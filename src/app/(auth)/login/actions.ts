'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { getOtpMode, canSkipOtp } from '@/lib/flags';

// ═══════════════════════════════════════════════════════════
// 🔐 نظام تسجيل الدخول مع 3 أوضاع OTP
// ═══════════════════════════════════════════════════════════

function getIp(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}

function derivePassword(phone: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  return createHash('sha256')
    .update(phone + ':' + encryptionKey)
    .digest('hex')
    .slice(0, 32);
}

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.spirmedical.local`;
}

/**
 * NEXT_REDIRECT helper - يميز redirects (المتوقعة) عن الأخطاء الحقيقية
 */
function isNextRedirect(err: unknown): boolean {
  return (
    err instanceof Error &&
    'digest' in err &&
    typeof (err as { digest?: string }).digest === 'string' &&
    (err as { digest: string }).digest.includes('NEXT_REDIRECT')
  );
}

// ─────────────────────────────────────────────────────────
// إرسال OTP أو دخول مباشر (حسب action)
// ─────────────────────────────────────────────────────────

export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const action = (formData.get('action') as string) || 'auto';
  // 🎯 V25.24: نُمرّر redirect URL لو موجود
  const redirectTo = formData.get('redirect') as string | null;
  // 🎯 V26.6: قناة OTP مفضّلة (اختياري من Frontend)
  const preferredChannel = (formData.get('channel') as string | null) as
    | 'whatsapp'
    | 'telegram'
    | 'sms'
    | null;

  const ip = getIp();
  const limit = await checkRateLimit(`otp:send:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = phoneSchema.safeParse({ phone });
  if (!validation.success) {
    redirect(
      '/login?error=' + encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const normalizedPhone = normalizePhone(validation.data.phone);
  const mode = getOtpMode();

  const shouldUseOtp =
    mode === 'required' || (mode === 'optional' && action === 'otp');

  if (!shouldUseOtp) {
    return await loginWithoutOtp(normalizedPhone, ip);
  }

  // ═══════════════════════════════════════════════════════════
  // 🎯 V26.6: تحديد قناة OTP المُفضّلة
  // الأولوية:
  //   1. القناة المرسلة من Frontend (preferredChannel)
  //   2. تفضيل المستخدم من DB (لو الحساب موجود)
  //   3. WhatsApp افتراضياً (أرخص + أسرع)
  // ═══════════════════════════════════════════════════════════

  let channel: 'whatsapp' | 'telegram' | 'sms' = preferredChannel || 'whatsapp';

  // محاولة قراءة تفضيل المستخدم من DB (إن وُجد الحساب مسبقاً)
  if (!preferredChannel) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSbClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    
    const adminAny = admin as unknown as {
      from: (t: string) => {
        
        select: (cols: string) => any;
      };
    };

    const userPrefRes = await adminAny
      .from('users')
      .select('preferred_otp_channel, wa_verified, wa_otp_enabled')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    const userPref = userPrefRes.data as {
      preferred_otp_channel?: 'whatsapp' | 'telegram' | 'sms';
      wa_verified?: boolean;
      wa_otp_enabled?: boolean;
    } | null;

    if (userPref?.wa_otp_enabled && userPref?.wa_verified && userPref?.preferred_otp_channel) {
      channel = userPref.preferred_otp_channel;
    }
    // لو الـ wa_verified = false → فعّل WhatsApp افتراضياً (للحسابات الجديدة)
  }

  // ═══════════════════════════════════════════════════════════
  // 📤 إرسال OTP عبر القناة المختارة
  // ═══════════════════════════════════════════════════════════

  if (channel === 'whatsapp' || channel === 'telegram') {
    // ─── WhatsApp / Telegram via Meta API ───
    try {
      const { sendOtp: sendWhatsAppOtp } = await import('@/lib/whatsapp/otp-service');
      const result = await sendWhatsAppOtp({
        phone: normalizedPhone,
        channel,
        purpose: 'login',
        ipAddress: ip,
      });

      if (result.success) {
        await logAuditEvent({
          action: 'auth.otp_sent',
          metadata: { phone: normalizedPhone, ip, channel },
        });

        const otpUrl = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? `/otp?phone=${encodeURIComponent(normalizedPhone)}&channel=${channel}&redirect=${encodeURIComponent(redirectTo)}`
          : `/otp?phone=${encodeURIComponent(normalizedPhone)}&channel=${channel}`;

        redirect(otpUrl);
      }

      // لو فشل → نسجّل + نتحوّل لـ SMS fallback
      logger.warn('WhatsApp OTP failed, falling back to SMS', {
        phone: normalizedPhone,
        error: result.error,
      });
    } catch (err) {
      // 🎯 mengyper next/navigation redirect → نُعيد إطلاقه
      if (isNextRedirect(err)) throw err;
      logger.warn('WhatsApp OTP exception, falling back to SMS', {
        phone: normalizedPhone,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
    // ↓ يستمر للـ SMS fallback
  }

  // ─── SMS fallback (الافتراضي القديم) ───
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    logger.error('OTP send failed', {
      phone: normalizedPhone,
      error: error.message,
    });
    redirect(
      '/login?error=' +
        encodeURIComponent('فشل إرسال الرمز. حاول مرة أخرى')
    );
  }

  await logAuditEvent({
    action: 'auth.otp_sent',
    metadata: { phone: normalizedPhone, ip, channel: 'sms' },
  });

  // 🎯 V25.24: مرّر redirect إلى صفحة OTP
  const otpUrl = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
    ? `/otp?phone=${encodeURIComponent(normalizedPhone)}&channel=sms&redirect=${encodeURIComponent(redirectTo)}`
    : `/otp?phone=${encodeURIComponent(normalizedPhone)}&channel=sms`;

  redirect(otpUrl);
}

// ─────────────────────────────────────────────────────────
// تخطي OTP
// ─────────────────────────────────────────────────────────

export async function skipOtp(formData: FormData) {
  if (!canSkipOtp()) {
    redirect('/login?error=' + encodeURIComponent('OTP مطلوب'));
  }

  const phone = formData.get('phone') as string;
  const ip = getIp();

  const limit = await checkRateLimit(`otp:skip:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = phoneSchema.safeParse({ phone });
  if (!validation.success) {
    redirect(
      '/login?error=' + encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const normalizedPhone = normalizePhone(validation.data.phone);
  return await loginWithoutOtp(normalizedPhone, ip);
}

// ─────────────────────────────────────────────────────────
// دخول مباشر بدون OTP (مُصلح)
// ─────────────────────────────────────────────────────────
// ✅ V25.3: مُحسّن للأداء (~500ms بدلاً من ~3-5s)
//   - حذف listUsers() الثقيل
//   - حذف updateUserById في الحالة الناجحة
//   - فقط نُحدّث password لو signIn فشل (نادر)
// ─────────────────────────────────────────────────────────


async function loginWithoutOtp(phone: string, ip: string): Promise<never> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    logger.error('Missing Supabase env vars', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceKey,
    });
    redirect('/login?error=' + encodeURIComponent('إعداد الخادم ناقص'));
  }

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = derivePassword(phone);
  const email = phoneToEmail(phone);
  const supabase = createClient();

  try {
    // 🚀 V25.3: Fast Path - محاولة تسجيل دخول مباشرة
    // معظم المحاولات من حسابات موجودة - نتخطى listUsers/createUser
    const { data: fastSignIn, error: fastErr } =
      await supabase.auth.signInWithPassword({ email, password });

    if (fastSignIn?.user && !fastErr) {
      // ✅ الحساب موجود + password صحيح
      // جلب role + phone في query واحد متوازي
      const profilePromise = admin
        .from('users')
        .select('role, phone')
        .eq('id', fastSignIn.user.id)
        .maybeSingle();

      // نسجّل في الـ audit بشكل متوازي (fire-and-forget)
      logAuditEvent({
        action: 'auth.login',
        user_id: fastSignIn.user.id,
        metadata: { ip, phone, method: 'fast' },
      }).catch(() => {});

      const { data: profile } = await profilePromise;

      // إذا الـ phone مختلف (حساب قديم بـ +temp_xxx)، حدّثه (fire-and-forget)
      if (profile && profile.phone !== phone) {
        admin
          .from('users')
          .update({ phone })
          .eq('id', fastSignIn.user.id)
          .then(() => undefined);
      }

      const role = profile?.role || 'patient';
      if (role === 'specialist') redirect('/specialist');
      if (
        role === 'admin' ||
        role === 'super_admin' ||
        role === 'manager' ||
        role === 'support'
      ) {
        redirect('/admin44');
      }
      redirect('/dashboard');
    }

    // 🐌 Slow Path: signIn فشل → الحساب جديد أو password قديم
    // (نصل هنا فقط في أول مرة أو لو ENCRYPTION_KEY تغيّر)

    // 1. ابحث في public.users بالـ phone
    const { data: existingProfile } = await admin
      .from('users')
      .select('id, role')
      .eq('phone', phone)
      .maybeSingle();

    let userId = existingProfile?.id;

    if (userId) {
      // الـ row موجود → password قديم، حدّثه
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      // 2. إنشاء مستخدم جديد - الـ trigger ينشئ public.users تلقائياً
      const { data: newUser, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { phone, created_via: 'no_otp' },
        });

      if (createErr || !newUser?.user) {
        logger.error('createUser failed', {
          phone,
          error: createErr?.message,
        });
        redirect(
          '/login?error=' +
            encodeURIComponent(
              `فشل إنشاء الحساب: ${createErr?.message ?? 'خطأ غير معروف'}`
            )
        );
      }

      userId = newUser.user.id;

      // حدّث phone من +temp_xxx للقيمة الحقيقية
      await admin
        .from('users')
        .update({ phone, full_name: 'مستخدم جديد' })
        .eq('id', userId);
    }

    // 3. signIn الآن
    const { data: signInData, error: signInErr } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInErr || !signInData?.user) {
      logger.error('signIn failed after setup', {
        phone,
        error: signInErr?.message,
      });
      redirect(
        '/login?error=' +
          encodeURIComponent('فشل تسجيل الدخول، حاول مرة أخرى')
      );
    }

    // Audit (fire-and-forget)
    logAuditEvent({
      action: 'auth.login',
      user_id: signInData.user.id,
      metadata: { ip, phone, method: 'slow' },
    }).catch(() => {});

    // 4. التوجيه
    const role = existingProfile?.role || 'patient';
    if (role === 'specialist') redirect('/specialist');
    if (
      role === 'admin' ||
      role === 'super_admin' ||
      role === 'manager' ||
      role === 'support'
    ) {
      redirect('/admin44');
    }
    redirect('/dashboard');
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    logger.error('No-OTP flow failed', {
      phone,
      error: err instanceof Error ? err.message : String(err),
    });
    redirect(
      '/login?error=' +
        encodeURIComponent(
          `خطأ: ${err instanceof Error ? err.message : 'غير معروف'}`
        )
    );
  }
}

// ─────────────────────────────────────────────────────────
// التحقق من OTP
// ─────────────────────────────────────────────────────────

export async function verifyOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;
  // 🎯 V25.24: redirect URL لو المستخدم جاء من صفحة محمية
  const redirectTo = (formData.get('redirect') as string | null) || null;
  // 🎯 V26.6: قناة OTP (whatsapp/telegram/sms)
  const channel = ((formData.get('channel') as string | null) || 'sms') as
    | 'whatsapp'
    | 'telegram'
    | 'sms';

  const ip = getIp();
  const limit = await checkRateLimit(`otp:verify:${ip}`, {
    max: 5,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&channel=${channel}&error=` +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = otpSchema.safeParse({ phone, token });
  if (!validation.success) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&channel=${channel}&error=` +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🎯 V26.6: التحقّق حسب القناة
  // ═══════════════════════════════════════════════════════════

  if (channel === 'whatsapp' || channel === 'telegram') {
    // ─── التحقّق عبر Meta OTP Service ───
    try {
      const { verifyOtp: verifyWhatsAppOtp } = await import('@/lib/whatsapp/otp-service');
      const result = await verifyWhatsAppOtp({
        phone,
        code: token,
        purpose: 'login',
      });

      if (!result.success) {
        logger.warn('WhatsApp OTP verification failed', {
          phone,
          error: result.error,
        });
        redirect(
          `/otp?phone=${encodeURIComponent(phone)}&channel=${channel}&error=` +
            encodeURIComponent(result.error || 'الرمز غير صحيح')
        );
      }

      // ✅ OTP صحيح → الآن نُسجّل الدخول بـ Supabase (passwordless)
      // نستخدم phone-to-password derivation (مثل loginWithoutOtp)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const admin = createSbClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const password = derivePassword(phone);
      const email = phoneToEmail(phone);
      const supabase = createClient();

      // محاولة تسجيل دخول مباشرة
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      let userId: string | undefined = signInData?.user?.id;

      if (signInErr || !signInData?.user) {
        // الحساب جديد → نُنشئه
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          phone,
          email_confirm: true,
          phone_confirm: true,
        });

        if (createErr || !newUser?.user) {
          logger.error('Failed to create user after WhatsApp OTP', {
            phone,
            error: createErr?.message,
          });
          redirect(
            `/otp?phone=${encodeURIComponent(phone)}&channel=${channel}&error=` +
              encodeURIComponent('فشل إنشاء الحساب')
          );
        }

        userId = newUser.user.id;

        // إنشاء profile في public.users
        
        const adminAny = admin as unknown as {
          from: (t: string) => {
            insert: (d: object) => Promise<{ error: { message: string } | null }>;
          };
        };

        await adminAny.from('users').insert({
          id: userId,
          phone,
          role: 'patient',
          wa_otp_enabled: channel === 'whatsapp',
          wa_verified: true,
          preferred_otp_channel: channel,
        });

        // تسجيل دخول الحساب الجديد
        await supabase.auth.signInWithPassword({ email, password });
      } else {
        // الحساب موجود → تحديث wa_verified إذا لزم
        
        const adminAny = admin as unknown as {
          from: (t: string) => {
            update: (d: object) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
          };
        };

        await adminAny.from('users').update({
          wa_verified: true,
          preferred_otp_channel: channel,
        }).eq('id', userId!);
      }

      await logAuditEvent({
        action: 'auth.login',
        user_id: userId,
        metadata: { ip, phone, method: 'otp', channel },
      });

      // جلب الـ role للتوجيه
      
      const adminAny2 = admin as unknown as {
        from: (t: string) => {
          
          select: (cols: string) => any;
        };
      };

      const profileRes = await adminAny2.from('users')
        .select('role')
        .eq('id', userId!)
        .single();

      const role = (profileRes.data as { role?: string } | null)?.role || 'patient';

      if (role === 'specialist') redirect('/specialist');
      if (role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'support') {
        redirect('/admin44');
      }
      if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
        redirect(redirectTo);
      }
      redirect('/dashboard');
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      logger.error('WhatsApp OTP verify exception', {
        phone,
        error: err instanceof Error ? err.message : 'unknown',
      });
      redirect(
        `/otp?phone=${encodeURIComponent(phone)}&channel=${channel}&error=` +
          encodeURIComponent('فشل التحقّق، حاول مرة أخرى')
      );
    }
  }

  // ─── SMS Verification (الافتراضي القديم via Supabase Auth) ───
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error || !data.user) {
    logger.warn('OTP verification failed', {
      phone,
      error: error?.message,
    });
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&channel=sms&error=` +
        encodeURIComponent('الرمز غير صحيح')
    );
  }

  await logAuditEvent({
    action: 'auth.login',
    user_id: data.user.id,
    metadata: { ip, phone, method: 'otp', channel: 'sms' },
  });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profile?.role === 'specialist') {
    redirect('/specialist');
  }
  if (
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'manager' ||
    profile?.role === 'support'
  ) {
    redirect('/admin44');
  }

  // 🎯 V25.24: لو فيه redirect URL صالح من الـ middleware، نُوجّه إليه
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    redirect(redirectTo);
  }

  redirect('/dashboard');
}

// ─────────────────────────────────────────────────────────
// إعادة إرسال OTP
// ─────────────────────────────────────────────────────────

export async function resendOtp(formData: FormData) {
  return sendOtp(formData);
}

// ─────────────────────────────────────────────────────────
// تسجيل الخروج
// ─────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAuditEvent({
      action: 'auth.logout',
      user_id: user.id,
    });
  }

  await supabase.auth.signOut();
  redirect('/');
}

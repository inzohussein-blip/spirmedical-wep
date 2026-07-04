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
import { getOtpMode, canSkipOtp, isPasswordlessLoginAllowed } from '@/lib/flags';
// ✅ FIX 1: static import بدلاً من dynamic
import { verifyOtp as verifyWhatsAppOtp, sendOtp as sendWhatsAppOtpDirect } from '@/lib/whatsapp/otp-service';

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
 * NEXT_REDIRECT helper
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
// إرسال OTP أو دخول مباشر
// ─────────────────────────────────────────────────────────

export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const action = (formData.get('action') as string) || 'auto';
  const redirectTo = formData.get('redirect') as string | null;
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

  // تحديد قناة OTP المُفضّلة
  let channel: 'whatsapp' | 'telegram' | 'sms' = preferredChannel || 'whatsapp';

  // قراءة تفضيل المستخدم من DB (إن وُجد)
  if (!preferredChannel) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSbClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userPrefRes = await admin
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
  }

  let lastOtpErrorCode: string | undefined;

  if (channel === 'whatsapp' || channel === 'telegram') {
    try {
      const result = await sendWhatsAppOtpDirect({
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

      logger.warn('WhatsApp OTP failed, falling back to SMS', {
        phone: normalizedPhone,
        error: result.error,
        code: result.code,
      });
      lastOtpErrorCode = result.code;
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      logger.warn('WhatsApp OTP exception, falling back to SMS', {
        phone: normalizedPhone,
        error: err instanceof Error ? err.message : 'unknown',
      });
      lastOtpErrorCode = 'EXCEPTION';
    }
  }

  // SMS fallback
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    logger.error('OTP send failed', {
      phone: normalizedPhone,
      error: error.message,
      code: lastOtpErrorCode,
    });
    const diagCode = lastOtpErrorCode || 'SMS_FAILED';
    redirect(
      '/login?error=' +
        encodeURIComponent('فشل إرسال الرمز. حاول مرة أخرى') +
        '&code=' + encodeURIComponent(diagCode)
    );
  }

  await logAuditEvent({
    action: 'auth.otp_sent',
    metadata: { phone: normalizedPhone, ip, channel: 'sms' },
  });

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
// ✅ FIX 2: إزالة listUsers() الثقيل
// ✅ FIX 3: createUser مع معالجة duplicate (getUserByEmail غير موجودة في v2.45)

async function loginWithoutOtp(phone: string, ip: string): Promise<never> {
  // 🔒 حاجز أمني: الدخول بدون رمز ممنوع في الإنتاج (ما لم يُفعَّل صراحةً).
  // يمنع الوصول لسجلّ مريض بمجرد معرفة رقم هاتفه.
  if (!isPasswordlessLoginAllowed()) {
    logger.warn('Passwordless login blocked', { ip });
    redirect(
      '/login?error=' + encodeURIComponent('التحقق عبر رمز OTP مطلوب لتسجيل الدخول')
    );
  }

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
    // 🚀 Fast Path: محاولة تسجيل دخول مباشرة
    const { data: fastSignIn, error: fastErr } =
      await supabase.auth.signInWithPassword({ email, password });

    if (fastSignIn?.user && !fastErr) {
      // ✅ الحساب موجود + password صحيح
      const profilePromise = admin
        .from('users')
        .select('role, phone')
        .eq('id', fastSignIn.user.id)
        .maybeSingle();

      logAuditEvent({
        action: 'auth.login',
        user_id: fastSignIn.user.id,
        metadata: { ip, phone, method: 'fast' },
      }).catch(() => {});

      const { data: profile } = await profilePromise;

      if (profile && profile.phone !== phone) {
        void admin
          .from('users')
          .update({ phone })
          .eq('id', fastSignIn.user.id)
          .then(() => null, () => null);
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

    // 🐌 Slow Path: signIn فشل

    // 1. ابحث في public.users بالـ phone
    const { data: existingProfile } = await admin
      .from('users')
      .select('id, role')
      .eq('phone', phone)
      .maybeSingle();

    let userId = existingProfile?.id;

    if (userId) {
      // ✅ FIX 2: profile موجود → حدّث password فقط
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      // ✅ FIX 3: createUser مع معالجة duplicate (getUserByEmail غير موجودة في v2.45)
      const { data: newUser, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { phone, created_via: 'no_otp' },
        });

      if (newUser?.user) {
        // ✅ مستخدم جديد أُنشئ بنجاح
        userId = newUser.user.id;

        await admin
          .from('users')
          .update({
            phone,
            full_name: 'مستخدم',
            approval_status: 'approved',
          })
          .eq('id', userId)
          .then(() => null, () => null);

      } else if (createErr && (
        createErr.message?.toLowerCase().includes('already been registered') ||
        createErr.message?.toLowerCase().includes('already exists') ||
        (createErr as any)?.status === 422
      )) {
        // ✅ الحساب موجود في auth.users → تسجيل دخول مؤقت للحصول على ID
        const { data: tempSignIn } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (tempSignIn?.user) {
          userId = tempSignIn.user.id;
        } else {
          // password قديم → حدّث عبر admin (نحتاج ID من public.users)
          logger.warn('Existing auth user with wrong password, phone not in public.users', { phone });
        }

        if (userId) {
          // تأكد من وجود row في public.users
          const { data: pubExists } = await admin
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

          if (!pubExists) {
            await admin.from('users').insert({
              id: userId,
              phone,
              full_name: 'مستخدم',
              role: 'patient',
              approval_status: 'approved',
            }).then(() => null, () => null);
          } else {
            await admin
              .from('users')
              .update({ phone, approval_status: 'approved' })
              .eq('id', userId)
              .then(() => null, () => null);
          }
        }
      } else if (createErr) {
        logger.error('createUser failed', { phone, error: createErr.message });
        redirect(
          '/login?error=' +
            encodeURIComponent(
              `فشل إنشاء الحساب: ${createErr.message ?? 'خطأ غير معروف'}`
            )
        );
      }
    }

    // 3. تسجيل دخول الآن
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
  const redirectTo = (formData.get('redirect') as string | null) || null;
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

  // ✅ FIX 1: استخدام static import للـ verifyWhatsAppOtp
  if (channel === 'whatsapp' || channel === 'telegram') {
    try {
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

      // ✅ OTP صحيح → تسجيل دخول
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
        // حساب جديد → إنشاء
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { phone, created_via: 'otp' },
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

        // ✅ FIX 5: إضافة approval_status و wa_verified
        await admin.from('users').insert({
          id: userId,
          phone,
          full_name: 'مستخدم',
          role: 'patient',
          approval_status: 'approved',
          wa_otp_enabled: channel === 'whatsapp',
          wa_verified: true,
          preferred_otp_channel: channel,
        }).then(() => null, () => null);

        // تسجيل دخول الحساب الجديد
        await supabase.auth.signInWithPassword({ email, password });
      } else {
        // الحساب موجود → تحديث wa_verified
        await admin.from('users').update({
          wa_verified: true,
          preferred_otp_channel: channel,
        }).eq('id', userId!).then(() => null, () => null);
      }

      await logAuditEvent({
        action: 'auth.login',
        user_id: userId,
        metadata: { ip, phone, method: 'otp', channel },
      });

      // جلب الـ role للتوجيه
      const profileRes = await admin.from('users')
        .select('role')
        .eq('id', userId!)
        .maybeSingle();

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

  // SMS Verification
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
    .maybeSingle();

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

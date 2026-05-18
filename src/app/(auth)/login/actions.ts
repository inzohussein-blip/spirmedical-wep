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

  // إرسال OTP عبر Supabase Auth
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
    metadata: { phone: normalizedPhone, ip },
  });

  redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
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

  const ip = getIp();
  const limit = await checkRateLimit(`otp:verify:${ip}`, {
    max: 5,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = otpSchema.safeParse({ phone, token });
  if (!validation.success) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

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
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent('الرمز غير صحيح')
    );
  }

  await logAuditEvent({
    action: 'auth.login',
    user_id: data.user.id,
    metadata: { ip, phone, method: 'otp' },
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

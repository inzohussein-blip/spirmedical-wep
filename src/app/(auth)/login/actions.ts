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
import { getOtpMode, isOtpRequired, canSkipOtp } from '@/lib/flags';

// ═══════════════════════════════════════════════════════════
// 🔐 نظام تسجيل الدخول مع 3 أوضاع OTP
// ═══════════════════════════════════════════════════════════
// - 'disabled': دخول مباشر دائماً
// - 'optional': المستخدم يختار (زر OTP أو زر تخطي)
// - 'required': OTP إجباري
//
// التبديل: NEXT_PUBLIC_OTP_MODE في Vercel
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

// ─────────────────────────────────────────────────────────
// إرسال OTP (وضع required أو اختيار المستخدم في optional)
// ─────────────────────────────────────────────────────────

export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  // المستخدم اختار طريقة الدخول صراحةً (في optional mode)
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

  // ─── منطق التوجيه حسب الوضع ───
  // disabled: دخول مباشر دائماً
  // optional: حسب اختيار المستخدم (action: 'otp' أو 'skip')
  // required: OTP إجباري دائماً

  const shouldUseOtp =
    mode === 'required' || (mode === 'optional' && action === 'otp');

  if (!shouldUseOtp) {
    // تخطي OTP - دخول مباشر
    // (في وضع required، shouldUseOtp = true دائماً، فلن نصل هنا)
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
// تخطي OTP (في optional أو disabled mode)
// ─────────────────────────────────────────────────────────

export async function skipOtp(formData: FormData) {
  // في وضع required، لا يُسمح بالتخطي
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
// دخول مباشر بدون OTP
// ─────────────────────────────────────────────────────────

async function loginWithoutOtp(phone: string, ip: string): Promise<never> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = derivePassword(phone);
  const email = phoneToEmail(phone);

  try {
    // 1. حاول إنشاء المستخدم (سيفشل إن كان موجوداً - نتجاهل الخطأ)
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      phone_confirm: true,
      user_metadata: { phone, created_via: 'no_otp_flow' },
    });

    // 2. سجّل دخول بكلمة السر
    const supabase = createClient();
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !data.user) {
      logger.error('No-OTP signin failed', {
        phone,
        error: signInErr?.message,
      });
      redirect(
        '/login?error=' +
          encodeURIComponent('فشل تسجيل الدخول. حاول مرة أخرى')
      );
    }

    // 3. تأكد من وجود سجل في public.users
    const { data: existingProfile } = await admin
      .from('users')
      .select('id, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!existingProfile) {
      await admin.from('users').insert({
        id: data.user.id,
        phone,
        full_name: 'مستخدم جديد',
      });
    }

    await logAuditEvent({
      action: 'auth.login',
      user_id: data.user.id,
      metadata: { ip, phone, method: 'no_otp' },
    });

    // 4. التوجيه حسب الدور
    if (existingProfile?.role === 'specialist') {
      redirect('/specialist');
    }
    redirect('/dashboard');
  } catch (err) {
    if (
      err instanceof Error &&
      'digest' in err &&
      typeof err.digest === 'string' &&
      err.digest.includes('NEXT_REDIRECT')
    ) {
      throw err;
    }

    logger.error('No-OTP login failed', {
      phone,
      error: String(err),
    });
    redirect(
      '/login?error=' + encodeURIComponent('فشل تسجيل الدخول. حاول مرة أخرى')
    );
  }
}

// ─────────────────────────────────────────────────────────
// التحقق من OTP (للوضعين required و optional إذا اختار OTP)
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

  // التوجيه حسب الدور
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profile?.role === 'specialist') {
    redirect('/specialist');
  }

  redirect('/dashboard');
}

// ─────────────────────────────────────────────────────────
// إعادة إرسال OTP (alias للتوافق مع otp/page.tsx)
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

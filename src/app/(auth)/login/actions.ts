'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import type { User } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// 🔐 الحسابات الجاهزة
// ═══════════════════════════════════════════════════════════
// الحسابات تم إنشاؤها مسبقاً في Supabase عبر SQL.
// هذا الملف فقط يستدعيها للدخول.
// ═══════════════════════════════════════════════════════════

interface DirectAccount {
  accountNumber: string;
  accessCode: string;
  email: string;
  password: string;
  redirectTo: string;
  role: 'patient' | 'specialist' | 'admin';
}

const DIRECT_ACCOUNTS: DirectAccount[] = [
  {
    accountNumber: '100001',
    accessCode: '100001',
    email: 'patient@spirmedical.iq',
    password: 'SpirPatient_2026_Live!',
    redirectTo: '/dashboard',
    role: 'patient',
  },
  {
    accountNumber: '200001',
    accessCode: '200001',
    email: 'specialist@spirmedical.iq',
    password: 'SpirSpecialist_2026_Live!',
    redirectTo: '/specialist',
    role: 'specialist',
  },
  {
    accountNumber: '900001',
    accessCode: '900001',
    email: 'admin@spirmedical.iq',
    password: 'SpirAdmin_2026_Live!',
    redirectTo: '/admin',
    role: 'admin',
  },
];

/**
 * الدخول بـ رقم حساب + رمز سري
 * بسيط جداً: ابحث عن الحساب → سجّل دخول → انتقل
 */
export async function loginWithCredentials(
  accountNumber: string,
  accessCode: string
) {
  if (!accountNumber || !accessCode) {
    return { success: false, error: 'يرجى إدخال الرقم والرمز' };
  }

  // البحث عن الحساب
  const account = DIRECT_ACCOUNTS.find(
    (a) =>
      a.accountNumber === accountNumber.trim() &&
      a.accessCode === accessCode.trim()
  );

  if (!account) {
    logger.warn('Login failed - invalid credentials', {
      accountNumber: accountNumber.slice(0, 3) + '***',
    });
    return { success: false, error: 'رقم الحساب أو الرمز السري غير صحيح' };
  }

  const supabase = createClient();

  try {
    // تسجيل الدخول مباشرة (الحساب موجود في Supabase)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error || !data.user) {
      logger.error('Login failed', {
        role: account.role,
        error: error?.message,
      });
      return {
        success: false,
        error: 'فشل تسجيل الدخول. تأكّد من تشغيل SQL أولاً',
      };
    }

    // تسجيل في audit log
    const ip = headers().get('x-forwarded-for') ?? 'unknown';
    await logAuditEvent({
      action: 'auth.login',
      user_id: data.user.id,
      metadata: { ip, role: account.role },
    });

    logger.info('Login successful', {
      role: account.role,
      user_id: data.user.id,
    });

    return {
      success: true,
      redirectTo: account.redirectTo,
      role: account.role,
    };
  } catch (e: any) {
    logger.error('Login exception', { error: e.message });
    return {
      success: false,
      error: 'حدث خطأ في النظام. حاول مرة أخرى',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// النظام القديم - OTP (للتوافق - يبقى يعمل)
// ═══════════════════════════════════════════════════════════

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const dummy = Buffer.alloc(Math.max(a.length, b.length));
    timingSafeEqual(dummy, dummy);
    return false;
  }
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

const TEST_MODE = process.env.ENABLE_TEST_MODE !== 'false';

const TEST_ACCOUNTS: Record<
  string,
  { otp: string; role: 'patient' | 'specialist' | 'admin' }
> = {
  '+9647712345678': { otp: '123456', role: 'patient' },
  '+9647811111111': { otp: '111111', role: 'specialist' },
  '+9647900000000': { otp: '000000', role: 'admin' },
};

function isTestPhone(phone: string): boolean {
  return TEST_MODE && phone in TEST_ACCOUNTS;
}

function getIp(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}

export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;

  const ip = getIp();
  const limit = await checkRateLimit(`otp:send:${ip}`, {
    max: 5,
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

  if (isTestPhone(normalizedPhone)) {
    redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}&test=1`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    logger.error('OTP send failed', { phone: normalizedPhone });
    redirect(
      '/login?error=' + encodeURIComponent('فشل إرسال الرمز. حاول مرة أخرى')
    );
  }

  redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
}

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
        encodeURIComponent(`محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`)
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
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent('الرمز غير صحيح')
    );
  }

  await logAuditEvent({
    action: 'auth.login',
    user_id: data.user.id,
    metadata: { ip, phone },
  });

  redirect('/dashboard');
}

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

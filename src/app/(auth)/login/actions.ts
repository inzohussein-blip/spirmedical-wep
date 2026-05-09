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
// 🔐 الحسابات الجاهزة للدخول
// ═══════════════════════════════════════════════════════════
// تعمل كحسابات حقيقية في Supabase Auth
// رقم الحساب + الرمز السري → دخول مباشر
// ═══════════════════════════════════════════════════════════

interface DirectAccount {
  accountNumber: string;
  accessCode: string;
  role: 'patient' | 'specialist' | 'admin';
  phone: string;
  fullName: string;
  email: string;
  password: string;
  governorate?: string;
  redirectTo: string;
}

const DIRECT_ACCOUNTS: DirectAccount[] = [
  // 👤 المراجع
  {
    accountNumber: '100001',
    accessCode: '100001',
    role: 'patient',
    phone: '+9647712345678',
    fullName: 'أحمد محمد العراقي',
    email: 'patient@spirmedical.iq',
    password: 'SpirPatient_2026_Live!',
    governorate: 'بغداد',
    redirectTo: '/dashboard',
  },
  // ⚕️ الأخصائي
  {
    accountNumber: '200001',
    accessCode: '200001',
    role: 'specialist',
    phone: '+9647811111111',
    fullName: 'د. سارة أحمد',
    email: 'specialist@spirmedical.iq',
    password: 'SpirSpecialist_2026_Live!',
    governorate: 'بغداد',
    redirectTo: '/specialist',
  },
  // 🛡 الأدمن
  {
    accountNumber: '900001',
    accessCode: '900001',
    role: 'admin',
    phone: '+9647900000000',
    fullName: 'مسؤول النظام',
    email: 'admin@spirmedical.iq',
    password: 'SpirAdmin_2026_Live!',
    governorate: 'بغداد',
    redirectTo: '/admin',
  },
];

/**
 * الدخول بـ رقم حساب + رمز سري
 * يستخدم Supabase Auth حقيقي → session دائمة
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
    // محاولة الدخول
    let { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    // إنشاء الحساب إذا لم يكن موجوداً
    if (error || !data.user) {
      logger.info('Creating new account', { role: account.role });

      const signUpResult = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        phone: account.phone,
        options: {
          data: {
            role: account.role,
            full_name: account.fullName,
            governorate: account.governorate,
          },
        },
      });

      if (signUpResult.error || !signUpResult.data.user) {
        logger.error('Account creation failed', {
          role: account.role,
          error: signUpResult.error?.message,
        });
        return {
          success: false,
          error: 'فشل إنشاء الحساب. تواصل مع الدعم',
        };
      }

      await ensureUserProfile(signUpResult.data.user, account);

      // إعادة محاولة الدخول
      const retrySignIn = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (retrySignIn.error || !retrySignIn.data.user) {
        return { success: false, error: 'فشل الدخول بعد إنشاء الحساب' };
      }

      data = retrySignIn.data;
    } else {
      await ensureUserProfile(data.user, account);
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
    return { success: false, error: 'حدث خطأ في النظام' };
  }
}

/**
 * ضمان أن جدول users يحتوي على البيانات
 */
async function ensureUserProfile(authUser: User, account: DirectAccount) {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('users').upsert(
      {
        id: authUser.id,
        phone: account.phone,
        full_name: account.fullName,
        email: account.email,
        role: account.role,
        governorate: account.governorate,
        updated_at: new Date().toISOString(),
      } as any,
      {
        onConflict: 'id',
      }
    );

    if (error) {
      logger.warn('Profile upsert failed (non-critical)', {
        error: error.message,
      });
    }
  } catch (e) {
    logger.warn('Profile creation skipped (non-critical)');
  }
}

// ═══════════════════════════════════════════════════════════
// النظام القديم - OTP عبر الهاتف (يبقى للتوافق)
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
    logger.info('[TEST MODE] OTP request for test account', {
      phone: normalizedPhone,
    });
    redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}&test=1`);
  }

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
      '/login?error=' + encodeURIComponent('فشل إرسال الرمز. حاول مرة أخرى')
    );
  }

  await logAuditEvent({
    action: 'auth.otp_sent',
    metadata: { phone: normalizedPhone, ip },
  });

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

  if (isTestPhone(phone)) {
    return handleTestLogin(phone, token, ip);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error || !data.user) {
    logger.warn('OTP verification failed', { phone, error: error?.message });
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

  logger.info('User logged in', { user_id: data.user.id });
  redirect('/dashboard');
}

async function handleTestLogin(
  phone: string,
  token: string,
  ip: string
): Promise<void> {
  const testAccount = TEST_ACCOUNTS[phone];

  if (!safeCompare(token, testAccount.otp)) {
    logger.warn('[TEST MODE] Wrong OTP for test account', { phone });
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(`الرمز غير صحيح. الرمز للاختبار: ${testAccount.otp}`)
    );
  }

  try {
    const supabase = createClient();
    const fakeEmail = `test_${phone.replace(/\D/g, '')}@spirmedical.test`;
    const fakePassword = `TestPassword_${phone.slice(-6)}_2026!`;

    let user: User | null = null;

    const signInResult = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    });

    if (signInResult.data.user) {
      user = signInResult.data.user;
    } else {
      const signUpResult = await supabase.auth.signUp({
        email: fakeEmail,
        password: fakePassword,
        phone,
        options: {
          data: {
            role: testAccount.role,
            is_test: true,
            test_phone: phone,
          },
        },
      });

      if (signUpResult.error) {
        logger.error('[TEST MODE] Sign-up failed', {
          phone,
          error: signUpResult.error.message,
        });
        redirect(
          `/otp?phone=${encodeURIComponent(phone)}&error=` +
            encodeURIComponent(
              'فشل إنشاء الحساب التجريبي: ' + signUpResult.error.message
            )
        );
      }

      if (signUpResult.data.user) {
        user = signUpResult.data.user;
      }
    }

    if (!user) {
      redirect(
        `/otp?phone=${encodeURIComponent(phone)}&error=` +
          encodeURIComponent('فشل تسجيل الدخول التجريبي')
      );
    }

    await logAuditEvent({
      action: 'auth.test_login',
      user_id: user.id,
      metadata: { ip, phone, role: testAccount.role },
    });

    logger.info('[TEST MODE] User logged in', {
      user_id: user.id,
      role: testAccount.role,
    });

    if (testAccount.role === 'admin') redirect('/admin');
    if (testAccount.role === 'specialist') redirect('/specialist');
    redirect('/dashboard');
  } catch (e: any) {
    if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;

    logger.error('[TEST MODE] Login exception', {
      phone,
      error: e?.message,
    });
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent('حدث خطأ في النظام')
    );
  }
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

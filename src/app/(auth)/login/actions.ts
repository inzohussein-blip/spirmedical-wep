'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { headers, cookies } from 'next/headers';

// ============================================================
// 🧪 وضع التجربة (TEST MODE)
// ============================================================
// مُفعّل فقط عند: ENABLE_TEST_MODE=true في environment variables
// ⚠️ لا تُفعّله في الإنتاج العام مع المستخدمين الحقيقيين!
// ============================================================

const TEST_MODE = process.env.ENABLE_TEST_MODE === 'true';

const TEST_ACCOUNTS: Record<string, { otp: string; role: 'patient' | 'specialist' | 'admin' }> = {
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

// ============================================================
// إرسال OTP
// ============================================================
export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;

  // Rate limit: 5 محاولات / 15 دقيقة لكل IP
  const ip = getIp();
  const limit = await checkRateLimit(`otp:send:${ip}`, {
    max: 5,
    windowSeconds: 900,
  });
  if (!limit.allowed) {
    redirect(
      '/login?error=' +
        encodeURIComponent(`محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds}s`)
    );
  }

  // Validation
  const validation = phoneSchema.safeParse({ phone });
  if (!validation.success) {
    redirect(
      '/login?error=' + encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const normalizedPhone = normalizePhone(phone);

  // 🧪 TEST MODE: تجاوز SMS للأرقام التجريبية
  if (isTestPhone(normalizedPhone)) {
    logger.info('[TEST MODE] Bypassing SMS for test account', {
      phone: normalizedPhone,
    });
    redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
  }

  // الإنتاج: استخدم Supabase + Twilio
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });

  if (error) {
    logger.error('OTP send failed', {
      phone: normalizedPhone,
      error: error.message,
    });
    redirect(
      '/login?error=' + encodeURIComponent('فشل إرسال الرمز، حاول مرة أخرى')
    );
  }

  logger.info('OTP sent', { phone: normalizedPhone, ip });
  redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
}

// ============================================================
// التحقق من OTP
// ============================================================
export async function verifyOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;

  const ip = getIp();
  const limit = await checkRateLimit(`otp:verify:${ip}`, {
    max: 3,
    windowSeconds: 600,
  });
  if (!limit.allowed) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(`محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds}s`)
    );
  }

  const validation = otpSchema.safeParse({ phone, token });
  if (!validation.success) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  // 🧪 TEST MODE: تسجيل دخول مباشر للأرقام التجريبية
  if (isTestPhone(phone)) {
    const testAccount = TEST_ACCOUNTS[phone];

    if (token !== testAccount.otp) {
      logger.warn('[TEST MODE] Wrong OTP for test account', { phone });
      redirect(
        `/otp?phone=${encodeURIComponent(phone)}&error=` +
          encodeURIComponent('الرمز غير صحيح')
      );
    }

    // إنشاء أو الحصول على حساب التيست
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      phone,
      password: `test_${testAccount.otp}_${phone.slice(-4)}`,
      options: {
        data: { role: testAccount.role, is_test: true },
      },
    });

    // إذا الحساب موجود، سجّل دخول
    if (signUpError && signUpError.message.includes('already')) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone,
        password: `test_${testAccount.otp}_${phone.slice(-4)}`,
      });

      if (signInError) {
        logger.error('[TEST MODE] Sign-in failed', {
          phone,
          error: signInError.message,
        });
        redirect(
          `/otp?phone=${encodeURIComponent(phone)}&error=` +
            encodeURIComponent('فشل تسجيل الدخول التجريبي')
        );
      }
    }

    // ترقية الدور
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ role: testAccount.role })
        .eq('id', user.id);

      await logAuditEvent({
        action: 'auth.login.test',
        user_id: user.id,
        metadata: { ip, phone, role: testAccount.role, test_mode: true },
      });

      logger.info('[TEST MODE] User logged in', {
        user_id: user.id,
        role: testAccount.role,
      });
    }

    redirect('/dashboard');
  }

  // الإنتاج: التحقق العادي
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error || !data.user) {
    logger.warn('OTP verify failed', { phone, error: error?.message });
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent('الرمز غير صحيح أو منتهي')
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

// ============================================================
// تسجيل الخروج
// ============================================================
export async function signOut() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAuditEvent({
      action: 'auth.logout',
      user_id: user.id,
      metadata: { ip: getIp() },
    });
  }

  await supabase.auth.signOut();
  redirect('/');
}

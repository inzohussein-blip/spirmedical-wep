'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// ============================================================
// 🧪 وضع التجربة (TEST MODE)
// ============================================================
// مُفعّل افتراضياً لتسهيل الاختبار
// لتعطيله: ENABLE_TEST_MODE=false في environment variables
// ============================================================

const TEST_MODE = process.env.ENABLE_TEST_MODE !== 'false'; // مُفعّل افتراضياً

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
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
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
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (error) {
      logger.error('OTP send failed', {
        phone: normalizedPhone,
        error: error.message,
        code: error.status,
      });

      // رسائل خطأ مفصّلة حسب نوع الخطأ
      let errorMessage = 'فشل إرسال الرمز';

      if (error.message.includes('SMS provider')) {
        errorMessage = 'مزوّد SMS غير مُعدّ. استخدم رقماً تجريبياً: 7712345678';
      } else if (error.message.includes('rate')) {
        errorMessage = 'محاولات كثيرة، انتظر دقيقة';
      } else if (error.message.includes('phone')) {
        errorMessage = 'رقم الهاتف غير صحيح';
      } else {
        errorMessage =
          'فشل إرسال الرمز. للاختبار استخدم: 7712345678 / 7811111111 / 7900000000';
      }

      redirect('/login?error=' + encodeURIComponent(errorMessage));
    }

    logger.info('OTP sent', { phone: normalizedPhone, ip });
    redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
  } catch (err) {
    // redirect throws NEXT_REDIRECT - أعد رميه
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
      throw err;
    }

    logger.error('OTP send exception', {
      phone: normalizedPhone,
      error: err instanceof Error ? err.message : 'Unknown',
    });
    redirect(
      '/login?error=' +
        encodeURIComponent(
          'حدث خطأ تقني. للاختبار استخدم: 7712345678 (الرمز: 123456)'
        )
    );
  }
}

// ============================================================
// التحقق من OTP
// ============================================================
export async function verifyOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;

  const ip = getIp();
  const limit = await checkRateLimit(`otp:verify:${ip}`, {
    max: 5,
    windowSeconds: 600,
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

  // 🧪 TEST MODE: تسجيل دخول مباشر للأرقام التجريبية
  if (isTestPhone(phone)) {
    await handleTestLogin(phone, token, ip);
    return; // never reaches (handleTestLogin always redirects)
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
// معالجة دخول التيست (دالة منفصلة لتجنّب مشاكل types)
// ============================================================
async function handleTestLogin(
  phone: string,
  token: string,
  ip: string
): Promise<void> {
  const testAccount = TEST_ACCOUNTS[phone];

  if (token !== testAccount.otp) {
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

    // محاولة تسجيل الدخول أولاً
    const signInResult = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    });

    if (signInResult.data.user) {
      user = signInResult.data.user;
    } else {
      // الحساب غير موجود - أنشئه
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

    // ترقية الدور في public.users
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        phone,
        role: testAccount.role,
      });

    if (updateError) {
      logger.warn('[TEST MODE] Could not update user role', {
        error: updateError.message,
      });
    }

    // Audit log
    await logAuditEvent({
      action: 'auth.login.test',
      user_id: user.id,
      metadata: {
        ip,
        phone,
        role: testAccount.role,
        test_mode: true,
      },
    }).catch((e) =>
      logger.warn('Audit log failed', { error: e.message })
    );

    logger.info('[TEST MODE] User logged in', {
      user_id: user.id,
      role: testAccount.role,
    });

    redirect('/dashboard');
  } catch (err) {
    // redirect throws NEXT_REDIRECT - أعد رميه
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
      throw err;
    }

    logger.error('[TEST MODE] Exception', {
      phone,
      error: err instanceof Error ? err.message : 'Unknown',
    });
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(
          'خطأ تقني في التيست: ' + (err as Error).message
        )
    );
  }
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

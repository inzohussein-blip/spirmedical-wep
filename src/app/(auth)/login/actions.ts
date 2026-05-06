'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

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

  // Audit: تسجيل دخول ناجح
  await logAuditEvent({
    action: 'auth.login',
    user_id: data.user.id,
    metadata: { ip, phone },
  });

  logger.info('User logged in', { user_id: data.user.id });
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
      metadata: { ip: getIp() },
    });
  }

  await supabase.auth.signOut();
  redirect('/');
}

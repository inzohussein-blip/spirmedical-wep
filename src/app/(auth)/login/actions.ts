'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';

/**
 * إرسال رمز OTP لرقم الهاتف
 */
export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;

  const validation = phoneSchema.safeParse({ phone });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const normalizedPhone = normalizePhone(phone);
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    console.error('OTP send error:', error.message);
    return { error: 'فشل إرسال الرمز، حاول مرة أخرى' };
  }

  // إعادة توجيه لصفحة التحقق
  redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
}

/**
 * التحقق من رمز OTP
 */
export async function verifyOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;

  const validation = otpSchema.safeParse({ phone, token });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    console.error('OTP verify error:', error.message);
    return { error: 'الرمز غير صحيح أو منتهي' };
  }

  redirect('/dashboard');
}

/**
 * تسجيل خروج
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

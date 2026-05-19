'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * اشتراك بطبيب عائلة
 */
export async function subscribeToDoctor(
  doctorId: string,
  plan: 'monthly' | 'yearly'
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح - سجّل دخول أولاً' };

  // جلب سعر الطبيب
  const { data: doctor } = await supabase
    .from('doctors')
    .select('monthly_subscription_price, yearly_subscription_price')
    .eq('id', doctorId)
    .single();

  if (!doctor) return { success: false, error: 'الطبيب غير موجود' };

  const price = plan === 'monthly'
    ? doctor.monthly_subscription_price
    : doctor.yearly_subscription_price;

  if (!price) return { success: false, error: 'هذا النوع من الاشتراك غير متاح' };

  // تحقق من اشتراك نشط
  const { data: existing } = await supabase
    .from('doctor_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('doctor_id', doctorId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'لديك اشتراك نشط مع هذا الطبيب' };
  }

  // حساب تاريخ الانتهاء
  const expiresAt = new Date();
  if (plan === 'monthly') {
    expiresAt.setDate(expiresAt.getDate() + 30);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  const { error } = await supabase
    .from('doctor_subscriptions')
    .insert({
      user_id: user.id,
      doctor_id: doctorId,
      plan,
      price,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/services/doctors/${doctorId}`);
  return { success: true };
}

/**
 * بدء استشارة جديدة مع طبيب
 */
export async function startConsultation(doctorId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح - سجّل دخول أولاً' };

  // جلب الطبيب
  const { data: doctor } = await supabase
    .from('doctors')
    .select('user_id, video_consult_price')
    .eq('id', doctorId)
    .single();

  if (!doctor) return { success: false, error: 'الطبيب غير موجود' };

  // تحقّق من اشتراك نشط
  const { data: subscription } = await supabase
    .from('doctor_subscriptions')
    .select('id, consultations_used')
    .eq('user_id', user.id)
    .eq('doctor_id', doctorId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  const isFree = !!subscription;

  // إنشاء الاستشارة
  const { data: consultation, error } = await supabase
    .from('consultations')
    .insert({
      patient_user_id: user.id,
      doctor_id: doctorId,
      doctor_user_id: doctor.user_id,
      consultation_type: 'asynchronous',
      title: 'استشارة جديدة',
      status: 'awaiting_doctor',
      price: isFree ? 0 : (doctor.video_consult_price || 0),
      is_free: isFree,
      subscription_id: subscription?.id ?? null,
    })
    .select('id')
    .single();

  if (error || !consultation) {
    return { success: false, error: error?.message || 'فشل إنشاء الاستشارة' };
  }

  // تحديث عدد الاستشارات في الاشتراك
  if (subscription) {
    await supabase
      .from('doctor_subscriptions')
      .update({ consultations_used: subscription.consultations_used + 1 })
      .eq('id', subscription.id);
  }

  return { success: true, consultationId: consultation.id };
}

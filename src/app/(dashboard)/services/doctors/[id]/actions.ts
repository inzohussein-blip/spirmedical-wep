'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { encrypt } from '@/lib/encryption';

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

// ═══════════════════════════════════════════════════════════════════════════
// 👨‍⚕️ V25.45: createDoctorAppointment - حجز موعد مع الطبيب (structured)
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateDoctorAppointmentInput {
  doctor_id: string;
  appointment_type: 'home_visit' | 'clinic_visit' | 'video' | 'follow_up';
  scheduled_at: string;
  
  // العنوان (للزيارة المنزلية)
  address?: string;
  location_lat?: number;
  location_lng?: number;
  
  // التفاصيل الطبية
  chief_complaint: string;     // سبب الزيارة
  current_medications?: string[];
  notes?: string;
  
  // للعائلة
  family_member_id?: string | null;
}

export async function createDoctorAppointment(input: CreateDoctorAppointmentInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  // Validation
  if (!input.chief_complaint || input.chief_complaint.length < 5) {
    return { success: false, error: 'يجب إدخال سبب الزيارة (5 أحرف على الأقل)' };
  }

  // جلب الطبيب + السعر
  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', input.doctor_id)
    .single();

  if (!doctor || !doctor.is_active) {
    return { success: false, error: 'الطبيب غير متاح' };
  }

  // تحديد السعر حسب النوع
  let price = 0;
  let duration = 30;
  let needsAddress = false;
  let serviceTypeArabic = 'استشارة طبيب';

  switch (input.appointment_type) {
    case 'home_visit':
      if (!doctor.available_for_home_visit) {
        return { success: false, error: 'الطبيب لا يقدّم زيارات منزلية' };
      }
      price = doctor.home_visit_price || 0;
      duration = 60;
      needsAddress = true;
      serviceTypeArabic = 'زيارة منزلية - طبيب';
      if (!input.address || input.address.length < 10) {
        return { success: false, error: 'يجب إدخال عنوان مفصّل للزيارة المنزلية' };
      }
      break;
    
    case 'clinic_visit':
      if (!doctor.available_for_clinic) {
        return { success: false, error: 'الطبيب لا يستقبل في عيادة' };
      }
      price = 25000; // سعر ثابت لزيارة العيادة
      duration = 30;
      needsAddress = false;
      serviceTypeArabic = 'زيارة عيادة';
      break;
    
    case 'video':
      if (!doctor.available_for_video) {
        return { success: false, error: 'الطبيب لا يقدّم استشارات فيديو' };
      }
      price = doctor.video_consult_price || 0;
      duration = 20;
      needsAddress = false;
      serviceTypeArabic = 'استشارة بالفيديو';
      break;
    
    case 'follow_up':
      price = 10000;
      duration = 15;
      serviceTypeArabic = 'متابعة';
      break;
  }

  try {
    
    const supabaseAny = supabase as unknown as {
      from: (t: string) => {
        insert: (d: object) => { select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
      };
    };

    const appointmentData = {
      user_id: user.id,
      service_type: serviceTypeArabic,
      service_id: 'doctor-appointment',
      doctor_id: input.doctor_id,
      doctor_appointment_type: input.appointment_type,
      scheduled_at: input.scheduled_at,
      address: input.address || 'استشارة عن بُعد',
      chief_complaint: input.chief_complaint,
      current_medications: input.current_medications || null,
      notes_encrypted: input.notes ? encrypt(input.notes) : null,
      estimated_price: price,
      duration_minutes: duration,
      status: 'pending',
      required_specialist_type: 'doctor',
      family_member_id: input.family_member_id || null,
      
      // GPS
      location_lat: input.location_lat || null,
      location_lng: input.location_lng || null,
    };

    const { data: appointment, error } = await supabaseAny
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error || !appointment) {
      return { success: false, error: 'فشل إنشاء الموعد. حاول مرة أخرى.' };
    }

    revalidatePath('/appointments');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      appointment_id: appointment.id,
      price,
      duration,
    };
  } catch (err) {
    return { success: false, error: 'حدث خطأ غير متوقّع' };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface RatingInput {
  appointment_id: string;
  overall_rating: number;
  punctuality_rating?: number;
  professionalism_rating?: number;
  cleanliness_rating?: number;
  review_text?: string;
  tags?: string[];
  is_anonymous?: boolean;
}

export async function submitRating(input: RatingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // Validation
  if (input.overall_rating < 1 || input.overall_rating > 5) {
    return { ok: false, error: 'التقييم العام يجب أن يكون بين 1 و 5' };
  }

  // تأكد أن الموعد للمستخدم وأنه completed
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, user_id, status, specialist_id, assigned_specialist_id')
    .eq('id', input.appointment_id)
    .single();

  if (!appointment) return { ok: false, error: 'الموعد غير موجود' };
  if (appointment.user_id !== user.id) return { ok: false, error: 'غير مسموح' };

  // 🆕 V31: لا يُسمح بالتقييم إلا بعد إكمال الموعد فعلياً
  if (appointment.status !== 'completed') {
    return { ok: false, error: 'يمكن التقييم بعد إكمال الموعد فقط' };
  }

  // تحقق من عدم وجود تقييم سابق
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('appointment_id', input.appointment_id)
    .maybeSingle();

  if (existing) return { ok: false, error: 'تم تقييم هذا الموعد مسبقاً' };

  // ✨ V25.6: يستخدم assigned_specialist_id (الجديد) أو specialist_id (legacy)
  const specialistId = appointment.assigned_specialist_id ?? appointment.specialist_id;

  const { error } = await supabase.from('ratings').insert({
    appointment_id: input.appointment_id,
    user_id: user.id,
    specialist_id: specialistId,
    overall_rating: input.overall_rating,
    punctuality_rating: input.punctuality_rating ?? null,
    professionalism_rating: input.professionalism_rating ?? null,
    cleanliness_rating: input.cleanliness_rating ?? null,
    review_text: input.review_text?.trim() || null,
    tags: input.tags ?? [],
    is_anonymous: input.is_anonymous ?? false,
    is_published: true,
  } as never);

  if (error) return { ok: false, error: error.message };

  // ─── V25.47: حفظ أيضاً في الجدول الخاص (hospital/dental/optical) ───
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: Record<string, unknown> | null }>;
        };
      };
      insert: (d: object) => Promise<{ error: unknown }>;
    };
  };

  // إعادة جلب الـ appointment مع الأعمدة الإضافية (hospital_id, dental_clinic_id, optical_store_id)
  const { data: fullAppt } = await supabaseAny
    .from('appointments')
    .select('id, hospital_id, dental_clinic_id, optical_store_id')
    .eq('id', input.appointment_id)
    .single();

  if (fullAppt) {
    const hospitalId = fullAppt.hospital_id as string | null;
    const dentalClinicId = fullAppt.dental_clinic_id as string | null;
    const opticalStoreId = fullAppt.optical_store_id as string | null;

    if (hospitalId) {
      await supabaseAny.from('hospital_ratings').insert({
        user_id: user.id,
        hospital_id: hospitalId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        cleanliness_rating: input.cleanliness_rating || null,
        staff_rating: input.professionalism_rating || null,
        wait_time_rating: input.punctuality_rating || null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
    } else if (dentalClinicId) {
      await supabaseAny.from('dental_ratings').insert({
        user_id: user.id,
        dental_clinic_id: dentalClinicId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        cleanliness_rating: input.cleanliness_rating || null,
        skill_rating: input.professionalism_rating || null,
        price_rating: null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
    } else if (opticalStoreId) {
      await supabaseAny.from('optical_ratings').insert({
        user_id: user.id,
        optical_store_id: opticalStoreId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        product_quality_rating: input.cleanliness_rating || null,
        service_rating: input.professionalism_rating || null,
        price_rating: null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
    }
  }

  revalidatePath(`/appointments/${input.appointment_id}`);
  revalidatePath('/appointments');
  return { ok: true };
}

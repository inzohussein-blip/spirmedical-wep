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

  revalidatePath(`/appointments/${input.appointment_id}`);
  revalidatePath('/appointments');
  return { ok: true };
}

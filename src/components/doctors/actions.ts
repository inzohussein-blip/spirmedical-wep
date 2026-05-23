'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface DoctorRatingInput {
  doctor_id: string;
  appointment_id?: string;
  consultation_id?: string;
  rating: number;
  expertise_rating?: number;
  communication_rating?: number;
  punctuality_rating?: number;
  empathy_rating?: number;
  comment?: string;
  would_recommend?: boolean;
  interaction_type?: 'home_visit' | 'clinic_visit' | 'video' | 'chat' | 'subscription';
}

export async function submitDoctorRating(input: DoctorRatingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  }

  // التحقق - لازم يكون عند المستخدم تفاعل مع الطبيب
  if (input.appointment_id) {
    const { data: appt } = await supabase
      .from('appointments')
      .select('id, user_id')
      .eq('id', input.appointment_id)
      .eq('user_id', user.id)
      .single();
    
    if (!appt) return { ok: false, error: 'الموعد غير موجود' };
  }

  if (input.consultation_id) {
    const { data: cons } = await supabase
      .from('consultations')
      .select('id, patient_user_id')
      .eq('id', input.consultation_id)
      .eq('patient_user_id', user.id)
      .single();
    
    if (!cons) return { ok: false, error: 'الاستشارة غير موجودة' };
  }

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      upsert: (d: object, opts?: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  const onConflictTarget = input.appointment_id 
    ? 'user_id,appointment_id'
    : 'user_id,consultation_id';

  const { error } = await supabaseAny
    .from('doctor_ratings')
    .upsert({
      user_id: user.id,
      doctor_id: input.doctor_id,
      appointment_id: input.appointment_id || null,
      consultation_id: input.consultation_id || null,
      rating: input.rating,
      expertise_rating: input.expertise_rating || null,
      communication_rating: input.communication_rating || null,
      punctuality_rating: input.punctuality_rating || null,
      empathy_rating: input.empathy_rating || null,
      comment: input.comment || null,
      would_recommend: input.would_recommend ?? true,
      interaction_type: input.interaction_type || null,
      is_public: true,
    }, {
      onConflict: onConflictTarget,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/services/doctors/${input.doctor_id}`);
  if (input.appointment_id) revalidatePath(`/appointments/${input.appointment_id}`);
  
  return { ok: true };
}

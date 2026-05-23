'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * 💉 V25.44: Nursing Actions
 * ════════════════════════════════════════════════════════════════════
 */

interface NurseRatingInput {
  appointment_id: string;
  specialist_id: string;
  rating: number;
  hygiene_rating?: number;
  expertise_rating?: number;
  punctuality_rating?: number;
  attitude_rating?: number;
  comment?: string;
  would_recommend?: boolean;
}

export async function submitNurseRating(input: NurseRatingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // Validation
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  }

  // التحقق من أن الموعد للمستخدم
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, user_id, status')
    .eq('id', input.appointment_id)
    .eq('user_id', user.id)
    .single();

  if (!appointment) {
    return { ok: false, error: 'الموعد غير موجود' };
  }

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      upsert: (d: object, opts?: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await supabaseAny
    .from('nurse_ratings')
    .upsert({
      user_id: user.id,
      specialist_id: input.specialist_id,
      appointment_id: input.appointment_id,
      rating: input.rating,
      hygiene_rating: input.hygiene_rating || null,
      expertise_rating: input.expertise_rating || null,
      punctuality_rating: input.punctuality_rating || null,
      attitude_rating: input.attitude_rating || null,
      comment: input.comment || null,
      would_recommend: input.would_recommend ?? true,
      is_public: true,
    }, {
      onConflict: 'user_id,appointment_id',
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/appointments/${input.appointment_id}`);
  revalidatePath('/account/nursing-history');
  
  return { ok: true };
}

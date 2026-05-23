'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * ⭐ V25.47: Universal Service Rating Action
 * ════════════════════════════════════════════════════════════════════
 */

export interface ServiceRatingInput {
  service_type: 'hospital' | 'dental' | 'optical';
  service_id: string;
  appointment_id?: string;
  rating: number;
  detail_ratings?: Record<string, number>;
  comment?: string;
  would_recommend?: boolean;
}

const TABLE_MAP = {
  hospital: { table: 'hospital_ratings', fkColumn: 'hospital_id' },
  dental: { table: 'dental_ratings', fkColumn: 'dental_clinic_id' },
  optical: { table: 'optical_ratings', fkColumn: 'optical_store_id' },
};

export async function submitServiceRating(input: ServiceRatingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  }

  const tableMeta = TABLE_MAP[input.service_type];
  if (!tableMeta) {
    return { ok: false, error: 'نوع الخدمة غير صالح' };
  }

  // التحقق من الموعد (لو معطى)
  if (input.appointment_id) {
    const { data: appt } = await supabase
      .from('appointments')
      .select('id, user_id')
      .eq('id', input.appointment_id)
      .eq('user_id', user.id)
      .single();

    if (!appt) return { ok: false, error: 'الموعد غير موجود' };
  }

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      upsert: (d: object, opts?: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  // بناء البيانات
  const data: Record<string, unknown> = {
    user_id: user.id,
    [tableMeta.fkColumn]: input.service_id,
    appointment_id: input.appointment_id || null,
    rating: input.rating,
    comment: input.comment || null,
    would_recommend: input.would_recommend ?? true,
    is_public: true,
  };

  // إضافة التقييمات التفصيلية
  if (input.detail_ratings) {
    Object.entries(input.detail_ratings).forEach(([key, value]) => {
      if (value && value >= 1 && value <= 5) {
        data[key] = value;
      } else {
        data[key] = null;
      }
    });
  }

  const { error } = await supabaseAny
    .from(tableMeta.table)
    .upsert(data, {
      onConflict: 'user_id,appointment_id',
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/services/${input.service_type === 'hospital' ? 'hospitals' : input.service_type}/${input.service_id}`);
  
  return { ok: true };
}

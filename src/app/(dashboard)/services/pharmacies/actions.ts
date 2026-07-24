'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database';

/**
 * ════════════════════════════════════════════════════════════════════
 * 💊 V25.46: Pharmacy Server Actions
 * ════════════════════════════════════════════════════════════════════
 * - createReservation (حجز دواء)
 * - cancelReservation
 * - toggleFavorite
 * - submitPharmacyRating
 * - addUserMedication / removeUserMedication
 * ════════════════════════════════════════════════════════════════════
 */

// ─── Types ───
export interface ReservationItem {
  medication_id?: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface CreateReservationInput {
  pharmacy_id: string;
  items: ReservationItem[];
  prescription_id?: string;
  family_member_id?: string;
  prescription_image_url?: string;
  customer_notes?: string;
  expected_pickup_at?: string;
}

// ─── 1. حجز دواء ───
export async function createPharmacyReservation(input: CreateReservationInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' };

  if (!input.items || input.items.length === 0) {
    return { ok: false, error: 'يجب اختيار دواء واحد على الأقل' };
  }

  // التحقق من وجود الصيدلية
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('id, name')
    .eq('id', input.pharmacy_id)
    .eq('is_active', true)
    .single();

  if (!pharmacy) {
    return { ok: false, error: 'الصيدلية غير موجودة أو غير نشطة' };
  }

  
  // expires_at = 24 ساعة من الآن
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: reservation, error } = await supabase
    .from('pharmacy_reservations')
    .insert({
      user_id: user.id,
      pharmacy_id: input.pharmacy_id,
      prescription_id: input.prescription_id || null,
      family_member_id: input.family_member_id || null,
      // JSONB — ReservationItem[] صالحة كـ JSON وقت التشغيل (cast حدّي)
      items: input.items as unknown as Json,
      prescription_image_url: input.prescription_image_url || null,
      customer_notes: input.customer_notes || null,
      expected_pickup_at: input.expected_pickup_at || null,
      expires_at: expiresAt,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !reservation) {
    return { ok: false, error: error?.message || 'فشل الحجز' };
  }

  revalidatePath('/account/pharmacy-reservations');
  revalidatePath(`/services/pharmacies/${input.pharmacy_id}`);

  return { ok: true, reservation_id: reservation.id };
}

// ─── 2. إلغاء حجز ───
export async function cancelPharmacyReservation(reservationId: string, reason?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  
  const { error } = await supabase
    .from('pharmacy_reservations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'إلغاء من المريض',
    })
    .eq('id', reservationId)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/pharmacy-reservations');
  return { ok: true };
}

// ─── 3. Favorites ───
export async function togglePharmacyFavorite(pharmacyId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: { id: string } | null }> } } };
      delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
      insert: (d: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  // هل موجود؟
  const { data: existing } = await supabaseAny
    .from('pharmacy_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (existing) {
    // احذف
    await supabaseAny
      .from('pharmacy_favorites')
      .delete()
      .eq('id', existing.id);
    
    revalidatePath('/account/pharmacies');
    revalidatePath(`/services/pharmacies/${pharmacyId}`);
    return { ok: true, favorited: false };
  } else {
    // أضف
    const { error } = await supabaseAny
      .from('pharmacy_favorites')
      .insert({ user_id: user.id, pharmacy_id: pharmacyId });
    
    if (error) return { ok: false, error: error.message };
    
    revalidatePath('/account/pharmacies');
    revalidatePath(`/services/pharmacies/${pharmacyId}`);
    return { ok: true, favorited: true };
  }
}

// ─── 4. Rating ───
interface PharmacyRatingInput {
  pharmacy_id: string;
  reservation_id?: string;
  rating: number;
  availability_rating?: number;
  price_rating?: number;
  service_rating?: number;
  comment?: string;
  would_recommend?: boolean;
}

export async function submitPharmacyRating(input: PharmacyRatingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  }

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      upsert: (d: object, opts?: object) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await supabaseAny
    .from('pharmacy_ratings')
    .upsert({
      user_id: user.id,
      pharmacy_id: input.pharmacy_id,
      reservation_id: input.reservation_id || null,
      rating: input.rating,
      availability_rating: input.availability_rating || null,
      price_rating: input.price_rating || null,
      service_rating: input.service_rating || null,
      comment: input.comment || null,
      would_recommend: input.would_recommend ?? true,
      is_public: true,
    }, {
      onConflict: 'user_id,reservation_id',
    });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/services/pharmacies/${input.pharmacy_id}`);
  return { ok: true };
}

// ─── 5. User Medications ───
export interface UserMedicationInput {
  medication_id?: string;
  custom_name?: string;
  dosage?: string;
  frequency?: string;
  timing?: string[];
  notes?: string;
  start_date?: string;
  end_date?: string;
  is_chronic?: boolean;
  enable_reminders?: boolean;
  prescription_id?: string;
  family_member_id?: string;
}

export async function addUserMedication(input: UserMedicationInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (!input.medication_id && !input.custom_name) {
    return { ok: false, error: 'يجب اختيار دواء أو إدخال اسمه' };
  }

  
  const { data, error } = await supabase
    .from('user_medications')
    .insert({
      user_id: user.id,
      medication_id: input.medication_id || null,
      custom_name: input.custom_name || null,
      dosage: input.dosage || null,
      frequency: input.frequency || null,
      timing: input.timing || null,
      notes: input.notes || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      is_chronic: input.is_chronic ?? false,
      enable_reminders: input.enable_reminders ?? false,
      prescription_id: input.prescription_id || null,
      family_member_id: input.family_member_id || null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || 'فشل الحفظ' };
  }

  revalidatePath('/account/medications');
  return { ok: true, id: data.id };
}

export async function removeUserMedication(medicationId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  
  const { error } = await supabase
    .from('user_medications')
    .delete()
    .eq('id', medicationId)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/medications');
  return { ok: true };
}

export async function toggleUserMedicationActive(medicationId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  
  const { data: med } = await supabase
    .from('user_medications')
    .select('is_active')
    .eq('id', medicationId)
    .eq('user_id', user.id)
    .single();

  if (!med) return { ok: false, error: 'الدواء غير موجود' };

  await supabase
    .from('user_medications')
    .update({ is_active: !med.is_active })
    .eq('id', medicationId);

  revalidatePath('/account/medications');
  return { ok: true };
}

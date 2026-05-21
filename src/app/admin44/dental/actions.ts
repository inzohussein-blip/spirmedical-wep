'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false as const, error: 'غير مصرّح' };
  }

  return { ok: true as const, supabase, userId: user.id };
}

interface DentalInput {
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  doctor_count: number;
  doctor_names: string[];
  specialties: string[];
  cleaning_price_min: number;
  cleaning_price_max: number;
  filling_price_min: number;
  filling_price_max: number;
  implant_price_min: number;
  implant_price_max: number;
  offers_cleaning: boolean;
  offers_fillings: boolean;
  offers_extraction: boolean;
  offers_implants: boolean;
  offers_orthodontics: boolean;
  offers_whitening: boolean;
  offers_pediatric: boolean;
  offers_emergency: boolean;
  working_hours: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
}

export async function createDentalClinic(input: DentalInput) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('dental_clinics').insert(input);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/dental');
  revalidatePath('/services/dental');
  return { ok: true };
}

export async function updateDentalClinic(id: string, input: Partial<DentalInput>) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('dental_clinics')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/dental');
  revalidatePath('/services/dental');
  return { ok: true };
}

export async function deleteDentalClinic(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('dental_clinics')
    .delete()
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/dental');
  revalidatePath('/services/dental');
  return { ok: true };
}

export async function toggleDentalActive(id: string, isActive: boolean) {
  return updateDentalClinic(id, { is_active: isActive });
}

export async function toggleDentalFeatured(id: string, isFeatured: boolean) {
  return updateDentalClinic(id, { is_featured: isFeatured });
}

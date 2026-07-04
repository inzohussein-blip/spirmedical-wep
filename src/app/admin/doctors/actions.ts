'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false, error: 'غير مصرّح' };
  }

  return { ok: true, supabase, userId: user.id };
}

interface DoctorInput {
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  specialty: string;
  sub_specialty: string | null;
  years_experience: number;
  clinic_city: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  clinic_lat: number | null;
  clinic_lng: number | null;
  bio: string | null;
  qualifications: string[];
  languages: string[];
  home_visit_price: number;
  video_consult_price: number;
  monthly_subscription_price: number | null;
  yearly_subscription_price: number | null;
  available_for_home_visit: boolean;
  available_for_video: boolean;
}

export async function createDoctor(input: DoctorInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('doctors')
    .insert({
      ...input,
      qualifications: input.qualifications.length > 0 ? input.qualifications : null,
      is_active: true,
      is_verified: false,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/doctors');
  revalidatePath('/services/doctors');
  return { success: true };
}

export async function updateDoctor(id: string, input: DoctorInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('doctors')
    .update({
      ...input,
      qualifications: input.qualifications.length > 0 ? input.qualifications : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/doctors');
  revalidatePath('/services/doctors');
  revalidatePath(`/services/doctors/${id}`);
  return { success: true };
}

export async function deleteDoctor(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('doctors')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/doctors');
  return { success: true };
}

export async function toggleDoctorActive(id: string, newValue: boolean) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('doctors')
    .update({ is_active: newValue, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/doctors');
  revalidatePath('/services/doctors');
  return { success: true };
}

export async function verifyDoctor(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('doctors')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/doctors');
  return { success: true };
}

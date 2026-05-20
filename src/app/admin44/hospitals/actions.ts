'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false, error: 'غير مصرّح' };
  }
  return { ok: true, supabase };
}

interface HospitalInput {
  name: string;
  name_en: string | null;
  type: 'government' | 'private' | 'health_center' | 'specialized';
  city: string;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  phone_emergency: string | null;
  whatsapp: string | null;
  is_24h: boolean;
  visiting_hours: string | null;
  departments: string[] | null;
  has_emergency: boolean;
  has_ambulance: boolean;
  has_pharmacy: boolean;
  has_lab: boolean;
  has_radiology: boolean;
  beds_count: number | null;
  icu_beds_count: number | null;
  description: string | null;
}

export async function createHospital(input: HospitalInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from('hospitals').insert({
    ...input,
    is_active: true,
    is_verified: true,  // إذا أضافه admin = موثّق
    verified_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/hospitals');
  revalidatePath('/services/hospitals');
  return { success: true };
}

export async function updateHospital(id: string, input: HospitalInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('hospitals')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/hospitals');
  revalidatePath('/services/hospitals');
  return { success: true };
}

export async function deleteHospital(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from('hospitals').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/hospitals');
  return { success: true };
}

export async function toggleHospitalActive(id: string, newValue: boolean) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('hospitals')
    .update({ is_active: newValue, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/hospitals');
  revalidatePath('/services/hospitals');
  return { success: true };
}

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

interface MedicationInput {
  name_ar: string;
  name_en: string | null;
  generic_name: string | null;
  manufacturer: string | null;
  country_of_origin: string | null;
  category: string;
  form: string | null;
  strength: string | null;
  package_size: string | null;
  requires_prescription: boolean;
  is_controlled: boolean;
  side_effects: string | null;
}

export async function createMedication(input: MedicationInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from('medications').insert(input);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/medications');
  return { success: true };
}

export async function updateMedication(id: string, input: MedicationInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('medications')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/medications');
  return { success: true };
}

export async function deleteMedication(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from('medications').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/medications');
  return { success: true };
}

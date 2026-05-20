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

interface PharmacyInput {
  name: string;
  city: string;
  district: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string | null;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
  has_emergency_section: boolean;
  owner_email?: string | null;
}

export async function createPharmacy(input: PharmacyInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  // البحث عن المالك
  let ownerUserId: string | null = null;
  if (input.owner_email) {
    const { data: owner } = await auth.supabase
      .from('users')
      .select('id')
      .eq('email', input.owner_email)
      .maybeSingle();
    ownerUserId = owner?.id ?? null;
  }

  const { owner_email, ...data } = input;
  void owner_email;

  const { error } = await auth.supabase.from('pharmacies').insert({
    ...data,
    owner_user_id: ownerUserId,
    is_active: true,
    is_verified: true,
    verified_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/pharmacies');
  revalidatePath('/services/pharmacies');
  return { success: true };
}

export async function updatePharmacy(id: string, input: PharmacyInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  let ownerUserId: string | null | undefined = undefined;
  if (input.owner_email !== undefined) {
    if (input.owner_email) {
      const { data: owner } = await auth.supabase
        .from('users')
        .select('id')
        .eq('email', input.owner_email)
        .maybeSingle();
      ownerUserId = owner?.id ?? null;
    } else {
      ownerUserId = null;
    }
  }

  const { owner_email, ...data } = input;
  void owner_email;
  const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
  if (ownerUserId !== undefined) updates.owner_user_id = ownerUserId;

  const { error } = await auth.supabase
    .from('pharmacies')
    .update(updates)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/pharmacies');
  revalidatePath('/services/pharmacies');
  return { success: true };
}

export async function deletePharmacy(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from('pharmacies').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/pharmacies');
  return { success: true };
}

export async function togglePharmacyActive(id: string, newValue: boolean) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('pharmacies')
    .update({ is_active: newValue, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin44/pharmacies');
  revalidatePath('/services/pharmacies');
  return { success: true };
}

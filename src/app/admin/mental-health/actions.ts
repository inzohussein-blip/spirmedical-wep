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

export async function createMentalSpecialist(input: Record<string, unknown>) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('mental_health_specialists').insert(input as never);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/mental-health');
  revalidatePath('/services/mental-health');
  return { ok: true };
}

export async function updateMentalSpecialist(id: string, input: Record<string, unknown>) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('mental_health_specialists').update({ ...input, updated_at: new Date().toISOString() } as never).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/mental-health');
  revalidatePath('/services/mental-health');
  return { ok: true };
}

export async function deleteMentalSpecialist(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('mental_health_specialists').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/mental-health');
  revalidatePath('/services/mental-health');
  return { ok: true };
}

export async function toggleMentalActive(id: string, isActive: boolean) {
  return updateMentalSpecialist(id, { is_active: isActive });
}

export async function toggleMentalVerified(id: string, isVerified: boolean) {
  return updateMentalSpecialist(id, { is_verified: isVerified });
}

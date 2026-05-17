'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface PrescriptionInput {
  doctor_name: string;
  doctor_specialty?: string;
  medication: string;
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  notes?: string;
  prescribed_at?: string;
}

export async function createPrescription(input: PrescriptionInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase.from('prescriptions').insert({
    user_id: user.id,
    doctor_name: input.doctor_name,
    doctor_specialty: input.doctor_specialty || null,
    medication: input.medication,
    dosage: input.dosage || null,
    frequency: input.frequency || null,
    duration_days: input.duration_days || null,
    notes: input.notes || null,
    prescribed_at: input.prescribed_at || new Date().toISOString().split('T')[0],
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/prescriptions');
  return { ok: true };
}

export async function deletePrescription(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/prescriptions');
  return { ok: true };
}

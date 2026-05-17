'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type VitalType = 'pulse' | 'blood_pressure' | 'blood_sugar' | 'temperature' | 'weight' | 'oxygen' | 'height';

interface VitalInput {
  vital_type: VitalType;
  value: string;
  unit?: string;
  notes?: string;
}

export async function recordVital(input: VitalInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase.from('health_vitals').insert({
    user_id: user.id,
    vital_type: input.vital_type,
    value: input.value,
    unit: input.unit || null,
    notes: input.notes || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/health');
  return { ok: true };
}

export async function deleteVital(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('health_vitals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/account/health');
  return { ok: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { MedicalInfo } from './types';

export async function updateMedicalInfo(info: MedicalInfo) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const { error } = await supabase
    .from('users')
    .update({ medical_info: info as never })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account/medical-record');
  revalidatePath('/account/health');
  return { ok: true };
}

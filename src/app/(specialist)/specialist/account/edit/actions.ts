'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateSpecialistInput {
  full_name: string;
  governorate: string;
  email?: string;
  specialist_bio?: string;
  specialist_years_exp?: number;
}

export async function updateSpecialistProfile(input: UpdateSpecialistInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  if (input.full_name.trim().length < 2) {
    return { ok: false, error: 'الاسم يجب أن يحتوي على حرفين على الأقل' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: input.full_name.trim(),
      governorate: input.governorate,
      email: input.email?.trim() || null,
      specialist_bio: input.specialist_bio?.trim() || null,
      specialist_years_exp: input.specialist_years_exp ?? null,
    } as never)
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/specialist/account');
  revalidatePath('/specialist/account/edit');
  return { ok: true };
}

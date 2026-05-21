'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generateMyReferralCode() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول' };

  // نتفقد إذا في كود موجود
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return { ok: true, code: existing.code, alreadyExists: true };
  }

  // نُولّد كود عبر الـ function
  const { data, error } = await supabase
    .rpc('generate_referral_code', { p_user_id: user.id });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/account/rewards');
  return { ok: true, code: data as string, alreadyExists: false };
}

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
  return { ok: true, supabase, userId: user.id };
}

export interface BetaCodeInput {
  code: string;
  description: string | null;
  max_uses: number;
  expires_at: string | null;
}

export async function createBetaCode(input: BetaCodeInput) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const code = input.code.toUpperCase().trim();
  if (!/^[A-Z0-9-_]{3,30}$/.test(code)) {
    return { success: false, error: 'الرمز يجب أن يكون 3-30 حرفاً (أحرف كبيرة وأرقام)' };
  }

  const { error } = await auth.supabase
    .from('beta_codes')
    .insert({
      code,
      description: input.description,
      max_uses: input.max_uses,
      expires_at: input.expires_at,
      created_by: auth.userId,
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'هذا الرمز موجود مسبقاً' };
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/beta-codes');
  return { success: true };
}

export async function toggleBetaCode(id: string, isActive: boolean) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from('beta_codes')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/beta-codes');
  return { success: true };
}

export async function deleteBetaCode(id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from('beta_codes').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/beta-codes');
  return { success: true };
}

export async function generateRandomBetaCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BETA-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

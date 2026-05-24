'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🏃 V26.1: Physio Admin Actions
 * ════════════════════════════════════════════════════════════════════
 */

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return null;
  }
  return supabase;
}

export async function toggleVerifyPhysio(id: string, verified: boolean) {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, error: 'unauthorized' };

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      update: (d: object) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
  };

  const { error } = await supabaseAny
    .from('physio_specialists')
    .update({ is_verified: verified })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/physio');
  return { ok: true };
}

export async function toggleActivePhysio(id: string, active: boolean) {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, error: 'unauthorized' };

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      update: (d: object) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
  };

  const { error } = await supabaseAny
    .from('physio_specialists')
    .update({ is_active: active })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/physio');
  return { ok: true };
}

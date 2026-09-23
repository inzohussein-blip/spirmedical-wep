'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Admin functions
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

export async function updateBugStatus(
  id: string,
  status: 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate',
  fixedInVersion?: string
) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'fixed') {
    updates.fixed_at = new Date().toISOString();
    if (fixedInVersion) updates.fixed_in_version = fixedInVersion;
  }

  const { error } = await auth.supabase
    .from('bug_reports')
    .update(updates)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/bugs');
  return { success: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export interface BugReportInput {
  title: string;
  description: string;
  steps_to_reproduce?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  page_url?: string | null;
}

// Public: any user can report a bug
export async function reportBug(input: BugReportInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ua = headers().get('user-agent') || null;

  const { error } = await supabase.from('bug_reports').insert({
    user_id: user?.id || null,
    title: input.title,
    description: input.description,
    steps_to_reproduce: input.steps_to_reproduce || null,
    severity: input.severity || 'medium',
    page_url: input.page_url || null,
    user_agent: ua,
    browser: detectBrowser(ua),
    device: detectDevice(ua),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

function detectBrowser(ua: string | null): string | null {
  if (!ua) return null;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Unknown';
}

function detectDevice(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

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

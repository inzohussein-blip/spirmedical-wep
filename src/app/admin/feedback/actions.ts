'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export interface FeedbackInput {
  type: 'suggestion' | 'complaint' | 'praise' | 'feature_request' | 'other';
  category: string;
  rating?: number | null;
  subject?: string | null;
  message: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  page_url?: string | null;
}

// المستخدم العادي يُرسل ملاحظة
export async function submitFeedback(input: FeedbackInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ua = headers().get('user-agent') || null;

  const { error } = await supabase.from('user_feedback').insert({
    user_id: user?.id || null,
    type: input.type,
    category: input.category,
    rating: input.rating ?? null,
    subject: input.subject ?? null,
    message: input.message,
    contact_email: input.contact_email ?? null,
    contact_phone: input.contact_phone ?? null,
    page_url: input.page_url ?? null,
    user_agent: ua,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
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

export async function updateFeedbackStatus(
  id: string,
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived',
  adminNotes?: string
) {
  const auth = await verifyAdmin();
  if (!auth.ok || !auth.supabase) return { success: false, error: auth.error };

  const updates: Record<string, unknown> = { status };
  if (status === 'reviewed') updates.reviewed_at = new Date().toISOString();
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();
  if (adminNotes !== undefined) updates.admin_notes = adminNotes;

  const { error } = await auth.supabase
    .from('user_feedback')
    .update(updates)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/feedback');
  return { success: true };
}

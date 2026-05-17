'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'unauthorized', supabase: null };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) return { ok: false as const, error: 'forbidden', supabase: null };
  return { ok: true as const, user, supabase };
}

/**
 * إضافة تصنيف (tag) لمريض
 */
export async function addPatientTag(patientId: string, tag: string, color: string = 'emerald') {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!tag.trim()) return { ok: false, error: 'التصنيف فارغ' };

  const { error } = await auth.supabase.from('patient_tags').insert({
    patient_id: patientId,
    tag: tag.trim(),
    color,
    added_by: auth.user!.id,
  });

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'هذا التصنيف موجود مسبقاً' };
    return { ok: false, error: error.message };
  }

  await logAdminAction({
    action_type: 'add_patient_tag',
    target_type: 'user',
    target_id: patientId,
    details: { tag, color },
  });

  revalidatePath(`/admin44/patients/${patientId}`);
  return { ok: true };
}

/**
 * حذف تصنيف
 */
export async function removePatientTag(tagId: string, patientId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('patient_tags').delete().eq('id', tagId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'remove_patient_tag',
    target_type: 'user',
    target_id: patientId,
    details: { tag_id: tagId },
  });

  revalidatePath(`/admin44/patients/${patientId}`);
  return { ok: true };
}

/**
 * إضافة ملاحظة على مريض
 */
export async function addPatientNote(
  patientId: string,
  note: string,
  noteType: 'general' | 'warning' | 'vip' | 'follow_up' = 'general',
  isPinned: boolean = false
) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!note.trim()) return { ok: false, error: 'الملاحظة فارغة' };

  const { error } = await auth.supabase.from('patient_notes').insert({
    patient_id: patientId,
    admin_id: auth.user!.id,
    note: note.trim(),
    note_type: noteType,
    is_pinned: isPinned,
  });

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'add_patient_note',
    target_type: 'user',
    target_id: patientId,
    details: { note_type: noteType, is_pinned: isPinned },
  });

  revalidatePath(`/admin44/patients/${patientId}`);
  return { ok: true };
}

/**
 * حذف ملاحظة
 */
export async function deletePatientNote(noteId: string, patientId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from('patient_notes').delete().eq('id', noteId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin44/patients/${patientId}`);
  return { ok: true };
}

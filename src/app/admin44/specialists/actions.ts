'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';
import {
  notifySpecialistApproved as notifySpecialistApprovedWA,
  notifySpecialistRejected as notifySpecialistRejectedWA,
} from '@/lib/notifications';
import {
  notifySpecialistApproved,
  notifySpecialistRejected,
} from '@/lib/services/push-templates';
import type { SpecialistType } from '@/lib/specialist-types';

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
  return { ok: true as const, user, role: profile!.role, supabase };
}

/**
 * الموافقة على اختصاصي + تحديد نوعه
 */
export async function approveSpecialist(
  specialistId: string,
  specialistType: SpecialistType,
  notes?: string
) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('users')
    .update({
      approval_status: 'approved',
      specialist_type: specialistType,
      rejection_reason: null,
      admin_internal_notes: notes ?? null,
    })
    .eq('id', specialistId)
    .eq('role', 'specialist');

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'approve_specialist',
    target_type: 'user',
    target_id: specialistId,
    details: { specialist_type: specialistType, notes },
  });

  // إرسال إشعار واتساب (fire-and-forget)
  notifySpecialistApprovedWA(specialistId, specialistType, auth.supabase).catch(console.error);

  // ✨ V25.3: Push notification للأخصائي (clean template)
  notifySpecialistApproved(specialistId, {
    specialistType,
  }).catch((err) => console.error('Push approval failed:', err));

  revalidatePath('/admin44/specialists/pending');
  revalidatePath('/admin44/specialists');
  revalidatePath(`/admin44/specialists/${specialistId}`);
  return { ok: true };
}

/**
 * رفض اختصاصي
 */
export async function rejectSpecialist(specialistId: string, reason: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!reason.trim()) return { ok: false, error: 'يرجى ذكر سبب الرفض' };

  const { error } = await auth.supabase
    .from('users')
    .update({
      approval_status: 'rejected',
      rejection_reason: reason.trim(),
    })
    .eq('id', specialistId)
    .eq('role', 'specialist');

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'reject_specialist',
    target_type: 'user',
    target_id: specialistId,
    details: { reason },
  });

  // إرسال إشعار واتساب
  notifySpecialistRejectedWA(specialistId, reason, auth.supabase).catch(console.error);

  // ✨ V25.3: Push notification للأخصائي
  notifySpecialistRejected(specialistId, {
    reason: reason.trim(),
  }).catch((err) => console.error('Push rejection failed:', err));

  revalidatePath('/admin44/specialists/pending');
  revalidatePath('/admin44/specialists');
  return { ok: true };
}

/**
 * تعليق/إلغاء تعليق مستخدم
 */
export async function toggleSuspendUser(userId: string, suspend: boolean, reason?: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('users')
    .update({
      is_suspended: suspend,
      suspension_reason: suspend ? (reason ?? null) : null,
      suspended_at: suspend ? new Date().toISOString() : null,
      suspended_by: suspend ? auth.user!.id : null,
    })
    .eq('id', userId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: suspend ? 'suspend_user' : 'unsuspend_user',
    target_type: 'user',
    target_id: userId,
    details: { reason },
  });

  revalidatePath('/admin44/specialists');
  revalidatePath('/admin44/patients');
  revalidatePath(`/admin44/specialists/${userId}`);
  revalidatePath(`/admin44/patients/${userId}`);
  return { ok: true };
}

/**
 * تعديل نوع الاختصاصي
 */
export async function updateSpecialistType(specialistId: string, newType: SpecialistType) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('users')
    .update({ specialist_type: newType })
    .eq('id', specialistId)
    .eq('role', 'specialist');

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'edit_user',
    target_type: 'user',
    target_id: specialistId,
    details: { field: 'specialist_type', new_value: newType },
  });

  revalidatePath('/admin44/specialists');
  revalidatePath(`/admin44/specialists/${specialistId}`);
  return { ok: true };
}

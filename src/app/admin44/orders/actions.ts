'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';
import { notifyOrderAssigned, notifyOrderCancelled } from '@/lib/notifications';

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
 * تعيين اختصاصي يدوياً لطلب
 */
export async function assignOrderToSpecialist(orderId: string, specialistId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('appointments')
    .update({
      assigned_specialist_id: specialistId,
      status: 'confirmed',
    })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'assign_appointment',
    target_type: 'appointment',
    target_id: orderId,
    details: { specialist_id: specialistId },
  });

  // إرسال إشعار واتساب
  notifyOrderAssigned(orderId, auth.supabase).catch(console.error);

  revalidatePath(`/admin44/orders/${orderId}`);
  revalidatePath('/admin44/orders');
  return { ok: true };
}

/**
 * إلغاء طلب من الإدارة
 */
export async function adminCancelOrder(orderId: string, reason: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!reason.trim()) return { ok: false, error: 'يرجى ذكر سبب الإلغاء' };

  const { error } = await auth.supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancellation_reason: `[إدارة] ${reason.trim()}`,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'cancel_appointment',
    target_type: 'appointment',
    target_id: orderId,
    details: { reason },
  });

  // إرسال إشعار واتساب
  notifyOrderCancelled(orderId, reason, auth.supabase).catch(console.error);

  revalidatePath(`/admin44/orders/${orderId}`);
  revalidatePath('/admin44/orders');
  return { ok: true };
}

/**
 * إعادة جدولة طلب
 */
export async function rescheduleOrder(orderId: string, newDate: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('appointments')
    .update({ scheduled_at: newDate })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    action_type: 'edit_user',
    target_type: 'appointment',
    target_id: orderId,
    details: { field: 'scheduled_at', new_value: newDate },
  });

  revalidatePath(`/admin44/orders/${orderId}`);
  return { ok: true };
}

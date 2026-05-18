'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';
import { notifyOrderAssigned, notifyOrderCancelled as notifyOrderCancelledWA } from '@/lib/notifications';
import {
  notifySpecialistAssigned,
  notifyOrderCancelled,
  notifyNewOrderForSpecialist,
} from '@/lib/services/push-templates';

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
 * تعيين اختصاصي يدوياً لطلب + Push للمريض والأخصائي
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

  // ✨ V25.3: Push notifications للمريض والأخصائي
  try {
    const { data: order } = await auth.supabase
      .from('appointments')
      .select(`
        id, user_id, service_type, scheduled_at,
        users:user_id (full_name),
        specialist:assigned_specialist_id (full_name, user_id)
      `)
      .eq('id', orderId)
      .single();

    if (order) {
      const orderRow = order as unknown as {
        user_id: string;
        service_type: string;
        scheduled_at: string;
        users: { full_name: string | null } | null;
        specialist: { full_name: string | null; user_id: string | null } | null;
      };

      const specialistName = orderRow.specialist?.full_name || 'أخصائي';
      const patientName = orderRow.users?.full_name || 'مريض';

      // Push للمريض
      if (orderRow.user_id) {
        notifySpecialistAssigned(orderRow.user_id, {
          orderId,
          specialistName,
          serviceName: orderRow.service_type,
        }).catch(console.error);
      }

      // Push للأخصائي
      if (orderRow.specialist?.user_id) {
        notifyNewOrderForSpecialist(orderRow.specialist.user_id, {
          orderId,
          serviceName: orderRow.service_type,
          patientName,
          scheduledAt: orderRow.scheduled_at,
        }).catch(console.error);
      }
    }
  } catch (err) {
    console.error('Push notification failed:', err);
  }

  revalidatePath(`/admin44/orders/${orderId}`);
  revalidatePath('/admin44/orders');
  return { ok: true };
}

/**
 * إلغاء طلب من الإدارة + Push
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
  notifyOrderCancelledWA(orderId, reason, auth.supabase).catch(console.error);

  // ✨ V25.3: Push للمريض
  try {
    const { data: order } = await auth.supabase
      .from('appointments')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (order?.user_id) {
      notifyOrderCancelled(order.user_id, {
        orderId,
        reason: reason.trim(),
      }).catch(console.error);
    }
  } catch (err) {
    console.error('Push notification failed:', err);
  }

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

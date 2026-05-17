'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';
import { enqueueRawNotification } from '@/lib/notifications';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'unauthorized', supabase: null };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!isAdminRole(profile?.role)) return { ok: false as const, error: 'forbidden', supabase: null };
  return { ok: true as const, user, supabase };
}

/**
 * إرسال رسالة WhatsApp يدوية لمستخدم
 */
export async function sendManualWhatsApp(phone: string, body: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!phone.trim() || !body.trim()) {
    return { ok: false, error: 'الهاتف والنص مطلوبان' };
  }

  // ابحث عن user_id من الهاتف (إن وجد)
  const { data: target } = await auth.supabase
    .from('users')
    .select('id')
    .eq('phone', phone.trim())
    .single();

  const result = await enqueueRawNotification({
    recipientUserId: target?.id,
    recipientPhone: phone.trim(),
    channel: 'whatsapp',
    body: body.trim(),
    createdBy: auth.user!.id,
  }, auth.supabase);

  if (!result.ok) return { ok: false, error: result.error };

  await logAdminAction({
    action_type: 'send_notification',
    target_type: 'notification',
    target_id: result.id,
    details: { phone, channel: 'whatsapp', length: body.length },
  });

  revalidatePath('/admin44/notifications');
  return { ok: true, id: result.id };
}

/**
 * إعادة إرسال رسالة فشلت
 */
export async function retryNotification(notificationId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('notification_queue')
    .update({
      status: 'pending',
      attempts: 0,
      failed_at: null,
      error_message: null,
    })
    .eq('id', notificationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/notifications');
  return { ok: true };
}

/**
 * إلغاء رسالة معلّقة
 */
export async function cancelNotification(notificationId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('notification_queue')
    .update({ status: 'cancelled' })
    .eq('id', notificationId)
    .eq('status', 'pending');

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin44/notifications');
  return { ok: true };
}

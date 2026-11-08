'use server';

import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';
import { createClient } from '@/lib/supabase/server';

/**
 * إسنادٌ من لوحة الإرسال — القواعدُ كلُّها في `admin_assign_order` (0070):
 * مديرٌ، ومختصٌّ معتمَدٌ غيرُ موقوف من النوع المطلوب، وطلبٌ لم يصل المراجع.
 * عميلُ RLS بجلسة المدير (لا عميل الخدمة): الدالّةُ تسأل `auth.uid()` نفسها.
 */
export async function assignFromDispatch(orderId: string, specialistId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'سجّل الدخول أوّلاً' };
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isAdminRole(me?.role)) return { ok: false, error: 'للإدارة فقط' };

  const { data, error } = await supabase.rpc('admin_assign_order', { p_order_id: orderId, p_specialist_id: specialistId });
  if (error) return { ok: false, error: 'تعذّر الإسناد. حاول مجدداً.' };
  const r = data as { ok: boolean; error?: string; previous?: string | null; unchanged?: boolean };
  if (!r?.ok) return { ok: false, error: r?.error ?? 'تعذّر الإسناد' };

  if (!r.unchanged) {
    await logAdminAction({
      action_type: r.previous ? 'order.reassign' : 'order.assign',
      target_type: 'appointment',
      target_id: orderId,
      details: { specialist_id: specialistId, previous: r.previous ?? null, source: 'dispatch' },
    });
  }
  revalidatePath('/admin/dispatch');
  revalidatePath('/admin/orders');
  return { ok: true };
}

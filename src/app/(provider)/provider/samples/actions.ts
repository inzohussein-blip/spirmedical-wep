'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { sanitizeLabResults, toLabResultRows, type LabResultInput } from '@/lib/labs/lab-results';
import { notifyTestResultsReady } from '@/lib/services/push-templates';
import { notifyInbox } from '@/lib/inbox-notify';
import { logger } from '@/lib/logger';

/**
 * 🧪 المختبرُ يستلم العيّنة ويرفع النتائج (الدفعة 2، قرار المالك: المريض ← المختبر ← المحلّل).
 *
 * صفوفُ `lab_orders` و`lab_results` لا سياسةَ فيها للمختبر، فالكتابةُ بعميل الخدمة — **بعد** التحقّق هنا:
 * حسابُ مختبرٍ معتمَد غيرُ موقوف، والطلبُ مُسلَّمٌ إليه (`lab_specialist_id`)، والانتقالُ من حالةٍ متوقَّعة
 * (`.eq('status', …)` ويُعدّ الصفّ). المديرُ يمرّ كما في نافذة المختصّ.
 */
type LabCtx = { userId: string; admin: boolean };

async function requireLab(): Promise<LabCtx | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'سجّل الدخول أوّلاً' };
  const { data: p } = await supabase
    .from('users').select('role, provider_type, approval_status, is_suspended').eq('id', user.id).single();
  if (isAdminRole(p?.role)) return { userId: user.id, admin: true };
  if (p?.role !== 'provider' || p.provider_type !== 'lab') return { error: 'لحسابات المختبرات وحدها' };
  if (p.approval_status !== 'approved' || p.is_suspended) return { error: 'حسابُك بانتظار الاعتماد' };
  return { userId: user.id, admin: false };
}

async function loadOwnOrder(ctx: LabCtx, orderId: string) {
  const { data } = await createAdminClient()
    .from('lab_orders')
    .select('id, user_id, status, lab_specialist_id, appointment_id, lab_name_snapshot')
    .eq('id', orderId)
    .maybeSingle();
  if (!data) return null;
  if (!ctx.admin && data.lab_specialist_id !== ctx.userId) return null;
  return data;
}

/** «استلمتُ العيّنة»: من «في الطريق» إلى «قيد التحليل» */
export async function receiveSample(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireLab();
  if ('error' in ctx) return { ok: false, error: ctx.error };
  const order = await loadOwnOrder(ctx, orderId);
  if (!order) return { ok: false, error: 'الطلب غير موجود' };

  let q = createAdminClient()
    .from('lab_orders')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'sent_to_lab');
  if (!ctx.admin) q = q.eq('lab_specialist_id', ctx.userId);
  const { data, error } = await q.select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: 'حالةُ الطلب تغيّرت — حدّث الصفحة' };

  revalidatePath('/provider/samples');
  revalidatePath(`/provider/samples/${orderId}`);
  return { ok: true };
}

/** النتائج: تستبدل ما سبق، والطلبُ «النتائج جاهزة»، ويُخطَر المريض */
export async function saveResultsAsLab(
  orderId: string,
  input: LabResultInput[],
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireLab();
  if ('error' in ctx) return { ok: false, error: ctx.error };
  const order = await loadOwnOrder(ctx, orderId);
  if (!order) return { ok: false, error: 'الطلب غير موجود' };
  if (!['sent_to_lab', 'processing', 'results_ready'].includes(order.status ?? '')) {
    return { ok: false, error: 'لم تصل العيّنةُ إلى مختبرك بعد' };
  }
  if (!order.user_id) return { ok: false, error: 'الطلب بلا مريض' };

  const clean = sanitizeLabResults(input);
  if (!clean.ok) return { ok: false, error: clean.error };

  const db = createAdminClient();
  const { error: deleteError } = await db.from('lab_results').delete().eq('lab_order_id', orderId);
  if (deleteError) {
    logger.error('Lab provider: clearing previous results failed', { lab_order_id: orderId, error: deleteError.message });
    return { ok: false, error: 'تعذّر استبدال النتائج السابقة. حاول مرة أخرى.' };
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await db
    .from('lab_results')
    .insert(toLabResultRows(clean.results, { labOrderId: orderId, patientId: order.user_id, enteredBy: ctx.userId, at: now }))
    .select('id');
  if (insertError) return { ok: false, error: insertError.message };
  if ((inserted?.length ?? 0) !== clean.results.length) return { ok: false, error: 'لم تُحفظ كلُّ النتائج — حاول مرّةً أخرى' };

  const { data: updated, error: statusError } = await db
    .from('lab_orders')
    .update({ status: 'results_ready', updated_at: now })
    .eq('id', orderId)
    .select('id');
  if (statusError || !updated?.length) {
    logger.error('Lab results saved but status update failed', { lab_order_id: orderId, error: statusError?.message });
    return { ok: false, error: 'حُفظت النتائج لكن تعذّر تعليمُ الطلب «جاهزاً» — حاول مرّةً أخرى' };
  }

  const first = order.status !== 'results_ready';
  await notifyInbox([{
    user_id: order.user_id,
    title: first ? 'نتائجُ تحاليلك جاهزة' : 'عُدّلت نتائجُ تحاليلك',
    body: `${order.lab_name_snapshot || 'المختبر'} رفع النتائج — اضغط للعرض.`,
    type: 'lab_results',
    link: `/account/lab-history/${orderId}`,
  }]);
  if (first && order.appointment_id) {
    notifyTestResultsReady(order.user_id, { orderId: order.appointment_id }).catch(() => null);
  }

  revalidatePath('/provider/samples');
  revalidatePath(`/provider/samples/${orderId}`);
  revalidatePath('/account/lab-history');
  return { ok: true };
}

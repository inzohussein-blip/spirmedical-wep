'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { isErrorSource } from '@/lib/ops/errors-overview';

/**
 * 🚨 إجراءاتُ رصد الأخطاء: «تمّ الحلّ» وإعادةُ الفتح وحذفُ المحلول القديم.
 * الجدولُ بلا سياسات (0057) — يُكتب بعميل الخدمة بعد التحقّق من الدور، ويُعدّ ما تغيّر.
 */
export interface ErrorActionResult {
  ok: boolean;
  message: string;
}

const CAN_ACT = ['super_admin', 'admin', 'manager'];

async function requireActor(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return profile?.role && CAN_ACT.includes(profile.role) ? user.id : null;
}

export async function setErrorResolved(id: string, resolved: boolean): Promise<ErrorActionResult> {
  const actor = await requireActor();
  if (!actor) return { ok: false, message: 'غيرُ مصرَّح' };
  const { data, error } = await createServiceClient()
    .from('system_errors')
    .update(resolved ? { resolved_at: new Date().toISOString(), resolved_by: actor } : { resolved_at: null, resolved_by: null })
    .eq('id', id)
    .select('id');
  if (error || !data?.length) return { ok: false, message: 'تعذّر الحفظ' };
  revalidatePath('/admin/errors');
  return { ok: true, message: resolved ? 'عُلِّم محلولاً' : 'أُعيد فتحُه' };
}

/** «حلُّ الكلّ» للمصدر المعروض (أو للجميع) — بعد إصلاحٍ يغطّيها */
export async function resolveAllOpen(source: string | null): Promise<ErrorActionResult> {
  const actor = await requireActor();
  if (!actor) return { ok: false, message: 'غيرُ مصرَّح' };
  let q = createServiceClient()
    .from('system_errors')
    .update({ resolved_at: new Date().toISOString(), resolved_by: actor })
    .is('resolved_at', null);
  if (source && isErrorSource(source)) q = q.eq('source', source);
  const { data, error } = await q.select('id');
  if (error) return { ok: false, message: 'تعذّر الحفظ' };
  revalidatePath('/admin/errors');
  return { ok: true, message: `عُلِّم ${data?.length ?? 0} محلولاً` };
}

/** حذفُ ما حُلّ منذ أكثر من 30 يوماً — ما يعود بعد الحذف يظهر خطأً جديداً */
export async function purgeOldResolved(): Promise<ErrorActionResult> {
  const actor = await requireActor();
  if (!actor) return { ok: false, message: 'غيرُ مصرَّح' };
  const before = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await createServiceClient()
    .from('system_errors')
    .delete()
    .lt('resolved_at', before)
    .select('id');
  if (error) return { ok: false, message: 'تعذّر الحذف' };
  revalidatePath('/admin/errors');
  return { ok: true, message: `حُذف ${data?.length ?? 0}` };
}

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { isAdminRole } from '@/lib/admin-types';
import { logAdminAction } from '@/lib/admin-audit';
import { PROVIDER_META, isProviderType } from '@/lib/providers';

/**
 * 🏥 اعتمادُ حسابات «الخدمة» (0060). بعميل RLS للمدير (حارسُ 0058/0060 يسمح له وحده بالاعتماد)، ويُعدّ
 * الصفُّ المكتوب — سياسةٌ ترفض بصمت لا تعطي «تمّ». وصاحبُ الحساب يُخطَر في صندوق التطبيق.
 */
export interface ProviderActionResult {
  ok: boolean;
  message: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return isAdminRole(profile?.role) ? supabase : null;
}

async function notifyOwner(userId: string, title: string, body: string) {
  try {
    await createServiceClient().from('notifications').insert({
      user_id: userId, title, body, type: 'account', link: '/provider',
    });
  } catch { /* الإخطارُ لا يُسقط الاعتماد */ }
}

export async function approveProvider(id: string): Promise<ProviderActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, message: 'غيرُ مصرَّح' };
  const { data, error } = await supabase
    .from('users')
    .update({ approval_status: 'approved', rejection_reason: null })
    .eq('id', id)
    .eq('role', 'provider')
    .select('provider_type');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'لم يُعثر على حساب الخدمة' };
  await logAdminAction({ action_type: 'approve_provider', target_type: 'user', target_id: id, details: { provider_type: data[0].provider_type } });
  await notifyOwner(id, 'اعتُمد حسابُك', 'صار حسابُ الخدمة فعّالاً. أكمِل ملفّك ليظهر للمرضى.');
  revalidatePath('/admin/providers');
  return { ok: true, message: 'اعتُمد' };
}

export async function rejectProvider(id: string, reason: string): Promise<ProviderActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, message: 'غيرُ مصرَّح' };
  const why = reason.trim().slice(0, 300);
  if (!why) return { ok: false, message: 'اذكر سببَ الرفض' };
  const { data, error } = await supabase
    .from('users')
    .update({ approval_status: 'rejected', rejection_reason: why })
    .eq('id', id)
    .eq('role', 'provider')
    .select('id');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'لم يُعثر على حساب الخدمة' };
  await logAdminAction({ action_type: 'reject_provider', target_type: 'user', target_id: id, details: { reason: why } });
  await notifyOwner(id, 'لم يُعتمد حسابُك', why);
  revalidatePath('/admin/providers');
  return { ok: true, message: 'رُفض' };
}

/** تصحيحُ نوع الخدمة (سجّل «عيادة» وهو مختبر) — للمدير وحده */
export async function changeProviderType(id: string, type: string): Promise<ProviderActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, message: 'غيرُ مصرَّح' };
  if (!isProviderType(type)) return { ok: false, message: 'نوعٌ غيرُ معروف' };
  const { data, error } = await supabase
    .from('users').update({ provider_type: type }).eq('id', id).eq('role', 'provider').select('id');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'لم يُعثر على حساب الخدمة' };
  await logAdminAction({ action_type: 'change_provider_type', target_type: 'user', target_id: id, details: { provider_type: type } });
  revalidatePath('/admin/providers');
  return { ok: true, message: `صار ${PROVIDER_META[type].label}` };
}

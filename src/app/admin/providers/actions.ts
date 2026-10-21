'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { isAdminRole } from '@/lib/admin-types';
import { logAdminAction } from '@/lib/admin-audit';
import { PROVIDER_META, isProviderType } from '@/lib/providers';
import { LISTING_SOURCE, sanitizeProposedListing, type ListingKind } from '@/lib/provider-listings';
import { listingTable } from '@/lib/provider-listings-server';

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

// ─── ربطُ حساب الخدمة بمنشأته في الدليل (الدفعة 3، 0062) ───
// الكتابةُ بعميل الخدمة (الطلباتُ بلا سياسات، والمنشآتُ للإدارة) بعد `requireAdmin`. الملكيّةُ تُكتب مشروطةً
// بغياب مالك (`.is(owner, null)`) وتُعدّ الصفوف، ثمّ يُعلَّم الطلبُ معتمَداً — وإن فشل هذا تُرجَع الملكيّة.

type ClaimRow = { id: string; provider_id: string; listing_kind: ListingKind; listing_id: string | null; proposed: Record<string, unknown> };

export async function approveListingClaim(claimId: string): Promise<ProviderActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, message: 'غيرُ مصرَّح' };
  const { data: { user: admin } } = await supabase.auth.getUser();
  const db = createServiceClient();
  const { data: claim } = await db
    .from('provider_listing_claims')
    .select('id, provider_id, listing_kind, listing_id, proposed')
    .eq('id', claimId).eq('status', 'pending').maybeSingle();
  if (!claim) return { ok: false, message: 'الطلبُ غير موجود أو بُتّ فيه' };
  const c = claim as unknown as ClaimRow;
  const owner = LISTING_SOURCE[c.listing_kind].owner;

  let listingId = c.listing_id;
  let created = false;
  if (listingId) {
    const { data: taken, error } = await listingTable(c.listing_kind)
      .update({ [owner]: c.provider_id, updated_at: new Date().toISOString() })
      .eq('id', listingId).is(owner, null).select('id');
    if (error) return { ok: false, message: error.message };
    if (!taken?.length) return { ok: false, message: 'المنشأةُ مرتبطةٌ بحسابٍ آخر أو حُذفت — ارفض الطلب' };
  } else {
    const clean = sanitizeProposedListing(c.listing_kind, c.proposed ?? {});
    if (!clean.ok) return { ok: false, message: `بياناتُ المنشأة ناقصة: ${clean.error}` };
    const { data: row, error } = await listingTable(c.listing_kind)
      .insert({ ...clean.row, [owner]: c.provider_id, is_active: true, is_verified: false })
      .select('id').single();
    if (error || !row) return { ok: false, message: error?.message ?? 'تعذّر إنشاءُ المنشأة' };
    listingId = row.id as string;
    created = true;
  }

  const { data: done, error: claimError } = await db
    .from('provider_listing_claims')
    .update({ status: 'approved', listing_id: listingId, decided_at: new Date().toISOString(), decided_by: admin?.id ?? null })
    .eq('id', claimId).eq('status', 'pending').select('id');
  if (claimError || !done?.length) {
    // لا ملكيّةَ بلا طلبٍ معتمَد: تُرجَع
    if (created) await listingTable(c.listing_kind).delete().eq('id', listingId);
    else await listingTable(c.listing_kind).update({ [owner]: null }).eq('id', listingId).eq(owner, c.provider_id);
    return { ok: false, message: claimError?.message ?? 'تغيّر الطلبُ أثناء الاعتماد — حدّث الصفحة' };
  }

  await logAdminAction({ action_type: 'approve_listing_claim', target_type: 'user', target_id: c.provider_id, details: { listing_kind: c.listing_kind, listing_id: listingId, created } });
  await notifyOwner(c.provider_id, 'رُبطت منشأتُك', 'صارت حجوزاتُ منشأتك تصلك في «الطلبات».');
  revalidatePath('/admin/providers');
  return { ok: true, message: created ? 'أُنشئت المنشأةُ ورُبطت' : 'رُبطت' };
}

export async function rejectListingClaim(claimId: string, reason: string): Promise<ProviderActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { ok: false, message: 'غيرُ مصرَّح' };
  const why = reason.trim().slice(0, 300);
  if (!why) return { ok: false, message: 'اذكر سببَ الرفض' };
  const { data: { user: admin } } = await supabase.auth.getUser();
  const { data, error } = await createServiceClient()
    .from('provider_listing_claims')
    .update({ status: 'rejected', rejection_reason: why, decided_at: new Date().toISOString(), decided_by: admin?.id ?? null })
    .eq('id', claimId).eq('status', 'pending').select('provider_id');
  if (error || !data?.length) return { ok: false, message: error?.message ?? 'الطلبُ غير موجود أو بُتّ فيه' };
  await logAdminAction({ action_type: 'reject_listing_claim', target_type: 'user', target_id: data[0].provider_id, details: { reason: why } });
  await notifyOwner(data[0].provider_id, 'لم يُعتمد ربطُ منشأتك', why);
  revalidatePath('/admin/providers');
  return { ok: true, message: 'رُفض' };
}

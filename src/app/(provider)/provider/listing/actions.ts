'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isProviderType } from '@/lib/providers';
import { LISTING_SOURCE, listingKindFor, sanitizeListingUpdate, sanitizeProposedListing, type ListingKind } from '@/lib/provider-listings';
import { getListing, listingTable } from '@/lib/provider-listings-server';

/**
 * 🏥 ربطُ حساب الخدمة بمنشأته (0062): طلبٌ تعتمده الإدارة — بمنشأةٍ موجودة بلا مالك، أو بمنشأةٍ جديدة.
 * الطلبُ يُكتب بعميل الخدمة بعد التحقّق (الجدولُ بلا سياسات)، وطلبٌ حيٌّ واحد لكلّ حساب (فهرسٌ فريد).
 */
type Result = { ok: boolean; message: string };

async function requireListingProvider(): Promise<{ userId: string; kind: ListingKind } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'سجّل الدخول أوّلاً' };
  const { data: p } = await supabase.from('users').select('role, provider_type').eq('id', user.id).single();
  const kind = p?.role === 'provider' && isProviderType(p.provider_type) ? listingKindFor(p.provider_type) : null;
  if (!kind) return { error: 'لحسابات الصيدليات والعيادات والمستشفيات' };
  return { userId: user.id, kind };
}

async function insertClaim(row: { provider_id: string; listing_kind: ListingKind; listing_id: string | null; proposed: Record<string, unknown> }): Promise<Result> {
  const { error } = await createAdminClient().from('provider_listing_claims').insert(row as never);
  if (error) {
    return { ok: false, message: error.code === '23505' ? 'لديك طلبُ ربطٍ قائم — انتظر قرارَ الإدارة أو اسحبه' : error.message };
  }
  revalidatePath('/provider/listing');
  revalidatePath('/provider');
  return { ok: true, message: 'أُرسل الطلب — تراجعه الإدارة' };
}

/** «هذه منشأتي»: منشأةٌ موجودة، نشطة، بلا مالك */
export async function claimListing(listingId: string): Promise<Result> {
  const ctx = await requireListingProvider();
  if ('error' in ctx) return { ok: false, message: ctx.error };
  const listing = await getListing(ctx.kind, listingId);
  if (!listing || !listing.active) return { ok: false, message: 'المنشأة غير موجودة' };
  if (listing.owner) return { ok: false, message: 'هذه المنشأة مرتبطةٌ بحسابٍ آخر — راسل الإدارة إن كانت لك' };
  return insertClaim({ provider_id: ctx.userId, listing_kind: ctx.kind, listing_id: listingId, proposed: {} });
}

/** «منشأتي غير موجودة»: تُنشأ عند الاعتماد من هذه البيانات */
export async function proposeNewListing(raw: Record<string, unknown>): Promise<Result> {
  const ctx = await requireListingProvider();
  if ('error' in ctx) return { ok: false, message: ctx.error };
  const clean = sanitizeProposedListing(ctx.kind, raw);
  if (!clean.ok) return { ok: false, message: clean.error };
  return insertClaim({ provider_id: ctx.userId, listing_kind: ctx.kind, listing_id: null, proposed: clean.row });
}

/** سحبُ طلبٍ لم يُبتّ فيه */
export async function withdrawClaim(): Promise<Result> {
  const ctx = await requireListingProvider();
  if ('error' in ctx) return { ok: false, message: ctx.error };
  const { data, error } = await createAdminClient()
    .from('provider_listing_claims')
    .delete()
    .eq('provider_id', ctx.userId)
    .eq('status', 'pending')
    .select('id');
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: 'لا طلبَ قائماً' };
  revalidatePath('/provider/listing');
  return { ok: true, message: 'سُحب الطلب' };
}

/**
 * تعديلُ بيانات المنشأة (الهاتف، العنوان، الساعات، النبذة) — لمالكها وحده: بعميل الخدمة مقيّداً بعمود الملكيّة
 * ويُعدّ الصفّ. الحقولُ من `sanitizeListingUpdate` وحده؛ والاسمُ والتوثيقُ والملكيّةُ للإدارة.
 */
export async function updateMyListing(raw: Record<string, unknown>): Promise<Result> {
  const ctx = await requireListingProvider();
  if ('error' in ctx) return { ok: false, message: ctx.error };
  const clean = sanitizeListingUpdate(ctx.kind, raw);
  if (!clean.ok) return { ok: false, message: clean.error };
  const { data, error } = await listingTable(ctx.kind)
    .update({ ...clean.patch, updated_at: new Date().toISOString() })
    .eq(LISTING_SOURCE[ctx.kind].owner, ctx.userId)
    .select('id');
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: 'لا منشأةَ مرتبطة بحسابك' };
  revalidatePath('/provider/listing');
  return { ok: true, message: 'حُفظ — يراه المرضى في الدليل' };
}

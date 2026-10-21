'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/types/database';
import { isProviderType } from '@/lib/providers';
import {
  BOOKING_ACTIONS, PATIENT_MESSAGE, RESERVATION_ACTIONS, isBookingAction, isReservationAction, listingKindFor,
  type ListingKind,
} from '@/lib/provider-listings';
import { getOwnedListings } from '@/lib/provider-listings-server';
import { notifyInbox } from '@/lib/inbox-notify';

/**
 * 🏥 الصيدليةُ والعيادةُ والمستشفى ترد على حجوزات منشأتها (الدفعة 3).
 *
 * لا سياسةَ للمالك على `pharmacy_reservations`/`appointments` (0062 أزال ذراعَه من الكتابة)، فالكتابةُ بعميل
 * الخدمة **بعد** التحقّق هنا: حسابُ خدمةٍ معتمَد غيرُ موقوف، والحجزُ لمنشأةٍ يملكها، والانتقالُ من حالةٍ
 * مسموحة (`.in('status', from)`) ويُعدّ الصفّ. ثمّ يُخطَر المريض في صندوقه.
 */
type Result = { ok: boolean; message: string };
type Ctx = { userId: string; kind: ListingKind; listingIds: string[]; names: Map<string, string> };

async function requireOwner(): Promise<Ctx | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'سجّل الدخول أوّلاً' };
  const { data: p } = await supabase
    .from('users').select('role, provider_type, approval_status, is_suspended').eq('id', user.id).single();
  const kind = p?.role === 'provider' && isProviderType(p.provider_type) ? listingKindFor(p.provider_type) : null;
  if (!kind) return { error: 'لحسابات الصيدليات والعيادات والمستشفيات' };
  if (p?.approval_status !== 'approved' || p.is_suspended) return { error: 'حسابُك بانتظار الاعتماد' };
  const owned = await getOwnedListings(user.id, kind);
  if (owned.length === 0) return { error: 'اربط حسابَك بمنشأتك أوّلاً' };
  return { userId: user.id, kind, listingIds: owned.map((l) => l.id), names: new Map(owned.map((l) => [l.id, l.name])) };
}

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function updateReservation(
  id: string,
  action: string,
  extra: { note?: string; finalPrice?: number | null; reason?: string } = {},
): Promise<Result> {
  if (!isReservationAction(action)) return { ok: false, message: 'فعلٌ غيرُ معروف' };
  const ctx = await requireOwner();
  if ('error' in ctx) return { ok: false, message: ctx.error };
  if (ctx.kind !== 'pharmacy') return { ok: false, message: 'للصيدليات وحدها' };

  const step = RESERVATION_ACTIONS[action];
  const reason = clip(extra.reason, 300);
  if (action === 'cancel' && !reason) return { ok: false, message: 'اذكر سببَ الاعتذار — يراه المريض' };
  const now = new Date().toISOString();
  const patch: TablesUpdate<'pharmacy_reservations'> = { status: step.to, updated_at: now };
  const note = clip(extra.note, 500);
  if (note) patch.pharmacy_notes = note;
  if (typeof extra.finalPrice === 'number' && Number.isFinite(extra.finalPrice) && extra.finalPrice >= 0) {
    patch.total_final_price = Math.round(extra.finalPrice);
  }
  if (step.to === 'confirmed' || step.to === 'partially_available') patch.confirmed_at = now;
  if (step.to === 'picked_up') patch.picked_up_at = now;
  if (step.to === 'cancelled') { patch.cancelled_at = now; patch.cancellation_reason = reason; }

  const { data, error } = await createAdminClient()
    .from('pharmacy_reservations')
    .update(patch)
    .eq('id', id)
    .in('pharmacy_id', ctx.listingIds)
    .in('status', [...step.from])
    .select('id, user_id, pharmacy_id');
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: 'الحجزُ غير موجود أو تغيّرت حالتُه — حدّث الصفحة' };

  const row = data[0];
  const place = ctx.names.get(row.pharmacy_id) ?? 'الصيدلية';
  const m = PATIENT_MESSAGE[step.to](place);
  await notifyInbox([{
    user_id: row.user_id, title: m.title,
    body: step.to === 'cancelled' ? `${m.body} السبب: ${reason}` : m.body,
    type: 'pharmacy_reservation', link: `/account/pharmacy-reservations/${row.id}`,
  }]);
  revalidatePath('/provider/requests');
  return { ok: true, message: step.label };
}

export async function updateBooking(id: string, action: string, reason?: string): Promise<Result> {
  if (!isBookingAction(action)) return { ok: false, message: 'فعلٌ غيرُ معروف' };
  const ctx = await requireOwner();
  if ('error' in ctx) return { ok: false, message: ctx.error };
  if (ctx.kind === 'pharmacy') return { ok: false, message: 'للعيادات والمستشفيات' };

  const step = BOOKING_ACTIONS[action];
  const why = clip(reason, 300);
  if (action === 'decline' && !why) return { ok: false, message: 'اذكر سببَ الاعتذار — يراه المريض' };
  const column = ctx.kind === 'doctor' ? 'doctor_id' : 'hospital_id';
  const now = new Date().toISOString();
  const patch: TablesUpdate<'appointments'> = { status: step.to, updated_at: now };
  if (step.to === 'confirmed') patch.confirmed_at = now;
  if (step.to === 'completed') patch.completed_at = now;
  if (step.to === 'cancelled') { patch.cancelled_at = now; patch.cancelled_reason = why; }

  const { data, error } = await createAdminClient()
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .in(column, ctx.listingIds)
    .in('status', [...step.from])
    .select('id, user_id, doctor_id, hospital_id');
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: 'الموعدُ غير موجود أو تغيّرت حالتُه — حدّث الصفحة' };

  const row = data[0];
  const place = ctx.names.get((ctx.kind === 'doctor' ? row.doctor_id : row.hospital_id) ?? '') ?? 'المنشأة';
  const m = PATIENT_MESSAGE[step.to](place);
  await notifyInbox([{
    user_id: row.user_id, title: m.title,
    body: step.to === 'cancelled' ? `${m.body} السبب: ${why}` : m.body,
    type: 'appointment', link: `/appointments/${row.id}`,
  }]);
  revalidatePath('/provider/requests');
  return { ok: true, message: step.label };
}

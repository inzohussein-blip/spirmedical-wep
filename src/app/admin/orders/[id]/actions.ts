'use server';

/**
 * ═══════════════════════════════════════════════════════════════
 * Order Detail Actions (V25 — GPS Locations)
 * ═══════════════════════════════════════════════════════════════
 * يفصل منطق جلب موقع الطلب عن الـ page.tsx
 */

import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { revalidatePath } from 'next/cache';
import type { AppointmentLocation } from '@/types/location';
import { isValidCoordinates } from '@/types/location';

/* ─── Helper: التحقق من admin ────────────────────────────── */

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, supabase, user: null };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isAdminRole(profile?.role)) {
    return { authorized: false as const, supabase, user: null };
  }

  return { authorized: true as const, supabase, user };
}

/* ─── جلب موقع الطلب ──────────────────────────────────── */

/**
 * يجلب موقع GPS لطلب من جدول appointments
 * يعيد null إذا الطلب غير موجود أو الإحداثيات غير موجودة/غير صالحة
 */
export async function getOrderLocation(
  orderId: string
): Promise<AppointmentLocation | null> {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) return null;

  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, address, location_lat, location_lng, location_accuracy_m, location_captured_at'
    )
    .eq('id', orderId)
    .single();

  if (error || !data) return null;
  if (!data.location_lat || !data.location_lng) return null;

  const lat = Number(data.location_lat);
  const lng = Number(data.location_lng);

  if (!isValidCoordinates(lat, lng)) return null;

  return {
    appointment_id: data.id,
    address: data.address,
    lat,
    lng,
    accuracy_m: data.location_accuracy_m,
    captured_at: data.location_captured_at,
  };
}

/* ─── جلب موقع الأخصائي المُعيَّن ──────────────────────── */

/**
 * يجلب موقع عمل الأخصائي المُعيَّن لطلب معيّن
 * مفيد لعرض المختبر + المريض على نفس الخريطة
 */
export async function getAssignedSpecialistLocation(
  orderId: string
): Promise<{ lat: number; lng: number; full_name: string; work_address: string | null } | null> {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) return null;

  const { data: order } = await supabase
    .from('appointments')
    .select('assigned_specialist_id')
    .eq('id', orderId)
    .single();

  if (!order?.assigned_specialist_id) return null;

  const { data: specialist } = await supabase
    .from('users')
    .select('full_name, work_lat, work_lng, work_address')
    .eq('id', order.assigned_specialist_id)
    .single();

  if (!specialist?.work_lat || !specialist?.work_lng) return null;

  const lat = Number(specialist.work_lat);
  const lng = Number(specialist.work_lng);

  if (!isValidCoordinates(lat, lng)) return null;

  return {
    full_name: specialist.full_name ?? 'أخصائي',
    work_address: specialist.work_address,
    lat,
    lng,
  };
}

/* ─── تحديث موقع الطلب يدوياً (admin) ──────────────────── */

export interface UpdateOrderLocationResult {
  success: boolean;
  message: string;
}

/**
 * يسمح للـ admin بتحديث موقع GPS لطلب يدوياً
 * مفيد لو المريض لم يلتقط موقعه عند الطلب
 */
export async function updateOrderLocation(
  orderId: string,
  lat: number,
  lng: number,
  accuracyM?: number
): Promise<UpdateOrderLocationResult> {
  const { authorized, supabase, user } = await requireAdmin();
  if (!authorized || !user) {
    return { success: false, message: 'غير مصرّح' };
  }

  if (!isValidCoordinates(lat, lng)) {
    return { success: false, message: 'إحداثيات غير صالحة' };
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      location_lat: lat,
      location_lng: lng,
      location_accuracy_m: accuracyM ?? null,
      location_captured_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    return { success: false, message: 'فشل التحديث: ' + error.message };
  }

  // تسجيل العملية
  await supabase.from('admin_actions').insert({
    admin_id: user.id,
    action_type: 'update_order_location',
    target_type: 'appointment',
    target_id: orderId,
    details: { lat, lng, accuracy_m: accuracyM },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, message: 'تم تحديث الموقع بنجاح' };
}

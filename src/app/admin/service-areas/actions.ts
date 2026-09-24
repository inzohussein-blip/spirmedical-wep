'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { validateRing, type ServiceArea, type Ring } from '@/lib/service-areas';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'غير مصرّح' };

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { ok: false as const, error: 'غير مصرّح' };
  }
  return { ok: true as const, supabase, userId: user.id };
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * كلّ المناطق — المفعّلة والمعطّلة معاً. سياسة القاعدة
 * `service_areas_public_read` تكشف المفعّلة وحدها لغير المشرف، وسياسة
 * `service_areas_admin_manage` هي التي تُظهر الباقي هنا.
 */
export async function getServiceAreas(): Promise<{
  ok: boolean; areas: ServiceArea[]; error?: string;
}> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, areas: [], error: auth.error };

  const { data, error } = await (auth.supabase as any)
    .from('service_areas')
    .select('id, name_ar, governorate, polygon, color, is_active, notes, created_at')
    .order('created_at', { ascending: false });

  if (error) return { ok: false, areas: [], error: error.message };
  return { ok: true, areas: (data ?? []) as ServiceArea[] };
}

export async function createServiceArea(input: {
  name_ar: string;
  governorate?: string | null;
  polygon: unknown;
  color?: string;
  notes?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = (input.name_ar ?? '').trim();
  if (!name) return { ok: false, error: 'اسم المنطقة مطلوب' };
  if (name.length > 120) return { ok: false, error: 'الاسم طويل جداً' };

  // نتحقّق من الشكل هنا أيضاً لا اتّكالاً على CHECK وحده: قيد القاعدة يمنع
  // الحلقة القصيرة، لكنّه لا يمنع `[["a","b"],...]` — والرسالة العربية أوضح
  // من خطأ Postgres للمشرف.
  const ring = validateRing(input.polygon);
  if (!ring.ok) return { ok: false, error: ring.error };

  const color = input.color && HEX.test(input.color) ? input.color : 'var(--emerald-deep, #056559)';

  const { data, error } = await (auth.supabase as any)
    .from('service_areas')
    .insert({
      name_ar: name,
      governorate: input.governorate?.trim() || null,
      polygon: ring.ring,
      color,
      notes: input.notes?.trim() || null,
      created_by: auth.userId,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    action: 'service_area.create',
    user_id: auth.userId,
    entity_type: 'service_area',
    entity_id: data.id,
    metadata: { name_ar: name, vertices: ring.ring.length },
  });

  revalidatePath('/admin/service-areas');
  return { ok: true, id: data.id };
}

export async function updateServiceArea(
  id: string,
  patch: {
    name_ar?: string;
    governorate?: string | null;
    polygon?: unknown;
    color?: string;
    notes?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const update: Record<string, unknown> = {};

  if (patch.name_ar !== undefined) {
    const name = patch.name_ar.trim();
    if (!name) return { ok: false, error: 'اسم المنطقة مطلوب' };
    if (name.length > 120) return { ok: false, error: 'الاسم طويل جداً' };
    update.name_ar = name;
  }
  if (patch.governorate !== undefined) {
    update.governorate = patch.governorate?.trim() || null;
  }
  if (patch.notes !== undefined) {
    update.notes = patch.notes?.trim() || null;
  }
  if (patch.color !== undefined) {
    if (!HEX.test(patch.color)) return { ok: false, error: 'لون غير صالح' };
    update.color = patch.color;
  }
  if (patch.polygon !== undefined) {
    const ring = validateRing(patch.polygon);
    if (!ring.ok) return { ok: false, error: ring.error };
    update.polygon = ring.ring;
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await (auth.supabase as any)
    .from('service_areas').update(update).eq('id', id);

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    action: 'service_area.update',
    user_id: auth.userId,
    entity_type: 'service_area',
    entity_id: id,
    changes: update as Record<string, never>,
  });

  revalidatePath('/admin/service-areas');
  return { ok: true };
}

export async function toggleServiceArea(
  id: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await (auth.supabase as any)
    .from('service_areas').update({ is_active: isActive }).eq('id', id);

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    action: isActive ? 'service_area.activate' : 'service_area.deactivate',
    user_id: auth.userId,
    entity_type: 'service_area',
    entity_id: id,
  });

  revalidatePath('/admin/service-areas');
  return { ok: true };
}

export async function deleteServiceArea(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // نقرأ الاسم قبل الحذف — بعده لا يبقى في السجلّ إلّا معرّفٌ لا يدلّ على شيء
  const { data: before } = await (auth.supabase as any)
    .from('service_areas').select('name_ar').eq('id', id).single();

  const { error } = await (auth.supabase as any)
    .from('service_areas').delete().eq('id', id);

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    action: 'service_area.delete',
    user_id: auth.userId,
    entity_type: 'service_area',
    entity_id: id,
    metadata: { name_ar: before?.name_ar ?? null },
  });

  revalidatePath('/admin/service-areas');
  return { ok: true };
}

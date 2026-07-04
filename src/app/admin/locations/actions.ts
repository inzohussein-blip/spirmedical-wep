'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import { SOURCE_MAP, type LocationSource, type UnifiedLocation } from './types';

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

export async function getAllLocations(): Promise<{
  ok: boolean;
  locations: UnifiedLocation[];
  error?: string;
}> {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, locations: [], error: auth.error };

  const supabase = auth.supabase as any;
  const all: UnifiedLocation[] = [];

  for (const cfg of Object.values(SOURCE_MAP)) {
    const cols = `id, ${cfg.nameCol}, ${cfg.cityCol}, ${cfg.latCol}, ${cfg.lngCol}, is_active`;
    const { data, error } = await supabase.from(cfg.table).select(cols).limit(500);
    if (error || !data) continue;

    for (const row of data) {
      all.push({
        id: row.id,
        source: cfg.table,
        name: row[cfg.nameCol] ?? '—',
        city: row[cfg.cityCol] ?? null,
        latitude: row[cfg.latCol] ?? null,
        longitude: row[cfg.lngCol] ?? null,
        is_active: row.is_active ?? false,
        label: cfg.label,
        emoji: cfg.emoji,
        markerType: cfg.markerType,
      });
    }
  }

  return { ok: true, locations: all };
}

export async function toggleLocationActive(source: LocationSource, id: string, next: boolean) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cfg = SOURCE_MAP[source];
  if (!cfg) return { ok: false, error: 'مصدر غير صالح' };

  const supabase = auth.supabase as any;
  const { error } = await supabase
    .from(cfg.table)
    .update({ is_active: next, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  logAuditEvent({
    user_id: auth.userId,
    action: next ? 'location.show' : 'location.hide',
    entity_type: source,
    entity_id: id,
  }).catch(() => null);

  revalidatePath('/admin/locations');
  revalidatePath(cfg.servicesPath);
  revalidatePath('/services');
  return { ok: true };
}

export async function deleteLocation(source: LocationSource, id: string) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cfg = SOURCE_MAP[source];
  if (!cfg) return { ok: false, error: 'مصدر غير صالح' };

  const supabase = auth.supabase as any;
  const { error } = await supabase.from(cfg.table).delete().eq('id', id);

  if (error) return { ok: false, error: error.message };

  logAuditEvent({
    user_id: auth.userId,
    action: 'location.delete',
    entity_type: source,
    entity_id: id,
  }).catch(() => null);

  revalidatePath('/admin/locations');
  revalidatePath(cfg.servicesPath);
  revalidatePath('/services');
  return { ok: true };
}

export async function updateLocationCoords(
  source: LocationSource,
  id: string,
  lat: number,
  lng: number
) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cfg = SOURCE_MAP[source];
  if (!cfg) return { ok: false, error: 'مصدر غير صالح' };

  const supabase = auth.supabase as any;
  const { error } = await supabase
    .from(cfg.table)
    .update({
      [cfg.latCol]: lat,
      [cfg.lngCol]: lng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  logAuditEvent({
    user_id: auth.userId,
    action: 'location.move',
    entity_type: source,
    entity_id: id,
    metadata: { lat, lng },
  }).catch(() => null);

  revalidatePath('/admin/locations');
  revalidatePath(cfg.servicesPath);
  return { ok: true };
}

export async function createQuickLocation(input: {
  source: LocationSource;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}) {
  const auth = await verifyAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const cfg = SOURCE_MAP[input.source];
  if (!cfg) return { ok: false, error: 'مصدر غير صالح' };

  if (!input.name.trim()) return { ok: false, error: 'الاسم مطلوب' };

  const supabase = auth.supabase as any;

  const row: Record<string, unknown> = {
    [cfg.nameCol]: input.name.trim(),
    [cfg.cityCol]: input.city || null,
    [cfg.latCol]: input.latitude,
    [cfg.lngCol]: input.longitude,
    is_active: true,
  };

  if (input.source === 'doctors') {
    row.specialty = 'general';
    row.title = 'دكتور';
  }
  if (input.source === 'mental_health_specialists') {
    row.specialist_type = 'psychologist';
    row.title = 'أخصائي';
  }
  if (input.source === 'nutritionists') {
    row.title = 'أخصائي تغذية';
  }

  const { error } = await supabase.from(cfg.table).insert(row);
  if (error) return { ok: false, error: error.message };

  logAuditEvent({
    user_id: auth.userId,
    action: 'location.create',
    entity_type: input.source,
    metadata: { name: input.name },
  }).catch(() => null);

  revalidatePath('/admin/locations');
  revalidatePath(cfg.servicesPath);
  revalidatePath('/services');
  return { ok: true };
}

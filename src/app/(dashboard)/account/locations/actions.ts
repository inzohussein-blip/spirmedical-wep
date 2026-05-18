'use server';

/**
 * ═══════════════════════════════════════════════════════════════
 * Saved Locations Actions — V25 (Maps C2)
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { logAuditEvent } from '@/lib/audit';
import { isValidCoordinates } from '@/types/location';
import type {
  SavedLocation,
  SavedLocationInput,
} from '@/types/saved-locations';

/* ─── جلب المواقع المحفوظة ──────────────────────────────── */

export async function getSavedLocations(): Promise<SavedLocation[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('user_saved_locations')
    .select('*')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch saved locations', {
      user_id: user.id,
      error: error.message,
    });
    return [];
  }

  return (data ?? []) as SavedLocation[];
}

/* ─── إضافة موقع جديد ─────────────────────────────────── */

export interface SaveLocationResult {
  success: boolean;
  message: string;
  location?: SavedLocation;
}

export async function saveLocation(
  input: SavedLocationInput
): Promise<SaveLocationResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'يجب تسجيل الدخول' };
  }

  // التحقق من البيانات
  if (!input.label || input.label.trim().length === 0) {
    return { success: false, message: 'اسم الموقع مطلوب' };
  }
  if (input.label.length > 50) {
    return { success: false, message: 'اسم الموقع طويل جداً (حد أقصى 50 حرف)' };
  }
  if (!isValidCoordinates(input.lat, input.lng)) {
    return { success: false, message: 'إحداثيات غير صالحة' };
  }
  if (!input.address || input.address.trim().length === 0) {
    return { success: false, message: 'العنوان مطلوب' };
  }

  // إدراج
  const { data, error } = await supabase
    .from('user_saved_locations')
    .insert({
      user_id: user.id,
      label: input.label.trim(),
      icon: input.icon ?? '📍',
      address: input.address.trim(),
      lat: input.lat,
      lng: input.lng,
      governorate: input.governorate ?? null,
      notes: input.notes ?? null,
      is_pinned: input.is_pinned ?? false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Save location failed', {
      user_id: user.id,
      error: error.message,
    });

    // معالجة أخطاء معروفة
    if (error.message.includes('check_saved_locations_limit')) {
      return {
        success: false,
        message: 'لا يمكن حفظ أكثر من 10 مواقع. احذف موقع قديم أولاً.',
      };
    }
    if (error.message.includes('saved_location_max_per_user')) {
      return {
        success: false,
        message: 'لديك موقع بهذا الاسم بالفعل',
      };
    }

    return { success: false, message: 'فشل حفظ الموقع' };
  }

  // Audit
  await logAuditEvent({
    action: 'saved_location.create',
    user_id: user.id,
    entity_type: 'saved_location',
    entity_id: data.id,
    metadata: { label: input.label },
  });

  revalidatePath('/account/locations');
  revalidatePath('/appointments/new');

  return {
    success: true,
    message: 'تم حفظ الموقع',
    location: data as SavedLocation,
  };
}

/* ─── تعديل موقع ──────────────────────────────────────── */

export async function updateSavedLocation(
  id: string,
  updates: Partial<SavedLocationInput>
): Promise<SaveLocationResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'يجب تسجيل الدخول' };

  // التحقق من الـ updates
  if (updates.lat !== undefined && updates.lng !== undefined) {
    if (!isValidCoordinates(updates.lat, updates.lng)) {
      return { success: false, message: 'إحداثيات غير صالحة' };
    }
  }

  const { data, error } = await supabase
    .from('user_saved_locations')
    .update({
      ...(updates.label !== undefined && { label: updates.label.trim() }),
      ...(updates.icon !== undefined && { icon: updates.icon }),
      ...(updates.address !== undefined && { address: updates.address.trim() }),
      ...(updates.lat !== undefined && { lat: updates.lat }),
      ...(updates.lng !== undefined && { lng: updates.lng }),
      ...(updates.governorate !== undefined && { governorate: updates.governorate }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.is_pinned !== undefined && { is_pinned: updates.is_pinned }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('Update location failed', { user_id: user.id, id, error: error.message });
    return { success: false, message: 'فشل التحديث' };
  }

  revalidatePath('/account/locations');
  return { success: true, message: 'تم التحديث', location: data as SavedLocation };
}

/* ─── حذف موقع ────────────────────────────────────────── */

export async function deleteSavedLocation(id: string): Promise<SaveLocationResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'يجب تسجيل الدخول' };

  const { error } = await supabase
    .from('user_saved_locations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('Delete location failed', { user_id: user.id, id, error: error.message });
    return { success: false, message: 'فشل الحذف' };
  }

  // Audit
  await logAuditEvent({
    action: 'saved_location.delete',
    user_id: user.id,
    entity_type: 'saved_location',
    entity_id: id,
  });

  revalidatePath('/account/locations');
  return { success: true, message: 'تم الحذف' };
}

/* ─── استخدام موقع (يزيد use_count) ─────────────────── */

export async function markLocationUsed(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // جلب القيمة الحالية
  const { data: current } = await supabase
    .from('user_saved_locations')
    .select('use_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!current) return;

  // تحديث use_count + last_used
  await supabase
    .from('user_saved_locations')
    .update({
      use_count: current.use_count + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);
}

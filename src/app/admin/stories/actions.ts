'use server';

/**
 * ═══════════════════════════════════════════════════════════════
 * Stories Server Actions
 * ═══════════════════════════════════════════════════════════════
 * CRUD operations لإدارة الـ stories من admin
 */

import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import { validateStoryInput, type StoryInput } from '@/types/story';

export interface StoryActionResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/* ─── Helper: التحقق من الصلاحيات ──────────────────────────── */

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['super_admin', 'admin', 'manager'];
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    return { authorized: false, user: null, supabase };
  }

  return { authorized: true, user, supabase };
}

/* ─── Create Story ─────────────────────────────────────────── */

export async function createStory(input: StoryInput): Promise<StoryActionResult> {
  const { authorized, user, supabase } = await requireAdmin();
  if (!authorized || !user) {
    return { success: false, message: 'غير مصرّح' };
  }

  const validation = validateStoryInput(input);
  if (!validation.valid) {
    return { success: false, message: 'بيانات غير صالحة', errors: validation.errors };
  }

  const { error } = await supabase.from('stories').insert({
    title: input.title.trim(),
    icon: input.icon.trim(),
    description: input.description?.trim() || null,
    href: input.href.trim(),
    color_theme: input.color_theme,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    created_by: user.id,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Stories] Insert failed:', error);
    return { success: false, message: 'فشل الإضافة: ' + error.message };
  }

  revalidateTag('stories');
  return { success: true, message: 'تمت إضافة القصة بنجاح' };
}

/* ─── Update Story ─────────────────────────────────────────── */

export async function updateStory(
  id: string,
  input: Partial<StoryInput>
): Promise<StoryActionResult> {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return { success: false, message: 'غير مصرّح' };
  }

  // Validate only provided fields
  const validation = validateStoryInput(input);
  if (!validation.valid) {
    return { success: false, message: 'بيانات غير صالحة', errors: validation.errors };
  }

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.icon !== undefined) updateData.icon = input.icon.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.href !== undefined) updateData.href = input.href.trim();
  if (input.color_theme !== undefined) updateData.color_theme = input.color_theme;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.starts_at !== undefined) updateData.starts_at = input.starts_at || null;
  if (input.ends_at !== undefined) updateData.ends_at = input.ends_at || null;

  const { error } = await supabase.from('stories').update(updateData).eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Stories] Update failed:', error);
    return { success: false, message: 'فشل التحديث: ' + error.message };
  }

  revalidateTag('stories');
  return { success: true, message: 'تم تحديث القصة بنجاح' };
}

/* ─── Toggle Active ────────────────────────────────────────── */

export async function toggleStoryActive(
  id: string,
  isActive: boolean
): Promise<StoryActionResult> {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return { success: false, message: 'غير مصرّح' };
  }

  const { error } = await supabase
    .from('stories')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    return { success: false, message: 'فشل التحديث: ' + error.message };
  }

  revalidateTag('stories');
  return {
    success: true,
    message: isActive ? 'تم تفعيل القصة' : 'تم إخفاء القصة',
  };
}

/* ─── Delete Story ─────────────────────────────────────────── */

export async function deleteStory(id: string): Promise<StoryActionResult> {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return { success: false, message: 'غير مصرّح' };
  }

  const { error } = await supabase.from('stories').delete().eq('id', id);

  if (error) {
    return { success: false, message: 'فشل الحذف: ' + error.message };
  }

  revalidateTag('stories');
  return { success: true, message: 'تم حذف القصة' };
}

/* ─── Reorder Stories ──────────────────────────────────────── */

export async function reorderStories(
  orderedIds: string[]
): Promise<StoryActionResult> {
  const { authorized, supabase } = await requireAdmin();
  if (!authorized) {
    return { success: false, message: 'غير مصرّح' };
  }

  // تحديث sort_order لكل قصة
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('stories')
      .update({ sort_order: (index + 1) * 10 })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, message: 'فشل إعادة الترتيب' };
  }

  revalidateTag('stories');
  return { success: true, message: 'تم تحديث الترتيب' };
}

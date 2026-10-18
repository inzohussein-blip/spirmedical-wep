'use server';

/**
 * ═══════════════════════════════════════════════════════════════
 * Stories Server Actions
 * ═══════════════════════════════════════════════════════════════
 * CRUD operations لإدارة الـ stories من admin
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { randomUUID } from 'crypto';
// Next 16: updateTag يُبطل فوراً فيرى المديرُ تعديله (revalidateTag صار stale-while-revalidate)
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import { validateStoryInput, type StoryInput } from '@/types/story';
import type { TablesUpdate } from '@/types/database';

export interface StoryActionResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/* ─── Helper: التحقق من الصلاحيات ──────────────────────────── */

async function requireAdmin() {
  const supabase = await createClient();
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
    image_url: input.image_url || null,
    cta_label: input.cta_label?.trim() || null,
    color_theme: input.color_theme,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    created_by: user.id,
  });

  if (error) {
    console.error('[Stories] Insert failed:', error);
    return { success: false, message: 'فشل الإضافة: ' + error.message };
  }

  updateTag('stories');
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

  const updateData: TablesUpdate<'stories'> = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.icon !== undefined) updateData.icon = input.icon.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.href !== undefined) updateData.href = input.href.trim();
  if (input.image_url !== undefined) updateData.image_url = input.image_url || null;
  if (input.cta_label !== undefined) updateData.cta_label = input.cta_label?.trim() || null;
  if (input.color_theme !== undefined) updateData.color_theme = input.color_theme;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.starts_at !== undefined) updateData.starts_at = input.starts_at || null;
  if (input.ends_at !== undefined) updateData.ends_at = input.ends_at || null;

  const { error } = await supabase.from('stories').update(updateData).eq('id', id);

  if (error) {
    console.error('[Stories] Update failed:', error);
    return { success: false, message: 'فشل التحديث: ' + error.message };
  }

  updateTag('stories');
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

  updateTag('stories');
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

  const { data: row } = await supabase.from('stories').select('image_url').eq('id', id).maybeSingle();
  const { error } = await supabase.from('stories').delete().eq('id', id);

  if (error) {
    return { success: false, message: 'فشل الحذف: ' + error.message };
  }

  // صورتُها من حاويتنا تُحذف معها — فشلُ ذلك لا يُفشل الحذف
  const path = storyImagePath(row?.image_url);
  if (path) await createServiceClient().storage.from(STORY_IMAGES_BUCKET).remove([path]).catch(() => null);

  updateTag('stories');
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

  updateTag('stories');
  return { success: true, message: 'تم تحديث الترتيب' };
}

/* ─── Story image ──────────────────────────────────────────── */

const STORY_IMAGES_BUCKET = 'stories';
const STORY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const STORY_IMAGE_MAX = 2 * 1024 * 1024;

/** مسارُ الصورة داخل حاويتنا من رابطها العامّ — وإلّا null (رابطٌ خارجيّ لا يُحذف) */
function storyImagePath(url: string | null | undefined): string | null {
  const m = url?.match(/\/storage\/v1\/object\/public\/stories\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * يرفع صورةَ قصّة ويعيد رابطَها العامّ. الحاويةُ `stories` بلا أيّ سياسة كتابة (0054):
 * لا يكتبها إلّا عميلُ الخدمة من هنا، بعد التحقّق من دور المدير — فالقصصُ من الإدارة وحدها.
 * الصورةُ تُصغَّر في المتصفّح قبل الإرسال (`prepareUpload`).
 */
export async function uploadStoryImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { authorized } = await requireAdmin();
  if (!authorized) return { error: 'غير مصرّح' };

  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) return { error: 'لم تُختر صورة' };
  if (!STORY_IMAGE_TYPES.includes(file.type)) return { error: 'الصورة يجب أن تكون JPEG أو PNG أو WebP' };
  if (file.size > STORY_IMAGE_MAX) return { error: 'الصورة أكبر من 2MB' };

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${randomUUID()}.${ext}`;
  const storage = createServiceClient().storage.from(STORY_IMAGES_BUCKET);
  const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error('[Stories] Image upload failed:', error);
    return { error: 'تعذّر رفع الصورة' };
  }
  return { url: storage.getPublicUrl(path).data.publicUrl };
}

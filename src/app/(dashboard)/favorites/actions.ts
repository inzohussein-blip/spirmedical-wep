'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type FavoriteType = 'doctor' | 'hospital' | 'pharmacy' | 'medication' | 'lab_test';

export interface ToggleFavoriteInput {
  type: FavoriteType;
  referenceId: string;
  displayName?: string;
  displaySubtitle?: string;
  displayIcon?: string;
  displayMeta?: Record<string, unknown>;
}

/**
 * إضافة/إزالة من المفضّلة (toggle)
 */
export async function toggleFavorite(input: ToggleFavoriteInput): Promise<{
  success: boolean;
  isFavorite?: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'سجّل دخول أولاً' };

  // تحقّق إذا موجود
  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('favorite_type', input.type)
    .eq('reference_id', input.referenceId)
    .maybeSingle();

  if (existing) {
    // إزالة
    await supabase.from('user_favorites').delete().eq('id', existing.id);
    revalidatePath('/favorites');
    return { success: true, isFavorite: false };
  }

  // إضافة
  const { error } = await supabase.from('user_favorites').insert({
    user_id: user.id,
    favorite_type: input.type,
    reference_id: input.referenceId,
    display_name: input.displayName ?? null,
    display_subtitle: input.displaySubtitle ?? null,
    display_icon: input.displayIcon ?? null,
    display_meta: input.displayMeta ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/favorites');
  return { success: true, isFavorite: true };
}

/**
 * حذف مفضّل
 */
export async function removeFavorite(favoriteId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'سجّل دخول' };

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('id', favoriteId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/favorites');
  return { success: true };
}

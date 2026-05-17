/**
 * ═══════════════════════════════════════════════════════════════
 * Stories Loader (Server-side)
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import type { Story } from '@/types/story';

/**
 * يجلب الـ stories النشطة المُجدوَلة
 * - is_active = true
 * - starts_at <= now (أو null)
 * - ends_at > now (أو null)
 */
async function fetchActiveStories(): Promise<Story[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return [];

    const supabase = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false },
    });

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order('sort_order', { ascending: true })
      .limit(20);

    if (error || !data) {
      return [];
    }

    return data as Story[];
  } catch {
    return [];
  }
}

/**
 * نسخة مكشّوفة - cached لمدة 2 دقيقة
 * tagged بـ 'stories' للتحديث الفوري
 */
export const getActiveStories = unstable_cache(
  fetchActiveStories,
  ['active-stories-v1'],
  {
    tags: ['stories'],
    revalidate: 120,
  }
);

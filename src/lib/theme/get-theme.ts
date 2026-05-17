/**
 * ═══════════════════════════════════════════════════════════════
 * Server-side Theme Loader
 * ═══════════════════════════════════════════════════════════════
 * يجلب الـ theme النشط من Supabase
 *
 * مهم: نستخدم Supabase createClient @supabase/supabase-js مباشرة
 * (بدون cookies) لأنه يعمل داخل unstable_cache
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { DEFAULT_THEME, type ThemeSettings } from '@/types/theme';

/**
 * يجلب الـ active theme من Supabase
 * - يستخدم anon key (public read)
 * - tagged بـ 'theme' لإمكانية التحديث الفوري
 * - cached لمدة 5 دقائق
 */
async function fetchActiveTheme(): Promise<ThemeSettings> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return getDefaultTheme();
    }

    // عميل بدون cookies - يعمل داخل unstable_cache
    const supabase = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('app_theme_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      // الجدول قد لا يكون موجود بعد (قبل تطبيق Migration 13)
      // نستخدم الـ default theme بصمت
      return getDefaultTheme();
    }

    return data as ThemeSettings;
  } catch {
    return getDefaultTheme();
  }
}

function getDefaultTheme(): ThemeSettings {
  return {
    id: 'default',
    ...DEFAULT_THEME,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * نسخة مكشّوفة من fetchActiveTheme
 * - cached لمدة 5 دقائق
 * - tagged بـ 'theme' لإمكانية التحديث الفوري عبر revalidateTag('theme')
 */
export const getActiveTheme = unstable_cache(
  fetchActiveTheme,
  ['active-theme-v1'],
  {
    tags: ['theme'],
    revalidate: 300, // 5 minutes
  }
);

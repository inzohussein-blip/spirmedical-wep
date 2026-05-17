'use server';

/**
 * ═══════════════════════════════════════════════════════════════
 * Theme Server Actions
 * ═══════════════════════════════════════════════════════════════
 * تحديث ألوان المنصة من admin44
 * - يتحقق من super_admin
 * - validates input
 * - يحدّث DB
 * - يعيد build cache (revalidateTag('theme'))
 */

import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import { validateThemeInput, type ThemeUpdateInput } from '@/types/theme';

export interface ThemeActionResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * تحديث الـ active theme
 * - يجب أن يكون المستخدم super_admin
 * - يستبدل القيم الحالية بالقيم الجديدة
 */
export async function updateTheme(
  input: ThemeUpdateInput
): Promise<ThemeActionResult> {
  // 1. التحقق من المستخدم
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. التحقق من الصلاحيات
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isSuperAdmin(profile?.role)) {
    return {
      success: false,
      message: 'غير مصرّح — هذه العملية للمدير العام فقط',
    };
  }

  // 3. التحقق من البيانات
  const validation = validateThemeInput(input);
  if (!validation.valid) {
    return {
      success: false,
      message: 'بيانات غير صالحة',
      errors: validation.errors,
    };
  }

  // 4. جلب الـ theme النشط
  const { data: activeTheme, error: fetchError } = await supabase
    .from('app_theme_settings')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (fetchError || !activeTheme) {
    return {
      success: false,
      message: 'لم نجد theme فعّال. تأكد من تطبيق Migration 13 على Supabase',
    };
  }

  // 5. تحديث
  const { error: updateError } = await supabase
    .from('app_theme_settings')
    .update({
      primary_color: input.primary_color,
      primary_dark: input.primary_dark,
      primary_soft: input.primary_soft,
      accent_color: input.accent_color,
      danger_color: input.danger_color,
      theme_name: input.theme_name ?? 'Custom',
      updated_by: user.id,
    })
    .eq('id', activeTheme.id);

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error('[Theme] Update failed:', updateError);
    return {
      success: false,
      message: 'فشل التحديث: ' + updateError.message,
    };
  }

  // 6. تسجيل العملية في admin_actions
  await supabase.from('admin_actions').insert({
    admin_id: user.id,
    action_type: 'update_theme',
    target_type: 'app_theme_settings',
    target_id: activeTheme.id,
    details: {
      primary_color: input.primary_color,
      accent_color: input.accent_color,
      danger_color: input.danger_color,
    },
  });

  // 7. إعادة build cache → كل المنصة تحدّث ألوانها فوراً
  revalidateTag('theme');

  return {
    success: true,
    message: 'تم تحديث الألوان بنجاح — كل المنصة تحدّثت',
  };
}

/**
 * إعادة الـ theme لقيمه الافتراضية
 */
export async function resetThemeToDefault(): Promise<ThemeActionResult> {
  return updateTheme({
    primary_color: '#0E5C4D',
    primary_dark: '#073B30',
    primary_soft: '#D9E5DF',
    accent_color: '#B8540C',
    danger_color: '#A82E3D',
    theme_name: 'Default · افتراضي',
  });
}

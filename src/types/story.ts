/**
 * ═══════════════════════════════════════════════════════════════
 * Story Types — قصصٌ تنشرها الإدارة وحدها (0054)
 * ═══════════════════════════════════════════════════════════════
 * القصّةُ تُفتح بملء الشاشة: صورةٌ اختياريّة، ونصٌّ (`description`)، وزرُّ إجراء
 * (`cta_label` → `href`). ولونُها من لوحة المشروع (`lib/icons.ts`) لا من ترتيبها.
 */
import { ICON_TONES, type IconTone } from '@/lib/icons';

/** القيمُ الخمس الأولى قديمة (تبقى صالحة)، والباقي ألوانُ المفاهيم — قيدُ valid_color في 0054 */
export type StoryColorTheme =
  | 'emerald' | 'amber' | 'rose' | 'paper' | 'ink'
  | 'blue' | 'purple' | 'red' | 'orange' | 'teal' | 'green';

export const STORY_THEMES: readonly StoryColorTheme[] = [
  'emerald', 'blue', 'purple', 'red', 'orange', 'amber', 'teal', 'green', 'rose', 'paper', 'ink',
];

/** لونُ القصّة في لوحة المشروع — «فاتح» و«داكن» القديمان يُرسمان رماديّاً */
export function storyTone(theme: string | null | undefined): IconTone {
  if (theme && theme in ICON_TONES) return theme as IconTone;
  return theme === 'paper' || theme === 'ink' ? 'gray' : 'emerald';
}

export interface Story {
  id: string;
  title: string;
  icon: string;
  description: string | null;
  href: string;
  image_url?: string | null;
  cta_label?: string | null;
  color_theme: StoryColorTheme;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryInput {
  title: string;
  icon: string;
  description?: string;
  href: string;
  image_url?: string | null;
  cta_label?: string;
  color_theme: StoryColorTheme;
  sort_order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

/* ─── Color theme presets ──────────────────────────────────── */

const THEME_LABELS: Record<StoryColorTheme, string> = {
  emerald: 'أخضر', blue: 'أزرق', purple: 'بنفسجي', red: 'أحمر', orange: 'برتقالي', amber: 'كهرماني',
  teal: 'فيروزي', green: 'أخضر فاتح', rose: 'وردي', paper: 'رمادي', ink: 'رمادي داكن',
};

/** خياراتُ اللون في الإدارة: الألوانُ القديمة الصالحة لا تُعرض للاختيار الجديد */
export const COLOR_THEMES = STORY_THEMES.filter((t) => t !== 'paper' && t !== 'ink').map((value) => {
  const t = ICON_TONES[storyTone(value)];
  return { value, label: THEME_LABELS[value], bg: t.bg, fg: t.fg, ring: t.fg };
});

/** لألوانٍ قديمة في صفوفٍ موجودة (paper/ink) */
export function themeConfig(value: string) {
  const t = ICON_TONES[storyTone(value)];
  return { bg: t.bg, fg: t.fg, ring: t.fg };
}

/* ─── Validation ───────────────────────────────────────────── */

export function validateStoryInput(input: Partial<StoryInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('العنوان مطلوب');
  } else if (input.title.length > 30) {
    errors.push('العنوان طويل جداً (الحد 30 حرف)');
  }

  if (!input.icon || input.icon.trim().length === 0) {
    errors.push('الأيقونة مطلوبة');
  }

  if (!input.href || input.href.trim().length === 0) {
    errors.push('الرابط مطلوب');
  } else if (!input.href.startsWith('/') && !input.href.startsWith('http')) {
    errors.push('الرابط يجب أن يبدأ بـ / أو http');
  }

  if (input.color_theme && !STORY_THEMES.includes(input.color_theme)) {
    errors.push('اللون غير صالح');
  }

  if (input.description && input.description.length > 280) {
    errors.push('النصّ طويل جداً (الحد 280 حرفاً)');
  }

  if (input.cta_label && input.cta_label.length > 24) {
    errors.push('نصّ الزرّ طويل جداً (الحد 24 حرفاً)');
  }

  if (input.image_url && !input.image_url.startsWith('https://')) {
    errors.push('رابطُ الصورة غير صالح');
  }

  if (input.starts_at && input.ends_at) {
    if (new Date(input.ends_at) <= new Date(input.starts_at)) {
      errors.push('تاريخ الانتهاء يجب أن يكون بعد البداية');
    }
  }

  return { valid: errors.length === 0, errors };
}

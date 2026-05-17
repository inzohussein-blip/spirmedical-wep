/**
 * ═══════════════════════════════════════════════════════════════
 * Story Types — Promotional Stories System
 * ═══════════════════════════════════════════════════════════════
 */

export type StoryColorTheme = 'emerald' | 'amber' | 'rose' | 'paper' | 'ink';

export interface Story {
  id: string;
  title: string;
  icon: string;
  description: string | null;
  href: string;
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
  color_theme: StoryColorTheme;
  sort_order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

/* ─── Color theme presets ──────────────────────────────────── */

export const COLOR_THEMES: Array<{
  value: StoryColorTheme;
  label: string;
  bg: string;
  fg: string;
  ring: string;
}> = [
  { value: 'emerald', label: 'أخضر', bg: 'var(--emerald-soft)', fg: 'var(--emerald-deep)', ring: 'var(--emerald)' },
  { value: 'amber', label: 'كهرماني', bg: 'var(--amber-soft)', fg: 'var(--amber)', ring: 'var(--amber)' },
  { value: 'rose', label: 'وردي', bg: 'var(--rose-soft)', fg: 'var(--rose)', ring: 'var(--rose)' },
  { value: 'paper', label: 'فاتح', bg: 'var(--paper)', fg: 'var(--ink)', ring: 'var(--line-2)' },
  { value: 'ink', label: 'داكن', bg: 'var(--ink)', fg: 'var(--paper-3)', ring: 'var(--ink-2)' },
];

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

  if (input.color_theme && !['emerald', 'amber', 'rose', 'paper', 'ink'].includes(input.color_theme)) {
    errors.push('اللون غير صالح');
  }

  if (input.starts_at && input.ends_at) {
    if (new Date(input.ends_at) <= new Date(input.starts_at)) {
      errors.push('تاريخ الانتهاء يجب أن يكون بعد البداية');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * Theme Types — Dynamic App Theming
 * ═══════════════════════════════════════════════════════════════
 */

export interface ThemeSettings {
  id: string;
  primary_color: string;       // اللون الأساسي
  primary_dark: string;        // hover
  primary_soft: string;        // highlights
  accent_color: string;        // warnings
  danger_color: string;        // errors
  theme_name: string;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThemeUpdateInput {
  primary_color: string;
  primary_dark: string;
  primary_soft: string;
  accent_color: string;
  danger_color: string;
  theme_name?: string;
}

/**
 * الـ theme الافتراضي - يُستخدم كـ fallback عند فشل جلب البيانات
 */
export const DEFAULT_THEME: Omit<ThemeSettings, 'id' | 'updated_by' | 'created_at' | 'updated_at'> = {
  primary_color: '#0E5C4D',
  primary_dark: '#073B30',
  primary_soft: '#D9E5DF',
  accent_color: '#B8540C',
  danger_color: '#A82E3D',
  theme_name: 'Default',
  is_active: true,
};

/**
 * Validates hex color format (#RRGGBB)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/**
 * Validates entire theme update payload
 */
export function validateThemeInput(input: Partial<ThemeUpdateInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const required: (keyof ThemeUpdateInput)[] = [
    'primary_color',
    'primary_dark',
    'primary_soft',
    'accent_color',
    'danger_color',
  ];

  for (const key of required) {
    const value = input[key];
    if (!value) {
      errors.push(`${key} مطلوب`);
    } else if (!isValidHexColor(value)) {
      errors.push(`${key} يجب أن يكون hex code صالح (#RRGGBB)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * يحوّل ThemeSettings إلى object من CSS variables
 */
export function themeToCssVars(theme: Partial<ThemeSettings>): Record<string, string> {
  return {
    '--theme-primary': theme.primary_color ?? DEFAULT_THEME.primary_color,
    '--theme-primary-dark': theme.primary_dark ?? DEFAULT_THEME.primary_dark,
    '--theme-primary-soft': theme.primary_soft ?? DEFAULT_THEME.primary_soft,
    '--theme-accent': theme.accent_color ?? DEFAULT_THEME.accent_color,
    '--theme-danger': theme.danger_color ?? DEFAULT_THEME.danger_color,
  };
}

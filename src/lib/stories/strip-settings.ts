/**
 * ⚙️ إعدادُ شريط القصص — يتحكّم به المدير من `/admin/stories` (طلبُ المالك، 18 تشرين الأول).
 *
 * في `app_settings` بالمفتاح `stories_strip` (جدولٌ قائم، سياستُه `private.is_admin` للقراءة والكتابة):
 * إظهارُ الشريط أو إخفاؤه عن جميع المستخدمين، وشكلُه، وثيمُه. غيابُ الإعداد أو فسادُه ← القيمُ الافتراضيّة
 * (ظاهر، دوائر، ألوانُ القصص) — الشريطُ كان ظاهراً قبل وجود الإعداد، فلا يختفي بلا قرار.
 */
export const STRIP_SETTINGS_KEY = 'stories_strip';

export const STRIP_SHAPES = ['circle', 'rounded', 'card', 'chip'] as const;
export const STRIP_THEMES = ['concept', 'brand', 'soft', 'filled'] as const;

export type StripShape = (typeof STRIP_SHAPES)[number];
export type StripTheme = (typeof STRIP_THEMES)[number];

export interface StripSettings {
  enabled: boolean;
  shape: StripShape;
  theme: StripTheme;
}

export const DEFAULT_STRIP: StripSettings = { enabled: true, shape: 'circle', theme: 'concept' };

export const SHAPE_LABELS: Record<StripShape, { label: string; hint: string }> = {
  circle: { label: 'دوائر', hint: 'كقصص التطبيقات المعروفة' },
  rounded: { label: 'مربّعات مستديرة', hint: 'أقرب إلى أيقونات الهاتف' },
  card: { label: 'بطاقات', hint: 'أكبر، والعنوانُ داخل البطاقة' },
  chip: { label: 'شرائح', hint: 'سطرٌ مضغوط: أيقونةٌ وعنوان' },
};

export const THEME_LABELS: Record<StripTheme, { label: string; hint: string }> = {
  concept: { label: 'ألوانُ القصص', hint: 'كلُّ قصّةٍ بلونها' },
  brand: { label: 'لونُ الهويّة', hint: 'كلُّها بالأخضر' },
  soft: { label: 'هادئ', hint: 'إطارٌ رماديّ ونقطةٌ للجديدة' },
  filled: { label: 'ممتلئ', hint: 'خلفيّةٌ بلون القصّة وأيقونةٌ بيضاء' },
};

/** يقبل أيَّ قيمةٍ من القاعدة ويعيد إعداداً صالحاً — لا يرمي أبداً */
export function parseStripSettings(value: unknown): StripSettings {
  const v = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_STRIP.enabled,
    shape: STRIP_SHAPES.includes(v.shape as StripShape) ? (v.shape as StripShape) : DEFAULT_STRIP.shape,
    theme: STRIP_THEMES.includes(v.theme as StripTheme) ? (v.theme as StripTheme) : DEFAULT_STRIP.theme,
  };
}

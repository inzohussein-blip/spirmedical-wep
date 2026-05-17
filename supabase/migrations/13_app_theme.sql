-- ════════════════════════════════════════════════════════════════════
-- 🎨 Migration 13: App Theme Settings (V25 — Dynamic Theme System)
-- ════════════════════════════════════════════════════════════════════
-- يسمح للـ super_admin بتخصيص ألوان المنصة من admin44
-- الجدول يحوي صف واحد فقط (singleton row)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. الجدول ───
CREATE TABLE IF NOT EXISTS public.app_theme_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 5 ألوان رئيسية قابلة للتخصيص
  -- يجب أن تكون hex codes صحيحة (#RRGGBB)
  primary_color       text NOT NULL DEFAULT '#0E5C4D',  -- emerald
  primary_dark        text NOT NULL DEFAULT '#073B30',  -- emerald-deep
  primary_soft        text NOT NULL DEFAULT '#D9E5DF',  -- emerald-soft (highlights)
  accent_color        text NOT NULL DEFAULT '#B8540C',  -- amber (warnings)
  danger_color        text NOT NULL DEFAULT '#A82E3D',  -- rose (errors)

  -- اسم الـ theme (للعرض في admin)
  theme_name          text NOT NULL DEFAULT 'Default · افتراضي',

  -- هل مفعّل؟ (مفيد لاحقاً إذا أردنا multiple themes)
  is_active           boolean NOT NULL DEFAULT true,

  -- audit
  updated_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- ضمان وجود صف واحد فعّال
  CONSTRAINT valid_primary_color CHECK (primary_color ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_primary_dark CHECK (primary_dark ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_primary_soft CHECK (primary_soft ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_accent CHECK (accent_color ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_danger CHECK (danger_color ~* '^#[0-9a-f]{6}$')
);

-- فهرس على is_active لجلب الـ active theme بسرعة
CREATE INDEX IF NOT EXISTS idx_app_theme_active ON public.app_theme_settings(is_active) WHERE is_active = true;

-- ─── 2. trigger لتحديث updated_at تلقائياً ───
CREATE OR REPLACE FUNCTION public.update_theme_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_theme_updated_at ON public.app_theme_settings;
CREATE TRIGGER trg_theme_updated_at
  BEFORE UPDATE ON public.app_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_theme_updated_at();

-- ─── 3. Seed: إضافة الـ theme الافتراضي إن لم يوجد ───
INSERT INTO public.app_theme_settings (
  primary_color, primary_dark, primary_soft, accent_color, danger_color, theme_name, is_active
)
SELECT
  '#0E5C4D', '#073B30', '#D9E5DF', '#B8540C', '#A82E3D',
  'Default · افتراضي',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_theme_settings WHERE is_active = true
);

-- ─── 4. RLS Policies ───
ALTER TABLE public.app_theme_settings ENABLE ROW LEVEL SECURITY;

-- الجميع يقرأ (التطبيق يحتاج الألوان قبل تسجيل الدخول)
DROP POLICY IF EXISTS theme_read_all ON public.app_theme_settings;
CREATE POLICY theme_read_all
  ON public.app_theme_settings
  FOR SELECT
  USING (true);

-- فقط super_admin يعدّل
DROP POLICY IF EXISTS theme_update_super_admin ON public.app_theme_settings;
CREATE POLICY theme_update_super_admin
  ON public.app_theme_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- فقط super_admin يضيف themes جديدة (لاحقاً)
DROP POLICY IF EXISTS theme_insert_super_admin ON public.app_theme_settings;
CREATE POLICY theme_insert_super_admin
  ON public.app_theme_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- ─── 5. تعليقات للتوثيق ───
COMMENT ON TABLE public.app_theme_settings IS 'إعدادات ألوان التطبيق - قابلة للتعديل من admin44';
COMMENT ON COLUMN public.app_theme_settings.primary_color IS 'اللون الأساسي (CTAs, headers)';
COMMENT ON COLUMN public.app_theme_settings.primary_dark IS 'اللون الأساسي الداكن (hover states)';
COMMENT ON COLUMN public.app_theme_settings.primary_soft IS 'لون التمييز الناعم (selected items)';
COMMENT ON COLUMN public.app_theme_settings.accent_color IS 'لون التنبيهات (warnings)';
COMMENT ON COLUMN public.app_theme_settings.danger_color IS 'لون الأخطاء (errors, delete)';

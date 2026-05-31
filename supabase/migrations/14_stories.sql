-- ════════════════════════════════════════════════════════════════════
-- 📸 Migration 14: Promotional Stories System (V25)
-- ════════════════════════════════════════════════════════════════════
-- نظام قصص ترويجية (مثل Instagram Stories) قابل للإدارة من admin44
-- تظهر في dashboard المستخدم كصف من الـ circles
--
-- 🔧 ملاحظة: يبدأ بـ DROP TABLE IF EXISTS للتعامل مع
-- جدول stories قديم قد يكون موجوداً
-- ════════════════════════════════════════════════════════════════════

-- ─── 0. حذف الجدول القديم إن وُجد (آمن إذا لا يوجد) ───
DROP TABLE IF EXISTS public.stories CASCADE;

-- ─── 1. الجدول ───
CREATE TABLE IF NOT EXISTS public.stories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- المحتوى
  title           text NOT NULL,
  icon            text NOT NULL,                          -- emoji أو lucide-icon name
  description     text,                                    -- وصف اختياري
  href            text NOT NULL DEFAULT '#',              -- الرابط عند الضغط

  -- التصميم
  color_theme     text NOT NULL DEFAULT 'emerald',
  CONSTRAINT valid_color CHECK (
    color_theme IN ('emerald', 'amber', 'rose', 'paper', 'ink')
  ),

  -- الترتيب والحالة
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,

  -- الجدولة (اختيارية)
  starts_at       timestamptz,
  ends_at         timestamptz,

  -- audit
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- لا يمكن أن يكون ends_at قبل starts_at
  CONSTRAINT valid_date_range CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  )
);

-- ─── 2. Indexes ───
CREATE INDEX idx_stories_active_order
  ON public.stories(is_active, sort_order)
  WHERE is_active = true;

CREATE INDEX idx_stories_schedule
  ON public.stories(starts_at, ends_at)
  WHERE is_active = true;

-- ─── 3. Trigger لتحديث updated_at ───
CREATE OR REPLACE FUNCTION public.update_stories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stories_updated_at ON public.stories;
CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stories_updated_at();

-- ─── 4. Seed: قصص افتراضية (5 قصص) ───
INSERT INTO public.stories (title, icon, href, color_theme, sort_order) VALUES
  ('لقاحات', '💉', '/tools/vaccinations', 'rose', 1),
  ('صحتك', '🩺', '/account/health', 'emerald', 2),
  ('دواء', '💊', '/account/prescriptions', 'amber', 3),
  ('تغذية', '🍎', '/tools/risk-calculator', 'rose', 4),
  ('إسعافات', '🚑', '/tools/first-aid', 'amber', 5);

-- ─── 5. RLS Policies ───
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- الجميع يقرأ الـ active stories (المستخدمين + الزوار)
DROP POLICY IF EXISTS stories_read_active ON public.stories;
CREATE POLICY stories_read_active
  ON public.stories
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

-- super_admin يقرأ كل القصص (حتى المعطّلة)
DROP POLICY IF EXISTS stories_read_all_admin ON public.stories;
CREATE POLICY stories_read_all_admin
  ON public.stories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- super_admin/admin/manager يضيف ويعدّل
DROP POLICY IF EXISTS stories_insert_admin ON public.stories;
CREATE POLICY stories_insert_admin
  ON public.stories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS stories_update_admin ON public.stories;
CREATE POLICY stories_update_admin
  ON public.stories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS stories_delete_admin ON public.stories;
CREATE POLICY stories_delete_admin
  ON public.stories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- ─── 6. تعليقات ───
COMMENT ON TABLE public.stories IS 'قصص ترويجية تظهر في dashboard المستخدم';
COMMENT ON COLUMN public.stories.color_theme IS 'اختياري: emerald/amber/rose/paper/ink';
COMMENT ON COLUMN public.stories.sort_order IS 'الترتيب من اليمين لليسار (الأقل أولاً)';
COMMENT ON COLUMN public.stories.starts_at IS 'تاريخ بدء العرض (null = فوري)';
COMMENT ON COLUMN public.stories.ends_at IS 'تاريخ انتهاء العرض (null = دائم)';

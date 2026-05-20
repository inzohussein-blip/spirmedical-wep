-- ════════════════════════════════════════════════════════════════════
-- ⭐ Migration 27: User Favorites System (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- نظام موحّد لحفظ المفضّلات:
--   - أطباء
--   - مستشفيات
--   - صيدليات
--   - فحوصات (medications/tests)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- نوع المفضّل
  favorite_type TEXT NOT NULL CHECK (favorite_type IN (
    'doctor', 'hospital', 'pharmacy', 'medication', 'lab_test'
  )),

  -- ID المرجع (polymorphic)
  reference_id UUID NOT NULL,

  -- معلومات إضافية (cache للأداء)
  display_name TEXT,
  display_subtitle TEXT,
  display_icon TEXT,
  display_meta JSONB,

  -- تاريخ الإضافة
  created_at TIMESTAMPTZ DEFAULT now(),

  -- منع التكرار
  UNIQUE(user_id, favorite_type, reference_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user
  ON public.user_favorites(user_id, favorite_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_reference
  ON public.user_favorites(reference_id, favorite_type);

-- RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى/يدير مفضّلاته فقط
DROP POLICY IF EXISTS "favorites_select_own" ON public.user_favorites;
CREATE POLICY "favorites_select_own"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON public.user_favorites;
CREATE POLICY "favorites_insert_own"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON public.user_favorites;
CREATE POLICY "favorites_delete_own"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Admins يرون كل المفضّلات (للإحصائيات)
DROP POLICY IF EXISTS "favorites_admin_select_all" ON public.user_favorites;
CREATE POLICY "favorites_admin_select_all"
  ON public.user_favorites FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

COMMENT ON TABLE public.user_favorites IS
  'مفضّلات المستخدم - أطباء، مستشفيات، صيدليات، فحوصات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 27 applied: User Favorites';
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 🔐 Migration 21: Nurse Credentials & Compliance (V25.6)
-- ════════════════════════════════════════════════════════════════════
-- بناءً على البند 9 من وثيقة المواصفات:
-- "خانة الأخصائي وشروط انضمام وتدقيق الكادر والتحقق من الهوية"
--
-- يُضيف:
--   - وثائق الكادر التمريضي (هوية نقابة + إجازة وزارة الصحة)
--   - حقيبة الطوارئ التمريضية الإلزامية
--   - تتبع تاريخ التحقق + الانتهاء
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة في users للممرضين ─────────────────
ALTER TABLE public.users
  -- هوية نقابة التمريض
  ADD COLUMN IF NOT EXISTS nursing_union_id_url TEXT,
  ADD COLUMN IF NOT EXISTS nursing_union_id_number TEXT,
  ADD COLUMN IF NOT EXISTS nursing_union_expires_at DATE,
  ADD COLUMN IF NOT EXISTS nursing_union_verified BOOLEAN DEFAULT FALSE,

  -- إجازة ممارسة المهنة من وزارة الصحة
  ADD COLUMN IF NOT EXISTS health_ministry_license_url TEXT,
  ADD COLUMN IF NOT EXISTS health_ministry_license_number TEXT,
  ADD COLUMN IF NOT EXISTS health_ministry_expires_at DATE,
  ADD COLUMN IF NOT EXISTS health_ministry_verified BOOLEAN DEFAULT FALSE,

  -- حقيبة الطوارئ التمريضية
  ADD COLUMN IF NOT EXISTS emergency_kit_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emergency_kit_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS emergency_kit_items JSONB,
    -- مثال: ["adrenaline", "antihistamine", "oxygen_mask", "first_aid_kit", "gloves", "masks"]

  -- معلومات مهنية إضافية
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS specializations TEXT[],
    -- مثال: ["pediatric", "diabetic_care", "wound_care", "iv_therapy"]
  ADD COLUMN IF NOT EXISTS cv_url TEXT,

  -- تاريخ التحقق
  ADD COLUMN IF NOT EXISTS credentials_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credentials_verified_by UUID REFERENCES public.users(id);

-- ─── 2. ترقية approval_status (دقيق أكثر) ───────────────
-- (موجود مسبقاً، لكن نضمن وجوده)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_approval_status_enum'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT check_approval_status_enum
      CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended', 'expired'));
  END IF;
END $$;

-- ─── 3. سجل الوثائق (للتدقيق الإداري) ──────────────────
CREATE TABLE IF NOT EXISTS public.specialist_credentials_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
    -- 'uploaded', 'verified', 'rejected', 'expired', 'renewed'
  document_type TEXT NOT NULL,
    -- 'union_id', 'health_license', 'cv', 'emergency_kit'
  document_url TEXT,
  notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credentials_log_specialist
  ON public.specialist_credentials_log(specialist_id, created_at DESC);

ALTER TABLE public.specialist_credentials_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credentials_log_specialist_self" ON public.specialist_credentials_log;
CREATE POLICY "credentials_log_specialist_self"
  ON public.specialist_credentials_log FOR SELECT
  USING (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "credentials_log_admin_insert" ON public.specialist_credentials_log;
CREATE POLICY "credentials_log_admin_insert"
  ON public.specialist_credentials_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR auth.uid() = specialist_id
  );

-- ─── 4. تنبيهات انتهاء الصلاحية (View) ──────────────────
CREATE OR REPLACE VIEW public.expiring_credentials AS
SELECT
  u.id,
  u.full_name,
  u.phone,
  u.specialist_type,
  u.nursing_union_expires_at,
  u.health_ministry_expires_at,
  CASE
    WHEN u.nursing_union_expires_at <= CURRENT_DATE THEN 'union_expired'
    WHEN u.nursing_union_expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'union_expiring'
    WHEN u.health_ministry_expires_at <= CURRENT_DATE THEN 'license_expired'
    WHEN u.health_ministry_expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'license_expiring'
    ELSE 'ok'
  END as status,
  LEAST(
    COALESCE(u.nursing_union_expires_at, '9999-12-31'::date),
    COALESCE(u.health_ministry_expires_at, '9999-12-31'::date)
  ) as nearest_expiry
FROM public.users u
WHERE u.role = 'specialist'
  AND u.specialist_type = 'nurse'
  AND (
    u.nursing_union_expires_at IS NOT NULL
    OR u.health_ministry_expires_at IS NOT NULL
  );

-- ─── 5. تعليقات ──────────────────────────────────────
COMMENT ON COLUMN public.users.nursing_union_id_url IS
  'هوية نقابة التمريض النافذة - إلزامية للممرضين';

COMMENT ON COLUMN public.users.health_ministry_license_url IS
  'إجازة ممارسة المهنة من وزارة الصحة العراقية';

COMMENT ON COLUMN public.users.emergency_kit_confirmed IS
  'تأكيد تجهيز حقيبة الطوارئ التمريضية الإلزامية';

COMMENT ON VIEW public.expiring_credentials IS
  'الوثائق المنتهية أو القريبة من الانتهاء';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 21 applied: Nurse credentials & compliance';
END $$;

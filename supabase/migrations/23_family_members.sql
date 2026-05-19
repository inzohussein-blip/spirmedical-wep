-- ════════════════════════════════════════════════════════════════════
-- 👨‍👩‍👧‍👦 Migration 23: Family Members (V25.8)
-- ════════════════════════════════════════════════════════════════════
-- نظام موحّد لإدارة أفراد العائلة:
--   - المريض يضيف أفراد عائلته
--   - أي طلب يمكن ربطه بفرد عائلة بدل نفسه
--   - المختص يرى اسم الفرد المعني تلقائياً
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. جدول أفراد العائلة ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- صاحب الحساب الأساسي
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- بيانات الفرد
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
    -- 'spouse' (زوج/زوجة)
    -- 'father' (أب)
    -- 'mother' (أم)
    -- 'son' (ابن)
    -- 'daughter' (ابنة)
    -- 'brother' (أخ)
    -- 'sister' (أخت)
    -- 'grandfather' (جد)
    -- 'grandmother' (جدة)
    -- 'other' (أخرى)
  
  -- الجنس + العمر (مهم للأطباء)
  gender TEXT CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  
  -- التواصل (اختياري - قد يكون للطفل لا رقم)
  phone TEXT,
  
  -- المعلومات الطبية الأساسية (للتشخيص السريع)
  blood_type TEXT,                  -- 'A+', 'O-', etc
  height_cm INTEGER,
  weight_kg NUMERIC,
  chronic_conditions TEXT[],        -- مثل: ['diabetes', 'hypertension']
  allergies TEXT[],                 -- مثل: ['penicillin', 'lactose']
  current_medications TEXT,         -- نص حر
  notes TEXT,                       -- ملاحظات إضافية
  
  -- صورة شخصية (اختياري)
  avatar_emoji TEXT DEFAULT '👤',   -- إيموجي افتراضي
  
  -- إعدادات
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_owner 
  ON public.family_members(owner_user_id) 
  WHERE is_active = TRUE;

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- قراءة: صاحب الحساب + المختصون الذين لديهم طلبات لهذا الفرد + الأدمن
DROP POLICY IF EXISTS "family_members_select_own" ON public.family_members;
CREATE POLICY "family_members_select_own"
  ON public.family_members FOR SELECT
  USING (
    auth.uid() = owner_user_id
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.family_member_id = family_members.id
        AND a.assigned_specialist_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- إدراج: صاحب الحساب فقط
DROP POLICY IF EXISTS "family_members_insert_own" ON public.family_members;
CREATE POLICY "family_members_insert_own"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- تعديل: صاحب الحساب فقط
DROP POLICY IF EXISTS "family_members_update_own" ON public.family_members;
CREATE POLICY "family_members_update_own"
  ON public.family_members FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- حذف: صاحب الحساب فقط
DROP POLICY IF EXISTS "family_members_delete_own" ON public.family_members;
CREATE POLICY "family_members_delete_own"
  ON public.family_members FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ─── 2. ربط appointments بفرد العائلة (اختياري) ─────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS family_member_id UUID 
    REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_family_member 
  ON public.appointments(family_member_id) 
  WHERE family_member_id IS NOT NULL;

-- ─── 3. ربط nursing_visit_history (للسجلات) ─────────────
ALTER TABLE public.nursing_visit_history
  ADD COLUMN IF NOT EXISTS family_member_id UUID 
    REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nursing_history_family_member 
  ON public.nursing_visit_history(family_member_id) 
  WHERE family_member_id IS NOT NULL;

-- ─── 4. View: عرض الطلب مع معلومات الفرد ────────────────
CREATE OR REPLACE VIEW public.appointments_with_target AS
SELECT
  a.*,
  COALESCE(fm.full_name, owner.full_name) as target_name,
  COALESCE(fm.gender, owner.gender) as target_gender,
  COALESCE(
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, fm.date_of_birth))::int,
    NULL
  ) as target_age,
  fm.chronic_conditions as target_chronic_conditions,
  fm.allergies as target_allergies,
  fm.relation as target_relation,
  fm.avatar_emoji as target_avatar,
  CASE WHEN a.family_member_id IS NULL THEN 'self' ELSE 'family' END as target_type
FROM public.appointments a
LEFT JOIN public.family_members fm ON fm.id = a.family_member_id
LEFT JOIN public.users owner ON owner.id = a.user_id;

-- ─── 5. تعليقات ──────────────────────────────────────
COMMENT ON TABLE public.family_members IS
  'أفراد عائلة المستخدم - لتسجيل طلبات لغيره';

COMMENT ON COLUMN public.appointments.family_member_id IS
  'إذا NULL: الطلب لصاحب الحساب. غير NULL: لأحد أفراد عائلته';

COMMENT ON VIEW public.appointments_with_target IS
  'الطلبات مع المعلومات الكاملة عن المريض المعني (سواء المستخدم نفسه أو فرد عائلة)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 23 applied: Family Members system';
END $$;

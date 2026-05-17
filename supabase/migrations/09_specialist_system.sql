-- ═══════════════════════════════════════════════════════════════════
-- 09_specialist_system.sql — نظام الاختصاصيين الموحّد (V24 — مُصحَّح)
-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V24: مزامنة specialist_id ↔ assigned_specialist_id عبر trigger
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. توسيع جدول users ───
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS specialist_type text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS specialist_bio text,
  ADD COLUMN IF NOT EXISTS specialist_certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specialist_years_exp integer,
  ADD COLUMN IF NOT EXISTS specialist_languages text[] DEFAULT ARRAY['ar']::text[],
  ADD COLUMN IF NOT EXISTS auto_reply_message text DEFAULT 'مرحباً! استلمنا طلبك وسنرد عليك في أقرب وقت. شكراً لاختياركم Spir Medical.';

-- check المسموح في specialist_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_specialist_type_check') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_specialist_type_check
      CHECK (specialist_type IS NULL OR specialist_type IN (
        'lab_analyst', 'nurse', 'doctor', 'pharmacist',
        'physio', 'psychologist', 'nutritionist'
      ));
  END IF;
END $$;

-- 🆕 V24: indexes على الأعمدة الجديدة
CREATE INDEX IF NOT EXISTS users_specialist_type_idx ON public.users(specialist_type)
  WHERE specialist_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_approval_status_idx ON public.users(approval_status, role)
  WHERE role = 'specialist';


-- ─── 2. توسيع جدول appointments ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS required_specialist_type text,
  ADD COLUMN IF NOT EXISTS assigned_specialist_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS specialist_notes text,
  ADD COLUMN IF NOT EXISTS lab_results_url text,
  ADD COLUMN IF NOT EXISTS lab_results_data jsonb,
  ADD COLUMN IF NOT EXISTS nursing_actions jsonb,
  ADD COLUMN IF NOT EXISTS prescription_data jsonb,
  ADD COLUMN IF NOT EXISTS session_plan jsonb;

CREATE INDEX IF NOT EXISTS appointments_specialist_idx ON public.appointments(assigned_specialist_id, status)
  WHERE assigned_specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_required_type_idx ON public.appointments(required_specialist_type, status)
  WHERE required_specialist_type IS NOT NULL;


-- ─── 3. جدول جدول الدوام (Schedule) ───
CREATE TABLE IF NOT EXISTS public.specialist_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week  integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT schedules_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS schedules_specialist_idx ON public.specialist_schedules(specialist_id, is_active);


-- ═══════════════════════════════════════════════════════════════════
-- 🔄 V24 جديد: مزامنة specialist_id ↔ assigned_specialist_id
-- ═══════════════════════════════════════════════════════════════════
-- توافق رجعي: عند تحديث أحدهما، الآخر يُحدّث تلقائياً.
-- الكود الجديد يستخدم assigned_specialist_id (مفضّل).
-- الـ policies القديمة تستخدم specialist_id (يجب أن تبقى تعمل).

CREATE OR REPLACE FUNCTION public.sync_specialist_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: مزامنة أحدهما إلى الآخر
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_specialist_id IS NOT NULL AND NEW.specialist_id IS NULL THEN
      NEW.specialist_id := NEW.assigned_specialist_id;
    ELSIF NEW.specialist_id IS NOT NULL AND NEW.assigned_specialist_id IS NULL THEN
      NEW.assigned_specialist_id := NEW.specialist_id;
    END IF;
  END IF;

  -- UPDATE: إذا تغيّر assigned_specialist_id، حدّث specialist_id
  IF TG_OP = 'UPDATE' THEN
    IF NEW.assigned_specialist_id IS DISTINCT FROM OLD.assigned_specialist_id
       AND NEW.specialist_id = OLD.specialist_id THEN
      NEW.specialist_id := NEW.assigned_specialist_id;
    -- إذا تغيّر specialist_id (legacy)، حدّث assigned_specialist_id
    ELSIF NEW.specialist_id IS DISTINCT FROM OLD.specialist_id
          AND NEW.assigned_specialist_id = OLD.assigned_specialist_id THEN
      NEW.assigned_specialist_id := NEW.specialist_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_specialist_fields ON public.appointments;
CREATE TRIGGER trg_sync_specialist_fields
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_specialist_fields();

-- مزامنة البيانات الموجودة (مرة واحدة)
UPDATE public.appointments
SET assigned_specialist_id = specialist_id
WHERE specialist_id IS NOT NULL
  AND assigned_specialist_id IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.specialist_schedules ENABLE ROW LEVEL SECURITY;

-- Schedules: الاختصاصي يدير جدوله، الكل يقدر يقرأ
DROP POLICY IF EXISTS schedules_view_all ON public.specialist_schedules;
CREATE POLICY schedules_view_all ON public.specialist_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS schedules_manage_own ON public.specialist_schedules;
CREATE POLICY schedules_manage_own ON public.specialist_schedules
  FOR ALL USING (specialist_id = auth.uid())
  WITH CHECK (specialist_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════
-- Function: Auto-assign specialist type on appointment creation
-- ═══════════════════════════════════════════════════════════════════
-- منطق التوزيع: حسب service_id → specialist_type

CREATE OR REPLACE FUNCTION public.determine_specialist_type(service_id text)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN service_id IN ('blood-draw', 'lab-test') THEN 'lab_analyst'
    WHEN service_id IN ('home-nursing', 'injection', 'vaccination') THEN 'nurse'
    WHEN service_id IN ('consultation-general', 'consultation-specialist', 'consultation-video') THEN 'doctor'
    WHEN service_id IN ('pharmacy-consultation', 'drug-interaction') THEN 'pharmacist'
    WHEN service_id IN ('physiotherapy') THEN 'physio'
    WHEN service_id IN ('psychology') THEN 'psychologist'
    WHEN service_id IN ('nutrition') THEN 'nutritionist'
    ELSE 'doctor' -- default
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: عند إنشاء appointment، حدد required_specialist_type تلقائياً
CREATE OR REPLACE FUNCTION public.auto_set_required_specialist()
RETURNS trigger AS $$
BEGIN
  IF NEW.required_specialist_type IS NULL AND NEW.service_id IS NOT NULL THEN
    NEW.required_specialist_type := public.determine_specialist_type(NEW.service_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_required_specialist ON public.appointments;
CREATE TRIGGER trg_auto_required_specialist
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_required_specialist();


-- ═══════════════════════════════════════════════════════════════════
-- RLS Update: appointments — الاختصاصي يشوف بس طلبات نوعه
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS appointments_specialist_view ON public.appointments;
CREATE POLICY appointments_specialist_view ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid()  -- المريض يشوف طلباته
    OR assigned_specialist_id = auth.uid()  -- الاختصاصي المعيّن
    OR EXISTS (  -- أي اختصاصي من نفس النوع المطلوب يشوفها لو لم تُعيّن
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'specialist'
      AND u.approval_status = 'approved'
      AND u.specialist_type = appointments.required_specialist_type
      AND appointments.assigned_specialist_id IS NULL
    )
  );

-- اختصاصي يقدر يقبل/يعدّل طلب نوعه فقط
DROP POLICY IF EXISTS appointments_specialist_update ON public.appointments;
CREATE POLICY appointments_specialist_update ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'specialist'
      AND u.approval_status = 'approved'
      AND u.specialist_type = appointments.required_specialist_type
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 09 Complete
-- ═══════════════════════════════════════════════════════════════════
-- ملاحظة: الاختصاصيين الموجودين سيكونون 'approved' افتراضياً (DEFAULT)
-- المسجلون الجدد عبر /register/specialist سيكونون 'pending'
-- ═══════════════════════════════════════════════════════════════════

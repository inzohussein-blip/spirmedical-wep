-- ═══════════════════════════════════════════════════════════════════
-- 07_personal_health.sql — جداول الصحة الشخصية (V24 — مُصحَّح)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف:
--   1. reminders          — تذكيرات (دواء/موعد/فحص/لقاح)
--   2. prescriptions      — الوصفات الطبية
--   3. health_vitals      — المؤشرات الحيوية
-- مع RLS كامل (المستخدم يرى بياناته فقط)
--
-- 🔧 V24: استخدام update_updated_at بدل set_updated_at (موحّد)
-- 🔧 V24: إضافة indexes ناقصة
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. التذكيرات ───
CREATE TABLE IF NOT EXISTS public.reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('medication', 'appointment', 'checkup', 'vaccine')),
  title           text NOT NULL,
  description     text,
  scheduled_at    timestamptz NOT NULL,
  frequency       text NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  active          boolean NOT NULL DEFAULT true,
  last_triggered  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_user_idx ON public.reminders(user_id, active, scheduled_at);

-- ─── 2. الوصفات الطبية ───
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_name     text NOT NULL,
  doctor_specialty text,
  medication      text NOT NULL,
  dosage          text,
  frequency       text,          -- مثال: "3 مرات يومياً"
  duration_days   integer,        -- مدة العلاج بالأيام
  notes           text,
  prescribed_at   date NOT NULL DEFAULT CURRENT_DATE,
  appointment_id  uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prescriptions_user_idx ON public.prescriptions(user_id, prescribed_at DESC);
-- 🆕 V24: index ناقص على appointment_id
CREATE INDEX IF NOT EXISTS prescriptions_appt_idx ON public.prescriptions(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- ─── 3. المؤشرات الحيوية ───
CREATE TABLE IF NOT EXISTS public.health_vitals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vital_type      text NOT NULL CHECK (vital_type IN ('pulse', 'blood_pressure', 'blood_sugar', 'temperature', 'weight', 'oxygen', 'height')),
  value           text NOT NULL,         -- text لدعم "120/80" للضغط
  unit            text,
  measured_at     timestamptz NOT NULL DEFAULT now(),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_vitals_user_idx ON public.health_vitals(user_id, vital_type, measured_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- RLS: المستخدم يرى/يعدّل بياناته فقط
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;

-- Reminders policies
DROP POLICY IF EXISTS reminders_select_own ON public.reminders;
CREATE POLICY reminders_select_own ON public.reminders FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS reminders_insert_own ON public.reminders;
CREATE POLICY reminders_insert_own ON public.reminders FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reminders_update_own ON public.reminders;
CREATE POLICY reminders_update_own ON public.reminders FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS reminders_delete_own ON public.reminders;
CREATE POLICY reminders_delete_own ON public.reminders FOR DELETE USING (user_id = auth.uid());

-- Prescriptions policies
DROP POLICY IF EXISTS prescriptions_select_own ON public.prescriptions;
CREATE POLICY prescriptions_select_own ON public.prescriptions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS prescriptions_insert_own ON public.prescriptions;
CREATE POLICY prescriptions_insert_own ON public.prescriptions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS prescriptions_update_own ON public.prescriptions;
CREATE POLICY prescriptions_update_own ON public.prescriptions FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS prescriptions_delete_own ON public.prescriptions;
CREATE POLICY prescriptions_delete_own ON public.prescriptions FOR DELETE USING (user_id = auth.uid());

-- Health vitals policies
DROP POLICY IF EXISTS vitals_select_own ON public.health_vitals;
CREATE POLICY vitals_select_own ON public.health_vitals FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS vitals_insert_own ON public.health_vitals;
CREATE POLICY vitals_insert_own ON public.health_vitals FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vitals_update_own ON public.health_vitals;
CREATE POLICY vitals_update_own ON public.health_vitals FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS vitals_delete_own ON public.health_vitals;
CREATE POLICY vitals_delete_own ON public.health_vitals FOR DELETE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- Triggers لتحديث updated_at تلقائياً
-- 🔧 V24: استخدام update_updated_at (موحّد) بدل set_updated_at
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_reminders_updated_at ON public.reminders;
CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 07 Complete
-- ═══════════════════════════════════════════════════════════════════

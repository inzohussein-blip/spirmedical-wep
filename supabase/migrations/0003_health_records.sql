-- ╔══════════════════════════════════════════════════════════════╗
-- ║  03_health_records.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 03_health_records.sql — الصحة + السجل الطبي + سحب الدم + المختبرات
-- مدموج (V33) من: 07_personal_health.sql 08_medical_record.sql 38_blood_draw_system.sql 39_lab_results_notifications.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 07_personal_health.sql ───
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


-- ─── 08_medical_record.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 08_medical_record.sql — السجل الطبي + إعدادات المستخدم (V24)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف:
--   1. medical_info  jsonb — معلومات طبية (فصيلة الدم، أمراض، حساسية)
--   2. user_settings jsonb — إعدادات (إشعارات، لغة، إلخ)
-- ═══════════════════════════════════════════════════════════════════

-- إضافة الأعمدة لجدول users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS medical_info jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS user_settings jsonb DEFAULT '{}'::jsonb;

-- مؤشرات على الـ JSONB للبحث السريع (لو احتجناها مستقبلاً)
CREATE INDEX IF NOT EXISTS users_medical_info_gin ON public.users USING gin (medical_info);
CREATE INDEX IF NOT EXISTS users_settings_gin ON public.users USING gin (user_settings);


-- ═══════════════════════════════════════════════════════════════════
-- 📋 توثيق البنية المتوقعة (للمطوّر فقط - لا يُنفّذ)
-- ═══════════════════════════════════════════════════════════════════

-- مثال على هيكل medical_info:
-- {
--   "blood_type": "O+",
--   "height_cm": 175,
--   "weight_kg": 72,
--   "birth_date": "1995-03-15",
--   "chronic_conditions": [
--     { "name": "السكري النوع 2", "since": "2020", "severity": "moderate" }
--   ],
--   "allergies": [
--     { "name": "البنسلين", "reaction": "طفح جلدي" }
--   ],
--   "past_surgeries": [],
--   "family_history": []
-- }

-- مثال على هيكل user_settings:
-- {
--   "language": "ar",
--   "biometric": false,
--   "auto_lock": true,
--   "analytics": true,
--   "notifications": {
--     "appointments": true,
--     "meds": true,
--     "results": true,
--     "messages": true,
--     "news": false
--   }
-- }


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 08 Complete
-- ═══════════════════════════════════════════════════════════════════
COMMENT ON COLUMN public.users.medical_info IS 'JSONB: blood_type, height_cm, weight_kg, birth_date, chronic_conditions[], allergies[], past_surgeries[], family_history[]';
COMMENT ON COLUMN public.users.user_settings IS 'JSONB: language, biometric, auto_lock, analytics, notifications{}';


-- ─── 38_blood_draw_system.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 38: Blood Draw + Lab Tests System (V25.43)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُنشئ 3 جداول جديدة:
--   • partner_labs        - المختبرات الشريكة (مع إدارة كاملة)
--   • lab_orders          - تفاصيل طلب سحب الدم (test_ids, lab_id, إلخ)
--   • lab_results         - نتائج التحاليل (لكل فحص نتيجة منفصلة)
--
-- + columns جديدة على appointments للربط
-- + RLS policies + indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PARTNER LABS - المختبرات الشريكة ───
CREATE TABLE IF NOT EXISTS public.partner_labs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الأساسيات
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  logo_url        TEXT,
  description     TEXT,
  
  -- الموقع
  city            TEXT NOT NULL,
  governorate     TEXT,
  address         TEXT,
  latitude        NUMERIC(10, 7),
  longitude       NUMERIC(10, 7),
  
  -- التواصل
  phone           TEXT,
  whatsapp        TEXT,
  website         TEXT,
  
  -- الميزات
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  accepts_home_draw BOOLEAN NOT NULL DEFAULT true,
  
  -- الإحصائيات (computed)
  total_orders    INTEGER NOT NULL DEFAULT 0,
  rating_avg      NUMERIC(3, 2) DEFAULT 0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  
  -- ساعات العمل
  working_hours   JSONB,  -- { "sat": "08:00-20:00", "sun": "08:00-20:00", ... }
  
  -- التخصصات
  specialties     TEXT[],  -- ['general', 'cardiac', 'diabetes', ...]
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_labs_city ON public.partner_labs(city);
CREATE INDEX IF NOT EXISTS idx_partner_labs_active ON public.partner_labs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partner_labs_location ON public.partner_labs(latitude, longitude) WHERE latitude IS NOT NULL;

-- ─── 2. LAB ORDERS - طلبات سحب الدم ───
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- التحاليل المطلوبة
  test_ids        TEXT[] NOT NULL,  -- ['cbc', 'fbs', 'hba1c']
  bundle_id       TEXT,             -- 'bundle-general-health' أو null
  
  -- المختبر
  partner_lab_id  UUID REFERENCES public.partner_labs(id) ON DELETE SET NULL,
  lab_name_snapshot TEXT,  -- اسم المختبر وقت الطلب (للسجلات)
  
  -- بيانات المريض (اختيارية - مفيدة للنتائج)
  patient_age     INTEGER,
  patient_gender  TEXT CHECK (patient_gender IN ('male', 'female') OR patient_gender IS NULL),
  patient_condition TEXT,  -- حالة طبية (سكري، حمل، إلخ)
  
  -- معلومات الصيام
  needs_fasting   BOOLEAN NOT NULL DEFAULT false,
  fasting_hours   INTEGER DEFAULT 0,
  fasting_confirmed BOOLEAN NOT NULL DEFAULT false,  -- المريض أكّد أنه صائم
  
  -- التسعير
  draw_fee        INTEGER NOT NULL DEFAULT 15000,  -- سعر سحب الدم (IQD)
  tests_total     INTEGER NOT NULL DEFAULT 0,      -- إجمالي التحاليل
  discount        INTEGER NOT NULL DEFAULT 0,      -- خصم
  total_price     INTEGER NOT NULL,                -- الإجمالي النهائي
  
  -- التوقيت
  expected_result_at TIMESTAMPTZ,  -- متى نتوقع النتيجة
  
  -- الحالة
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',           -- لم يُجمع بعد
      'sample_collected',  -- جُمعت العينة
      'sent_to_lab',       -- أُرسلت للمختبر
      'processing',        -- قيد التحليل
      'results_ready',     -- النتائج جاهزة
      'delivered',         -- سُلّمت للمريض
      'cancelled'          -- ألغي
    )),
  
  -- ملاحظات
  notes           TEXT,
  internal_notes  TEXT,  -- للموظّفين فقط
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT lab_orders_tests_required CHECK (array_length(test_ids, 1) > 0)
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_user ON public.lab_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_appointment ON public.lab_orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON public.lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_created ON public.lab_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_orders_test_ids ON public.lab_orders USING GIN(test_ids);

-- ─── 3. LAB RESULTS - نتائج التحاليل (لكل فحص نتيجة منفصلة) ───
CREATE TABLE IF NOT EXISTS public.lab_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط
  lab_order_id    UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- الفحص
  test_id         TEXT NOT NULL,  -- 'cbc', 'fbs', إلخ
  test_name       TEXT NOT NULL,  -- اسم الفحص (snapshot)
  
  -- النتيجة
  result_value    TEXT,           -- القيمة (قد تكون رقم أو نص)
  result_numeric  NUMERIC,        -- القيمة كرقم (للـ trends و charts)
  unit            TEXT,           -- mg/dL، g/dL، إلخ
  normal_range_min NUMERIC,
  normal_range_max NUMERIC,
  normal_range_text TEXT,         -- "70-100 mg/dL" - للعرض
  
  -- التفسير
  status          TEXT NOT NULL DEFAULT 'normal'
    CHECK (status IN ('normal', 'low', 'high', 'critical', 'inconclusive')),
  flag            TEXT,           -- 'L', 'H', 'HH', 'LL', 'C' (critical)
  notes           TEXT,           -- ملاحظات الطبيب
  
  -- ملف PDF (اختياري)
  pdf_url         TEXT,
  
  -- التوقيتات
  tested_at       TIMESTAMPTZ,    -- متى أُجري الفحص في المختبر
  results_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- متى أُدخلت النتيجة
  
  -- من أدخل النتيجة
  entered_by      UUID REFERENCES public.users(id),
  reviewed_by     UUID REFERENCES public.users(id),  -- طبيب راجع النتيجة
  reviewed_at     TIMESTAMPTZ,
  
  -- هل المريض شاهد النتيجة؟
  viewed_by_patient BOOLEAN NOT NULL DEFAULT false,
  viewed_at       TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_order ON public.lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user ON public.lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test ON public.lab_results(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user_test ON public.lab_results(user_id, test_id, results_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON public.lab_results(status) WHERE status != 'normal';

-- ─── 4. ربط appointments بـ lab_orders ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_lab_order ON public.appointments(lab_order_id) WHERE lab_order_id IS NOT NULL;

-- ─── 5. RLS Policies ───

-- partner_labs: الجميع يقرأ النشطة، الـ admin يدير
ALTER TABLE public.partner_labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_labs_public_read" ON public.partner_labs;
CREATE POLICY "partner_labs_public_read"
  ON public.partner_labs FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "partner_labs_admin_all" ON public.partner_labs;
CREATE POLICY "partner_labs_admin_all"
  ON public.partner_labs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- lab_orders: المريض يرى طلباته، الـ specialist (lab_analyst) يرى المُسندة له، الـ admin يرى الكل
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_orders_user_own" ON public.lab_orders;
CREATE POLICY "lab_orders_user_own"
  ON public.lab_orders FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lab_orders_user_insert" ON public.lab_orders;
CREATE POLICY "lab_orders_user_insert"
  ON public.lab_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lab_orders_specialist_read" ON public.lab_orders;
CREATE POLICY "lab_orders_specialist_read"
  ON public.lab_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.lab_order_id = lab_orders.id
        AND a.specialist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_orders_specialist_update" ON public.lab_orders;
CREATE POLICY "lab_orders_specialist_update"
  ON public.lab_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.lab_order_id = lab_orders.id
        AND a.specialist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_orders_admin_all" ON public.lab_orders;
CREATE POLICY "lab_orders_admin_all"
  ON public.lab_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- lab_results: المريض يرى نتائجه، الـ specialist يدخلها، الـ admin يدير
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_results_user_own" ON public.lab_results;
CREATE POLICY "lab_results_user_own"
  ON public.lab_results FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lab_results_specialist_manage" ON public.lab_results;
CREATE POLICY "lab_results_specialist_manage"
  ON public.lab_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND specialist_type = 'lab_analyst'
    )
  );

DROP POLICY IF EXISTS "lab_results_admin_all" ON public.lab_results;
CREATE POLICY "lab_results_admin_all"
  ON public.lab_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 6. Trigger لتحديث updated_at ───
CREATE OR REPLACE FUNCTION update_lab_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lab_orders_updated_at ON public.lab_orders;
CREATE TRIGGER lab_orders_updated_at
  BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();

DROP TRIGGER IF EXISTS lab_results_updated_at ON public.lab_results;
CREATE TRIGGER lab_results_updated_at
  BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();

DROP TRIGGER IF EXISTS partner_labs_updated_at ON public.partner_labs;
CREATE TRIGGER partner_labs_updated_at
  BEFORE UPDATE ON public.partner_labs
  FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();

-- ─── 7. Seed data - المختبرات الـ 6 الأساسية ───
INSERT INTO public.partner_labs (
  name_ar, name_en, city, governorate, phone, is_active, is_featured, accepts_home_draw, specialties
) VALUES
  ('مختبر التحاليل الذهبي', 'Golden Lab', 'بغداد', 'بغداد', '07700000001', true, true, true, ARRAY['general', 'cardiac', 'diabetes', 'thyroid']),
  ('مختبر النخبة الطبي', 'Elite Medical Lab', 'بغداد', 'بغداد', '07700000002', true, true, true, ARRAY['general', 'cardiac', 'thyroid', 'hormones']),
  ('مختبر دجلة المركزي', 'Tigris Central Lab', 'بغداد', 'بغداد', '07700000003', true, false, true, ARRAY['general', 'diabetes', 'kidney', 'liver']),
  ('مختبر البصرة الحديث', 'Modern Basra Lab', 'البصرة', 'البصرة', '07700000004', true, true, true, ARRAY['general', 'cardiac', 'diabetes']),
  ('مختبر أربيل التخصصي', 'Erbil Specialist Lab', 'أربيل', 'أربيل', '07700000005', true, true, true, ARRAY['general', 'cardiac', 'hormones', 'genetic']),
  ('مختبر النجف الطبي', 'Najaf Medical Lab', 'النجف', 'النجف', '07700000006', true, false, true, ARRAY['general', 'diabetes', 'thyroid'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 38
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 39_lab_results_notifications.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 39: Lab Results Notifications + Helpers (V25.43)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Notification template للنتائج الجاهزة ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES (
  'lab_results_ready',
  'نتائج التحاليل جاهزة 🎉',
  'push',
  'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.'
) ON CONFLICT (key) DO NOTHING;

-- ─── 2. Trigger: عند تغيير lab_orders.status إلى 'results_ready' ───
-- نُرسل إشعار تلقائي للمريض

CREATE OR REPLACE FUNCTION notify_lab_results_ready()
RETURNS TRIGGER AS $$
BEGIN
  -- فقط لو الـ status تغيّر إلى 'results_ready' أو 'delivered'
  IF (OLD.status != 'results_ready' AND NEW.status = 'results_ready') OR
     (OLD.status != 'delivered' AND NEW.status = 'delivered') THEN
    
    -- أضِف إلى notification_queue
    INSERT INTO public.notification_queue (
      user_id,
      template_key,
      title,
      body,
      icon,
      data,
      created_at,
      scheduled_at
    ) VALUES (
      NEW.user_id,
      'lab_results_ready',
      'نتائج التحاليل جاهزة 🎉',
      'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.',
      '🩸',
      jsonb_build_object('lab_order_id', NEW.id, 'url', '/account/lab-history/' || NEW.id),
      NOW(),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab_results_notify ON public.lab_orders;
CREATE TRIGGER trigger_lab_results_notify
  AFTER UPDATE ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_lab_results_ready();

-- ─── 3. Function: تحديث partner_labs statistics ───
CREATE OR REPLACE FUNCTION update_partner_lab_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_lab_id IS NOT NULL THEN
    UPDATE public.partner_labs
    SET total_orders = (
      SELECT COUNT(*) FROM public.lab_orders 
      WHERE partner_lab_id = NEW.partner_lab_id
    )
    WHERE id = NEW.partner_lab_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partner_lab_stats ON public.lab_orders;
CREATE TRIGGER trigger_partner_lab_stats
  AFTER INSERT ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_lab_stats();

-- ─── 4. Index للأداء ───
CREATE INDEX IF NOT EXISTS idx_lab_results_user_recent 
  ON public.lab_results(user_id, results_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_user_recent 
  ON public.lab_orders(user_id, created_at DESC);

-- ─── 5. View للـ admin: lab orders summary ───
CREATE OR REPLACE VIEW public.admin_lab_orders_summary AS
SELECT 
  lo.id,
  lo.user_id,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  lo.test_ids,
  array_length(lo.test_ids, 1) AS test_count,
  lo.bundle_id,
  lo.partner_lab_id,
  pl.name_ar AS lab_name,
  lo.total_price,
  lo.status,
  lo.created_at,
  lo.updated_at,
  (
    SELECT COUNT(*) FROM public.lab_results lr 
    WHERE lr.lab_order_id = lo.id
  ) AS results_count
FROM public.lab_orders lo
LEFT JOIN public.users u ON u.id = lo.user_id
LEFT JOIN public.partner_labs pl ON pl.id = lo.partner_lab_id
ORDER BY lo.created_at DESC;

-- منح صلاحية القراءة للـ admin
GRANT SELECT ON public.admin_lab_orders_summary TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 39
-- ═══════════════════════════════════════════════════════════════════════════




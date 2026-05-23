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
        AND (a.assigned_specialist_id = auth.uid() OR a.specialist_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "lab_orders_specialist_update" ON public.lab_orders;
CREATE POLICY "lab_orders_specialist_update"
  ON public.lab_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.lab_order_id = lab_orders.id
        AND (a.assigned_specialist_id = auth.uid() OR a.specialist_id = auth.uid())
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

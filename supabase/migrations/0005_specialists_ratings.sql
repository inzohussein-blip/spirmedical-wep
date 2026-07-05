-- ╔══════════════════════════════════════════════════════════════╗
-- ║  05_specialists_ratings.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 05_specialists_ratings.sql — المختصّون + التمريض + كل التقييمات (تعتمد على 04)
-- مدموج (V33) من: 09_specialist_system.sql 20_nursing_enhancements.sql 21_nurse_credentials.sql 40_nursing_enhancements_v44.sql 41_doctor_system_v45.sql 42_pharmacy_system_v46.sql 43_hospitals_dental_optical_v47.sql 44_mental_nutrition_physio_cosmetic_v48.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 09_specialist_system.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 09_specialist_system.sql — نظام الاختصاصيين الموحّد (V24 — مُصحَّح)
-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V24: مزامنة specialist_id ↔ assigned_specialist_id عبر trigger
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. توسيع جدول users ───
-- (كتلة ALTER users نُقلت للملف 01 — V33)

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


-- ─── 20_nursing_enhancements.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 💉 Migration 20: Nursing Service Enhancements (V25.5)
-- ════════════════════════════════════════════════════════════════════
-- بناءً على وثيقة المواصفات الفنية لأيقونة "التمريض المنزلي والتداوي"
--
-- يُضيف:
--   1. nursing_supplies_request - طلب المستلزمات للممرض
--   2. nurse_gender_preference - تفضيل جنس الممرض
--   3. recurring_schedule - الجدولة الزرقية (كل 8/12 ساعة)
--   4. allergy_form_filled - استمارة التحسس الدوائي
--   5. prescription_image_url - صورة الوصفة الطبية الإلزامية
--   6. infectious_disease_alert - تنبيه أمراض معدية
--   7. visit_history - سجل الزيارات التمريضية
--   8. nurse_emergency_logs - سجل تفعيل زر الطوارئ للممرض
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة في appointments ─────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS nurse_gender_preference TEXT
    CHECK (nurse_gender_preference IN ('male', 'female', 'any')),
  ADD COLUMN IF NOT EXISTS recurring_schedule JSONB,
    -- مثال: {"enabled": true, "interval_hours": 8, "end_date": "2026-06-01", "auto_confirm": true}
  ADD COLUMN IF NOT EXISTS allergy_form JSONB,
    -- مثال: {"penicillin": false, "sulfa": true, "other": "حساسية لاكتوز", "filled_at": "..."}
  ADD COLUMN IF NOT EXISTS prescription_image_url TEXT,
  ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS infectious_disease_alert JSONB,
    -- مثال: {"hepatitis_b": true, "covid": false, "tb": false, "notes": "..."}
  ADD COLUMN IF NOT EXISTS supplies_request JSONB,
    -- مثال: [{"item": "كانيولا 22G", "qty": 2, "added_to_invoice": true, "price": 5000}]
  ADD COLUMN IF NOT EXISTS supplies_total NUMERIC DEFAULT 0;

-- ─── 2. سجل زيارات التمريض (History) ──────────────────────
CREATE TABLE IF NOT EXISTS public.nursing_visit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- تفاصيل الزيارة
  procedure_type TEXT NOT NULL,
    -- 'injection', 'iv', 'wound_care', 'cannula', 'catheter', 'diabetic_foot'
  procedure_details JSONB,
    -- مثال: {"injection_type": "IM", "site": "deltoid", "medication": "Augmentin"}
  
  -- العلامات الحيوية
  vital_signs JSONB,
    -- مثال: {"bp": "120/80", "pulse": 72, "temp": 37.0, "spo2": 98}
  
  -- ملاحظات
  notes TEXT,
  complications TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- timestamps
  performed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 🔧 V33: ربط nursing_visit_history بفرد العائلة (نُقل من 01 — يحتاج الجدول موجوداً)
ALTER TABLE public.nursing_visit_history
  ADD COLUMN IF NOT EXISTS family_member_id UUID 
    REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nursing_history_family_member 
  ON public.nursing_visit_history(family_member_id) 
  WHERE family_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nursing_history_user
  ON public.nursing_visit_history(user_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_nursing_history_specialist
  ON public.nursing_visit_history(specialist_id, performed_at DESC);

ALTER TABLE public.nursing_visit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nursing_history_select_own" ON public.nursing_visit_history;
CREATE POLICY "nursing_history_select_own"
  ON public.nursing_visit_history FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "nursing_history_insert_specialist" ON public.nursing_visit_history;
CREATE POLICY "nursing_history_insert_specialist"
  ON public.nursing_visit_history FOR INSERT
  WITH CHECK (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 3. سجل تفعيل زر الطوارئ للممرض ────────────────────────
CREATE TABLE IF NOT EXISTS public.nurse_emergency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- بيانات الطوارئ
  trigger_reason TEXT,
    -- 'attack', 'threat', 'harassment', 'medical', 'other'
  description TEXT,
  
  -- GPS وقت التفعيل
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy_m NUMERIC,
  
  -- معالجة الطوارئ
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'responding', 'resolved', 'false_alarm')),
  contacted_911 BOOLEAN DEFAULT FALSE,
  call_center_notified BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurse_emergency_open
  ON public.nurse_emergency_logs(status, created_at DESC)
  WHERE status IN ('open', 'responding');

ALTER TABLE public.nurse_emergency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurse_emergency_specialist_insert" ON public.nurse_emergency_logs;
CREATE POLICY "nurse_emergency_specialist_insert"
  ON public.nurse_emergency_logs FOR INSERT
  WITH CHECK (auth.uid() = specialist_id);

DROP POLICY IF EXISTS "nurse_emergency_admin_select" ON public.nurse_emergency_logs;
CREATE POLICY "nurse_emergency_admin_select"
  ON public.nurse_emergency_logs FOR SELECT
  USING (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 4. تقييم جودة الخدمة التمريضية ──────────────────────
-- (ALTER order_reviews أُزيل — الجدول غير موجود في المخطّط الحالي — V33)

-- ─── 5. تعليقات ──────────────────────────────────────────
COMMENT ON COLUMN public.appointments.nurse_gender_preference IS
  'تفضيل جنس الممرض لتلبية الرغبة الشخصية والشرعية';

COMMENT ON COLUMN public.appointments.recurring_schedule IS
  'الجدولة الزرقية: تنفيذ كورسات العلاج كل 8/12 ساعة';

COMMENT ON COLUMN public.appointments.prescription_image_url IS
  'صورة الوصفة الطبية الإلزامية (الراشيتة) - حماية قانونية';

COMMENT ON COLUMN public.appointments.allergy_form IS
  'استمارة التحسس الدوائي - يجب ملؤها قبل أي علاج';

COMMENT ON TABLE public.nursing_visit_history IS
  'سجل الزيارات التمريضية - History لكل مريض';

COMMENT ON TABLE public.nurse_emergency_logs IS
  'سجل تفعيل زر الطوارئ الأمني للممرض داخل منزل المريض';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20 applied: Nursing service enhancements (10 features)';
END $$;


-- ─── 21_nurse_credentials.sql ───
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


-- ─── 40_nursing_enhancements_v44.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 40: Nursing Service Enhancements (V25.44)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. تقييم الممرضين (nurse_ratings)
--   2. View للـ vitals trends
--   3. Trigger للإشعارات
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. NURSE RATINGS - تقييمات الممرضين ───
CREATE TABLE IF NOT EXISTS public.nurse_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_id          UUID REFERENCES public.nursing_visit_history(id) ON DELETE SET NULL,
  
  -- التقييم العام
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية (1-5)
  hygiene_rating    INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  attitude_rating   INTEGER CHECK (attitude_rating >= 1 AND attitude_rating <= 5),
  
  -- ملاحظات المريض
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- متاح للعرض العام؟
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- لا يمكن تقييم نفس الموعد مرّتين
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_ratings_specialist ON public.nurse_ratings(specialist_id);
CREATE INDEX IF NOT EXISTS idx_nurse_ratings_user ON public.nurse_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_nurse_ratings_rating ON public.nurse_ratings(rating);

-- RLS
ALTER TABLE public.nurse_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurse_ratings_user_own" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_user_own"
  ON public.nurse_ratings FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_user_insert" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_user_insert"
  ON public.nurse_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_specialist_read" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_specialist_read"
  ON public.nurse_ratings FOR SELECT
  USING (specialist_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_public_read" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_public_read"
  ON public.nurse_ratings FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "nurse_ratings_admin_all" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_admin_all"
  ON public.nurse_ratings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 2. View للـ vitals trends ───
CREATE OR REPLACE VIEW public.vitals_trends AS
SELECT 
  user_id,
  performed_at::date AS visit_date,
  performed_at,
  procedure_type,
  vital_signs->>'bp' AS blood_pressure,
  (vital_signs->>'pulse')::int AS pulse,
  (vital_signs->>'temp')::numeric AS temperature,
  (vital_signs->>'spo2')::int AS oxygen_saturation,
  (vital_signs->>'sugar')::int AS blood_sugar,
  notes
FROM public.nursing_visit_history
WHERE vital_signs IS NOT NULL
ORDER BY performed_at DESC;

GRANT SELECT ON public.vitals_trends TO authenticated;

-- ─── 3. Function: عند إضافة rating، حدّث متوسط الممرض ───
CREATE OR REPLACE FUNCTION update_nurse_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- لو في column rating_avg في users (لازم نضيفها لو ما كانت)
  UPDATE public.users
  SET updated_at = NOW()
  WHERE id = NEW.specialist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nurse_avg_rating ON public.nurse_ratings;
CREATE TRIGGER trigger_nurse_avg_rating
  AFTER INSERT OR UPDATE ON public.nurse_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nurse_avg_rating();

-- ─── 4. Notification template للنوسنج ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'nursing_request_accepted',
    'تمّ قبول طلب التمريض ✓',
    'push',
    'الممرض في الطريق إليك'
  ),
  (
    'nursing_visit_completed',
    'انتهت زيارة التمريض ✓',
    'push',
    'كيف كانت تجربتك مع الممرض؟ قيّمها الآن.'
  )
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 40
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 41_doctor_system_v45.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 41: Doctor System Enhancements (V25.45)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. doctor_ratings (تقييمات الأطباء)
--   2. doctor_appointment_type (column في appointments)
--   3. video_sessions (للاستشارات بالفيديو)
--   4. Notifications للأطباء
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. DOCTOR RATINGS ───
CREATE TABLE IF NOT EXISTS public.doctor_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  consultation_id   UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  
  -- تقييم عام (1-5)
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  empathy_rating    INTEGER CHECK (empathy_rating >= 1 AND empathy_rating <= 5),
  
  -- ملاحظات
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- نوع التفاعل
  interaction_type TEXT CHECK (interaction_type IN ('home_visit', 'clinic_visit', 'video', 'chat', 'subscription')),
  
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id),
  UNIQUE (user_id, consultation_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_ratings_doctor ON public.doctor_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_user ON public.doctor_ratings(user_id);

ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_ratings_user_own" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_user_own"
  ON public.doctor_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_ratings_user_insert" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_user_insert"
  ON public.doctor_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_ratings_public_read" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_public_read"
  ON public.doctor_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "doctor_ratings_admin_all" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_admin_all"
  ON public.doctor_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. أعمدة جديدة على appointments للأطباء ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_appointment_type TEXT 
    CHECK (doctor_appointment_type IN ('home_visit', 'clinic_visit', 'video', 'follow_up')),
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT[];

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id) WHERE doctor_id IS NOT NULL;

-- ─── 3. VIDEO SESSIONS ───
CREATE TABLE IF NOT EXISTS public.video_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  patient_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Jitsi room name (random uuid)
  room_name         TEXT NOT NULL UNIQUE,
  
  -- توقيتات
  scheduled_at      TIMESTAMPTZ NOT NULL,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER,
  
  -- الحالة
  status            TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- recording (اختياري)
  recording_url     TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (consultation_id IS NOT NULL OR appointment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_video_sessions_patient ON public.video_sessions(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_doctor ON public.video_sessions(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_room ON public.video_sessions(room_name);

ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_sessions_participants" ON public.video_sessions;
CREATE POLICY "video_sessions_participants"
  ON public.video_sessions FOR SELECT
  USING (patient_user_id = auth.uid() OR doctor_user_id = auth.uid());

DROP POLICY IF EXISTS "video_sessions_admin" ON public.video_sessions;
CREATE POLICY "video_sessions_admin"
  ON public.video_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. Notification templates ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'doctor_appointment_confirmed',
    'تمّ تأكيد موعد الطبيب ✓',
    'push',
    'موعدك مع الطبيب جاهز'
  ),
  (
    'consultation_new_message',
    'رسالة جديدة من الطبيب 💬',
    'push',
    'افتح المحادثة لقراءة الرد'
  ),
  (
    'video_session_starting',
    'استشارة الفيديو على وشك البدء 📹',
    'push',
    'انضم الآن'
  ),
  (
    'doctor_subscription_renewed',
    'تجديد اشتراك الطبيب ✓',
    'push',
    'تم تجديد اشتراكك بنجاح'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── 5. Trigger: تحديث rating_avg للطبيب ───
CREATE OR REPLACE FUNCTION update_doctor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.doctors
  SET 
    rating_avg = (
      SELECT AVG(rating)::numeric(3,2) FROM public.doctor_ratings 
      WHERE doctor_id = NEW.doctor_id AND is_public = true
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.doctor_ratings 
      WHERE doctor_id = NEW.doctor_id AND is_public = true
    )
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doctor_rating_stats ON public.doctor_ratings;
CREATE TRIGGER trigger_doctor_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 41
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 42_pharmacy_system_v46.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 42: Pharmacy System Enhancements (V25.46)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. pharmacy_reservations (حجز دواء قبل الزيارة)
--   2. pharmacy_ratings (تقييم الصيدليات)
--   3. pharmacy_favorites (الصيدليات المفضّلة)
--   4. user_medications (أدوية المريض المعتادة)
--   5. Triggers + Notification templates
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PHARMACY RESERVATIONS ───
-- المريض يحجز دواء في صيدلية قبل ما يروح يطلبه
CREATE TABLE IF NOT EXISTS public.pharmacy_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  -- ربط بـ prescription (اختياري)
  prescription_id   UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  
  -- لمن (عائلة)
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- الأدوية المطلوبة (structured JSONB)
  items             JSONB NOT NULL,
    -- [
    --   {
    --     "medication_id": "uuid",      -- إن وُجد في DB
    --     "name": "بنادول 500mg",        -- اسم نصي (لو ما في medication_id)
    --     "quantity": 1,                 -- العدد
    --     "notes": "علبة كبيرة"          -- ملاحظات
    --   }
    -- ]
  
  -- صورة الوصفة (اختياري)
  prescription_image_url TEXT,
  
  -- ملاحظات للصيدلية
  customer_notes    TEXT,
  pharmacy_notes    TEXT,
  
  -- التسعير (الصيدلية ترد بالسعر)
  total_estimated_price NUMERIC,
  total_final_price NUMERIC,
  
  -- التوقّع - متى المستخدم سيأتي
  expected_pickup_at TIMESTAMPTZ,
  
  -- الحالة
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',           -- بانتظار رد الصيدلية
      'confirmed',         -- الصيدلية أكّدت التوفّر
      'partially_available', -- بعض الأدوية فقط متوفّرة
      'ready_for_pickup',  -- جاهز للاستلام
      'picked_up',         -- المريض استلمه
      'cancelled',         -- ألغي
      'expired'            -- انتهت صلاحية الحجز
    )),
  
  -- expiry (12 ساعة بعد التأكيد)
  expires_at        TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT items_required CHECK (jsonb_array_length(items) > 0)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_user ON public.pharmacy_reservations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_pharmacy ON public.pharmacy_reservations(pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_status ON public.pharmacy_reservations(status);

-- RLS
ALTER TABLE public.pharmacy_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_reservations_user_own" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_own"
  ON public.pharmacy_reservations FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_user_insert" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_insert"
  ON public.pharmacy_reservations FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_user_update" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_update"
  ON public.pharmacy_reservations FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_pharmacy_owner" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_pharmacy_owner"
  ON public.pharmacy_reservations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_reservations.pharmacy_id 
        AND p.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pharmacy_reservations_admin_all" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_admin_all"
  ON public.pharmacy_reservations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. PHARMACY RATINGS ───
CREATE TABLE IF NOT EXISTS public.pharmacy_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  reservation_id    UUID REFERENCES public.pharmacy_reservations(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  availability_rating INTEGER CHECK (availability_rating >= 1 AND availability_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating    INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_ratings_pharmacy ON public.pharmacy_ratings(pharmacy_id);

ALTER TABLE public.pharmacy_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_ratings_user_own" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_user_own"
  ON public.pharmacy_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_ratings_user_insert" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_user_insert"
  ON public.pharmacy_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_ratings_public_read" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_public_read"
  ON public.pharmacy_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "pharmacy_ratings_admin_all" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_admin_all"
  ON public.pharmacy_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. PHARMACY FAVORITES ───
CREATE TABLE IF NOT EXISTS public.pharmacy_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, pharmacy_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_favorites_user ON public.pharmacy_favorites(user_id);

ALTER TABLE public.pharmacy_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_favorites_user_all" ON public.pharmacy_favorites;
CREATE POLICY "pharmacy_favorites_user_all"
  ON public.pharmacy_favorites FOR ALL USING (user_id = auth.uid());

-- ─── 4. USER MEDICATIONS - أدوية المريض المعتادة ───
CREATE TABLE IF NOT EXISTS public.user_medications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- الدواء (إما من DB أو نصّي)
  medication_id     UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  custom_name       TEXT,  -- اسم نصي لو ما في medication_id
  
  -- التفاصيل
  dosage            TEXT,  -- "1 قرص"
  frequency         TEXT,  -- "3 مرات يومياً"
  timing            TEXT[],  -- ['morning', 'noon', 'evening', 'before_sleep']
  notes             TEXT,
  
  -- المدة
  start_date        DATE,
  end_date          DATE,
  is_chronic        BOOLEAN DEFAULT FALSE,  -- مزمن (مدى الحياة)
  
  -- التذكير
  enable_reminders  BOOLEAN DEFAULT FALSE,
  
  -- ربط بـ prescription
  prescription_id   UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  
  -- لمن
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  is_active         BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_medications_name_required CHECK (
    medication_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_user_medications_user ON public.user_medications(user_id, is_active);

ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_medications_user_all" ON public.user_medications;
CREATE POLICY "user_medications_user_all"
  ON public.user_medications FOR ALL USING (user_id = auth.uid());

-- ─── 5. Notification templates ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'pharmacy_reservation_new',
    'حجز دواء جديد 💊',
    'push',
    'لديك حجز جديد من مريض - يرجى الرد'
  ),
  (
    'pharmacy_reservation_confirmed',
    'تأكيد الحجز ✓',
    'push',
    'الصيدلية أكّدت توفّر الأدوية'
  ),
  (
    'pharmacy_reservation_partial',
    'تأكيد جزئي ⚠️',
    'push',
    'بعض الأدوية فقط متوفّرة'
  ),
  (
    'pharmacy_reservation_rejected',
    'الأدوية غير متوفّرة',
    'push',
    'للأسف الأدوية غير متوفّرة حالياً'
  ),
  (
    'pharmacy_reservation_ready',
    'الدواء جاهز للاستلام 🎉',
    'push',
    'يمكنك المرور لاستلامه'
  ),
  (
    'medication_reminder',
    'تذكير بموعد الدواء ⏰',
    'push',
    'حان وقت تناول الدواء'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── 6. Trigger: تحديث pharmacy rating stats ───
CREATE OR REPLACE FUNCTION update_pharmacy_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  pharmacy_uuid UUID;
BEGIN
  pharmacy_uuid := COALESCE(NEW.pharmacy_id, OLD.pharmacy_id);
  
  UPDATE public.pharmacies
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.pharmacy_ratings 
      WHERE pharmacy_id = pharmacy_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.pharmacy_ratings 
      WHERE pharmacy_id = pharmacy_uuid AND is_public = true
    )
  WHERE id = pharmacy_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_rating_stats ON public.pharmacy_ratings;
CREATE TRIGGER trigger_pharmacy_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_rating_stats();

-- ─── 7. Trigger: notify pharmacy on new reservation ───
CREATE OR REPLACE FUNCTION notify_pharmacy_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  pharmacy_owner UUID;
BEGIN
  -- جلب owner_user_id للصيدلية
  SELECT owner_user_id INTO pharmacy_owner
  FROM public.pharmacies
  WHERE id = NEW.pharmacy_id;
  
  IF pharmacy_owner IS NOT NULL THEN
    INSERT INTO public.notification_queue (
      user_id, template_key, title, body, icon, data, created_at, scheduled_at
    ) VALUES (
      pharmacy_owner,
      'pharmacy_reservation_new',
      'حجز دواء جديد 💊',
      'لديك حجز جديد من مريض - يرجى الرد',
      '💊',
      jsonb_build_object('reservation_id', NEW.id, 'url', '/pharmacy-orders/' || NEW.id),
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_new_reservation ON public.pharmacy_reservations;
CREATE TRIGGER trigger_pharmacy_new_reservation
  AFTER INSERT ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_pharmacy_new_reservation();

-- ─── 8. Trigger: notify user on reservation status change ───
CREATE OR REPLACE FUNCTION notify_user_reservation_status()
RETURNS TRIGGER AS $$
DECLARE
  template_key_val TEXT;
  title_val TEXT;
  body_val TEXT;
  icon_val TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  CASE NEW.status
    WHEN 'confirmed' THEN
      template_key_val := 'pharmacy_reservation_confirmed';
      title_val := 'تأكيد الحجز ✓';
      body_val := 'الصيدلية أكّدت توفّر الأدوية';
      icon_val := '✅';
    WHEN 'partially_available' THEN
      template_key_val := 'pharmacy_reservation_partial';
      title_val := 'تأكيد جزئي ⚠️';
      body_val := 'بعض الأدوية فقط متوفّرة - يُرجى المراجعة';
      icon_val := '⚠️';
    WHEN 'ready_for_pickup' THEN
      template_key_val := 'pharmacy_reservation_ready';
      title_val := 'الدواء جاهز للاستلام 🎉';
      body_val := 'يمكنك المرور لاستلامه';
      icon_val := '🎉';
    WHEN 'cancelled' THEN
      template_key_val := 'pharmacy_reservation_rejected';
      title_val := 'الأدوية غير متوفّرة';
      body_val := COALESCE(NEW.cancellation_reason, 'للأسف الأدوية غير متوفّرة حالياً');
      icon_val := '❌';
    ELSE
      RETURN NEW;
  END CASE;
  
  INSERT INTO public.notification_queue (
    user_id, template_key, title, body, icon, data, created_at, scheduled_at
  ) VALUES (
    NEW.user_id,
    template_key_val,
    title_val,
    body_val,
    icon_val,
    jsonb_build_object('reservation_id', NEW.id, 'url', '/account/pharmacy-reservations/' || NEW.id),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_reservation_status ON public.pharmacy_reservations;
CREATE TRIGGER trigger_user_reservation_status
  AFTER UPDATE ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_reservation_status();

-- ─── 9. updated_at triggers ───
CREATE OR REPLACE FUNCTION update_pharmacy_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_reservation_updated_at ON public.pharmacy_reservations;
CREATE TRIGGER trigger_pharmacy_reservation_updated_at
  BEFORE UPDATE ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_reservation_updated_at();

DROP TRIGGER IF EXISTS trigger_user_medications_updated_at ON public.user_medications;
CREATE TRIGGER trigger_user_medications_updated_at
  BEFORE UPDATE ON public.user_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_reservation_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 42
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 43_hospitals_dental_optical_v47.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 43: Hospitals + Dental + Optical Enhancements (V25.47)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. أعمدة structured في appointments للـ 3 خدمات
--   2. 3 جداول ratings (hospital_ratings, dental_ratings, optical_ratings)
--   3. جدول favorites موحّد
--   4. Triggers + Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة على appointments ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hospital_department TEXT,
  ADD COLUMN IF NOT EXISTS dental_clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dental_procedure_type TEXT 
    CHECK (dental_procedure_type IN (
      'cleaning', 'filling', 'extraction', 'root_canal', 'crown',
      'orthodontics', 'whitening', 'consultation', 'other'
    ) OR dental_procedure_type IS NULL),
  ADD COLUMN IF NOT EXISTS optical_store_id UUID REFERENCES public.optical_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS optical_service_type TEXT 
    CHECK (optical_service_type IN (
      'eye_exam', 'prescription_lenses', 'sunglasses', 
      'contact_lenses', 'frames_only', 'consultation'
    ) OR optical_service_type IS NULL);

CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON public.appointments(hospital_id) WHERE hospital_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_dental ON public.appointments(dental_clinic_id) WHERE dental_clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_optical ON public.appointments(optical_store_id) WHERE optical_store_id IS NOT NULL;

-- ─── 2. HOSPITAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.hospital_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hospital_id       UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  staff_rating      INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
  facilities_rating INTEGER CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
  wait_time_rating  INTEGER CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  
  department        TEXT,  -- القسم الذي زاره (اختياري)
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_ratings_hospital ON public.hospital_ratings(hospital_id);

ALTER TABLE public.hospital_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospital_ratings_user_own" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_user_own"
  ON public.hospital_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "hospital_ratings_user_insert" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_user_insert"
  ON public.hospital_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "hospital_ratings_public_read" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_public_read"
  ON public.hospital_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "hospital_ratings_admin_all" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_admin_all"
  ON public.hospital_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. DENTAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.dental_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dental_clinic_id  UUID NOT NULL REFERENCES public.dental_clinics(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  hygiene_rating    INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  comfort_rating    INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  
  procedure_type    TEXT,
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_dental_ratings_clinic ON public.dental_ratings(dental_clinic_id);

ALTER TABLE public.dental_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_ratings_user_own" ON public.dental_ratings;
CREATE POLICY "dental_ratings_user_own"
  ON public.dental_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dental_ratings_user_insert" ON public.dental_ratings;
CREATE POLICY "dental_ratings_user_insert"
  ON public.dental_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dental_ratings_public_read" ON public.dental_ratings;
CREATE POLICY "dental_ratings_public_read"
  ON public.dental_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "dental_ratings_admin_all" ON public.dental_ratings;
CREATE POLICY "dental_ratings_admin_all"
  ON public.dental_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. OPTICAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.optical_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  optical_store_id  UUID NOT NULL REFERENCES public.optical_stores(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  selection_rating  INTEGER CHECK (selection_rating >= 1 AND selection_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating    INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  quality_rating    INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  service_type      TEXT,
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_optical_ratings_store ON public.optical_ratings(optical_store_id);

ALTER TABLE public.optical_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optical_ratings_user_own" ON public.optical_ratings;
CREATE POLICY "optical_ratings_user_own"
  ON public.optical_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "optical_ratings_user_insert" ON public.optical_ratings;
CREATE POLICY "optical_ratings_user_insert"
  ON public.optical_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "optical_ratings_public_read" ON public.optical_ratings;
CREATE POLICY "optical_ratings_public_read"
  ON public.optical_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "optical_ratings_admin_all" ON public.optical_ratings;
CREATE POLICY "optical_ratings_admin_all"
  ON public.optical_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 5. SERVICE FAVORITES (موحّد لكل الخدمات) ───
CREATE TABLE IF NOT EXISTS public.service_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- نوع الخدمة (واحد فقط)
  service_type      TEXT NOT NULL CHECK (service_type IN (
    'hospital', 'dental', 'optical', 'doctor', 'pharmacy',
    'mental', 'nutrition', 'physio'
  )),
  service_id        UUID NOT NULL,  -- المرجع للجدول حسب service_type
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, service_type, service_id)
);

CREATE INDEX IF NOT EXISTS idx_service_favorites_user ON public.service_favorites(user_id, service_type);

ALTER TABLE public.service_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_favorites_user_all" ON public.service_favorites;
CREATE POLICY "service_favorites_user_all"
  ON public.service_favorites FOR ALL USING (user_id = auth.uid());

-- ─── 6. Triggers: تحديث rating_avg تلقائياً ───

-- Hospital
CREATE OR REPLACE FUNCTION update_hospital_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  hospital_uuid UUID;
BEGIN
  hospital_uuid := COALESCE(NEW.hospital_id, OLD.hospital_id);
  
  UPDATE public.hospitals
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.hospital_ratings 
      WHERE hospital_id = hospital_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.hospital_ratings 
      WHERE hospital_id = hospital_uuid AND is_public = true
    )
  WHERE id = hospital_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hospital_rating_stats ON public.hospital_ratings;
CREATE TRIGGER trigger_hospital_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.hospital_ratings
  FOR EACH ROW EXECUTE FUNCTION update_hospital_rating_stats();

-- Dental
CREATE OR REPLACE FUNCTION update_dental_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  clinic_uuid UUID;
BEGIN
  clinic_uuid := COALESCE(NEW.dental_clinic_id, OLD.dental_clinic_id);
  
  UPDATE public.dental_clinics
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.dental_ratings 
      WHERE dental_clinic_id = clinic_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.dental_ratings 
      WHERE dental_clinic_id = clinic_uuid AND is_public = true
    )
  WHERE id = clinic_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dental_rating_stats ON public.dental_ratings;
CREATE TRIGGER trigger_dental_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.dental_ratings
  FOR EACH ROW EXECUTE FUNCTION update_dental_rating_stats();

-- Optical
CREATE OR REPLACE FUNCTION update_optical_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  store_uuid UUID;
BEGIN
  store_uuid := COALESCE(NEW.optical_store_id, OLD.optical_store_id);
  
  UPDATE public.optical_stores
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.optical_ratings 
      WHERE optical_store_id = store_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.optical_ratings 
      WHERE optical_store_id = store_uuid AND is_public = true
    )
  WHERE id = store_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_optical_rating_stats ON public.optical_ratings;
CREATE TRIGGER trigger_optical_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.optical_ratings
  FOR EACH ROW EXECUTE FUNCTION update_optical_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 43
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 44_mental_nutrition_physio_cosmetic_v48.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 44: Mental + Nutrition + Physio + Cosmetic (V25.48 + V25.49)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. mental_health_ratings + nutritionist_ratings + physio_ratings
--   2. cosmetic_wishlist + cosmetic_product_reviews
--   3. أعمدة structured في appointments
--   4. Triggers + Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. MENTAL HEALTH RATINGS ───
CREATE TABLE IF NOT EXISTS public.mental_health_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.mental_health_specialists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  empathy_rating    INTEGER CHECK (empathy_rating >= 1 AND empathy_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  -- نوع الجلسة
  session_type      TEXT CHECK (session_type IN ('online', 'clinic')),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_anonymous      BOOLEAN NOT NULL DEFAULT TRUE,  -- افتراضياً مجهول للحساسية
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_mental_ratings_specialist ON public.mental_health_ratings(specialist_id);

ALTER TABLE public.mental_health_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_ratings_user_own" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_user_own"
  ON public.mental_health_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mental_ratings_user_insert" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_user_insert"
  ON public.mental_health_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mental_ratings_public_read" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_public_read"
  ON public.mental_health_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "mental_ratings_admin_all" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_admin_all"
  ON public.mental_health_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. NUTRITIONIST RATINGS ───
CREATE TABLE IF NOT EXISTS public.nutritionist_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nutritionist_id   UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  plan_quality_rating INTEGER CHECK (plan_quality_rating >= 1 AND plan_quality_rating <= 5),
  responsiveness_rating INTEGER CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
  results_rating    INTEGER CHECK (results_rating >= 1 AND results_rating <= 5),
  
  package_type      TEXT CHECK (package_type IN ('initial', 'follow_up', 'monthly')),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nutritionist_ratings_nutritionist ON public.nutritionist_ratings(nutritionist_id);

ALTER TABLE public.nutritionist_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutritionist_ratings_user_own" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_user_own"
  ON public.nutritionist_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutritionist_ratings_user_insert" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_user_insert"
  ON public.nutritionist_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutritionist_ratings_public_read" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_public_read"
  ON public.nutritionist_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "nutritionist_ratings_admin_all" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_admin_all"
  ON public.nutritionist_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. PHYSIO RATINGS ───
CREATE TABLE IF NOT EXISTS public.physio_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.physio_specialists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  skill_rating      INTEGER CHECK (skill_rating >= 1 AND skill_rating <= 5),
  improvement_rating INTEGER CHECK (improvement_rating >= 1 AND improvement_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  
  -- نوع الجلسة
  session_type      TEXT CHECK (session_type IN ('home_visit', 'clinic_visit')),
  service_type_slug TEXT,  -- ربط بـ physio_service_types
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_physio_ratings_specialist ON public.physio_ratings(specialist_id);

ALTER TABLE public.physio_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_ratings_user_own" ON public.physio_ratings;
CREATE POLICY "physio_ratings_user_own"
  ON public.physio_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "physio_ratings_user_insert" ON public.physio_ratings;
CREATE POLICY "physio_ratings_user_insert"
  ON public.physio_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "physio_ratings_public_read" ON public.physio_ratings;
CREATE POLICY "physio_ratings_public_read"
  ON public.physio_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "physio_ratings_admin_all" ON public.physio_ratings;
CREATE POLICY "physio_ratings_admin_all"
  ON public.physio_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. أعمدة structured في appointments للـ 3 services ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS mental_specialist_id UUID REFERENCES public.mental_health_specialists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS physio_specialist_id UUID REFERENCES public.physio_specialists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS physio_service_type_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_mental ON public.appointments(mental_specialist_id) WHERE mental_specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON public.appointments(nutritionist_id) WHERE nutritionist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_physio ON public.appointments(physio_specialist_id) WHERE physio_specialist_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💄 V25.49: COSMETIC E-COMMERCE
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 5. COSMETIC WISHLIST ───
CREATE TABLE IF NOT EXISTS public.cosmetic_wishlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.cosmetic_products(id) ON DELETE CASCADE,
  notes             TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_wishlist_user ON public.cosmetic_wishlist(user_id);

ALTER TABLE public.cosmetic_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_wishlist_user_all" ON public.cosmetic_wishlist;
CREATE POLICY "cosmetic_wishlist_user_all"
  ON public.cosmetic_wishlist FOR ALL USING (user_id = auth.uid());

-- ─── 6. COSMETIC PRODUCT REVIEWS ───
CREATE TABLE IF NOT EXISTS public.cosmetic_product_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.cosmetic_products(id) ON DELETE CASCADE,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  value_rating      INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  scent_rating      INTEGER CHECK (scent_rating >= 1 AND scent_rating <= 5),
  
  title             TEXT,  -- عنوان المراجعة (اختياري)
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- صورة (اختياري)
  image_url         TEXT,
  
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  helpful_count     INTEGER DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_reviews_product ON public.cosmetic_product_reviews(product_id, created_at DESC);

ALTER TABLE public.cosmetic_product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_reviews_user_own" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_own"
  ON public.cosmetic_product_reviews FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_user_insert" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_insert"
  ON public.cosmetic_product_reviews FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_user_update" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_update"
  ON public.cosmetic_product_reviews FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_public_read" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_public_read"
  ON public.cosmetic_product_reviews FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "cosmetic_reviews_admin_all" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_admin_all"
  ON public.cosmetic_product_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 7. Triggers لتحديث stats ───

-- Mental Health rating stats
CREATE OR REPLACE FUNCTION update_mental_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  spec_id UUID;
BEGIN
  spec_id := COALESCE(NEW.specialist_id, OLD.specialist_id);
  UPDATE public.mental_health_specialists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.mental_health_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.mental_health_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    )
  WHERE id = spec_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mental_rating_stats ON public.mental_health_ratings;
CREATE TRIGGER trigger_mental_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.mental_health_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_rating_stats();

-- Nutritionist rating stats
CREATE OR REPLACE FUNCTION update_nutritionist_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  nut_id UUID;
BEGIN
  nut_id := COALESCE(NEW.nutritionist_id, OLD.nutritionist_id);
  UPDATE public.nutritionists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.nutritionist_ratings 
      WHERE nutritionist_id = nut_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.nutritionist_ratings 
      WHERE nutritionist_id = nut_id AND is_public = true
    )
  WHERE id = nut_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nutritionist_rating_stats ON public.nutritionist_ratings;
CREATE TRIGGER trigger_nutritionist_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.nutritionist_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nutritionist_rating_stats();

-- Physio rating stats
CREATE OR REPLACE FUNCTION update_physio_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  spec_id UUID;
BEGIN
  spec_id := COALESCE(NEW.specialist_id, OLD.specialist_id);
  UPDATE public.physio_specialists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.physio_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.physio_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    )
  WHERE id = spec_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_physio_rating_stats ON public.physio_ratings;
CREATE TRIGGER trigger_physio_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.physio_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_physio_rating_stats();

-- Cosmetic product rating stats
CREATE OR REPLACE FUNCTION update_cosmetic_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  prod_id UUID;
BEGIN
  prod_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.cosmetic_products
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.cosmetic_product_reviews 
      WHERE product_id = prod_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.cosmetic_product_reviews 
      WHERE product_id = prod_id AND is_public = true
    )
  WHERE id = prod_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cosmetic_rating_stats ON public.cosmetic_product_reviews;
CREATE TRIGGER trigger_cosmetic_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.cosmetic_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cosmetic_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 44 (V25.48 + V25.49)
-- ═══════════════════════════════════════════════════════════════════════════




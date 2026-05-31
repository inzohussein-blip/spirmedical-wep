-- ═══════════════════════════════════════════════════════════════════
-- 📦 04_services_catalog.sql — كل الخدمات (الجداول الأساسية للمزوّدين)
-- مدموج (V33) من: 22_pharmacy_catalog.sql 24_doctors_hospitals_consultations.sql 29_cosmetic_products.sql 32_physio_service.sql 33_new_services.sql 45_vaccines_service_v50.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 22_pharmacy_catalog.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 💊 Migration 22: Pharmacy Catalog System (V25.7)
-- ════════════════════════════════════════════════════════════════════
-- منصة Spir Medical لا تبيع/توصّل أدوية (ممنوع قانونياً في العراق)
-- بل توفّر دليلاً ذكياً للبحث عن توفّر الأدوية في الصيدليات
--
-- يُضيف:
--   1. pharmacies      - الصيدليات المسجّلة
--   2. medications     - كتالوج الأدوية الشامل (مرجع وطني)
--   3. pharmacy_inventory - مخزون كل صيدلية (متوفر/غير متوفر)
--   4. medication_searches - تتبّع البحث لتحسين الخدمة
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. جدول الصيدليات ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- بيانات أساسية
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  license_number TEXT,
  license_image_url TEXT,
  
  -- العنوان
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- التواصل
  phone TEXT NOT NULL,
  whatsapp TEXT,
  
  -- ساعات العمل
  is_24h BOOLEAN DEFAULT FALSE,
  opens_at TIME,
  closes_at TIME,
  working_days TEXT[] DEFAULT ARRAY['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
  
  -- الميزات
  has_delivery BOOLEAN DEFAULT FALSE,  -- ⚠️ للعرض فقط لا للحجز
  has_emergency_section BOOLEAN DEFAULT FALSE,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  
  -- التقييمات (محسوبة من ratings)
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- العرض
  cover_image_url TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON public.pharmacies(city);
CREATE INDEX IF NOT EXISTS idx_pharmacies_active ON public.pharmacies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pharmacies_owner ON public.pharmacies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_24h ON public.pharmacies(is_24h) WHERE is_24h = TRUE;
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON public.pharmacies(latitude, longitude);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- قراءة: الكل (الصيدليات المُفعّلة فقط)
DROP POLICY IF EXISTS "pharmacies_select_active" ON public.pharmacies;
CREATE POLICY "pharmacies_select_active"
  ON public.pharmacies FOR SELECT
  USING (is_active = TRUE OR auth.uid() = owner_user_id);

-- تعديل: المالك أو الأدمن
DROP POLICY IF EXISTS "pharmacies_update_owner" ON public.pharmacies;
CREATE POLICY "pharmacies_update_owner"
  ON public.pharmacies FOR UPDATE
  USING (
    auth.uid() = owner_user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- إدراج: فقط الأدمن
DROP POLICY IF EXISTS "pharmacies_insert_admin" ON public.pharmacies;
CREATE POLICY "pharmacies_insert_admin"
  ON public.pharmacies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 2. كتالوج الأدوية الشامل (مرجع وطني) ───────────────────
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  name_ar TEXT NOT NULL,            -- "بنادول"
  name_en TEXT,                     -- "Panadol"
  generic_name TEXT,                -- "Paracetamol"
  manufacturer TEXT,                -- "GSK"
  country_of_origin TEXT,           -- "England"
  
  -- التصنيف
  category TEXT NOT NULL,
    -- 'analgesic', 'antibiotic', 'antihypertensive', 'antidiabetic',
    -- 'cardiac', 'respiratory', 'gastric', 'dermatological',
    -- 'vitamin', 'cosmetic', 'baby', 'first_aid', 'other'
  
  form TEXT,
    -- 'tablet', 'capsule', 'syrup', 'injection', 'ointment',
    -- 'drops', 'inhaler', 'suppository', 'patch'
  
  -- الجرعة
  strength TEXT,                    -- "500mg"
  unit_type TEXT,                   -- "tablet", "ml"
  package_size TEXT,                -- "20 قرص", "100 مل"
  
  -- المرجع
  requires_prescription BOOLEAN DEFAULT FALSE,
  is_controlled BOOLEAN DEFAULT FALSE,    -- مراقَب (مخدّرات/مهدئات)
  
  -- ملاحظات طبية
  side_effects TEXT,
  contraindications TEXT,
  storage_notes TEXT,
  
  -- الصورة
  image_url TEXT,
  
  -- البحث
  search_keywords TEXT[],           -- مرادفات للبحث الذكي
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_name_ar ON public.medications USING gin(to_tsvector('arabic', name_ar));
CREATE INDEX IF NOT EXISTS idx_medications_name_en ON public.medications(name_en);
CREATE INDEX IF NOT EXISTS idx_medications_generic ON public.medications(generic_name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON public.medications(category);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- قراءة: للجميع
DROP POLICY IF EXISTS "medications_select_all" ON public.medications;
CREATE POLICY "medications_select_all"
  ON public.medications FOR SELECT
  USING (TRUE);

-- إدراج/تعديل: فقط الأدمن
DROP POLICY IF EXISTS "medications_admin_only" ON public.medications;
CREATE POLICY "medications_admin_only"
  ON public.medications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 3. مخزون الصيدلية (الجدول الأهم!) ───────────────────────
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- التوفر (الأهم)
  is_available BOOLEAN DEFAULT TRUE,
  
  -- التفاصيل الخاصة بالصيدلية
  custom_price NUMERIC,             -- السعر في هذه الصيدلية (اختياري)
  brand_variant TEXT,               -- البديل المتوفر (مثلاً: "Panadol" أو "Tylenol")
  notes TEXT,                       -- "متوفر الكبير 50 قرص فقط"
  
  -- إحصائيات
  searched_count INTEGER DEFAULT 0,  -- كم مرة بحث عنه الناس
  last_searched_at TIMESTAMPTZ,
  
  -- التاريخ
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  marked_unavailable_at TIMESTAMPTZ,
  
  UNIQUE(pharmacy_id, medication_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON public.pharmacy_inventory(pharmacy_id, is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_medication ON public.pharmacy_inventory(medication_id, is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON public.pharmacy_inventory(is_available) WHERE is_available = TRUE;

ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;

-- قراءة: للجميع
DROP POLICY IF EXISTS "inventory_select_all" ON public.pharmacy_inventory;
CREATE POLICY "inventory_select_all"
  ON public.pharmacy_inventory FOR SELECT
  USING (TRUE);

-- تعديل: صاحب الصيدلية أو الأدمن
DROP POLICY IF EXISTS "inventory_update_owner" ON public.pharmacy_inventory;
CREATE POLICY "inventory_update_owner"
  ON public.pharmacy_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_id AND p.owner_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 4. سجل عمليات البحث (تحليلات) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.medication_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  city_filter TEXT,
  results_count INTEGER DEFAULT 0,
  found_any_available BOOLEAN DEFAULT FALSE,
  ip_country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_searches_query ON public.medication_searches(search_query);
CREATE INDEX IF NOT EXISTS idx_searches_unavailable
  ON public.medication_searches(created_at DESC)
  WHERE found_any_available = FALSE;

ALTER TABLE public.medication_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "searches_admin_select" ON public.medication_searches;
CREATE POLICY "searches_admin_select"
  ON public.medication_searches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "searches_insert_self" ON public.medication_searches;
CREATE POLICY "searches_insert_self"
  ON public.medication_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ─── 5. View: medications مع عدد الصيدليات المتوفر فيها ─────
CREATE OR REPLACE VIEW public.medications_with_availability AS
SELECT
  m.*,
  COUNT(DISTINCT pi.pharmacy_id) FILTER (WHERE pi.is_available = TRUE) as available_count,
  COUNT(DISTINCT pi.pharmacy_id) as total_pharmacies_count
FROM public.medications m
LEFT JOIN public.pharmacy_inventory pi ON pi.medication_id = m.id
GROUP BY m.id;

-- ─── 6. View: pharmacy_stats للصيدلاني ──────────────────────
CREATE OR REPLACE VIEW public.pharmacy_inventory_stats AS
SELECT
  p.id as pharmacy_id,
  p.name as pharmacy_name,
  COUNT(pi.id) as total_medications,
  COUNT(pi.id) FILTER (WHERE pi.is_available = TRUE) as available_medications,
  COUNT(pi.id) FILTER (WHERE pi.is_available = FALSE) as unavailable_medications,
  SUM(pi.searched_count) as total_searches
FROM public.pharmacies p
LEFT JOIN public.pharmacy_inventory pi ON pi.pharmacy_id = p.id
GROUP BY p.id, p.name;

-- ─── 7. تعليقات ──────────────────────────────────────────
COMMENT ON TABLE public.pharmacies IS
  'صيدليات Spir Medical - دليل بحث للأدوية (لا توصيل، إرشادي فقط)';

COMMENT ON TABLE public.medications IS
  'كتالوج وطني للأدوية - مرجع شامل لكل الصيدليات';

COMMENT ON TABLE public.pharmacy_inventory IS
  'مخزون كل صيدلية - يحدّده الصيدلاني نفسه (متوفر/غير متوفر)';

COMMENT ON COLUMN public.pharmacies.has_delivery IS
  'هذا الحقل للعرض فقط - لا يوجد توصيل حقيقي في النظام';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 22 applied: Pharmacy catalog system';
END $$;


-- ─── 24_doctors_hospitals_consultations.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🏥 Migration 24: Family Doctor + Hospitals + Consultations (V25.9)
-- ════════════════════════════════════════════════════════════════════
-- يُضيف 3 خدمات أساسية:
--   1. doctors           - أطباء العائلة + التخصصات
--   2. hospitals         - المستشفيات (حكومي/أهلي/مراكز صحية)
--   3. consultations     - الاستشارات النصية + الصور + تحويل التاريخ
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. جدول الأطباء (Family Doctor)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ربط بحساب الطبيب (لو مسجّل في النظام)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- بيانات شخصية
  full_name TEXT NOT NULL,
  full_name_en TEXT,
  title TEXT DEFAULT 'د.',          -- 'د.', 'بروفيسور', 'أ.د.'
  gender TEXT CHECK (gender IN ('male', 'female')),
  
  -- التخصص
  specialty TEXT NOT NULL,
    -- 'family_medicine' (طب عائلة)
    -- 'pediatrics' (أطفال)
    -- 'internal' (باطنية)
    -- 'cardiology' (قلبية)
    -- 'gynecology' (نسائية)
    -- 'orthopedics' (عظام)
    -- 'dermatology' (جلدية)
    -- 'psychiatry' (نفسية)
    -- 'general' (طب عام)
  sub_specialty TEXT,                -- التخصص الدقيق
  
  -- الخبرة والشهادات
  years_experience INTEGER DEFAULT 0,
  qualifications TEXT[],             -- ["بكالوريوس طب جامعة بغداد 2010", "بورد عربي 2015"]
  certifications_url TEXT,           -- ملف PDF للشهادات
  
  -- التوفّر
  available_for_home_visit BOOLEAN DEFAULT TRUE,
  available_for_video BOOLEAN DEFAULT TRUE,
  available_for_clinic BOOLEAN DEFAULT FALSE,
  
  -- التسعير
  home_visit_price NUMERIC DEFAULT 0,        -- زيارة منزلية واحدة
  video_consult_price NUMERIC DEFAULT 0,     -- استشارة فيديو
  monthly_subscription_price NUMERIC,        -- اشتراك شهري (طبيب عائلة)
  yearly_subscription_price NUMERIC,         -- اشتراك سنوي
  
  -- العيادة (لو موجودة)
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,
  clinic_lat NUMERIC,
  clinic_lng NUMERIC,
  
  -- اللغات
  languages TEXT[] DEFAULT ARRAY['ar'],
    -- 'ar', 'en', 'ku' (كردي), 'tr' (تركي)
  
  -- التقييمات
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- الوصف
  bio TEXT,                          -- نبذة شخصية
  avatar_url TEXT,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_city ON public.doctors(clinic_city);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON public.doctors(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON public.doctors(rating_avg DESC);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_select_active" ON public.doctors;
CREATE POLICY "doctors_select_active"
  ON public.doctors FOR SELECT
  USING (is_active = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "doctors_admin_manage" ON public.doctors;
CREATE POLICY "doctors_admin_manage"
  ON public.doctors FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR auth.uid() = user_id
  );

-- ─── اشتراكات طبيب العائلة ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),
  
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- إحصائيات
  visits_used INTEGER DEFAULT 0,
  consultations_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.doctor_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_doctor ON public.doctor_subscriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.doctor_subscriptions(status) WHERE status = 'active';

ALTER TABLE public.doctor_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_own" ON public.doctor_subscriptions;
CREATE POLICY "subscriptions_own"
  ON public.doctor_subscriptions FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ════════════════════════════════════════════════════════════════════
-- 2. جدول المستشفيات
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  name TEXT NOT NULL,
  name_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('government', 'private', 'health_center', 'specialized')),
    -- government: حكومي
    -- private: أهلي/خاص
    -- health_center: مركز صحي
    -- specialized: تخصصي (مثل مستشفى الأطفال)
  
  -- العنوان
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- التواصل
  phone TEXT,
  phone_emergency TEXT,        -- رقم الطوارئ
  whatsapp TEXT,
  website TEXT,
  email TEXT,
  
  -- ساعات العمل
  is_24h BOOLEAN DEFAULT FALSE,
  visiting_hours TEXT,         -- "10:00 - 12:00 مساءً"
  
  -- الأقسام والخدمات
  departments TEXT[],
    -- ['emergency', 'cardiology', 'pediatrics', 'maternity', 'surgery', 
    --  'orthopedics', 'oncology', 'icu', 'lab', 'radiology', 'pharmacy']
  
  has_emergency BOOLEAN DEFAULT FALSE,
  has_ambulance BOOLEAN DEFAULT FALSE,
  has_pharmacy BOOLEAN DEFAULT FALSE,
  has_lab BOOLEAN DEFAULT FALSE,
  has_radiology BOOLEAN DEFAULT FALSE,
  
  -- السعة
  beds_count INTEGER,
  icu_beds_count INTEGER,
  
  -- التقييمات
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- الصور والوصف
  cover_image_url TEXT,
  logo_url TEXT,
  description TEXT,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_city ON public.hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_type ON public.hospitals(type);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON public.hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON public.hospitals(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hospitals_emergency ON public.hospitals(has_emergency) WHERE has_emergency = TRUE;

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospitals_select_all" ON public.hospitals;
CREATE POLICY "hospitals_select_all"
  ON public.hospitals FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "hospitals_admin_manage" ON public.hospitals;
CREATE POLICY "hospitals_admin_manage"
  ON public.hospitals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ════════════════════════════════════════════════════════════════════
-- 3. جدول الاستشارات النصية
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الأطراف
  patient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    -- لو الطبيب مسجّل في النظام (أكثر دقّة)
  
  -- لمن الاستشارة (فرد عائلة أو نفسه)
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- نوع الاستشارة
  consultation_type TEXT NOT NULL DEFAULT 'chat' CHECK (consultation_type IN ('chat', 'asynchronous')),
    -- chat: محادثة مباشرة (سيتم تطويرها لاحقاً)
    -- asynchronous: المريض يرسل أسئلة + صور + الطبيب يرد لاحقاً
  
  -- الموضوع
  title TEXT NOT NULL,
  category TEXT,
    -- 'general', 'urgent', 'follow_up', 'second_opinion'
  
  -- التاريخ الطبي المُحوّل (الميزة الجديدة!)
  shared_medical_data JSONB,
    -- مثال:
    -- {
    --   "include_appointments": ["uuid1", "uuid2"],
    --   "include_lab_results": ["uuid3"],
    --   "include_prescriptions": ["uuid4"],
    --   "include_family_member_info": true,
    --   "shared_at": "2026-05-19T..."
    -- }
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awaiting_doctor', 'awaiting_patient', 'closed')),
  
  -- التسعير
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,     -- ضمن اشتراك أو مجاناً
  subscription_id UUID REFERENCES public.doctor_subscriptions(id),
  
  -- المواعيد
  expected_response_hours INTEGER DEFAULT 24,
  responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_participants" ON public.consultations;
CREATE POLICY "consultations_participants"
  ON public.consultations FOR ALL
  USING (
    auth.uid() = patient_user_id
    OR auth.uid() = doctor_user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── رسائل الاستشارة (نص + صور) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor', 'system')),
  
  -- المحتوى
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'medical_record', 'voice')),
  content TEXT,                      -- النص
  image_url TEXT,                    -- صورة (أشعة، نتيجة تحليل، صورة لمرض...)
  attached_record_id UUID,           -- ID لسجل طبي محوّل
  attached_record_type TEXT,         -- 'appointment', 'lab_result', 'prescription'
  
  -- الحالة
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation 
  ON public.consultation_messages(consultation_id, created_at);

ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultation_messages_participants" ON public.consultation_messages;
CREATE POLICY "consultation_messages_participants"
  ON public.consultation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
      AND (auth.uid() = c.patient_user_id OR auth.uid() = c.doctor_user_id)
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "consultation_messages_insert" ON public.consultation_messages;
CREATE POLICY "consultation_messages_insert"
  ON public.consultation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
      AND (auth.uid() = c.patient_user_id OR auth.uid() = c.doctor_user_id)
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- 4. View: الأطباء مع إحصائياتهم
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.doctors_with_stats AS
SELECT
  d.*,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscribers_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status != 'closed') as open_consultations_count
FROM public.doctors d
LEFT JOIN public.doctor_subscriptions s ON s.doctor_id = d.id
LEFT JOIN public.consultations c ON c.doctor_id = d.id
GROUP BY d.id;

-- ════════════════════════════════════════════════════════════════════
-- 5. تعليقات
-- ════════════════════════════════════════════════════════════════════
COMMENT ON TABLE public.doctors IS 'الأطباء - متخصصون لاستقبال الحجوزات والاستشارات';
COMMENT ON TABLE public.doctor_subscriptions IS 'اشتراكات طبيب العائلة (شهري/سنوي)';
COMMENT ON TABLE public.hospitals IS 'المستشفيات والمراكز الصحية - حكومي/أهلي/تخصصي';
COMMENT ON TABLE public.consultations IS 'الاستشارات الطبية النصّية';
COMMENT ON TABLE public.consultation_messages IS 'رسائل الاستشارة - نص + صور + تحويل سجلات';

COMMENT ON COLUMN public.consultations.shared_medical_data IS
  'البيانات الطبية التي شاركها المريض مع الطبيب (طلبات، نتائج، وصفات)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 24 applied: Doctors, Hospitals, Consultations';
END $$;


-- ─── 29_cosmetic_products.sql ───
-- ════════════════════════════════════════════════════════════════════
-- ✨ Migration 29: Cosmetic & Beauty Products (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- منتجات التجميل والعناية المُتوفّرة في الصيدليات
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- المعلومات الأساسية
  name TEXT NOT NULL,
  name_en TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'skincare',     -- العناية بالبشرة
    'haircare',     -- الشعر
    'makeup',       -- مكياج
    'fragrance',    -- عطور
    'supplements',  -- مكملات غذائية
    'bodycare',     -- العناية بالجسم
    'baby_care',    -- منتجات أطفال
    'mens_care'     -- منتجات رجالية
  )),

  -- السعر
  price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,

  -- التفاصيل
  description TEXT,
  ingredients TEXT,
  usage_instructions TEXT,

  -- الصورة
  image_url TEXT,
  image_emoji TEXT DEFAULT '🧴',

  -- المتاجر التي تبيعه
  available_at_pharmacies UUID[] DEFAULT ARRAY[]::UUID[],

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- المخزون
  is_in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,

  -- منشأ + توصيات
  country_of_origin TEXT,
  is_recommended BOOLEAN DEFAULT FALSE,    -- اختيار الموظفين
  recommendation_note TEXT,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_category ON public.cosmetic_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetic_active ON public.cosmetic_products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cosmetic_recommended ON public.cosmetic_products(is_recommended) WHERE is_recommended = TRUE;

ALTER TABLE public.cosmetic_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_read_all" ON public.cosmetic_products;
CREATE POLICY "cosmetic_read_all"
  ON public.cosmetic_products FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "cosmetic_admin_manage" ON public.cosmetic_products;
CREATE POLICY "cosmetic_admin_manage"
  ON public.cosmetic_products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── Seed data ───
INSERT INTO public.cosmetic_products (name, name_en, brand, category, price, image_emoji, country_of_origin, is_recommended) VALUES
('كريم ترطيب للوجه', 'Moisturizing Face Cream', 'Eucerin', 'skincare', 25000, '🧴', 'Germany', true),
('سيروم فيتامين C', 'Vitamin C Serum', 'CeraVe', 'skincare', 35000, '💧', 'USA', true),
('شامبو ضد القشرة', 'Anti-Dandruff Shampoo', 'Head & Shoulders', 'haircare', 12000, '🧴', 'USA', false),
('غسول للوجه', 'Foaming Face Wash', 'Cetaphil', 'skincare', 18000, '🧼', 'France', true),
('واقي شمس', 'Sun Protection SPF50', 'La Roche-Posay', 'skincare', 32000, '☀️', 'France', true),
('كريم الأطفال', 'Baby Cream', 'Bepanthen', 'baby_care', 15000, '👶', 'Germany', true),
('فيتامين د3 1000', 'Vitamin D3 1000IU', 'Nature Made', 'supplements', 22000, '💊', 'USA', false),
('عطر رجالي', 'Cool Water Cologne', 'Davidoff', 'fragrance', 85000, '🌸', 'Germany', false),
('شامبو للشعر الدهني', 'Oily Hair Shampoo', 'Vichy', 'haircare', 28000, '🧴', 'France', false),
('كريم ليلي مضاد للتجاعيد', 'Anti-Aging Night Cream', 'Olay', 'skincare', 45000, '🌙', 'USA', true),
('روج أحمر', 'Matte Red Lipstick', 'MAC', 'makeup', 38000, '💄', 'USA', false),
('بلسم للشفاه', 'Lip Balm', 'Vaseline', 'skincare', 5000, '👄', 'USA', true),
('زيت للشعر', 'Hair Oil', 'L''Oreal', 'haircare', 18000, '✨', 'France', false),
('غسول مهبلي', 'Intimate Wash', 'Lactacyd', 'bodycare', 14000, '🌸', 'Belgium', false),
('كريم اليدين', 'Hand Cream', 'Neutrogena', 'skincare', 12000, '🤲', 'USA', true),
('كولاجين شراب', 'Collagen Drink', 'Skinade', 'supplements', 95000, '🥤', 'UK', false),
('شعر اصطناعي', 'Hair Mask', 'Garnier', 'haircare', 16000, '💆', 'France', false),
('عطر نسائي', 'Eau de Parfum', 'Chanel', 'fragrance', 320000, '🌺', 'France', true),
('مزيل عرق', 'Antiperspirant', 'Dove', 'bodycare', 8000, '🧴', 'UK', false),
('مكواة شعر', 'Hair Straightener', 'Babyliss', 'haircare', 75000, '✨', 'France', false);

COMMENT ON TABLE public.cosmetic_products IS 'منتجات التجميل والعناية المتوفرة في الصيدليات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 29 applied: Cosmetic Products + 20 seed';
END $$;


-- ─── 32_physio_service.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🦾 Migration 32: Physiotherapy Service (V25.14)
-- ════════════════════════════════════════════════════════════════════
-- خدمة العلاج الفيزيائي:
--   - أنواع العلاج (إعادة تأهيل، رياضي، أطفال، إلخ)
--   - الأخصائيون
--   - جلسات وخطط علاج
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أنواع العلاج الفيزيائي ───
CREATE TABLE IF NOT EXISTS public.physio_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  icon TEXT DEFAULT '🦾',
  base_price NUMERIC NOT NULL DEFAULT 25000,
  session_duration_minutes INTEGER DEFAULT 45,
  recommended_sessions INTEGER DEFAULT 6,
  conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.physio_service_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_types_public" ON public.physio_service_types;
CREATE POLICY "physio_types_public"
  ON public.physio_service_types FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "physio_types_admin" ON public.physio_service_types;
CREATE POLICY "physio_types_admin"
  ON public.physio_service_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 2. الأخصائيون ───
CREATE TABLE IF NOT EXISTS public.physio_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'د.',
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar']::TEXT[],

  -- التواجد
  cities TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأسعار
  home_visit_price NUMERIC DEFAULT 30000,
  clinic_visit_price NUMERIC DEFAULT 20000,
  package_discount_pct INTEGER DEFAULT 10,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  available_for_home BOOLEAN DEFAULT TRUE,
  available_for_clinic BOOLEAN DEFAULT FALSE,

  -- العيادة (لو موجودة)
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_physio_active ON public.physio_specialists(is_active, rating_avg DESC);

ALTER TABLE public.physio_specialists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_specialists_public" ON public.physio_specialists;
CREATE POLICY "physio_specialists_public"
  ON public.physio_specialists FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "physio_specialists_admin" ON public.physio_specialists;
CREATE POLICY "physio_specialists_admin"
  ON public.physio_specialists FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── Seed: أنواع العلاج الفيزيائي ───
INSERT INTO public.physio_service_types (slug, name_ar, description, icon, base_price, session_duration_minutes, recommended_sessions, conditions, order_index) VALUES
  ('rehab',
   'إعادة التأهيل العام',
   'علاج فيزيائي بعد العمليات أو الإصابات لاستعادة الوظائف الحركية',
   '🦾',
   30000, 45, 8,
   ARRAY['آلام الظهر', 'بعد العمليات الجراحية', 'إصابات العضلات', 'ضعف عام'],
   1),

  ('sports',
   'العلاج الرياضي',
   'علاج إصابات الرياضيين وتحسين الأداء البدني',
   '⚽',
   35000, 60, 10,
   ARRAY['إصابات الملاعب', 'تمزق العضلات', 'التواء المفاصل', 'تأهيل بعد الإصابة'],
   2),

  ('pediatric',
   'علاج الأطفال',
   'علاج فيزيائي مخصّص للأطفال - تأخر النمو، الشلل الدماغي، إصابات',
   '👶',
   40000, 45, 12,
   ARRAY['الشلل الدماغي', 'تأخر النمو الحركي', 'مشاكل المشي عند الأطفال', 'تشوهات القدم'],
   3),

  ('geriatric',
   'علاج كبار السن',
   'علاج فيزيائي مخصّص لكبار السن لتحسين الحركة والاستقلالية',
   '👴',
   25000, 45, 8,
   ARRAY['هشاشة العظام', 'آلام المفاصل', 'صعوبة المشي', 'بعد الجلطات'],
   4),

  ('neurological',
   'علاج الأعصاب',
   'تأهيل بعد السكتات الدماغية أو إصابات الجهاز العصبي',
   '🧠',
   45000, 60, 16,
   ARRAY['بعد الجلطات الدماغية', 'إصابات الحبل الشوكي', 'الشلل النصفي', 'التصلب اللويحي'],
   5),

  ('orthopedic',
   'علاج العظام والمفاصل',
   'علاج آلام العظام والمفاصل والعمود الفقري',
   '🦴',
   30000, 45, 8,
   ARRAY['آلام الرقبة', 'الانزلاق الغضروفي', 'خشونة المفاصل', 'تمزق الأربطة'],
   6),

  ('post_surgery',
   'بعد العمليات الجراحية',
   'تأهيل ما بعد العمليات الجراحية - استبدال مفصل، عمليات الظهر، إلخ',
   '🏥',
   35000, 45, 10,
   ARRAY['استبدال مفصل الركبة', 'استبدال مفصل الورك', 'عمليات الظهر', 'كسور معقدة'],
   7),

  ('respiratory',
   'العلاج التنفسي',
   'تأهيل وظائف الرئة والجهاز التنفسي',
   '💨',
   30000, 45, 6,
   ARRAY['ما بعد كوفيد-19', 'الربو المزمن', 'انسداد الرئة', 'بعد عمليات الصدر'],
   8)

ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: أخصائيون افتراضيون ───
INSERT INTO public.physio_specialists (
  full_name, title, gender, bio, years_experience,
  specialties, certifications, languages, cities,
  home_visit_price, clinic_visit_price, rating_avg, rating_count, total_sessions,
  is_active, is_verified, available_for_home, available_for_clinic,
  clinic_name, clinic_city
) VALUES
  ('أحمد الكاظمي', 'د.', 'male',
   'أخصائي علاج فيزيائي بخبرة 12 سنة في إعادة التأهيل الرياضي والعصبي',
   12,
   ARRAY['rehab', 'sports', 'orthopedic'],
   ARRAY['DPT - الجامعة المستنصرية', 'شهادة تأهيل رياضي معتمد', 'دورة Mulligan'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'كربلاء'],
   35000, 25000, 4.8, 142, 1850,
   TRUE, TRUE, TRUE, TRUE,
   'عيادة الكاظمي للعلاج الفيزيائي', 'بغداد'),

  ('سارة الموسوي', 'د.', 'female',
   'أخصائية علاج فيزيائي للأطفال وذوي الاحتياجات الخاصة',
   8,
   ARRAY['pediatric', 'neurological'],
   ARRAY['DPT - جامعة بغداد', 'شهادة Bobath للأطفال'],
   ARRAY['ar'],
   ARRAY['بغداد', 'النجف'],
   40000, 30000, 4.9, 89, 920,
   TRUE, TRUE, TRUE, FALSE,
   NULL, NULL),

  ('علي حسن', 'د.', 'male',
   'متخصص في تأهيل كبار السن وعلاج آلام المفاصل',
   15,
   ARRAY['geriatric', 'orthopedic'],
   ARRAY['DPT - جامعة بغداد', 'دبلوم تأهيل كبار السن'],
   ARRAY['ar'],
   ARRAY['البصرة', 'بغداد'],
   30000, NULL, 4.7, 215, 2400,
   TRUE, TRUE, TRUE, FALSE,
   NULL, NULL),

  ('فاطمة العزاوي', 'د.', 'female',
   'أخصائية تأهيل بعد العمليات الجراحية والعلاج التنفسي',
   10,
   ARRAY['post_surgery', 'respiratory', 'rehab'],
   ARRAY['DPT - الجامعة المستنصرية', 'شهادة Cardiopulmonary'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد'],
   38000, 28000, 4.9, 167, 1620,
   TRUE, TRUE, TRUE, TRUE,
   'مركز سعد للعلاج الفيزيائي', 'بغداد'),

  ('حسين الزبيدي', 'د.', 'male',
   'أخصائي علاج فيزيائي رياضي - يعمل مع لاعبي محترفين',
   7,
   ARRAY['sports', 'orthopedic'],
   ARRAY['DPT - جامعة بغداد', 'شهادة FIFA Football Medicine'],
   ARRAY['ar', 'en'],
   ARRAY['أربيل', 'الموصل'],
   42000, 32000, 4.8, 98, 1100,
   TRUE, TRUE, TRUE, TRUE,
   'عيادة الرياضة الحديثة', 'أربيل')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.physio_service_types IS 'أنواع العلاج الفيزيائي';
COMMENT ON TABLE public.physio_specialists IS 'أخصائيو العلاج الفيزيائي';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 32 applied: Physiotherapy Service';
  RAISE NOTICE '   - 8 service types seeded';
  RAISE NOTICE '   - 5 specialists seeded';
END $$;


-- ─── 33_new_services.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🆕 Migration 33: New Services (V25.19)
-- ════════════════════════════════════════════════════════════════════
-- 4 خدمات جديدة:
--   1. 🦷 Dentistry (طب الأسنان)
--   2. 👓 Eyewear (النظارات الطبية)
--   3. 🧠 Mental Health (العلاج النفسي)
--   4. 🥗 Nutrition (التغذية والحمية)
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 🦷 1. DENTISTRY
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dental_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  latitude NUMERIC,
  longitude NUMERIC,

  -- التخصصات
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأطباء
  doctor_count INTEGER DEFAULT 1,
  doctor_names TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأسعار (مدى من-إلى)
  cleaning_price_min NUMERIC DEFAULT 15000,
  cleaning_price_max NUMERIC DEFAULT 30000,
  filling_price_min NUMERIC DEFAULT 20000,
  filling_price_max NUMERIC DEFAULT 50000,
  extraction_price_min NUMERIC DEFAULT 25000,
  extraction_price_max NUMERIC DEFAULT 75000,
  implant_price_min NUMERIC DEFAULT 500000,
  implant_price_max NUMERIC DEFAULT 1500000,

  -- الخدمات
  offers_cleaning BOOLEAN DEFAULT TRUE,
  offers_fillings BOOLEAN DEFAULT TRUE,
  offers_extraction BOOLEAN DEFAULT TRUE,
  offers_implants BOOLEAN DEFAULT FALSE,
  offers_orthodontics BOOLEAN DEFAULT FALSE,
  offers_whitening BOOLEAN DEFAULT FALSE,
  offers_cosmetic BOOLEAN DEFAULT FALSE,
  offers_pediatric BOOLEAN DEFAULT FALSE,
  offers_emergency BOOLEAN DEFAULT FALSE,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  insurance_providers TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- ساعات العمل
  working_hours TEXT,
  is_open_24h BOOLEAN DEFAULT FALSE,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dental_active ON public.dental_clinics(is_active, city, rating_avg DESC);

ALTER TABLE public.dental_clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_public" ON public.dental_clinics;
CREATE POLICY "dental_public"
  ON public.dental_clinics FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "dental_admin" ON public.dental_clinics;
CREATE POLICY "dental_admin"
  ON public.dental_clinics FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 👓 2. EYEWEAR
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.optical_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  latitude NUMERIC,
  longitude NUMERIC,

  -- الخدمات
  offers_eye_exam BOOLEAN DEFAULT TRUE,
  exam_price NUMERIC DEFAULT 10000,
  offers_prescription_lenses BOOLEAN DEFAULT TRUE,
  offers_sunglasses BOOLEAN DEFAULT TRUE,
  offers_contact_lenses BOOLEAN DEFAULT FALSE,
  offers_eye_surgery_referral BOOLEAN DEFAULT FALSE,

  -- العلامات التجارية
  brands TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأسعار (الإطارات)
  frame_price_min NUMERIC DEFAULT 25000,
  frame_price_max NUMERIC DEFAULT 500000,
  lens_price_min NUMERIC DEFAULT 30000,
  lens_price_max NUMERIC DEFAULT 200000,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  working_hours TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_optical_active ON public.optical_stores(is_active, city, rating_avg DESC);

ALTER TABLE public.optical_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optical_public" ON public.optical_stores;
CREATE POLICY "optical_public"
  ON public.optical_stores FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "optical_admin" ON public.optical_stores;
CREATE POLICY "optical_admin"
  ON public.optical_stores FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 🧠 3. MENTAL HEALTH
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.mental_health_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'د.',
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,

  -- النوع
  specialist_type TEXT NOT NULL CHECK (specialist_type IN (
    'psychiatrist',         -- طبيب نفسي (يصف أدوية)
    'psychologist',         -- أخصائي نفسي
    'therapist',            -- معالج نفسي
    'counselor',            -- مرشد نفسي
    'family_therapist'      -- معالج عائلي
  )),

  -- التخصصات
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- ex: 'anxiety', 'depression', 'ocd', 'trauma', 'couples', 'children', 'addiction'

  -- المؤهلات
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar']::TEXT[],

  -- التوافر
  cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_online BOOLEAN DEFAULT TRUE,
  available_in_clinic BOOLEAN DEFAULT TRUE,

  -- الأسعار
  online_session_price NUMERIC DEFAULT 50000,
  clinic_session_price NUMERIC DEFAULT 75000,
  session_duration_minutes INTEGER DEFAULT 50,

  -- العيادة
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  accepts_emergency BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mental_active ON public.mental_health_specialists(is_active, specialist_type, rating_avg DESC);

ALTER TABLE public.mental_health_specialists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_public" ON public.mental_health_specialists;
CREATE POLICY "mental_public"
  ON public.mental_health_specialists FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "mental_admin" ON public.mental_health_specialists;
CREATE POLICY "mental_admin"
  ON public.mental_health_specialists FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 🥗 4. NUTRITION
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.nutritionists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'د.',
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,

  -- التخصصات
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- ex: 'weight_loss', 'weight_gain', 'sports_nutrition',
  --     'diabetes', 'pcos', 'pregnancy', 'pediatric', 'eating_disorders'

  -- المؤهلات
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar']::TEXT[],

  -- التوافر
  cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_online BOOLEAN DEFAULT TRUE,
  available_in_clinic BOOLEAN DEFAULT TRUE,

  -- الأسعار (3 باقات)
  initial_consultation_price NUMERIC DEFAULT 30000,
  follow_up_price NUMERIC DEFAULT 15000,
  monthly_plan_price NUMERIC DEFAULT 100000,

  -- العيادة
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 0, -- نسبة النجاح %

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_active ON public.nutritionists(is_active, rating_avg DESC);

ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutrition_public" ON public.nutritionists;
CREATE POLICY "nutrition_public"
  ON public.nutritionists FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "nutrition_admin" ON public.nutritionists;
CREATE POLICY "nutrition_admin"
  ON public.nutritionists FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 🌱 SEED DATA
-- ════════════════════════════════════════════════════════════════════

-- ─── 🦷 Dental Clinics ───
INSERT INTO public.dental_clinics (
  name, description, city, district, address, phone,
  specialties, doctor_count, doctor_names,
  cleaning_price_min, cleaning_price_max,
  filling_price_min, filling_price_max,
  implant_price_min, implant_price_max,
  offers_implants, offers_orthodontics, offers_whitening, offers_cosmetic, offers_pediatric,
  rating_avg, rating_count, is_verified, is_featured,
  working_hours
) VALUES
  ('عيادة الابتسامة الذهبية',
   'عيادة متكاملة لكل احتياجات طب الأسنان - تقويم + تجميل + زراعة',
   'بغداد', 'الكرادة', 'الكرادة - شارع 62',
   '+9647707000001',
   ARRAY['تقويم', 'تجميل', 'زراعة', 'تبييض'],
   3, ARRAY['د. أحمد الزبيدي', 'د. سارة العزاوي', 'د. علي السامرائي'],
   20000, 30000,
   30000, 60000,
   600000, 1200000,
   TRUE, TRUE, TRUE, TRUE, TRUE,
   4.8, 234, TRUE, TRUE,
   'يومياً من 9 ص إلى 9 م'),

  ('مركز اللؤلؤة لطب الأسنان',
   'متخصصون في الزراعة وطب الأسنان التجميلي',
   'البصرة', 'المعقل', 'المعقل - شارع الميناء',
   '+9647807000002',
   ARRAY['زراعة', 'تجميل', 'علاج عصب'],
   2, ARRAY['د. حسن البصري', 'د. زينب الجبوري'],
   15000, 25000,
   25000, 55000,
   500000, 1100000,
   TRUE, FALSE, TRUE, TRUE, FALSE,
   4.7, 156, TRUE, FALSE,
   'السبت-الخميس 10 ص - 8 م'),

  ('عيادة الأطفال للأسنان',
   'متخصصة في أسنان الأطفال - بيئة مريحة وممتعة للأطفال',
   'بغداد', 'المنصور', 'المنصور - شارع 14 رمضان',
   '+9647707000003',
   ARRAY['أطفال', 'تقويم', 'وقاية'],
   2, ARRAY['د. فاطمة الكاظمي', 'د. مريم الحسيني'],
   15000, 20000,
   20000, 40000,
   0, 0,
   FALSE, TRUE, FALSE, FALSE, TRUE,
   4.9, 312, TRUE, TRUE,
   'يومياً 9 ص - 6 م'),

  ('مركز المهارة الطبي للأسنان',
   'الرائدون في تقويم الأسنان والشفّاف Invisalign',
   'أربيل', 'عينكاوا', 'عينكاوا - الشارع الرئيسي',
   '+9647507000004',
   ARRAY['تقويم', 'Invisalign', 'تبييض', 'فينير'],
   4, ARRAY['د. هيوا أحمد', 'د. شاهين رشيد'],
   25000, 35000,
   35000, 70000,
   700000, 1500000,
   TRUE, TRUE, TRUE, TRUE, FALSE,
   4.9, 198, TRUE, TRUE,
   'يومياً 10 ص - 9 م'),

  ('عيادة النجف الحديثة',
   'أحدث تقنيات طب الأسنان بأسعار مناسبة',
   'النجف', 'حي السعد', 'حي السعد - شارع المدرسة',
   '+9647807000005',
   ARRAY['عام', 'حشوات', 'علاج عصب'],
   2, ARRAY['د. كاظم الحلو', 'د. ليلى السيد'],
   12000, 18000,
   18000, 35000,
   0, 0,
   FALSE, FALSE, TRUE, FALSE, TRUE,
   4.5, 87, TRUE, FALSE,
   'السبت-الخميس 9 ص - 8 م')
ON CONFLICT DO NOTHING;

-- ─── 👓 Optical Stores ───
INSERT INTO public.optical_stores (
  name, description, city, district, address, phone,
  brands, exam_price,
  frame_price_min, frame_price_max,
  lens_price_min, lens_price_max,
  offers_contact_lenses, offers_eye_exam,
  rating_avg, rating_count, is_verified, is_featured,
  working_hours
) VALUES
  ('نظارات الرؤية الواضحة',
   'وكلاء حصريّون لـ Ray-Ban و Oakley في العراق',
   'بغداد', 'المنصور', 'المنصور - شارع 14 رمضان',
   '+9647707000010',
   ARRAY['Ray-Ban', 'Oakley', 'Tom Ford', 'Gucci'],
   10000, 50000, 800000, 40000, 250000,
   TRUE, TRUE,
   4.7, 142, TRUE, TRUE,
   'يومياً 10 ص - 10 م'),

  ('بصريات الكوفي',
   'أكبر سلسلة نظارات في العراق - 5 فروع',
   'بغداد', 'الكرادة', 'فرع الكرادة',
   '+9647707000011',
   ARRAY['Police', 'Carrera', 'Persol', 'محلية'],
   8000, 25000, 500000, 30000, 180000,
   TRUE, TRUE,
   4.5, 287, TRUE, TRUE,
   'يومياً 9 ص - 9 م'),

  ('Optical Vision البصرة',
   'أحدث الموديلات والعلامات العالمية',
   'البصرة', 'الجزائر', 'شارع الجزائر',
   '+9647807000012',
   ARRAY['Ray-Ban', 'Persol', 'Lacoste'],
   12000, 60000, 600000, 35000, 200000,
   TRUE, TRUE,
   4.6, 98, TRUE, FALSE,
   'السبت-الخميس 9 ص - 9 م'),

  ('بصريات النجف',
   'نظارات طبية وشمسية بأسعار مناسبة',
   'النجف', 'مركز المدينة', 'شارع الرسول',
   '+9647807000013',
   ARRAY['محلية', 'صينية', 'تركية'],
   5000, 20000, 200000, 20000, 100000,
   FALSE, TRUE,
   4.3, 67, TRUE, FALSE,
   'يومياً 9 ص - 8 م'),

  ('Eye Care أربيل',
   'متخصصون في فحوصات النظر والعدسات اللاصقة',
   'أربيل', 'إنكاوا', 'إنكاوا - شارع 60',
   '+9647507000014',
   ARRAY['Acuvue', 'Bausch + Lomb', 'Persol'],
   15000, 80000, 700000, 45000, 280000,
   TRUE, TRUE,
   4.8, 121, TRUE, TRUE,
   'يومياً 10 ص - 10 م')
ON CONFLICT DO NOTHING;

-- ─── 🧠 Mental Health Specialists ───
INSERT INTO public.mental_health_specialists (
  full_name, title, gender, bio, years_experience,
  specialist_type, specialties, certifications, languages, cities,
  available_online, available_in_clinic,
  online_session_price, clinic_session_price,
  rating_avg, rating_count, total_sessions,
  is_active, is_verified, accepts_emergency,
  clinic_name, clinic_city
) VALUES
  ('د. مهند العبيدي', 'د.', 'male',
   'طبيب نفسي بخبرة 15 سنة - متخصص في علاج القلق والاكتئاب',
   15, 'psychiatrist',
   ARRAY['anxiety', 'depression', 'ocd', 'bipolar'],
   ARRAY['MD - جامعة بغداد', 'دبلوم الطب النفسي', 'CBT certified'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   60000, 80000,
   4.9, 245, 2400,
   TRUE, TRUE, FALSE,
   'مركز الصفاء النفسي', 'بغداد'),

  ('أ. هدى الجبوري', 'أ.', 'female',
   'أخصائية نفسية - متخصصة في علاج اضطرابات الأكل والقلق لدى النساء',
   10, 'psychologist',
   ARRAY['eating_disorders', 'anxiety', 'trauma', 'women_health'],
   ARRAY['MSc Clinical Psychology', 'EMDR certified'],
   ARRAY['ar'],
   ARRAY['بغداد', 'كربلاء'],
   TRUE, TRUE,
   45000, 65000,
   4.8, 187, 1800,
   TRUE, TRUE, FALSE,
   NULL, NULL),

  ('د. أحمد الكاظمي', 'د.', 'male',
   'معالج عائلي وزواجي - متخصص في العلاقات والتواصل الزوجي',
   12, 'family_therapist',
   ARRAY['couples', 'family', 'parenting', 'communication'],
   ARRAY['PhD Marriage & Family Therapy', 'Gottman trained'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'البصرة'],
   TRUE, TRUE,
   55000, 75000,
   4.9, 156, 1450,
   TRUE, TRUE, FALSE,
   'عيادة العائلة', 'بغداد'),

  ('أ. ريم الموسوي', 'أ.', 'female',
   'مستشارة نفسية للأطفال والمراهقين - 8 سنوات خبرة',
   8, 'counselor',
   ARRAY['children', 'adolescents', 'school_issues', 'adhd'],
   ARRAY['MA Child Psychology', 'Play Therapy certified'],
   ARRAY['ar'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   40000, 55000,
   4.7, 134, 1200,
   TRUE, TRUE, FALSE,
   NULL, NULL),

  ('د. كرار الزبيدي', 'د.', 'male',
   'معالج إدمان وطبيب نفسي - متخصص في الإقلاع عن المخدرات والكحول',
   18, 'psychiatrist',
   ARRAY['addiction', 'depression', 'anxiety'],
   ARRAY['MD - الجامعة المستنصرية', 'Addiction Medicine certified'],
   ARRAY['ar'],
   ARRAY['بغداد', 'النجف'],
   TRUE, TRUE,
   70000, 100000,
   4.9, 89, 1620,
   TRUE, TRUE, TRUE,
   'مركز الأمل للتأهيل', 'بغداد')
ON CONFLICT DO NOTHING;

-- ─── 🥗 Nutritionists ───
INSERT INTO public.nutritionists (
  full_name, title, gender, bio, years_experience,
  specialties, certifications, languages, cities,
  available_online, available_in_clinic,
  initial_consultation_price, follow_up_price, monthly_plan_price,
  rating_avg, rating_count, total_clients, success_rate,
  is_active, is_verified,
  clinic_name, clinic_city
) VALUES
  ('أ. زينب السامرائي', 'أ.', 'female',
   'أخصائية تغذية - متخصصة في إنقاص الوزن لدى النساء و PCOS',
   8,
   ARRAY['weight_loss', 'pcos', 'pregnancy', 'women_health'],
   ARRAY['BSc Nutrition', 'PCOS Coach certified'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'كربلاء'],
   TRUE, TRUE,
   35000, 20000, 120000,
   4.8, 312, 850, 87,
   TRUE, TRUE,
   'عيادة التغذية الصحية', 'بغداد'),

  ('د. علي الحسني', 'د.', 'male',
   'دكتور تغذية رياضية - أعمل مع رياضيين محترفين',
   10,
   ARRAY['sports_nutrition', 'weight_gain', 'muscle_building'],
   ARRAY['MSc Sports Nutrition', 'ISSN certified'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'أربيل'],
   TRUE, TRUE,
   45000, 25000, 150000,
   4.9, 234, 620, 92,
   TRUE, TRUE,
   'مركز الأداء الرياضي', 'بغداد'),

  ('أ. ساره الكاظمي', 'أ.', 'female',
   'أخصائية تغذية الأطفال والرضع - 7 سنوات خبرة',
   7,
   ARRAY['pediatric', 'pregnancy', 'breastfeeding'],
   ARRAY['BSc Nutrition', 'Pediatric Nutrition specialist'],
   ARRAY['ar'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   30000, 18000, 100000,
   4.9, 198, 540, 95,
   TRUE, TRUE,
   NULL, NULL),

  ('د. حسن المالكي', 'د.', 'male',
   'متخصص في إدارة السكري وأمراض القلب عبر التغذية',
   12,
   ARRAY['diabetes', 'cardiovascular', 'weight_loss'],
   ARRAY['PhD Nutrition Sciences', 'Certified Diabetes Educator'],
   ARRAY['ar', 'en'],
   ARRAY['البصرة', 'بغداد'],
   TRUE, TRUE,
   50000, 28000, 180000,
   4.8, 167, 720, 89,
   TRUE, TRUE,
   'عيادة الأيض', 'البصرة'),

  ('أ. مريم الأنصاري', 'أ.', 'female',
   'متخصصة في علاج اضطرابات الأكل واستعادة العلاقة الصحية بالطعام',
   6,
   ARRAY['eating_disorders', 'weight_loss', 'mental_health_nutrition'],
   ARRAY['MSc Clinical Nutrition', 'Eating Disorders specialist'],
   ARRAY['ar'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   40000, 22000, 130000,
   4.9, 89, 320, 91,
   TRUE, TRUE,
   NULL, NULL)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.dental_clinics IS 'عيادات الأسنان';
COMMENT ON TABLE public.optical_stores IS 'متاجر النظارات الطبية';
COMMENT ON TABLE public.mental_health_specialists IS 'أخصائيو الصحة النفسية';
COMMENT ON TABLE public.nutritionists IS 'أخصائيو التغذية';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 33 applied: 4 new services';
  RAISE NOTICE '   - 🦷 5 عيادات أسنان';
  RAISE NOTICE '   - 👓 5 متاجر نظارات';
  RAISE NOTICE '   - 🧠 5 أخصائيو صحة نفسية';
  RAISE NOTICE '   - 🥗 5 أخصائيو تغذية';
END $$;


-- ─── 45_vaccines_service_v50.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 45: Vaccines Service (V25.50)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. vaccines (الكتالوج)
--   2. vaccine_clinics (مراكز التطعيم)
--   3. vaccination_records (سجل تطعيمات المريض)
--   4. vaccine_appointments (مواعيد اللقاحات)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. VACCINES Catalog ───
CREATE TABLE IF NOT EXISTS public.vaccines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المعلومات الأساسية
  name_ar           TEXT NOT NULL,
  name_en           TEXT,
  manufacturer      TEXT,
  
  -- الفئة
  category          TEXT NOT NULL CHECK (category IN (
    'pediatric',          -- لقاحات الأطفال (الجدول الوطني)
    'adult',              -- لقاحات البالغين (إنفلونزا، تيتانوس...)
    'travel',             -- لقاحات السفر (حمى صفراء، كوليرا...)
    'covid',              -- كوفيد
    'seasonal',           -- موسمية
    'optional'            -- اختيارية
  )),
  
  -- الأمراض المستهدفة
  diseases          TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- e.g. ['الحصبة', 'النكاف', 'الحصبة الألمانية']
  
  -- الجرعات
  doses_required    INTEGER NOT NULL DEFAULT 1,
  dose_interval_days INTEGER,  -- الفترة بين الجرعات
  recommended_age_months INTEGER,  -- العمر الموصى به (للأطفال)
  recommended_age_months_max INTEGER,  -- العمر الأقصى
  
  -- السعر
  price             NUMERIC NOT NULL DEFAULT 0,
  is_free           BOOLEAN DEFAULT FALSE,  -- لقاح حكومي مجاني
  
  -- الوصف
  description       TEXT,
  side_effects      TEXT,
  contraindications TEXT,
  
  -- الصورة
  icon              TEXT DEFAULT '💉',
  image_url         TEXT,
  
  -- التصنيف
  is_mandatory      BOOLEAN DEFAULT FALSE,  -- إلزامي حكومياً
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  display_order     INTEGER DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccines_category ON public.vaccines(category);
CREATE INDEX IF NOT EXISTS idx_vaccines_age ON public.vaccines(recommended_age_months);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccines_public_read" ON public.vaccines;
CREATE POLICY "vaccines_public_read"
  ON public.vaccines FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "vaccines_admin_all" ON public.vaccines;
CREATE POLICY "vaccines_admin_all"
  ON public.vaccines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. VACCINE CLINICS ───
CREATE TABLE IF NOT EXISTS public.vaccine_clinics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('government', 'private', 'mobile')),
  
  -- الموقع
  city              TEXT NOT NULL,
  district          TEXT,
  address           TEXT,
  latitude          NUMERIC,
  longitude         NUMERIC,
  
  -- الاتصال
  phone             TEXT,
  whatsapp          TEXT,
  
  -- ساعات العمل
  opens_at          TEXT DEFAULT '08:00',
  closes_at         TEXT DEFAULT '14:00',
  works_friday      BOOLEAN DEFAULT FALSE,
  
  -- الخدمات
  offers_pediatric  BOOLEAN DEFAULT TRUE,
  offers_adult      BOOLEAN DEFAULT TRUE,
  offers_travel     BOOLEAN DEFAULT FALSE,
  offers_covid      BOOLEAN DEFAULT TRUE,
  offers_home_visit BOOLEAN DEFAULT FALSE,
  home_visit_price  NUMERIC DEFAULT 25000,
  
  -- التقييم
  rating_avg        NUMERIC DEFAULT 0,
  rating_count      INTEGER DEFAULT 0,
  
  -- الحالة
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccine_clinics_city ON public.vaccine_clinics(city);

ALTER TABLE public.vaccine_clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccine_clinics_public_read" ON public.vaccine_clinics;
CREATE POLICY "vaccine_clinics_public_read"
  ON public.vaccine_clinics FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "vaccine_clinics_admin_all" ON public.vaccine_clinics;
CREATE POLICY "vaccine_clinics_admin_all"
  ON public.vaccine_clinics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. VACCINATION RECORDS ───
-- سجل تطعيمات المريض (والعائلة)
CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  vaccine_id        UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  
  -- معلومات الجرعة
  dose_number       INTEGER NOT NULL DEFAULT 1,
  administered_at   TIMESTAMPTZ NOT NULL,
  administered_by   TEXT,  -- اسم الطبيب/الممرض
  clinic_id         UUID REFERENCES public.vaccine_clinics(id) ON DELETE SET NULL,
  clinic_name       TEXT,
  
  -- معلومات إضافية
  batch_number      TEXT,
  expiry_date       DATE,
  
  -- آثار جانبية
  side_effects      TEXT,
  
  -- شهادة التطعيم
  certificate_url   TEXT,
  
  -- ملاحظات
  notes             TEXT,
  
  -- مصدر التسجيل
  source            TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'appointment', 'imported')),
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, vaccine_id, dose_number, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_vaccination_records_user ON public.vaccination_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_vaccine ON public.vaccination_records(vaccine_id);

ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccination_records_user_all" ON public.vaccination_records;
CREATE POLICY "vaccination_records_user_all"
  ON public.vaccination_records FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "vaccination_records_admin_read" ON public.vaccination_records;
CREATE POLICY "vaccination_records_admin_read"
  ON public.vaccination_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. أعمدة في appointments للقاحات ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS vaccine_id UUID REFERENCES public.vaccines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vaccine_clinic_id UUID REFERENCES public.vaccine_clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vaccine_dose_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_appointments_vaccine ON public.appointments(vaccine_id) WHERE vaccine_id IS NOT NULL;

-- ─── 5. Seed - 10 لقاحات أساسية ───
INSERT INTO public.vaccines (name_ar, name_en, category, diseases, doses_required, dose_interval_days, recommended_age_months, recommended_age_months_max, price, is_free, is_mandatory, description, icon, display_order)
VALUES
  ('بي سي جي (BCG)', 'BCG', 'pediatric', ARRAY['السل'], 1, NULL, 0, 1, 0, TRUE, TRUE, 'لقاح ضد السل - يُعطى عند الولادة', '💉', 1),
  ('خماسي (Pentavalent)', 'Pentavalent', 'pediatric', ARRAY['الدفتيريا', 'الكزاز', 'السعال الديكي', 'التهاب الكبد B', 'الإنفلونزا المستدمية'], 3, 60, 2, 6, 0, TRUE, TRUE, 'لقاح خماسي يُعطى 3 جرعات على فترات شهرين', '💉', 2),
  ('شلل الأطفال (OPV)', 'OPV', 'pediatric', ARRAY['شلل الأطفال'], 4, 60, 2, 18, 0, TRUE, TRUE, 'لقاح شلل الأطفال الفموي', '💉', 3),
  ('MMR', 'MMR', 'pediatric', ARRAY['الحصبة', 'النكاف', 'الحصبة الألمانية'], 2, 365, 12, 18, 0, TRUE, TRUE, 'لقاح الحصبة والنكاف والحصبة الألمانية', '💉', 4),
  ('الإنفلونزا الموسمية', 'Influenza', 'seasonal', ARRAY['الإنفلونزا'], 1, NULL, 6, NULL, 15000, FALSE, FALSE, 'لقاح سنوي ضد الإنفلونزا الموسمية', '🤧', 5),
  ('كوفيد-19 (Pfizer)', 'Pfizer COVID-19', 'covid', ARRAY['كوفيد-19'], 3, 21, 60, NULL, 0, TRUE, FALSE, 'لقاح فايزر ضد كورونا', '😷', 6),
  ('التيتانوس', 'Tetanus', 'adult', ARRAY['الكزاز'], 1, NULL, 60, NULL, 8000, FALSE, FALSE, 'لقاح ضد الكزاز - يُعطى كل 10 سنوات', '💉', 7),
  ('التهاب الكبد A', 'Hepatitis A', 'optional', ARRAY['التهاب الكبد A'], 2, 180, 12, NULL, 25000, FALSE, FALSE, 'لقاح اختياري ضد التهاب الكبد A', '💉', 8),
  ('الحمى الصفراء', 'Yellow Fever', 'travel', ARRAY['الحمى الصفراء'], 1, NULL, 108, NULL, 50000, FALSE, FALSE, 'لقاح ضد الحمى الصفراء - مطلوب للسفر لبعض الدول', '🦟', 9),
  ('HPV', 'HPV', 'adult', ARRAY['فيروس الورم الحليمي'], 2, 180, 108, 324, 80000, FALSE, FALSE, 'لقاح ضد فيروس الورم الحليمي (للإناث)', '💉', 10)
ON CONFLICT DO NOTHING;

-- ─── 6. Notification templates ───
INSERT INTO public.notification_templates (key, title_ar, body_ar, icon, type)
VALUES 
  ('vaccine_reminder', 'تذكير: موعد لقاح قريب 💉', 'لديك جرعة لقاح مستحقّة قريباً', '💉', 'info'),
  ('vaccine_overdue', 'تنبيه: جرعة لقاح متأخّرة ⚠️', 'فاتك موعد جرعة - راجع جدول اللقاحات', '⚠️', 'warning'),
  ('vaccine_appointment_booked', 'تأكيد موعد اللقاح ✓', 'تم حجز موعد اللقاح بنجاح', '✅', 'success')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 45 (V25.50)
-- ═══════════════════════════════════════════════════════════════════════════


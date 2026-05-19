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

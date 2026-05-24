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

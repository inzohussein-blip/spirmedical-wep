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

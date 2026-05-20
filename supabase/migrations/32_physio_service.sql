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

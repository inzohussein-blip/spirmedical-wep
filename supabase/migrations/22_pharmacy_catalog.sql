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

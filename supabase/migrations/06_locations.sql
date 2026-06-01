-- ═══════════════════════════════════════════════════════════════════
-- 📦 06_locations.sql — المواقع + الإحداثيات + التخزين المؤقت
-- مدموج (V33) من: 15_gps_locations.sql 17_saved_locations.sql 37_doctors_clinics_coordinates.sql 48_mental_nutrition_coordinates.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 15_gps_locations.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🗺️ Migration 15: GPS Locations (V25 — Free Medical Map)
-- ════════════════════════════════════════════════════════════════════
-- يضيف حقول GPS للجداول الأساسية لدعم الخرائط
-- (Leaflet + OpenStreetMap - بدون أي خدمة مدفوعة)
--
-- NUMERIC(10, 7):
--   - 7 خانات عشرية = دقة ~1.1 سم
--   - مناسب لـ -180.0000000 إلى +180.0000000
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. appointments: موقع تنفيذ الخدمة (منزل المريض) ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_accuracy_m INTEGER,
  ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;

-- التحقق من صحة الإحداثيات
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_valid_lat,
  ADD CONSTRAINT appointments_valid_lat
    CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_valid_lng,
  ADD CONSTRAINT appointments_valid_lng
    CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));

-- التحقق من تكامل البيانات: إن وُجد lat فيجب وجود lng والعكس
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_location_pair,
  ADD CONSTRAINT appointments_location_pair
    CHECK (
      (location_lat IS NULL AND location_lng IS NULL)
      OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)
    );

-- فهرس للبحث الجغرافي السريع (للتقارير + لوحة الإدارة)
CREATE INDEX IF NOT EXISTS idx_appointments_location
  ON public.appointments(location_lat, location_lng)
  WHERE location_lat IS NOT NULL;

-- ─── 2. users: موقع عمل الأخصائي/المختبر ───
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS work_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS work_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS work_address TEXT;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_valid_work_lat,
  ADD CONSTRAINT users_valid_work_lat
    CHECK (work_lat IS NULL OR (work_lat >= -90 AND work_lat <= 90));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_valid_work_lng,
  ADD CONSTRAINT users_valid_work_lng
    CHECK (work_lng IS NULL OR (work_lng >= -180 AND work_lng <= 180));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_work_location_pair,
  ADD CONSTRAINT users_work_location_pair
    CHECK (
      (work_lat IS NULL AND work_lng IS NULL)
      OR (work_lat IS NOT NULL AND work_lng IS NOT NULL)
    );

-- فهرس للبحث الجغرافي عن الأخصائيين
CREATE INDEX IF NOT EXISTS idx_users_work_location
  ON public.users(work_lat, work_lng)
  WHERE work_lat IS NOT NULL AND role = 'specialist';

-- ─── 3. تعليقات للتوثيق ───
COMMENT ON COLUMN public.appointments.location_lat IS
  'خط العرض GPS لموقع تنفيذ الخدمة (منزل المريض)';
COMMENT ON COLUMN public.appointments.location_lng IS
  'خط الطول GPS لموقع تنفيذ الخدمة';
COMMENT ON COLUMN public.appointments.location_accuracy_m IS
  'دقة الموقع بالأمتار (من Geolocation API)';
COMMENT ON COLUMN public.appointments.location_captured_at IS
  'توقيت التقاط الموقع (لمعرفة هل قديم)';

COMMENT ON COLUMN public.users.work_lat IS
  'خط العرض GPS لموقع عمل الأخصائي (مختبر/عيادة)';
COMMENT ON COLUMN public.users.work_lng IS
  'خط الطول GPS لموقع عمل الأخصائي';
COMMENT ON COLUMN public.users.work_address IS
  'العنوان النصي لموقع العمل';


-- ─── 17_saved_locations.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🗺️ Migration 17: Saved Locations + Geocoding Cache (V25)
-- ════════════════════════════════════════════════════════════════════
-- يضيف:
--   1. user_saved_locations - المواقع المفضّلة (البيت، العمل، إلخ)
--   2. geocoding_cache - cache لنتائج reverse geocoding (تقليل API calls)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. user_saved_locations ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- اسم الموقع (البيت، بيت الجدّة، العمل)
  label TEXT NOT NULL,
  icon TEXT DEFAULT '📍',  -- emoji
  
  -- العنوان النصي + الإحداثيات
  address TEXT NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  
  -- معلومات إضافية اختيارية
  governorate TEXT,
  notes TEXT,
  
  -- الأكثر استخداماً = pinned
  is_pinned BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT saved_location_valid_lat CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT saved_location_valid_lng CHECK (lng >= -180 AND lng <= 180),
  CONSTRAINT saved_location_label_length CHECK (char_length(label) BETWEEN 1 AND 50),
  CONSTRAINT saved_location_max_per_user UNIQUE (user_id, label)
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_saved_locations_user
  ON public.user_saved_locations(user_id, is_pinned DESC, last_used_at DESC);

-- RLS: المستخدم يرى مواقعه فقط
ALTER TABLE public.user_saved_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_locations_select_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_select_own"
  ON public.user_saved_locations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_locations_insert_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_insert_own"
  ON public.user_saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_locations_update_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_update_own"
  ON public.user_saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_locations_delete_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_delete_own"
  ON public.user_saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Limit: 10 مواقع كحدّ أقصى لكل مستخدم
CREATE OR REPLACE FUNCTION public.check_saved_locations_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.user_saved_locations
  WHERE user_id = NEW.user_id;
  
  IF current_count >= 10 THEN
    RAISE EXCEPTION 'لا يمكن حفظ أكثر من 10 مواقع';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_locations_limit ON public.user_saved_locations;
CREATE TRIGGER trg_saved_locations_limit
  BEFORE INSERT ON public.user_saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_saved_locations_limit();

-- ─── 2. geocoding_cache ──────────────────────────────────
-- نخزّن نتائج Nominatim للحدّ من API calls
CREATE TABLE IF NOT EXISTS public.geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المفتاح: lat,lng مدوّر إلى 4 خانات عشرية
  -- ~11 متر دقة - يكفي للـ cache
  lat_rounded NUMERIC(8, 4) NOT NULL,
  lng_rounded NUMERIC(8, 4) NOT NULL,
  
  -- النتيجة من Nominatim
  display_name TEXT NOT NULL,        -- العنوان الكامل
  road TEXT,                          -- اسم الشارع
  suburb TEXT,                        -- الحي
  city TEXT,                          -- المدينة
  governorate TEXT,                   -- المحافظة
  country TEXT,                       -- البلد
  
  -- Raw response (JSONB للمرونة)
  raw_data JSONB,
  
  -- Metadata
  hit_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT geocoding_cache_unique_coords UNIQUE (lat_rounded, lng_rounded)
);

CREATE INDEX IF NOT EXISTS idx_geocoding_cache_coords
  ON public.geocoding_cache(lat_rounded, lng_rounded);

CREATE INDEX IF NOT EXISTS idx_geocoding_cache_last_used
  ON public.geocoding_cache(last_used_at DESC);

-- RLS: قراءة عامة للمستخدمين الـ authenticated، الكتابة للسيرفر فقط
ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "geocoding_cache_select_all" ON public.geocoding_cache;
CREATE POLICY "geocoding_cache_select_all"
  ON public.geocoding_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── 3. تعليقات ──────────────────────────────────────────
COMMENT ON TABLE public.user_saved_locations IS
  'المواقع المفضّلة للمستخدم - مثل: البيت، العمل، بيت الجدّة';

COMMENT ON TABLE public.geocoding_cache IS
  'Cache لنتائج Reverse Geocoding من Nominatim - يقلل API calls';

-- ─── 4. تأكيد ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 17 applied: saved_locations + geocoding_cache';
END $$;


-- ─── 37_doctors_clinics_coordinates.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 37_doctors_clinics_coordinates.sql
-- إضافة clinic_latitude/longitude للأطباء + باقي الخدمات (V25.39)
-- ═══════════════════════════════════════════════════════════════════
--
-- الغرض:
--   - الأطباء (users.specialist_type = 'doctor') لو عندهم عيادة ثابتة
--   - باقي الجداول اللي ما عندها lat/lng بعد:
--     * pharmacies, dental_clinics, optical_stores
--   - نُكمّل الـ schema لدعم نظام الخرائط الموحّد SpirMap
--
-- ملاحظات:
--   - الأعمدة nullable لأن:
--     • الأطباء قد يكونون متنقّلين (home visits)
--     • بعض المختصّين أونلاين فقط
--   - الـ indexes للبحث الجغرافي السريع
--
-- يمكن تشغيل هذا الـ migration مرّات عديدة بأمان (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. users (للأطباء + المختصّين)
-- ─────────────────────────────────────────────────────────────
-- نُضيف clinic_latitude/longitude لجدول users
-- ينطبق على specialist_type IN ('doctor', 'lab_analyst', 'pharmacist', 'physio')
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS clinic_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clinic_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clinic_address TEXT,
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS clinic_city TEXT,
  ADD COLUMN IF NOT EXISTS clinic_phone TEXT;

-- Index للبحث الجغرافي (composite + partial)
CREATE INDEX IF NOT EXISTS idx_users_clinic_location
  ON public.users(clinic_latitude, clinic_longitude)
  WHERE clinic_latitude IS NOT NULL
    AND clinic_longitude IS NOT NULL
    AND role = 'specialist';

-- ─────────────────────────────────────────────────────────────
-- 2. pharmacies (الصيدليات)
-- ─────────────────────────────────────────────────────────────
-- نتأكد من وجود الأعمدة (موجودة على الأرجح لكن للتأكيد)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.pharmacies
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_pharmacies_location
  ON public.pharmacies(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. dental_clinics (عيادات الأسنان)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.dental_clinics
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_dental_clinics_location
  ON public.dental_clinics(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. optical_stores (محلّات النظارات)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.optical_stores
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_optical_stores_location
  ON public.optical_stores(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS Policy للأعمدة الجديدة
-- ─────────────────────────────────────────────────────────────
-- الأعمدة الجديدة موروثة من الـ RLS policies الموجودة
-- لا حاجة لتعديل policies (الأعمدة جزء من نفس الـ rows)

-- ─────────────────────────────────────────────────────────────
-- 6. تعليقات للتوضيح
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.users.clinic_latitude IS 'إحداثيات GPS للعيادة - فقط للأطباء/المختصّين اللي عندهم عيادة ثابتة';
COMMENT ON COLUMN public.users.clinic_longitude IS 'إحداثيات GPS للعيادة - فقط للأطباء/المختصّين اللي عندهم عيادة ثابتة';
COMMENT ON COLUMN public.users.clinic_address IS 'عنوان العيادة التفصيلي';
COMMENT ON COLUMN public.users.clinic_name IS 'اسم العيادة (مثال: عيادة د. أحمد للقلبية)';
COMMENT ON COLUMN public.users.clinic_phone IS 'رقم هاتف العيادة (مختلف عن phone الشخصي)';

COMMENT ON COLUMN public.pharmacies.latitude IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';
COMMENT ON COLUMN public.dental_clinics.latitude IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';
COMMENT ON COLUMN public.optical_stores.latitude IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';

-- ─────────────────────────────────────────────────────────────
-- ✓ التحقق
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 37 (doctors + services coordinates) applied successfully';
  RAISE NOTICE '   ▸ users: +clinic_latitude, +clinic_longitude, +clinic_address, +clinic_name, +clinic_city, +clinic_phone';
  RAISE NOTICE '   ▸ pharmacies: +latitude, +longitude (idempotent)';
  RAISE NOTICE '   ▸ dental_clinics: +latitude, +longitude (idempotent)';
  RAISE NOTICE '   ▸ optical_stores: +latitude, +longitude (idempotent)';
  RAISE NOTICE '   ▸ Indexes: 4 partial indexes للبحث الجغرافي';
  RAISE NOTICE '';
  RAISE NOTICE '📍 الخطوة التالية:';
  RAISE NOTICE '   1. حدّث صفحة admin للأطباء لإضافة GPS picker';
  RAISE NOTICE '   2. الأطباء الجدد يقدرون يحدّدوا موقع عيادتهم عند التسجيل';
  RAISE NOTICE '   3. الـ markers ستظهر على /services map';
END $$;


-- ─── 48_mental_nutrition_coordinates.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 🗺️ V31: إضافة إحداثيات GPS لـ mental_health_specialists + nutritionists
-- ═══════════════════════════════════════════════════════════════════
--
-- المشكلة:
--   services/page.tsx يقرأ latitude/longitude من هذين الجدولين على الخريطة،
--   لكن العمودين غير موجودين أصلاً في DB!
--   النتيجة: استعلام يفشل أو يُرجع صفر نتائج دائماً → لا تظهر هذه الخدمات على الخريطة.
--
-- الحلّ:
--   إضافة latitude/longitude + index (نفس نمط migration 37 لبقية الخدمات)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. mental_health_specialists ───
ALTER TABLE IF EXISTS public.mental_health_specialists
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS address   TEXT;

CREATE INDEX IF NOT EXISTS idx_mental_health_coords
  ON public.mental_health_specialists(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─── 2. nutritionists ───
ALTER TABLE IF EXISTS public.nutritionists
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS address   TEXT;

CREATE INDEX IF NOT EXISTS idx_nutritionists_coords
  ON public.nutritionists(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.mental_health_specialists.latitude  IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';
COMMENT ON COLUMN public.nutritionists.latitude  IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 48 Complete
--
-- بعد التشغيل:
--   • الجدولان يدعمان الإحداثيات
--   • الأدمن يستطيع رفع مواقعهما من الخريطة (AdminLocationPicker)
--   • يظهران على خريطة /services
-- ═══════════════════════════════════════════════════════════════════

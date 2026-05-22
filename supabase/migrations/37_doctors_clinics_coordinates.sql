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

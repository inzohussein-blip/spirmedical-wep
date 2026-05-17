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

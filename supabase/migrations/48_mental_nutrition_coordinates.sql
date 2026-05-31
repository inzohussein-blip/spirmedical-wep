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

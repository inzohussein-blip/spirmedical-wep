-- ════════════════════════════════════════════════════════════════════════
-- 0030: مناطق الخدمة — يرسمها المشرف على الخريطة بدل أن تُكتب في الكود
-- ════════════════════════════════════════════════════════════════════════
--
-- لم يكن في المشروع أيّ تمثيلٍ لنطاق التغطية: لا جدول ولا عمود. فالتطبيق
-- يقبل أيّ عنوانٍ في أيّ مكان، ويكتشف المريضُ أنّ الخدمة لا تصله بعد الحجز
-- لا قبله.
--
-- ─── لماذا jsonb لا `geometry`؟ ───
--
-- أسقط الترحيل 0025 امتداد PostGIS لأنّه لم يكن مستعمَلاً، فهبطت إنذارات
-- المدقّق من ٩ إلى ١. وإعادته من أجل هذه الميزة وحدها تُعيد الإنذارات
-- الثلاثة وجدولَ `spatial_ref_sys` الذي لا نملك تأمينه (ملكيّته للامتداد).
--
-- والمضلَّع هنا حدودُ مدينةٍ أو حيّ: عشراتُ الرؤوس لا آلافها، والسؤال
-- الوحيد المطروح عليه «أهذه النقطة داخله؟». وذلك اختبارُ الشعاع
-- (ray casting) — حلقةٌ على الأضلاع، تُنفَّذ أدناه بـ SQL خالص. فلا حاجة
-- إلى فهرسٍ مكانيٍّ ولا إلى امتداد.
--
-- الإحداثيات مخزَّنةٌ `[lng, lat]` على ترتيب GeoJSON — لا `[lat, lng]` —
-- كي تُمرَّر إلى MapLibre كما هي بلا قلب.

CREATE TABLE IF NOT EXISTS public.service_areas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar       text NOT NULL,
  governorate   text,
  -- حلقةٌ مغلقة: [[lng,lat], [lng,lat], ...] — ثلاث نقاطٍ فأكثر
  polygon       jsonb NOT NULL,
  color         text NOT NULL DEFAULT '#0F766E',
  is_active     boolean NOT NULL DEFAULT true,
  notes         text,
  created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT service_areas_polygon_is_ring
    CHECK (jsonb_typeof(polygon) = 'array' AND jsonb_array_length(polygon) >= 3),
  CONSTRAINT service_areas_color_hex
    CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT service_areas_name_not_blank
    CHECK (btrim(name_ar) <> '')
);

CREATE INDEX IF NOT EXISTS service_areas_active_idx
  ON public.service_areas(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS service_areas_created_by_idx
  ON public.service_areas(created_by) WHERE created_by IS NOT NULL;

DROP TRIGGER IF EXISTS service_areas_updated_at ON public.service_areas;
CREATE TRIGGER service_areas_updated_at
  BEFORE UPDATE ON public.service_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── RLS ───
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

-- الزائر يحتاج أن يعرف قبل الحجز أنّ منطقته مخدومة — فالمناطق **المفعّلة**
-- مقروءةٌ للجميع. والمعطّلة والملاحظات الداخلية لا يراها إلّا المشرف.
DROP POLICY IF EXISTS service_areas_public_read ON public.service_areas;
CREATE POLICY service_areas_public_read ON public.service_areas
  FOR SELECT USING (is_active);

DROP POLICY IF EXISTS service_areas_admin_manage ON public.service_areas;
CREATE POLICY service_areas_admin_manage ON public.service_areas
  FOR ALL USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

GRANT SELECT ON public.service_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_areas TO authenticated;

-- ─── اختبار الشعاع: أهذه النقطة داخل المضلَّع؟ ───
--
-- خوارزمية الفتل/التقاطع: يُمدّ شعاعٌ أفقيٌّ من النقطة، ويُعدّ كم ضلعاً
-- يقطعه. فردٌ ⇒ داخل، زوجٌ ⇒ خارج. الشرط `(yi > lat) <> (yj > lat)` يستبعد
-- الأضلاع الأفقية أصلاً، فلا يقع `yj - yi` صفراً في المقام.
CREATE OR REPLACE FUNCTION public.point_in_polygon(
  p_polygon jsonb,
  p_lat     double precision,
  p_lng     double precision
) RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'pg_catalog', 'pg_temp'
AS $$
DECLARE
  n      integer;
  i      integer;
  j      integer;
  xi     double precision;
  yi     double precision;
  xj     double precision;
  yj     double precision;
  inside boolean := false;
BEGIN
  IF p_polygon IS NULL OR p_lat IS NULL OR p_lng IS NULL THEN
    RETURN false;
  END IF;

  n := jsonb_array_length(p_polygon);
  IF n IS NULL OR n < 3 THEN
    RETURN false;
  END IF;

  j := n - 1;
  FOR i IN 0 .. n - 1 LOOP
    xi := (p_polygon -> i ->> 0)::double precision;
    yi := (p_polygon -> i ->> 1)::double precision;
    xj := (p_polygon -> j ->> 0)::double precision;
    yj := (p_polygon -> j ->> 1)::double precision;

    IF ((yi > p_lat) <> (yj > p_lat))
       AND (p_lng < (xj - xi) * (p_lat - yi) / (yj - yi) + xi) THEN
      inside := NOT inside;
    END IF;

    j := i;
  END LOOP;

  RETURN inside;
END;
$$;

-- ─── المناطق المفعّلة التي تغطّي نقطةً بعينها ───
-- SECURITY INVOKER عمداً: تمرّ عبر RLS، فلا تكشف منطقةً معطّلة لزائر.
CREATE OR REPLACE FUNCTION public.service_areas_covering(
  p_lat double precision,
  p_lng double precision
) RETURNS TABLE (id uuid, name_ar text, governorate text, color text)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT a.id, a.name_ar, a.governorate, a.color
    FROM public.service_areas a
   WHERE a.is_active
     AND public.point_in_polygon(a.polygon, p_lat, p_lng);
$$;

GRANT EXECUTE ON FUNCTION public.point_in_polygon(jsonb, double precision, double precision)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_areas_covering(double precision, double precision)
  TO anon, authenticated;

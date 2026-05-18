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

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 43: Hospitals + Dental + Optical Enhancements (V25.47)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. أعمدة structured في appointments للـ 3 خدمات
--   2. 3 جداول ratings (hospital_ratings, dental_ratings, optical_ratings)
--   3. جدول favorites موحّد
--   4. Triggers + Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة على appointments ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hospital_department TEXT,
  ADD COLUMN IF NOT EXISTS dental_clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dental_procedure_type TEXT 
    CHECK (dental_procedure_type IN (
      'cleaning', 'filling', 'extraction', 'root_canal', 'crown',
      'orthodontics', 'whitening', 'consultation', 'other'
    ) OR dental_procedure_type IS NULL),
  ADD COLUMN IF NOT EXISTS optical_store_id UUID REFERENCES public.optical_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS optical_service_type TEXT 
    CHECK (optical_service_type IN (
      'eye_exam', 'prescription_lenses', 'sunglasses', 
      'contact_lenses', 'frames_only', 'consultation'
    ) OR optical_service_type IS NULL);

CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON public.appointments(hospital_id) WHERE hospital_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_dental ON public.appointments(dental_clinic_id) WHERE dental_clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_optical ON public.appointments(optical_store_id) WHERE optical_store_id IS NOT NULL;

-- ─── 2. HOSPITAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.hospital_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hospital_id       UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  staff_rating      INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
  facilities_rating INTEGER CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
  wait_time_rating  INTEGER CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  
  department        TEXT,  -- القسم الذي زاره (اختياري)
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_ratings_hospital ON public.hospital_ratings(hospital_id);

ALTER TABLE public.hospital_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospital_ratings_user_own" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_user_own"
  ON public.hospital_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "hospital_ratings_user_insert" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_user_insert"
  ON public.hospital_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "hospital_ratings_public_read" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_public_read"
  ON public.hospital_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "hospital_ratings_admin_all" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_admin_all"
  ON public.hospital_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. DENTAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.dental_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dental_clinic_id  UUID NOT NULL REFERENCES public.dental_clinics(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  hygiene_rating    INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  comfort_rating    INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  
  procedure_type    TEXT,
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_dental_ratings_clinic ON public.dental_ratings(dental_clinic_id);

ALTER TABLE public.dental_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_ratings_user_own" ON public.dental_ratings;
CREATE POLICY "dental_ratings_user_own"
  ON public.dental_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dental_ratings_user_insert" ON public.dental_ratings;
CREATE POLICY "dental_ratings_user_insert"
  ON public.dental_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dental_ratings_public_read" ON public.dental_ratings;
CREATE POLICY "dental_ratings_public_read"
  ON public.dental_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "dental_ratings_admin_all" ON public.dental_ratings;
CREATE POLICY "dental_ratings_admin_all"
  ON public.dental_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. OPTICAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.optical_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  optical_store_id  UUID NOT NULL REFERENCES public.optical_stores(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  selection_rating  INTEGER CHECK (selection_rating >= 1 AND selection_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating    INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  quality_rating    INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  service_type      TEXT,
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_optical_ratings_store ON public.optical_ratings(optical_store_id);

ALTER TABLE public.optical_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optical_ratings_user_own" ON public.optical_ratings;
CREATE POLICY "optical_ratings_user_own"
  ON public.optical_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "optical_ratings_user_insert" ON public.optical_ratings;
CREATE POLICY "optical_ratings_user_insert"
  ON public.optical_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "optical_ratings_public_read" ON public.optical_ratings;
CREATE POLICY "optical_ratings_public_read"
  ON public.optical_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "optical_ratings_admin_all" ON public.optical_ratings;
CREATE POLICY "optical_ratings_admin_all"
  ON public.optical_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 5. SERVICE FAVORITES (موحّد لكل الخدمات) ───
CREATE TABLE IF NOT EXISTS public.service_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- نوع الخدمة (واحد فقط)
  service_type      TEXT NOT NULL CHECK (service_type IN (
    'hospital', 'dental', 'optical', 'doctor', 'pharmacy',
    'mental', 'nutrition', 'physio'
  )),
  service_id        UUID NOT NULL,  -- المرجع للجدول حسب service_type
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, service_type, service_id)
);

CREATE INDEX IF NOT EXISTS idx_service_favorites_user ON public.service_favorites(user_id, service_type);

ALTER TABLE public.service_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_favorites_user_all" ON public.service_favorites;
CREATE POLICY "service_favorites_user_all"
  ON public.service_favorites FOR ALL USING (user_id = auth.uid());

-- ─── 6. Triggers: تحديث rating_avg تلقائياً ───

-- Hospital
CREATE OR REPLACE FUNCTION update_hospital_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  hospital_uuid UUID;
BEGIN
  hospital_uuid := COALESCE(NEW.hospital_id, OLD.hospital_id);
  
  UPDATE public.hospitals
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.hospital_ratings 
      WHERE hospital_id = hospital_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.hospital_ratings 
      WHERE hospital_id = hospital_uuid AND is_public = true
    )
  WHERE id = hospital_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hospital_rating_stats ON public.hospital_ratings;
CREATE TRIGGER trigger_hospital_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.hospital_ratings
  FOR EACH ROW EXECUTE FUNCTION update_hospital_rating_stats();

-- Dental
CREATE OR REPLACE FUNCTION update_dental_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  clinic_uuid UUID;
BEGIN
  clinic_uuid := COALESCE(NEW.dental_clinic_id, OLD.dental_clinic_id);
  
  UPDATE public.dental_clinics
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.dental_ratings 
      WHERE dental_clinic_id = clinic_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.dental_ratings 
      WHERE dental_clinic_id = clinic_uuid AND is_public = true
    )
  WHERE id = clinic_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dental_rating_stats ON public.dental_ratings;
CREATE TRIGGER trigger_dental_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.dental_ratings
  FOR EACH ROW EXECUTE FUNCTION update_dental_rating_stats();

-- Optical
CREATE OR REPLACE FUNCTION update_optical_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  store_uuid UUID;
BEGIN
  store_uuid := COALESCE(NEW.optical_store_id, OLD.optical_store_id);
  
  UPDATE public.optical_stores
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.optical_ratings 
      WHERE optical_store_id = store_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.optical_ratings 
      WHERE optical_store_id = store_uuid AND is_public = true
    )
  WHERE id = store_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_optical_rating_stats ON public.optical_ratings;
CREATE TRIGGER trigger_optical_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.optical_ratings
  FOR EACH ROW EXECUTE FUNCTION update_optical_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 43
-- ═══════════════════════════════════════════════════════════════════════════

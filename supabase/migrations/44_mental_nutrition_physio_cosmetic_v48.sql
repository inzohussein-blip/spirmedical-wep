-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 44: Mental + Nutrition + Physio + Cosmetic (V25.48 + V25.49)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. mental_health_ratings + nutritionist_ratings + physio_ratings
--   2. cosmetic_wishlist + cosmetic_product_reviews
--   3. أعمدة structured في appointments
--   4. Triggers + Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. MENTAL HEALTH RATINGS ───
CREATE TABLE IF NOT EXISTS public.mental_health_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.mental_health_specialists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  empathy_rating    INTEGER CHECK (empathy_rating >= 1 AND empathy_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  -- نوع الجلسة
  session_type      TEXT CHECK (session_type IN ('online', 'clinic')),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_anonymous      BOOLEAN NOT NULL DEFAULT TRUE,  -- افتراضياً مجهول للحساسية
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_mental_ratings_specialist ON public.mental_health_ratings(specialist_id);

ALTER TABLE public.mental_health_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_ratings_user_own" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_user_own"
  ON public.mental_health_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mental_ratings_user_insert" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_user_insert"
  ON public.mental_health_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mental_ratings_public_read" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_public_read"
  ON public.mental_health_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "mental_ratings_admin_all" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_admin_all"
  ON public.mental_health_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. NUTRITIONIST RATINGS ───
CREATE TABLE IF NOT EXISTS public.nutritionist_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nutritionist_id   UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  plan_quality_rating INTEGER CHECK (plan_quality_rating >= 1 AND plan_quality_rating <= 5),
  responsiveness_rating INTEGER CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
  results_rating    INTEGER CHECK (results_rating >= 1 AND results_rating <= 5),
  
  package_type      TEXT CHECK (package_type IN ('initial', 'follow_up', 'monthly')),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nutritionist_ratings_nutritionist ON public.nutritionist_ratings(nutritionist_id);

ALTER TABLE public.nutritionist_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutritionist_ratings_user_own" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_user_own"
  ON public.nutritionist_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutritionist_ratings_user_insert" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_user_insert"
  ON public.nutritionist_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutritionist_ratings_public_read" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_public_read"
  ON public.nutritionist_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "nutritionist_ratings_admin_all" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_admin_all"
  ON public.nutritionist_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. PHYSIO RATINGS ───
CREATE TABLE IF NOT EXISTS public.physio_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.physio_specialists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  skill_rating      INTEGER CHECK (skill_rating >= 1 AND skill_rating <= 5),
  improvement_rating INTEGER CHECK (improvement_rating >= 1 AND improvement_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  
  -- نوع الجلسة
  session_type      TEXT CHECK (session_type IN ('home_visit', 'clinic_visit')),
  service_type_slug TEXT,  -- ربط بـ physio_service_types
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_physio_ratings_specialist ON public.physio_ratings(specialist_id);

ALTER TABLE public.physio_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_ratings_user_own" ON public.physio_ratings;
CREATE POLICY "physio_ratings_user_own"
  ON public.physio_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "physio_ratings_user_insert" ON public.physio_ratings;
CREATE POLICY "physio_ratings_user_insert"
  ON public.physio_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "physio_ratings_public_read" ON public.physio_ratings;
CREATE POLICY "physio_ratings_public_read"
  ON public.physio_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "physio_ratings_admin_all" ON public.physio_ratings;
CREATE POLICY "physio_ratings_admin_all"
  ON public.physio_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. أعمدة structured في appointments للـ 3 services ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS mental_specialist_id UUID REFERENCES public.mental_health_specialists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS physio_specialist_id UUID REFERENCES public.physio_specialists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS physio_service_type_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_mental ON public.appointments(mental_specialist_id) WHERE mental_specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON public.appointments(nutritionist_id) WHERE nutritionist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_physio ON public.appointments(physio_specialist_id) WHERE physio_specialist_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💄 V25.49: COSMETIC E-COMMERCE
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 5. COSMETIC WISHLIST ───
CREATE TABLE IF NOT EXISTS public.cosmetic_wishlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.cosmetic_products(id) ON DELETE CASCADE,
  notes             TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_wishlist_user ON public.cosmetic_wishlist(user_id);

ALTER TABLE public.cosmetic_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_wishlist_user_all" ON public.cosmetic_wishlist;
CREATE POLICY "cosmetic_wishlist_user_all"
  ON public.cosmetic_wishlist FOR ALL USING (user_id = auth.uid());

-- ─── 6. COSMETIC PRODUCT REVIEWS ───
CREATE TABLE IF NOT EXISTS public.cosmetic_product_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.cosmetic_products(id) ON DELETE CASCADE,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  value_rating      INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  scent_rating      INTEGER CHECK (scent_rating >= 1 AND scent_rating <= 5),
  
  title             TEXT,  -- عنوان المراجعة (اختياري)
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- صورة (اختياري)
  image_url         TEXT,
  
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  helpful_count     INTEGER DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_reviews_product ON public.cosmetic_product_reviews(product_id, created_at DESC);

ALTER TABLE public.cosmetic_product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_reviews_user_own" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_own"
  ON public.cosmetic_product_reviews FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_user_insert" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_insert"
  ON public.cosmetic_product_reviews FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_user_update" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_update"
  ON public.cosmetic_product_reviews FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_public_read" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_public_read"
  ON public.cosmetic_product_reviews FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "cosmetic_reviews_admin_all" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_admin_all"
  ON public.cosmetic_product_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 7. Triggers لتحديث stats ───

-- Mental Health rating stats
CREATE OR REPLACE FUNCTION update_mental_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  spec_id UUID;
BEGIN
  spec_id := COALESCE(NEW.specialist_id, OLD.specialist_id);
  UPDATE public.mental_health_specialists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.mental_health_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.mental_health_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    )
  WHERE id = spec_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mental_rating_stats ON public.mental_health_ratings;
CREATE TRIGGER trigger_mental_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.mental_health_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_rating_stats();

-- Nutritionist rating stats
CREATE OR REPLACE FUNCTION update_nutritionist_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  nut_id UUID;
BEGIN
  nut_id := COALESCE(NEW.nutritionist_id, OLD.nutritionist_id);
  UPDATE public.nutritionists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.nutritionist_ratings 
      WHERE nutritionist_id = nut_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.nutritionist_ratings 
      WHERE nutritionist_id = nut_id AND is_public = true
    )
  WHERE id = nut_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nutritionist_rating_stats ON public.nutritionist_ratings;
CREATE TRIGGER trigger_nutritionist_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.nutritionist_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nutritionist_rating_stats();

-- Physio rating stats
CREATE OR REPLACE FUNCTION update_physio_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  spec_id UUID;
BEGIN
  spec_id := COALESCE(NEW.specialist_id, OLD.specialist_id);
  UPDATE public.physio_specialists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.physio_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.physio_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    )
  WHERE id = spec_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_physio_rating_stats ON public.physio_ratings;
CREATE TRIGGER trigger_physio_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.physio_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_physio_rating_stats();

-- Cosmetic product rating stats
CREATE OR REPLACE FUNCTION update_cosmetic_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  prod_id UUID;
BEGIN
  prod_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.cosmetic_products
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.cosmetic_product_reviews 
      WHERE product_id = prod_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.cosmetic_product_reviews 
      WHERE product_id = prod_id AND is_public = true
    )
  WHERE id = prod_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cosmetic_rating_stats ON public.cosmetic_product_reviews;
CREATE TRIGGER trigger_cosmetic_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.cosmetic_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cosmetic_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 44 (V25.48 + V25.49)
-- ═══════════════════════════════════════════════════════════════════════════

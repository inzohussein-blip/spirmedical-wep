-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 40: Nursing Service Enhancements (V25.44)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. تقييم الممرضين (nurse_ratings)
--   2. View للـ vitals trends
--   3. Trigger للإشعارات
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. NURSE RATINGS - تقييمات الممرضين ───
CREATE TABLE IF NOT EXISTS public.nurse_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_id          UUID REFERENCES public.nursing_visit_history(id) ON DELETE SET NULL,
  
  -- التقييم العام
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية (1-5)
  hygiene_rating    INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  attitude_rating   INTEGER CHECK (attitude_rating >= 1 AND attitude_rating <= 5),
  
  -- ملاحظات المريض
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- متاح للعرض العام؟
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- لا يمكن تقييم نفس الموعد مرّتين
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_ratings_specialist ON public.nurse_ratings(specialist_id);
CREATE INDEX IF NOT EXISTS idx_nurse_ratings_user ON public.nurse_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_nurse_ratings_rating ON public.nurse_ratings(rating);

-- RLS
ALTER TABLE public.nurse_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurse_ratings_user_own" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_user_own"
  ON public.nurse_ratings FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_user_insert" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_user_insert"
  ON public.nurse_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_specialist_read" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_specialist_read"
  ON public.nurse_ratings FOR SELECT
  USING (specialist_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_public_read" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_public_read"
  ON public.nurse_ratings FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "nurse_ratings_admin_all" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_admin_all"
  ON public.nurse_ratings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 2. View للـ vitals trends ───
CREATE OR REPLACE VIEW public.vitals_trends AS
SELECT 
  user_id,
  performed_at::date AS visit_date,
  performed_at,
  procedure_type,
  vital_signs->>'bp' AS blood_pressure,
  (vital_signs->>'pulse')::int AS pulse,
  (vital_signs->>'temp')::numeric AS temperature,
  (vital_signs->>'spo2')::int AS oxygen_saturation,
  (vital_signs->>'sugar')::int AS blood_sugar,
  notes
FROM public.nursing_visit_history
WHERE vital_signs IS NOT NULL
ORDER BY performed_at DESC;

GRANT SELECT ON public.vitals_trends TO authenticated;

-- ─── 3. Function: عند إضافة rating، حدّث متوسط الممرض ───
CREATE OR REPLACE FUNCTION update_nurse_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- لو في column rating_avg في users (لازم نضيفها لو ما كانت)
  UPDATE public.users
  SET updated_at = NOW()
  WHERE id = NEW.specialist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nurse_avg_rating ON public.nurse_ratings;
CREATE TRIGGER trigger_nurse_avg_rating
  AFTER INSERT OR UPDATE ON public.nurse_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nurse_avg_rating();

-- ─── 4. Notification template للنوسنج ───
INSERT INTO public.notification_templates (key, title_ar, body_ar, icon, type)
VALUES 
  (
    'nursing_request_accepted',
    'تمّ قبول طلب التمريض ✓',
    'الممرض في الطريق إليك',
    '💉',
    'info'
  ),
  (
    'nursing_visit_completed',
    'انتهت زيارة التمريض ✓',
    'كيف كانت تجربتك مع الممرض؟ قيّمها الآن.',
    '⭐',
    'success'
  )
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 40
-- ═══════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 💳 Migration 04: PAYMENTS & RATINGS (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V24: ratings.specialist_id → ON DELETE SET NULL (للحفاظ على التقييمات)
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 💵 PAYMENTS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- طريقة الدفع
  method TEXT NOT NULL CHECK (method IN ('cash', 'zain_cash', 'asia_hawala', 'visa', 'mastercard')),

  -- المبلغ
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'IQD' NOT NULL,

  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),

  -- معاملة
  transaction_id TEXT,
  notes TEXT,

  -- تواريخ
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_appt ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at DESC)
  WHERE paid_at IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- ⭐ RATINGS (V24 — مُصحَّح: specialist_id → SET NULL)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- 🔧 V24: ON DELETE SET NULL بدل CASCADE (التقييمات قيمتها تاريخية)
  specialist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- التقييمات (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),

  -- المراجعة
  review_text TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- خصوصية
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(appointment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_specialist ON public.ratings(specialist_id)
  WHERE specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ratings_appt ON public.ratings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_published ON public.ratings(is_published, created_at DESC)
  WHERE is_published = TRUE;


-- ════════════════════════════════════════════════════════════════════
-- 🔄 Triggers
-- ════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 📊 Specialist Stats View (للأدمن + Profile الأخصائي)
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V24: استخدام security_invoker لاحترام RLS
CREATE OR REPLACE VIEW public.specialist_stats
WITH (security_invoker = on) AS
SELECT
  u.id AS specialist_id,
  u.full_name,
  u.specialty,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS completed_appointments,
  COUNT(DISTINCT r.id) AS total_ratings,
  ROUND(AVG(r.overall_rating)::numeric, 2) AS average_rating,
  COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'completed') AS unique_patients
FROM public.users u
LEFT JOIN public.appointments a ON a.specialist_id = u.id
LEFT JOIN public.ratings r ON r.specialist_id = u.id AND r.is_published = TRUE
WHERE u.role = 'specialist'
GROUP BY u.id, u.full_name, u.specialty;


-- ════════════════════════════════════════════════════════════════════
-- 🔐 RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;


-- ─── Payments ───
DROP POLICY IF EXISTS "Users see own payments" ON public.payments;
CREATE POLICY "Users see own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Specialists see appointment payments" ON public.payments;
CREATE POLICY "Specialists see appointment payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = payments.appointment_id
      AND appointments.specialist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users create own payments" ON public.payments;
CREATE POLICY "Users create own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own payments" ON public.payments;
CREATE POLICY "Users update own payments" ON public.payments
  FOR UPDATE USING (auth.uid() = user_id);


-- ─── Ratings ───
DROP POLICY IF EXISTS "Anyone reads published ratings" ON public.ratings;
CREATE POLICY "Anyone reads published ratings" ON public.ratings
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Users see own ratings" ON public.ratings;
CREATE POLICY "Users see own ratings" ON public.ratings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own ratings" ON public.ratings;
CREATE POLICY "Users create own ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own ratings" ON public.ratings;
CREATE POLICY "Users update own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own ratings" ON public.ratings;
CREATE POLICY "Users delete own ratings" ON public.ratings
  FOR DELETE USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 04 Complete
-- ════════════════════════════════════════════════════════════════════

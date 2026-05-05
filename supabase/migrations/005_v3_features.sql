-- ============================================================================
-- Spir Medical - Migration 005: 15 New Features (v3.0)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PAYMENTS (دفع إلكتروني - زين كاش + ماستركارد)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  amount_iqd INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('zain_cash', 'mastercard', 'visa', 'cash', 'wallet')),
  
  -- Gateway response
  gateway_txn_id TEXT,
  gateway_status TEXT,
  gateway_response JSONB,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);

-- Wallet balance for in-app wallet
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance_iqd INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. AI SYMPTOM CHECKER (فحص أعراض بالذكاء الاصطناعي)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS symptom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  symptoms_text TEXT NOT NULL,
  ai_questions JSONB DEFAULT '[]'::jsonb,
  user_answers JSONB DEFAULT '[]'::jsonb,
  
  -- AI result
  ai_recommendation TEXT,
  suggested_service TEXT CHECK (suggested_service IN ('blood_test', 'consultation', 'emergency', 'pharmacy', 'specialist', 'self_care')),
  suggested_tests TEXT[],
  suggested_specialty TEXT,
  confidence_score NUMERIC(3,2),
  
  -- Conversion
  converted_to_order_id UUID REFERENCES orders(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_symptom_sessions_user ON symptom_sessions(user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. LIVE GPS TRACKING (تتبع حي)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_locations_order ON provider_locations(order_id);
CREATE INDEX idx_provider_locations_provider ON provider_locations(provider_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE provider_locations;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CLINIC BOOKING (حجز مواعيد عيادات)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  specialty TEXT NOT NULL,
  
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  phone TEXT,
  photo_url TEXT,
  
  consultation_fee_iqd INTEGER NOT NULL DEFAULT 25000,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  working_hours JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  doctor_name TEXT NOT NULL,
  
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  payment_id UUID REFERENCES payments(id),
  fee_iqd INTEGER NOT NULL,
  
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinic_appointments_user ON clinic_appointments(user_id, appointment_date DESC);
CREATE INDEX idx_clinic_appointments_clinic ON clinic_appointments(clinic_id, appointment_date);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. RECURRING BOOKINGS (حجز متكرر)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recurring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  service_type TEXT NOT NULL,
  test_ids TEXT[],
  
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  preferred_day INTEGER CHECK (preferred_day BETWEEN 0 AND 6),
  preferred_time TIME,
  
  address_id UUID,
  for_family_member_id UUID REFERENCES family_members(id),
  
  next_date DATE NOT NULL,
  total_completed INTEGER NOT NULL DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_user ON recurring_bookings(user_id);
CREATE INDEX idx_recurring_next ON recurring_bookings(next_date) WHERE status = 'active';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. MICRO INSURANCE (تأمين صحي مصغر)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  
  monthly_price_iqd INTEGER NOT NULL,
  
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"type": "free_tests", "count": 2}, {"type": "free_consultation", "count": 1}, {"type": "discount_percent", "value": 25}]
  
  max_coverage_iqd INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  plan_id UUID NOT NULL REFERENCES insurance_plans(id),
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  free_tests_remaining INTEGER NOT NULL DEFAULT 0,
  free_consultations_remaining INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_insurance ON user_insurance(user_id) WHERE status = 'active';

-- ────────────────────────────────────────────────────────────────────────────
-- 7. BADGES / GAMIFICATION (شارات إنجاز)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milestone', 'social', 'health', 'loyalty', 'special')),
  
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 0,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  badge_id TEXT NOT NULL REFERENCES badges(id),
  
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges ON user_badges(user_id);

-- Seed badges
INSERT INTO badges (id, name_ar, description_ar, icon, category, condition_type, condition_value, points_reward, sort_order) VALUES
('first_test', 'بداية رحلتك', 'أكملت أول فحص', '🩸', 'milestone', 'orders_completed', 1, 100, 1),
('five_tests', 'مهتم بصحتك', 'أكملت 5 فحوصات', '💪', 'milestone', 'orders_completed', 5, 250, 2),
('ten_tests', 'محارب صحي', 'أكملت 10 فحوصات', '🏅', 'milestone', 'orders_completed', 10, 500, 3),
('twenty_five', 'بطل سبير', 'أكملت 25 خدمة', '🏆', 'milestone', 'orders_completed', 25, 1000, 4),
('family_care', 'عائلة صحية', 'أضفت 3 أفراد عائلة', '👨‍👩‍👧‍👦', 'health', 'family_members', 3, 200, 5),
('first_review', 'صوتك مسموع', 'كتبت أول تقييم', '⭐', 'social', 'reviews_written', 1, 50, 6),
('ten_reviews', 'ناقد محترف', 'كتبت 10 تقييمات', '📝', 'social', 'reviews_written', 10, 300, 7),
('referral_1', 'سفير سبير', 'دعيت صديقاً واحداً', '🤝', 'social', 'referrals', 1, 100, 8),
('referral_5', 'نجم الإحالات', 'دعيت 5 أصدقاء', '🌟', 'social', 'referrals', 5, 500, 9),
('plus_member', 'عضو مميز', 'اشتركت في Spir Plus', '💎', 'loyalty', 'spir_plus', 1, 200, 10),
('plus_6months', 'عضو VIP', 'عضو Plus لـ 6 أشهر', '👑', 'loyalty', 'spir_plus_months', 6, 1000, 11),
('streak_3', 'منتظم', 'فحص 3 أشهر متتالية', '🔥', 'health', 'monthly_streak', 3, 300, 12),
('ai_explorer', 'مستكشف ذكي', 'استخدمت فحص الأعراض بالـ AI', '🤖', 'special', 'ai_sessions', 1, 50, 13),
('night_owl', 'بومة الليل', 'حجزت طلب بعد منتصف الليل', '🦉', 'special', 'night_order', 1, 50, 14),
('insurance_hero', 'محمي', 'اشتركت في حماية سبير', '🛡️', 'loyalty', 'insurance', 1, 200, 15)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. VIDEO CONSULTATION (استشارة فيديو)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'in_person' CHECK (consultation_type IN ('in_person', 'video', 'chat'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS video_room_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS video_started_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS video_ended_at TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. PRESCRIPTION OCR (قراءة وصفة بالكاميرا)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  image_url TEXT NOT NULL,
  
  extracted_medications JSONB DEFAULT '[]'::jsonb,
  raw_ocr_text TEXT,
  confidence NUMERIC(3,2),
  
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  converted_to_order_id UUID REFERENCES orders(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ocr_scans_user ON ocr_scans(user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 10. NOTIFICATIONS LOG (سجل الإشعارات)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('order_update', 'chat', 'promotion', 'reminder', 'result_ready', 'badge_earned', 'system')),
  
  data JSONB DEFAULT '{}'::jsonb,
  
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ────────────────────────────────────────────────────────────────────────────
-- 11. RLS POLICIES FOR ALL NEW TABLES
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE symptom_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sessions" ON symptom_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create sessions" ON symptom_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order parties view location" ON provider_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = provider_locations.order_id AND (user_id = auth.uid() OR provider_id = auth.uid()))
);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clinics" ON clinics FOR SELECT USING (is_active = TRUE);

ALTER TABLE clinic_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own appointments" ON clinic_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create appointments" ON clinic_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE recurring_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recurring" ON recurring_bookings FOR ALL USING (auth.uid() = user_id);

ALTER TABLE insurance_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON insurance_plans FOR SELECT USING (is_active = TRUE);

ALTER TABLE user_insurance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own insurance" ON user_insurance FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (TRUE);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scans" ON ocr_scans FOR ALL USING (auth.uid() = user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 12. SEED DATA
-- ────────────────────────────────────────────────────────────────────────────

-- Sample clinics
INSERT INTO clinics (name_ar, specialty, address, city, latitude, longitude, phone, consultation_fee_iqd, rating) VALUES
('عيادة الرحمة التخصصية', 'باطنية', 'شارع الصدر، النجف', 'النجف', 32.0085, 44.3464, '+9647801234567', 20000, 4.7),
('مركز الشفاء الطبي', 'عام', 'حي الأمير، النجف', 'النجف', 32.0120, 44.3500, '+9647801234568', 15000, 4.5),
('عيادة الزهراء للنساء', 'نسائية', 'شارع الكوفة، النجف', 'النجف', 32.0050, 44.3400, '+9647801234569', 25000, 4.8),
('مركز ابن سينا', 'أطفال', 'حي السعد، كربلاء', 'كربلاء', 32.6160, 44.0250, '+9647801234570', 20000, 4.6),
('عيادة النور التخصصية', 'عظام', 'شارع العباس، كربلاء', 'كربلاء', 32.6200, 44.0300, '+9647801234571', 30000, 4.9)
ON CONFLICT DO NOTHING;

-- Insurance plans
INSERT INTO insurance_plans (name_ar, description_ar, monthly_price_iqd, benefits) VALUES
('حماية سبير الأساسية', 'حماية أساسية للفحوصات والاستشارات', 10000, '[
  {"type": "free_tests", "count": 2, "label": "فحصان مجانيان شهرياً"},
  {"type": "free_consultation", "count": 1, "label": "استشارة طوارئ مجانية"},
  {"type": "discount_percent", "value": 25, "label": "خصم 25% على كل شيء"}
]'::jsonb),
('درع سبير العائلي', 'حماية شاملة لكل العائلة', 25000, '[
  {"type": "free_tests", "count": 5, "label": "5 فحوصات مجانية شهرياً"},
  {"type": "free_consultation", "count": 3, "label": "3 استشارات مجانية"},
  {"type": "discount_percent", "value": 40, "label": "خصم 40% على كل شيء"},
  {"type": "free_delivery", "value": true, "label": "توصيل أدوية مجاني"},
  {"type": "priority_booking", "value": true, "label": "أولوية في الحجز"}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
COMMENT ON SCHEMA public IS 'Spir Medical v3.0 - Migration 005: 15 new features';

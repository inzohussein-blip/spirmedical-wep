-- ============================================================================
-- Spir Medical - Migration 003: Toters-style Features
-- Stories + Banners + Loyalty + Cart + Family + Health Score + Subscriptions
-- ============================================================================

-- ============================================================================
-- BANNERS (Carousel في الشاشة الرئيسية)
-- ============================================================================
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar VARCHAR(150) NOT NULL,
  subtitle_ar VARCHAR(250),
  image_url TEXT,
  background_color VARCHAR(20) DEFAULT '#00C896',
  cta_text_ar VARCHAR(50),
  cta_action VARCHAR(100),  -- 'route:/pharmacy', 'url:https://...', 'promo:SPIR20'
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(is_active, sort_order)
  WHERE is_active = TRUE;

-- ============================================================================
-- STORIES (محتوى صحي يومي)
-- ============================================================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title_ar VARCHAR(150) NOT NULL,
  content_type VARCHAR(30) NOT NULL,  -- 'tip', 'stat', 'qa', 'promo', 'success_story'
  thumbnail_url TEXT,
  body_ar TEXT,
  image_url TEXT,
  cta_action VARCHAR(100),
  views_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_stories_active ON stories(is_active, created_at DESC)
  WHERE is_active = TRUE AND expires_at > NOW();

CREATE TABLE story_views (
  id BIGSERIAL PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, profile_id)
);

-- ============================================================================
-- LOYALTY POINTS - Spir Points
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spir_points INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'bronze';
-- bronze (0-999), silver (1000-4999), gold (5000-14999), platinum (15000+)

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_change INT NOT NULL,  -- positive = earned, negative = redeemed
  transaction_type VARCHAR(30),  -- 'order_earned', 'birthday_bonus', 'referral_bonus', 'redeemed'
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  description_ar VARCHAR(200),
  balance_after INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_profile ON loyalty_transactions(profile_id, created_at DESC);

-- Function: Award points after order completion
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  v_points INT;
BEGIN
  -- Only award points when order moves to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_points := FLOOR(NEW.total_iqd / 1000) * 5;  -- 5 points per 1000 IQD

    UPDATE profiles
      SET spir_points = spir_points + v_points,
          loyalty_tier = CASE
            WHEN spir_points + v_points >= 15000 THEN 'platinum'
            WHEN spir_points + v_points >= 5000 THEN 'gold'
            WHEN spir_points + v_points >= 1000 THEN 'silver'
            ELSE 'bronze'
          END
      WHERE id = NEW.patient_id;

    INSERT INTO loyalty_transactions (
      profile_id, points_change, transaction_type,
      related_order_id, description_ar, balance_after
    )
    SELECT NEW.patient_id, v_points, 'order_earned', NEW.id,
      'نقاط على طلب ' || NEW.order_number,
      spir_points
    FROM profiles WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_loyalty_points AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION award_loyalty_points();

-- ============================================================================
-- SPIR PLUS - الاشتراك الشهري
-- ============================================================================
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_name VARCHAR(50) DEFAULT 'spir_plus_monthly',
  status subscription_status DEFAULT 'active',
  monthly_consultations_used INT DEFAULT 0,
  monthly_consultations_limit INT DEFAULT 2,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_profile ON subscriptions(profile_id, status);

-- ============================================================================
-- FAMILY PROFILES - حسابات العائلة
-- ============================================================================
CREATE TYPE family_relation AS ENUM (
  'self', 'spouse', 'child', 'parent', 'sibling', 'other'
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  relation family_relation NOT NULL,
  gender gender_type,
  date_of_birth DATE,
  blood_type VARCHAR(5),  -- A+, B-, AB+, O-, etc
  chronic_conditions TEXT[],  -- ['سكري', 'ضغط دم']
  allergies TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_primary ON family_members(primary_profile_id);

-- Add for_family_member to orders (so user can book for someone else)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS for_family_member_id UUID
  REFERENCES family_members(id) ON DELETE SET NULL;

-- ============================================================================
-- HEALTH RECORDS - ملف صحي شامل
-- ============================================================================
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  record_type VARCHAR(40),  -- 'lab_result', 'consultation_note', 'prescription', 'vital'
  recorded_value JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_health_records_profile ON health_records(profile_id, recorded_at DESC);
CREATE INDEX idx_health_records_family ON health_records(family_member_id, recorded_at DESC);

-- ============================================================================
-- SAVED CART (Persistent Shopping Cart)
-- ============================================================================
CREATE TABLE saved_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cart_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: {"lab_tests": [ids], "medications": [{id, qty, pharmacy_id}], "service_type": "..."}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FAVORITES - حفظ مفضلات (أطباء، صيدليات)
-- ============================================================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,  -- 'doctor', 'pharmacy', 'lab_test'
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, item_type, item_id)
);

CREATE INDEX idx_favorites_profile ON favorites(profile_id, item_type);

-- ============================================================================
-- REVIEW PHOTOS - صور مع التقييمات
-- ============================================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0;

CREATE TABLE review_helpful_votes (
  id BIGSERIAL PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, profile_id)
);

-- ============================================================================
-- REFERRAL SYSTEM - برنامج الإحالة
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20);

-- Auto-generate referral code on profile create
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER('SPIR' || SUBSTRING(NEW.id::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_referral_code BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- ============================================================================
-- DOCTOR SCHEDULES - أوقات الأطباء
-- ============================================================================
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_doctor_schedules ON doctor_schedules(doctor_profile_id);

-- ============================================================================
-- PROMO CODES - أكواد الخصم
-- ============================================================================
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(30) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL,  -- 'percentage', 'fixed'
  discount_value INT NOT NULL,
  min_order_iqd INT DEFAULT 0,
  max_discount_iqd INT,
  usage_limit INT,  -- total usage across all users
  per_user_limit INT DEFAULT 1,
  current_usage INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_code_uses (
  id BIGSERIAL PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID
  REFERENCES promo_codes(id) ON DELETE SET NULL;

-- ============================================================================
-- GROUP BOOKING - حجوزات جماعية
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_group_booking BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_size INT DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_discount_iqd INT DEFAULT 0;

-- ============================================================================
-- RLS POLICIES for new tables
-- ============================================================================

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_public_read" ON banners FOR SELECT USING (is_active = TRUE);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_public_read" ON stories FOR SELECT
  USING (is_active = TRUE AND expires_at > NOW());

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_views_owner" ON story_views FOR ALL
  USING (auth.uid() = profile_id);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_owner_read" ON loyalty_transactions FOR SELECT
  USING (auth.uid() = profile_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_owner" ON subscriptions FOR ALL
  USING (auth.uid() = profile_id);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_owner" ON family_members FOR ALL
  USING (auth.uid() = primary_profile_id);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_owner" ON health_records FOR ALL
  USING (auth.uid() = profile_id);

ALTER TABLE saved_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_owner" ON saved_carts FOR ALL
  USING (auth.uid() = profile_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_owner" ON favorites FOR ALL
  USING (auth.uid() = profile_id);

ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_votes_owner" ON review_helpful_votes FOR ALL
  USING (auth.uid() = profile_id);

ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctor_schedules_public" ON doctor_schedules FOR SELECT USING (TRUE);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_codes_public_read" ON promo_codes FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate health score (0-100) based on recent activity
CREATE OR REPLACE FUNCTION calculate_health_score(p_profile_id UUID)
RETURNS INT AS $$
DECLARE
  v_score INT := 50;  -- baseline
  v_recent_tests INT;
  v_overdue_tests INT;
BEGIN
  -- More recent tests = higher score
  SELECT COUNT(*) INTO v_recent_tests
  FROM lab_results
  WHERE patient_id = p_profile_id
    AND uploaded_at > NOW() - INTERVAL '6 months';

  v_score := v_score + LEAST(v_recent_tests * 10, 30);

  -- Subtract for overdue annual tests (placeholder logic)
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SEED DATA: Banners + Stories + Promo Codes
-- ============================================================================

INSERT INTO banners (title_ar, subtitle_ar, background_color, cta_text_ar, cta_action, sort_order) VALUES
  ('خصم ٢٠٪ على أول طلب', 'استخدم الكود SPIR20', '#00C896', 'استخدم الآن', 'promo:SPIR20', 1),
  ('فحص شامل للعائلة', 'احجز للعائلة كلها بزيارة واحدة', '#FF6B6B', 'احجز الآن', 'route:/book/blood-test', 2),
  ('استشارة مجانية', 'لأول 100 مستخدم - استشارة عامة مجاناً', '#4D8AFF', 'احجز', 'route:/book/consultation', 3),
  ('Spir Plus متاح الآن', 'اشترك بـ 5,000 د.ع/شهر واحصل على مزايا حصرية', '#FFB800', 'اشترك', 'route:/spir-plus', 4);

INSERT INTO stories (title_ar, content_type, body_ar) VALUES
  ('نصيحة اليوم: شرب الماء', 'tip', 'احرص على شرب 8 أكواب ماء يومياً للحفاظ على صحة الكلى والبشرة. الماء يساعد على طرد السموم وتنظيم درجة حرارة الجسم.'),
  ('70% من الأطفال العراقيين', 'stat', '70% من الأطفال يعانون من نقص فيتامين D. يُنصح بفحص دوري سنوي للأطفال أعمارهم بين 1-12 سنة.'),
  ('متى تفحص السكر؟', 'qa', 'يُنصح بفحص السكر التراكمي (HbA1c) كل 3-6 أشهر للمصابين بالسكري، ومرة سنوياً لمن لديهم تاريخ عائلي.'),
  ('قصة نجاح: السيدة فاطمة', 'success_story', 'بفضل خدمة سحب الدم المنزلية، اكتشفت السيدة فاطمة ارتفاع السكر مبكراً وبدأت العلاج في الوقت المناسب.');

INSERT INTO promo_codes (code, discount_type, discount_value, min_order_iqd, max_discount_iqd, valid_until) VALUES
  ('SPIR20', 'percentage', 20, 10000, 15000, NOW() + INTERVAL '60 days'),
  ('FAMILY30', 'percentage', 30, 50000, 25000, NOW() + INTERVAL '90 days'),
  ('FIRST10K', 'fixed', 10000, 30000, NULL, NOW() + INTERVAL '30 days');

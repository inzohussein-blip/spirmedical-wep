-- ════════════════════════════════════════════════════════════════════
-- 🎁 Migration 30: Coupon Redemptions & Loyalty Enhancements (V25.13)
-- ════════════════════════════════════════════════════════════════════
-- يُكمل ما بدأ في:
--   - Migration 10 (coupons table)
--   - Migration 28 (wallet & loyalty)
--
-- يُضيف:
--   1. coupon_redemptions  - سجل استخدام الكوبونات (per user per coupon)
--   2. loyalty_milestones  - معالم النقاط (سيلفر/جولد/بلاتينيوم/دايموند)
--   3. referral_codes      - رموز الإحالة (Refer-a-Friend)
--   4. تحسينات على coupons (per_user_limit, min_order)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. تحسين جدول coupons ────────────────────────────
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_order_only BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allowed_cities TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.coupons.per_user_limit IS 'حد استخدام كل مستخدم لهذا الكوبون';
COMMENT ON COLUMN public.coupons.first_order_only IS 'يُطبّق على أول طلب فقط';
COMMENT ON COLUMN public.coupons.allowed_cities IS 'مدن محدّدة (فارغ = كل المدن)';

-- ─── 2. سجل استخدام الكوبونات ─────────────────────────
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,

  discount_amount NUMERIC NOT NULL,
  order_amount NUMERIC NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),

  -- تجنّب الاستخدام المتكرر
  UNIQUE(coupon_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
  ON public.coupon_redemptions(user_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon
  ON public.coupon_redemptions(coupon_id, applied_at DESC);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_redemptions_own_select" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_own_select"
  ON public.coupon_redemptions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "coupon_redemptions_admin_all" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_admin_all"
  ON public.coupon_redemptions FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─── 3. معالم برنامج الولاء ──────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE CHECK (tier IN ('silver', 'gold', 'platinum', 'diamond')),
  name_ar TEXT NOT NULL,
  min_points INTEGER NOT NULL,

  -- المزايا
  discount_percent NUMERIC DEFAULT 0,
  free_consultations_per_month INTEGER DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  free_delivery BOOLEAN DEFAULT FALSE,

  -- العرض
  badge_color TEXT DEFAULT '#9CA3AF',
  badge_icon TEXT DEFAULT '🏆',
  description_ar TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestones_public_read" ON public.loyalty_milestones;
CREATE POLICY "milestones_public_read"
  ON public.loyalty_milestones FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "milestones_admin_manage" ON public.loyalty_milestones;
CREATE POLICY "milestones_admin_manage"
  ON public.loyalty_milestones FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─── 4. نظام الإحالة ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,

  -- إحصائيات
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_own_select" ON public.referral_codes;
CREATE POLICY "referral_own_select"
  ON public.referral_codes FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_own_insert" ON public.referral_codes;
CREATE POLICY "referral_own_insert"
  ON public.referral_codes FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "referral_lookup_by_code" ON public.referral_codes;
CREATE POLICY "referral_lookup_by_code"
  ON public.referral_codes FOR SELECT
  USING (TRUE);  -- للسماح بالبحث بالكود (validate)

-- ─── 5. تتبّع الإحالات الناجحة ─────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- سجّل لكن لم يستخدم بعد
    'qualified',   -- أكمل أول طلب
    'rewarded'     -- تم منح المكافأة
  )),

  referrer_reward NUMERIC DEFAULT 0,
  referred_bonus NUMERIC DEFAULT 0,

  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_own_select" ON public.referrals;
CREATE POLICY "referrals_own_select"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referrals_admin_all" ON public.referrals;
CREATE POLICY "referrals_admin_all"
  ON public.referrals FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─── 6. Function: تحديث tier تلقائياً ─────────────────
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER AS $$
DECLARE
  v_new_tier TEXT;
BEGIN
  -- تحديد الـ tier حسب النقاط
  IF NEW.loyalty_points >= 10000 THEN
    v_new_tier := 'diamond';
  ELSIF NEW.loyalty_points >= 5000 THEN
    v_new_tier := 'platinum';
  ELSIF NEW.loyalty_points >= 1500 THEN
    v_new_tier := 'gold';
  ELSE
    v_new_tier := 'silver';
  END IF;

  -- تحديث فقط لو تغيّر
  IF v_new_tier != COALESCE(OLD.loyalty_tier, '') THEN
    NEW.loyalty_tier := v_new_tier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_loyalty_tier ON public.users;
CREATE TRIGGER auto_update_loyalty_tier
  BEFORE UPDATE OF loyalty_points ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_tier();

-- ─── 7. Function: استخدام كوبون مع التحقق ──────────────
CREATE OR REPLACE FUNCTION public.validate_coupon_for_user(
  p_code TEXT,
  p_user_id UUID,
  p_order_amount NUMERIC,
  p_user_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_amount NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage INTEGER;
  v_user_order_count INTEGER;
  v_discount NUMERIC;
BEGIN
  -- جلب الكوبون
  SELECT * INTO v_coupon FROM public.coupons
  WHERE code = p_code AND is_active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC, 'الكوبون غير موجود أو غير نشط'::TEXT;
    RETURN;
  END IF;

  -- التحقق من تاريخ الانتهاء
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC, 'انتهت صلاحية الكوبون'::TEXT;
    RETURN;
  END IF;

  -- التحقق من بداية الصلاحية
  IF v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC, 'الكوبون لم يبدأ بعد'::TEXT;
    RETURN;
  END IF;

  -- التحقق من max_uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC, 'تم استنفاد الكوبون'::TEXT;
    RETURN;
  END IF;

  -- التحقق من min_order
  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC,
      ('الحد الأدنى للطلب: ' || v_coupon.min_order_amount::TEXT)::TEXT;
    RETURN;
  END IF;

  -- التحقق من per_user_limit
  SELECT COUNT(*) INTO v_user_usage
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

  IF v_user_usage >= v_coupon.per_user_limit THEN
    RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC, 'استخدمت هذا الكوبون من قبل'::TEXT;
    RETURN;
  END IF;

  -- التحقق من first_order_only
  IF v_coupon.first_order_only THEN
    SELECT COUNT(*) INTO v_user_order_count
    FROM public.appointments
    WHERE user_id = p_user_id AND status != 'cancelled';

    IF v_user_order_count > 0 THEN
      RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC, 'هذا الكوبون لأول طلب فقط'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- التحقق من المدينة
  IF array_length(v_coupon.allowed_cities, 1) > 0 AND p_user_city IS NOT NULL THEN
    IF NOT (p_user_city = ANY(v_coupon.allowed_cities)) THEN
      RETURN QUERY SELECT FALSE, v_coupon.id, 0::NUMERIC, 'الكوبون غير متاح في مدينتك'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- حساب الخصم
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_order_amount * v_coupon.discount_value) / 100;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  -- تطبيق max_discount
  IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
    v_discount := v_coupon.max_discount_amount;
  END IF;

  -- لا يتجاوز قيمة الطلب
  IF v_discount > p_order_amount THEN
    v_discount := p_order_amount;
  END IF;

  RETURN QUERY SELECT TRUE, v_coupon.id, v_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 8. Function: إنشاء كود إحالة لكل مستخدم ─────────
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    -- توليد كود 6 أحرف (uppercase + numbers)
    v_code := UPPER(SUBSTRING(MD5(p_user_id::TEXT || NOW()::TEXT) FROM 1 FOR 6));

    -- التحقق من عدم وجوده
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_code);

    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code
  RETURNING code INTO v_code;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════
-- 🌱 Seed Data
-- ════════════════════════════════════════════════════════════════════

-- ─── معالم برنامج الولاء (4 tiers) ────────────────────
INSERT INTO public.loyalty_milestones (
  tier, name_ar, min_points,
  discount_percent, free_consultations_per_month,
  priority_support, free_delivery,
  badge_color, badge_icon, description_ar
) VALUES
  ('silver',   'سيلفر',     0,    0,  0, FALSE, FALSE, '#9CA3AF', '🥈',
   'مرحباً بك في برنامج الولاء! استمر بالاستخدام لرفع مستواك.'),

  ('gold',     'جولد',      1500, 5,  1, FALSE, FALSE, '#FBBF24', '🥇',
   '5% خصم على كل الخدمات + استشارة مجانية شهرياً'),

  ('platinum', 'بلاتينيوم', 5000, 10, 2, TRUE,  TRUE,  '#E5E7EB', '💎',
   '10% خصم + استشارتان مجانيتان + دعم أولوية + توصيل مجاني'),

  ('diamond',  'دايموند',   10000, 15, 4, TRUE, TRUE, '#60A5FA', '💍',
   '15% خصم + 4 استشارات مجانية + دعم VIP + توصيل مجاني + هدايا حصرية')
ON CONFLICT (tier) DO NOTHING;

-- ─── كوبون ترحيبي (لأول طلب) ─────────────────────────
INSERT INTO public.coupons (
  code, description, discount_type, discount_value,
  valid_from, valid_until, max_uses,
  min_order_amount, max_discount_amount, per_user_limit,
  first_order_only, is_active
) VALUES
  ('WELCOME10', 'خصم 10% لأول طلب', 'percentage', 10,
   NOW(), NOW() + INTERVAL '6 months', 10000,
   10000, 5000, 1, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE public.coupon_redemptions IS 'سجل استخدامات الكوبونات (per user per appointment)';
COMMENT ON TABLE public.loyalty_milestones IS 'معالم برنامج الولاء - 4 tiers (سيلفر/جولد/بلاتينيوم/دايموند)';
COMMENT ON TABLE public.referral_codes IS 'كود إحالة لكل مستخدم (Refer-a-Friend)';
COMMENT ON TABLE public.referrals IS 'تتبّع الإحالات الناجحة + المكافآت';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 30 applied:';
  RAISE NOTICE '   - coupons enhanced (5 new columns)';
  RAISE NOTICE '   - coupon_redemptions table';
  RAISE NOTICE '   - loyalty_milestones (4 tiers seeded)';
  RAISE NOTICE '   - referral_codes + referrals';
  RAISE NOTICE '   - validate_coupon_for_user() function';
  RAISE NOTICE '   - generate_referral_code() function';
  RAISE NOTICE '   - auto_update_loyalty_tier trigger';
  RAISE NOTICE '   - WELCOME10 seed coupon';
END $$;

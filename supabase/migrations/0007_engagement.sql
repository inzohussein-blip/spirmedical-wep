-- ╔══════════════════════════════════════════════════════════════╗
-- ║  07_engagement.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 07_engagement.sql — مدفوعات + أدمن + قصص + تحليلات + مفضّلة + محفظة + كوبونات + Beta
-- مدموج (V33) من: 04_payments_ratings.sql 10_admin_system.sql 14_stories.sql 26_analytics_events.sql 27_user_favorites.sql 28_wallet_loyalty.sql 30_coupon_redemptions.sql 31_beta_launch.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 04_payments_ratings.sql ───
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


-- ─── 10_admin_system.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 10_admin_system.sql — نظام الإدارة + CRM (V24 — مُصحَّح)
-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V24: super_admin/manager/support الآن في enum (من 01)
-- 🔧 V24: admin_id nullable (إصلاح تضارب NOT NULL + SET NULL)
-- 🔧 V24: إضافة 8 indexes ناقصة
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. سجل العمليات الإدارية ───
-- 🔧 V24: admin_id بدون NOT NULL (للتوافق مع ON DELETE SET NULL)
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action_type   text NOT NULL,  -- 'approve_specialist', 'reject_specialist', 'suspend_user', etc
  target_type   text,           -- 'user', 'appointment', 'rating', etc
  target_id     uuid,
  details       jsonb,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_admin_idx ON public.admin_actions(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_target_idx ON public.admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS admin_actions_type_idx ON public.admin_actions(action_type, created_at DESC);


-- ─── 2. تصنيفات المرضى (Tags) ───
CREATE TABLE IF NOT EXISTS public.patient_tags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tag          text NOT NULL,
  color        text DEFAULT 'default',  -- emerald, amber, rose, purple
  added_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(patient_id, tag)
);

CREATE INDEX IF NOT EXISTS patient_tags_patient_idx ON public.patient_tags(patient_id);
CREATE INDEX IF NOT EXISTS patient_tags_tag_idx ON public.patient_tags(tag);
-- 🆕 V24: index ناقص
CREATE INDEX IF NOT EXISTS patient_tags_added_by_idx ON public.patient_tags(added_by)
  WHERE added_by IS NOT NULL;


-- ─── 3. ملاحظات إدارية على المرضى ───
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  note         text NOT NULL,
  note_type    text DEFAULT 'general',  -- general, warning, vip, follow_up
  is_pinned    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_notes_patient_idx ON public.patient_notes(patient_id, created_at DESC);
-- 🆕 V24: indexes ناقصة
CREATE INDEX IF NOT EXISTS patient_notes_admin_idx ON public.patient_notes(admin_id)
  WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS patient_notes_pinned_idx ON public.patient_notes(patient_id, is_pinned)
  WHERE is_pinned = true;


-- ─── 4. توسيع users بحقول إدارية ───
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_internal_notes text,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- 🆕 V24: indexes ناقصة
CREATE INDEX IF NOT EXISTS users_suspended_idx ON public.users(is_suspended)
  WHERE is_suspended = true;
CREATE INDEX IF NOT EXISTS users_suspended_by_idx ON public.users(suspended_by)
  WHERE suspended_by IS NOT NULL;


-- ─── 5. حملات تسويقية ───
CREATE TABLE IF NOT EXISTS public.campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  type            text NOT NULL CHECK (type IN ('whatsapp', 'sms', 'push', 'email')),
  target_segment  jsonb DEFAULT '{}'::jsonb,  -- {governorate, has_chronic, tags, etc}
  message_content text NOT NULL,
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  recipients_count integer DEFAULT 0,
  success_count    integer DEFAULT 0,
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status, scheduled_for);
-- 🆕 V24: index ناقص
CREATE INDEX IF NOT EXISTS campaigns_created_by_idx ON public.campaigns(created_by)
  WHERE created_by IS NOT NULL;


-- ─── 6. كوبونات الخصم ───
CREATE TABLE IF NOT EXISTS public.coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  description     text,
  discount_type   text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  numeric NOT NULL,
  valid_from      timestamptz DEFAULT now(),
  valid_until     timestamptz,
  max_uses        integer,
  used_count      integer DEFAULT 0,
  applicable_services text[] DEFAULT ARRAY[]::text[],
  is_active       boolean DEFAULT true,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code) WHERE is_active = true;
-- 🆕 V24: index ناقص
CREATE INDEX IF NOT EXISTS coupons_created_by_idx ON public.coupons(created_by)
  WHERE created_by IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════
-- 🔐 RLS Policies — Admin Tables
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V24: Helper functions موحّدة لكل الأدوار الإدارية
-- ═══════════════════════════════════════════════════════════════════

-- يستبدل التعريف من 05_realtime_admin (نسخة موحّدة شاملة)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('super_admin', 'manager', 'support', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- admin_actions: super_admin يقرأ الكل، الباقي يقرأ أفعاله بس
DROP POLICY IF EXISTS admin_actions_view ON public.admin_actions;
CREATE POLICY admin_actions_view ON public.admin_actions
  FOR SELECT USING (
    admin_id = auth.uid() OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS admin_actions_insert ON public.admin_actions;
CREATE POLICY admin_actions_insert ON public.admin_actions
  FOR INSERT WITH CHECK (
    admin_id = auth.uid() AND public.is_admin(auth.uid())
  );


-- patient_tags: admins يقدرون يديرونها
DROP POLICY IF EXISTS patient_tags_admin ON public.patient_tags;
CREATE POLICY patient_tags_admin ON public.patient_tags
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- patient_notes: admins يقدرون
DROP POLICY IF EXISTS patient_notes_admin ON public.patient_notes;
CREATE POLICY patient_notes_admin ON public.patient_notes
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- campaigns: super_admin + manager فقط
DROP POLICY IF EXISTS campaigns_manage ON public.campaigns;
CREATE POLICY campaigns_manage ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'manager', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'manager', 'admin'))
  );


-- coupons: admins يقدرون يديرون، patients يقرأون الـ active
DROP POLICY IF EXISTS coupons_admin_manage ON public.coupons;
CREATE POLICY coupons_admin_manage ON public.coupons
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS coupons_public_read ON public.coupons;
CREATE POLICY coupons_public_read ON public.coupons
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));


-- ═══════════════════════════════════════════════════════════════════
-- توسيع RLS لـ users — Admins يقرأون الكل
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS users_admin_view ON public.users;
CREATE POLICY users_admin_view ON public.users
  FOR SELECT USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS users_admin_update ON public.users;
CREATE POLICY users_admin_update ON public.users
  FOR UPDATE USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  );


-- Admins يشوفون كل المواعيد
DROP POLICY IF EXISTS appointments_admin_view ON public.appointments;
CREATE POLICY appointments_admin_view ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'specialist'
      AND u.approval_status = 'approved'
      AND u.specialist_type = appointments.required_specialist_type
      AND appointments.assigned_specialist_id IS NULL
    )
  );

DROP POLICY IF EXISTS appointments_admin_update ON public.appointments;
CREATE POLICY appointments_admin_update ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'specialist'
      AND u.approval_status = 'approved'
      AND u.specialist_type = appointments.required_specialist_type
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- Update triggers
-- 🔧 V24: استخدام update_updated_at (الموحّد)
-- ═══════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_patient_notes_updated_at ON public.patient_notes;
CREATE TRIGGER trg_patient_notes_updated_at BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 10 Complete
-- ═══════════════════════════════════════════════════════════════════
-- 📋 ملاحظة مهمة: لتعيين أول Super Admin
--
-- UPDATE public.users
-- SET role = 'super_admin'
-- WHERE phone = '07XXXXXXXXX';  -- ضع رقمك هنا
--
-- 🔧 V24: الآن super_admin موجود في enum منذ 01_foundation، لن يفشل!
-- ═══════════════════════════════════════════════════════════════════


-- ─── 14_stories.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 📸 Migration 14: Promotional Stories System (V25)
-- ════════════════════════════════════════════════════════════════════
-- نظام قصص ترويجية (مثل Instagram Stories) قابل للإدارة من admin44
-- تظهر في dashboard المستخدم كصف من الـ circles
--
-- 🔧 ملاحظة: يبدأ بـ DROP TABLE IF EXISTS للتعامل مع
-- جدول stories قديم قد يكون موجوداً
-- ════════════════════════════════════════════════════════════════════

-- ─── 0. حذف الجدول القديم إن وُجد (آمن إذا لا يوجد) ───
DROP TABLE IF EXISTS public.stories CASCADE;

-- ─── 1. الجدول ───
CREATE TABLE IF NOT EXISTS public.stories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- المحتوى
  title           text NOT NULL,
  icon            text NOT NULL,                          -- emoji أو lucide-icon name
  description     text,                                    -- وصف اختياري
  href            text NOT NULL DEFAULT '#',              -- الرابط عند الضغط

  -- التصميم
  color_theme     text NOT NULL DEFAULT 'emerald',
  CONSTRAINT valid_color CHECK (
    color_theme IN ('emerald', 'amber', 'rose', 'paper', 'ink')
  ),

  -- الترتيب والحالة
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,

  -- الجدولة (اختيارية)
  starts_at       timestamptz,
  ends_at         timestamptz,

  -- audit
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- لا يمكن أن يكون ends_at قبل starts_at
  CONSTRAINT valid_date_range CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  )
);

-- ─── 2. Indexes ───
CREATE INDEX idx_stories_active_order
  ON public.stories(is_active, sort_order)
  WHERE is_active = true;

CREATE INDEX idx_stories_schedule
  ON public.stories(starts_at, ends_at)
  WHERE is_active = true;

-- ─── 3. Trigger لتحديث updated_at ───
CREATE OR REPLACE FUNCTION public.update_stories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stories_updated_at ON public.stories;
CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stories_updated_at();

-- ─── 4. Seed: قصص افتراضية (5 قصص) ───
INSERT INTO public.stories (title, icon, href, color_theme, sort_order) VALUES
  ('لقاحات', '💉', '/tools/vaccinations', 'rose', 1),
  ('صحتك', '🩺', '/account/health', 'emerald', 2),
  ('دواء', '💊', '/account/prescriptions', 'amber', 3),
  ('تغذية', '🍎', '/tools/risk-calculator', 'rose', 4),
  ('إسعافات', '🚑', '/tools/first-aid', 'amber', 5);

-- ─── 5. RLS Policies ───
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- الجميع يقرأ الـ active stories (المستخدمين + الزوار)
DROP POLICY IF EXISTS stories_read_active ON public.stories;
CREATE POLICY stories_read_active
  ON public.stories
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

-- super_admin يقرأ كل القصص (حتى المعطّلة)
DROP POLICY IF EXISTS stories_read_all_admin ON public.stories;
CREATE POLICY stories_read_all_admin
  ON public.stories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- super_admin/admin/manager يضيف ويعدّل
DROP POLICY IF EXISTS stories_insert_admin ON public.stories;
CREATE POLICY stories_insert_admin
  ON public.stories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS stories_update_admin ON public.stories;
CREATE POLICY stories_update_admin
  ON public.stories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS stories_delete_admin ON public.stories;
CREATE POLICY stories_delete_admin
  ON public.stories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- ─── 6. تعليقات ───
COMMENT ON TABLE public.stories IS 'قصص ترويجية تظهر في dashboard المستخدم';
COMMENT ON COLUMN public.stories.color_theme IS 'اختياري: emerald/amber/rose/paper/ink';
COMMENT ON COLUMN public.stories.sort_order IS 'الترتيب من اليمين لليسار (الأقل أولاً)';
COMMENT ON COLUMN public.stories.starts_at IS 'تاريخ بدء العرض (null = فوري)';
COMMENT ON COLUMN public.stories.ends_at IS 'تاريخ انتهاء العرض (null = دائم)';


-- ─── 26_analytics_events.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 📊 Migration 26: Analytics Events (V25.10)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,                  -- مُعرّف جلسة المتصفّح
  properties JSONB,                 -- بيانات الحدث
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics_events(created_at DESC);

-- RLS - admins only
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_admins_select" ON public.analytics_events;
CREATE POLICY "analytics_admins_select"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "analytics_anyone_insert" ON public.analytics_events;
CREATE POLICY "analytics_anyone_insert"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);  -- anyone can insert their own events

-- View: تقارير الأحداث
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT
  event_name,
  DATE_TRUNC('day', created_at) as event_date,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
WHERE created_at >= now() - INTERVAL '90 days'
GROUP BY event_name, DATE_TRUNC('day', created_at);

COMMENT ON TABLE public.analytics_events IS 'Internal analytics events - works alongside PostHog';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 26 applied: Analytics events';
END $$;


-- ─── 27_user_favorites.sql ───
-- ════════════════════════════════════════════════════════════════════
-- ⭐ Migration 27: User Favorites System (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- نظام موحّد لحفظ المفضّلات:
--   - أطباء
--   - مستشفيات
--   - صيدليات
--   - فحوصات (medications/tests)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- نوع المفضّل
  favorite_type TEXT NOT NULL CHECK (favorite_type IN (
    'doctor', 'hospital', 'pharmacy', 'medication', 'lab_test'
  )),

  -- ID المرجع (polymorphic)
  reference_id UUID NOT NULL,

  -- معلومات إضافية (cache للأداء)
  display_name TEXT,
  display_subtitle TEXT,
  display_icon TEXT,
  display_meta JSONB,

  -- تاريخ الإضافة
  created_at TIMESTAMPTZ DEFAULT now(),

  -- منع التكرار
  UNIQUE(user_id, favorite_type, reference_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user
  ON public.user_favorites(user_id, favorite_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_reference
  ON public.user_favorites(reference_id, favorite_type);

-- RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى/يدير مفضّلاته فقط
DROP POLICY IF EXISTS "favorites_select_own" ON public.user_favorites;
CREATE POLICY "favorites_select_own"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON public.user_favorites;
CREATE POLICY "favorites_insert_own"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON public.user_favorites;
CREATE POLICY "favorites_delete_own"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Admins يرون كل المفضّلات (للإحصائيات)
DROP POLICY IF EXISTS "favorites_admin_select_all" ON public.user_favorites;
CREATE POLICY "favorites_admin_select_all"
  ON public.user_favorites FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

COMMENT ON TABLE public.user_favorites IS
  'مفضّلات المستخدم - أطباء، مستشفيات، صيدليات، فحوصات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 27 applied: User Favorites';
END $$;


-- ─── 28_wallet_loyalty.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 💰 Migration 28: Wallet & Loyalty Points System (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- نظام محفظة + نقاط ولاء:
--   - رصيد كاش (للاستردادات)
--   - نقاط ولاء (مكافآت)
--   - معاملات (تاريخ كامل)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. ميزان المستخدم (cache) ───────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'silver' CHECK (loyalty_tier IN ('silver', 'gold', 'platinum', 'diamond'));

-- ─── 2. جدول المعاملات ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- النوع
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'credit',           -- إيداع
    'debit',            -- سحب/دفع
    'refund',           -- استرداد
    'reward',           -- مكافأة نقاط
    'points_redeem'     -- استبدال نقاط
  )),

  -- المبلغ
  amount NUMERIC NOT NULL DEFAULT 0,
  points INTEGER DEFAULT 0,

  -- الرصيد بعد المعاملة (للسجل)
  balance_after NUMERIC,
  points_after INTEGER,

  -- التفاصيل
  description TEXT NOT NULL,
  reference_type TEXT,                -- 'appointment', 'consultation', 'referral', 'manual'
  reference_id UUID,                  -- ID المرجع

  -- الحالة
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),

  -- audit
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user
  ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى معاملاته
DROP POLICY IF EXISTS "wallet_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_select_own"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins يقدرون يضيفون معاملات
DROP POLICY IF EXISTS "wallet_admin_all" ON public.wallet_transactions;
CREATE POLICY "wallet_admin_all"
  ON public.wallet_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 3. Function: إضافة معاملة + تحديث الرصيد ────────────
CREATE OR REPLACE FUNCTION public.add_wallet_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC DEFAULT 0,
  p_points INTEGER DEFAULT 0,
  p_description TEXT DEFAULT '',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance NUMERIC;
  v_new_points INTEGER;
  v_new_tier TEXT;
BEGIN
  -- حدّث الرصيد
  IF p_type IN ('credit', 'refund') THEN
    UPDATE public.users
    SET wallet_balance = wallet_balance + p_amount,
        loyalty_points = loyalty_points + p_points
    WHERE id = p_user_id
    RETURNING wallet_balance, loyalty_points INTO v_new_balance, v_new_points;
  ELSIF p_type IN ('debit', 'points_redeem') THEN
    UPDATE public.users
    SET wallet_balance = wallet_balance - p_amount,
        loyalty_points = loyalty_points - p_points
    WHERE id = p_user_id
    RETURNING wallet_balance, loyalty_points INTO v_new_balance, v_new_points;
  ELSIF p_type = 'reward' THEN
    UPDATE public.users
    SET loyalty_points = loyalty_points + p_points
    WHERE id = p_user_id
    RETURNING wallet_balance, loyalty_points INTO v_new_balance, v_new_points;
  END IF;

  -- حدّث المستوى (loyalty_tier) حسب النقاط
  v_new_tier := CASE
    WHEN v_new_points >= 1000 THEN 'diamond'
    WHEN v_new_points >= 500 THEN 'platinum'
    WHEN v_new_points >= 100 THEN 'gold'
    ELSE 'silver'
  END;

  UPDATE public.users
  SET loyalty_tier = v_new_tier
  WHERE id = p_user_id;

  -- سجّل المعاملة
  INSERT INTO public.wallet_transactions (
    user_id, transaction_type, amount, points,
    balance_after, points_after,
    description, reference_type, reference_id
  ) VALUES (
    p_user_id, p_type, p_amount, p_points,
    v_new_balance, v_new_points,
    p_description, p_reference_type, p_reference_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

COMMENT ON TABLE public.wallet_transactions IS 'سجل معاملات المحفظة والنقاط';
COMMENT ON FUNCTION public.add_wallet_transaction IS 'إضافة معاملة + تحديث الرصيد بعمل atomic';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 28 applied: Wallet & Loyalty';
END $$;


-- ─── 30_coupon_redemptions.sql ───
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


-- ─── 31_beta_launch.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🚀 Migration 31: Beta Launch System (V25.14)
-- ════════════════════════════════════════════════════════════════════
-- نظام كامل لإطلاق Beta:
--   1. launch_checklist - قائمة مهام الإطلاق
--   2. beta_codes - رموز دعوات Beta
--   3. user_feedback - استطلاعات + اقتراحات
--   4. bug_reports - تقارير الأعطال من المستخدمين
--   5. changelog_entries - ما الجديد
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Launch Checklist ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.launch_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'technical',       -- تقني
    'content',         -- محتوى
    'legal',           -- قانوني
    'marketing',       -- تسويق
    'operations',      -- عمليات
    'security'         -- أمان
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.users(id),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_category ON public.launch_checklist(category, is_completed, order_index);

ALTER TABLE public.launch_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_admin" ON public.launch_checklist;
CREATE POLICY "checklist_admin"
  ON public.launch_checklist FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 2. Beta Codes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  used_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_codes_active ON public.beta_codes(code, is_active);

ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beta_admin" ON public.beta_codes;
CREATE POLICY "beta_admin"
  ON public.beta_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "beta_select_public" ON public.beta_codes;
CREATE POLICY "beta_select_public"
  ON public.beta_codes FOR SELECT
  USING (is_active = TRUE);

-- ─── 3. User Feedback ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'complaint', 'praise', 'feature_request', 'other')),
  category TEXT NOT NULL CHECK (category IN (
    'booking', 'consultation', 'app_ui', 'doctors', 'pharmacy',
    'pricing', 'support', 'performance', 'other'
  )),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- اختياري
  subject TEXT,
  message TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'archived')),
  admin_notes TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.user_feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.user_feedback(user_id, created_at DESC);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_insert_any" ON public.user_feedback;
CREATE POLICY "feedback_insert_any"
  ON public.user_feedback FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "feedback_select_own" ON public.user_feedback;
CREATE POLICY "feedback_select_own"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_admin" ON public.user_feedback;
CREATE POLICY "feedback_admin"
  ON public.user_feedback FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 4. Bug Reports ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'wont_fix', 'duplicate')),
  page_url TEXT,
  browser TEXT,
  device TEXT,
  screenshot_url TEXT,
  user_agent TEXT,
  admin_notes TEXT,
  fixed_in_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  fixed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bugs_status ON public.bug_reports(status, severity, created_at DESC);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bugs_insert_any" ON public.bug_reports;
CREATE POLICY "bugs_insert_any"
  ON public.bug_reports FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "bugs_select_own" ON public.bug_reports;
CREATE POLICY "bugs_select_own"
  ON public.bug_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bugs_admin" ON public.bug_reports;
CREATE POLICY "bugs_admin"
  ON public.bug_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 5. Changelog ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  release_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  improvements TEXT[] DEFAULT ARRAY[]::TEXT[],
  fixes TEXT[] DEFAULT ARRAY[]::TEXT[],
  breaking_changes TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changelog_published ON public.changelog_entries(is_published, release_date DESC);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "changelog_read_published" ON public.changelog_entries;
CREATE POLICY "changelog_read_published"
  ON public.changelog_entries FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "changelog_admin" ON public.changelog_entries;
CREATE POLICY "changelog_admin"
  ON public.changelog_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ════════════════════════════════════════════════════════════════════
-- 🌱 Seed: 50 بنداً للـ checklist
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.launch_checklist (category, title, description, priority, order_index, is_completed) VALUES
-- Technical (15)
('technical', 'TypeScript بدون أخطاء', 'npx tsc --noEmit يعطي 0 errors', 'critical', 1, true),
('technical', 'ESLint بدون تحذيرات', 'npx next lint --quiet نظيف', 'critical', 2, true),
('technical', 'Build ناجح في production', 'npx next build ينجح بدون مشاكل', 'critical', 3, true),
('technical', 'الـ Database migrations مُطبّقة', 'كل الـ 31 migration تم تشغيلها على Supabase production', 'critical', 4, false),
('technical', 'RLS policies على كل الجداول الحسّاسة', 'فحص يدوي للجداول الحرجة', 'critical', 5, false),
('technical', 'env vars في Vercel', 'كل المفاتيح المطلوبة مُعرّفة في production', 'critical', 6, false),
('technical', 'Health check يعمل', '/api/monitoring/health يرجع 200', 'high', 7, false),
('technical', 'Push notifications تعمل', 'تجربة push على جهاز حقيقي', 'high', 8, false),
('technical', 'Email يصل بنجاح', 'تجربة Resend مع إيميل حقيقي', 'high', 9, false),
('technical', 'WhatsApp OTP يصل', 'تجربة OTP على رقم حقيقي', 'high', 10, false),
('technical', 'الـ Cron jobs مُجدوَلة', 'appointment reminders + notifications process', 'high', 11, false),
('technical', 'CDN + caching مُهيّأ', 'Vercel CDN يعمل', 'medium', 12, false),
('technical', 'Source maps مرفوعة لـ Sentry', 'لو Sentry مُفعّل', 'low', 13, false),
('technical', 'Lighthouse Score > 90', 'Performance + Accessibility + SEO', 'high', 14, false),
('technical', 'Mobile responsive 100%', 'فحص يدوي على أجهزة فعلية', 'critical', 15, false),

-- Content (10)
('content', 'كل الصفحات مُترجمة عربياً', 'لا يوجد placeholders بالإنجليزية', 'critical', 16, true),
('content', 'كل الـ TODOs محذوفة', 'بحث عن TODO/FIXME في الكود', 'high', 17, true),
('content', '20+ مقال في المدونة', 'محتوى SEO جاهز', 'high', 18, true),
('content', '10+ طبيب جاهز في القاعدة', 'بيانات حقيقية', 'high', 19, true),
('content', '25+ مستشفى جاهز', 'كل المحافظات', 'high', 20, true),
('content', '30+ صيدلية جاهزة', 'تغطية جغرافية', 'high', 21, true),
('content', '50+ دواء في الكتالوج', 'الأدوية الشائعة', 'high', 22, true),
('content', 'صور OG لكل صفحة رئيسية', 'للمشاركة على السوشيال ميديا', 'medium', 23, false),
('content', 'Favicon + Apple touch icons', 'كل الأحجام موجودة', 'medium', 24, false),
('content', 'النص في صفحات الـ Empty States', 'كل النصوص مُراجعة', 'medium', 25, true),

-- Legal (8)
('legal', 'سياسة الخصوصية محدّثة', '/legal/privacy جاهزة', 'critical', 26, true),
('legal', 'شروط الاستخدام محدّثة', '/legal/terms جاهزة', 'critical', 27, true),
('legal', 'سياسة الكوكيز', '/legal/cookies جاهزة', 'critical', 28, true),
('legal', 'سياسة الاسترداد', '/legal/refund جاهزة', 'critical', 29, true),
('legal', 'إخلاء المسؤولية الطبي', '/legal/disclaimer جاهز', 'critical', 30, true),
('legal', 'Cookie consent banner يعمل', 'GDPR compliant', 'critical', 31, true),
('legal', 'مسجّل لدى وزارة الصحة', 'لو يلزم', 'high', 32, false),
('legal', 'مسجّل تجارياً', 'سجل تجاري نشط', 'high', 33, false),

-- Marketing (8)
('marketing', 'Landing page محسّنة', 'الصفحة الرئيسية', 'critical', 34, true),
('marketing', 'صفحة About جاهزة', '/about', 'high', 35, true),
('marketing', 'صفحة FAQ شاملة', '/faq', 'high', 36, true),
('marketing', 'صفحة Contact', '/contact', 'high', 37, true),
('marketing', 'حسابات السوشيال ميديا', 'Twitter, Instagram, Facebook', 'medium', 38, false),
('marketing', 'Domain custom', 'spirmedical.com بدل vercel.app', 'high', 39, false),
('marketing', 'Google Analytics + Search Console', 'تتبّع الزوار', 'high', 40, false),
('marketing', 'حملة Pre-launch جاهزة', 'إعلانات + بريد + سوشيال', 'medium', 41, false),

-- Operations (5)
('operations', 'فريق الدعم جاهز', 'موظفون مدرّبون', 'critical', 42, false),
('operations', 'هاتف الدعم نشط', '+9647700000000', 'critical', 43, false),
('operations', 'WhatsApp Business نشط', 'للرد على المرضى', 'critical', 44, false),
('operations', 'الأطباء وُقّعوا العقود', 'الأطباء على المنصة', 'high', 45, false),
('operations', 'صلاحيات الـ admin مُعرّفة', 'كل أدوار الفريق', 'high', 46, false),

-- Security (4)
('security', 'كلمات السر قوية', 'admin passwords > 16 char', 'critical', 47, false),
('security', '2FA على حسابات الـ admin', 'إن أمكن', 'high', 48, false),
('security', 'Backup يومي يعمل', 'تأكيد من workflow', 'critical', 49, false),
('security', 'Rate limiting مُفعّل', 'حماية من DDoS', 'high', 50, false);

-- ─── Seed: Beta codes ───
INSERT INTO public.beta_codes (code, description, max_uses) VALUES
  ('BETA-EARLY-2026',    'Early adopters - 100 use',     100),
  ('BETA-FAMILY-50',     'Family beta program',          50),
  ('BETA-DOCTORS-30',    'Doctor invites',               30),
  ('BETA-PRESS',         'Press & journalists',          20),
  ('BETA-VIP',           'VIP / Partners',               10)
ON CONFLICT (code) DO NOTHING;

-- ─── Seed: First changelog entry ───
INSERT INTO public.changelog_entries (
  version, release_date, title, summary,
  features, improvements, is_published, created_at
) VALUES (
  'V25.14',
  CURRENT_DATE,
  '🚀 إطلاق Beta',
  'الإصدار الأول من Spir Medical جاهز للجمهور المحدود',
  ARRAY[
    'حجز سحب دم منزلي',
    'حجز خدمات تمريض',
    'طبيب العائلة باشتراك شهري/سنوي',
    'دليل 25+ مستشفى في 18 محافظة',
    '30+ صيدلية + 50+ دواء',
    'استشارات طبية مع الأطباء',
    'إدارة العائلة (حتى 10 أفراد)',
    'نظام نقاط ولاء (4 مستويات)',
    'تنبيهات WhatsApp + Push',
    'سجل طبي شخصي مُشفّر'
  ],
  ARRAY[
    'تصميم محسّن للجوال',
    'سرعة تحميل أعلى',
    'دعم RTL كامل'
  ],
  TRUE,
  now()
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.launch_checklist IS 'قائمة مهام الإطلاق - 50 بنداً';
COMMENT ON TABLE public.beta_codes IS 'رموز دعوات Beta';
COMMENT ON TABLE public.user_feedback IS 'استطلاعات + اقتراحات المستخدمين';
COMMENT ON TABLE public.bug_reports IS 'تقارير الأعطال';
COMMENT ON TABLE public.changelog_entries IS 'ما الجديد - سجل التحديثات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 31 applied: Beta Launch System';
  RAISE NOTICE '   - launch_checklist: 50 items seeded';
  RAISE NOTICE '   - beta_codes: 5 codes seeded';
  RAISE NOTICE '   - changelog: V25.14 entry';
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- 👑 V33: طلبات صلاحية الأدمن (نظام الموافقة)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  email        text NOT NULL,
  requested_role text NOT NULL DEFAULT 'support'
    CHECK (requested_role IN ('support', 'manager', 'admin')),
  reason       text,
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_status
  ON public.admin_requests (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_requests_pending_user
  ON public.admin_requests (user_id) WHERE status = 'pending';

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى طلبه، والأدمن يرى الكل
DROP POLICY IF EXISTS "admin_requests_select" ON public.admin_requests;
CREATE POLICY "admin_requests_select" ON public.admin_requests FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- المستخدم ينشئ طلبه فقط
DROP POLICY IF EXISTS "admin_requests_insert" ON public.admin_requests;
CREATE POLICY "admin_requests_insert" ON public.admin_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- super_admin فقط يوافق/يرفض
DROP POLICY IF EXISTS "admin_requests_update" ON public.admin_requests;
CREATE POLICY "admin_requests_update" ON public.admin_requests FOR UPDATE
  USING (public.is_super_admin(auth.uid()));



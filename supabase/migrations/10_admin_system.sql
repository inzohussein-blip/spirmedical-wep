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

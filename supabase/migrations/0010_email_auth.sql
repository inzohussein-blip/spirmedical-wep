-- ═══════════════════════════════════════════════════════════════════
-- 0002 — Email Auth (يعمل بعد 0001)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف أعمدة البريد إلى users + جداول email_verification_tokens و
-- specialist_applications + سياساتها ودوالها.
-- 🔧 إصلاح ترتيب: كان 001 يسبق الملف المدمج فتُمحى جداوله بالـ DROP؛ الآن بعد الأساس.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- Email-First Auth Migration
-- Spir Medical v2 - Complete Rewrite
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. تحديث جدول users (إضافة حقول الإيميل)
-- ─────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email text UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS signup_method text DEFAULT 'phone'
    CHECK (signup_method IN ('email', 'google', 'phone')),
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_email_verified_idx ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS users_signup_method_idx ON public.users(signup_method);

-- ─────────────────────────────────────────────────────────
-- 2. جدول التحقق من الإيميل (جديد)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx 
  ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS email_verification_tokens_token_idx 
  ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS email_verification_tokens_expires_at_idx 
  ON public.email_verification_tokens(expires_at);

-- ─────────────────────────────────────────────────────────
-- 3. جدول طلبات الأخصائيين (جديد)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.specialist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- الخطوات (timestamps)
  step_1_completed_at timestamptz,
  step_2_completed_at timestamptz,
  step_3_completed_at timestamptz,
  step_4_completed_at timestamptz,
  
  -- البيانات المهنية
  professional_data jsonb DEFAULT '{}'::jsonb,
  
  -- الملفات
  documents jsonb DEFAULT '{}'::jsonb,
  
  -- الموافقة
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  
  -- التتبع
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS specialist_applications_user_id_idx 
  ON public.specialist_applications(user_id);
CREATE INDEX IF NOT EXISTS specialist_applications_status_idx 
  ON public.specialist_applications(status);
CREATE INDEX IF NOT EXISTS specialist_applications_created_at_idx 
  ON public.specialist_applications(created_at DESC);

-- ─────────────────────────────────────────────────────────
-- 4. RLS Policies
-- ─────────────────────────────────────────────────────────

-- Email verification tokens
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_create_token" ON public.email_verification_tokens;
CREATE POLICY "anyone_can_create_token" ON public.email_verification_tokens
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "token_owner_can_read" ON public.email_verification_tokens;
CREATE POLICY "token_owner_can_read" ON public.email_verification_tokens
  FOR SELECT USING (user_id = auth.uid());

-- Specialist applications
ALTER TABLE public.specialist_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specialist_can_read_own_app" ON public.specialist_applications;
CREATE POLICY "specialist_can_read_own_app" ON public.specialist_applications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "specialist_can_update_own_app" ON public.specialist_applications;
CREATE POLICY "specialist_can_update_own_app" ON public.specialist_applications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_can_read_all_apps" ON public.specialist_applications;
CREATE POLICY "admins_can_read_all_apps" ON public.specialist_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "admins_can_update_apps" ON public.specialist_applications;
CREATE POLICY "admins_can_update_apps" ON public.specialist_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ─────────────────────────────────────────────────────────
-- 5. Cleanup function (cron job)
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_verification_tokens
  WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily
-- (setup in Vercel: /api/cron/cleanup-tokens)

-- ─────────────────────────────────────────────────────────
-- 6. Trigger لتحديث updated_at في specialist_applications
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_specialist_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS specialist_applications_updated_at_trigger ON public.specialist_applications;
CREATE TRIGGER specialist_applications_updated_at_trigger
  BEFORE UPDATE ON public.specialist_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_specialist_applications_updated_at();

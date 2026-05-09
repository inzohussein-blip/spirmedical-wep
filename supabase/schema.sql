-- ============================================================
-- Spir Medical · سباير ميديكال
-- Database Schema for Supabase (Postgres 15+)
-- Project: ioulxemokusfeykjcaxg
-- Version: 0.2.0 (with audit logs + security fixes)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'specialist', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  email VARCHAR(255) UNIQUE,
  role user_role DEFAULT 'patient' NOT NULL,
  governorate VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================================
-- TABLE: appointments (with optional encrypted notes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  address TEXT NOT NULL,
  -- notes_encrypted: نص حساس مشفّر بـ AES-256-GCM (عبر app layer)
  notes_encrypted TEXT,
  notes TEXT, -- ملاحظات عامة غير حساسة (سيُلغى لصالح encrypted)
  status appointment_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);

-- ============================================================
-- TABLE: audit_logs (CRITICAL for medical apps)
-- ============================================================
-- يسجّل كل وصول لبيانات حساسة + تغييرات.
-- Immutable: لا UPDATE ولا DELETE من المستخدمين العاديين.
-- يُستخدم service_role key للكتابة فقط.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'auth.login', 'appointment.create', إلخ
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- إنشاء سجل users تلقائياً عند تسجيل auth.users جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', 'unknown'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- منع UPDATE و DELETE على audit_logs (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'سجلات التدقيق immutable - لا يمكن التعديل أو الحذف';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON public.audit_logs;
CREATE TRIGGER audit_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS audit_no_delete ON public.audit_logs;
CREATE TRIGGER audit_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── سياسات users ───
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_admin_select_all" ON public.users;
CREATE POLICY "users_admin_select_all"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─── سياسات appointments ───
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
CREATE POLICY "appointments_select_own"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;
CREATE POLICY "appointments_insert_own"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
CREATE POLICY "appointments_update_own"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_delete_own" ON public.appointments;
CREATE POLICY "appointments_delete_own"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_admin_select_all" ON public.appointments;
CREATE POLICY "appointments_admin_select_all"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─── سياسات audit_logs ───
-- المستخدم يرى سجلاته فقط
DROP POLICY IF EXISTS "audit_select_own" ON public.audit_logs;
CREATE POLICY "audit_select_own"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- الأدمن يرى كل السجلات
DROP POLICY IF EXISTS "audit_admin_select_all" ON public.audit_logs;
CREATE POLICY "audit_admin_select_all"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- INSERT يمر فقط عبر service_role (من الـ app layer)
-- لا policy للـ INSERT العادي = no inserts من anon/authenticated

-- ============================================================
-- VIEWS (with security_invoker for proper RLS)
-- ============================================================

DROP VIEW IF EXISTS public.appointments_with_users;
CREATE VIEW public.appointments_with_users
  WITH (security_invoker = true) AS
SELECT 
  a.*,
  u.full_name as user_full_name,
  u.phone as user_phone
FROM public.appointments a
JOIN public.users u ON u.id = a.user_id;

-- ============================================================
-- DONE
-- ============================================================
-- بعد التشغيل:
-- 1. Authentication → Providers → فعّل Phone OTP
-- 2. لجعل أحد المستخدمين أدمن:
--    UPDATE public.users SET role = 'admin' WHERE phone = '+9647XXXXXXXXX';
-- 3. أضف ENCRYPTION_KEY في env (32 bytes hex):
--    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
-- ============================================================

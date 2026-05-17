-- ════════════════════════════════════════════════════════════════════
-- 🏗️ Migration 01: FOUNDATION (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- Extensions, Types, Core Tables (users, appointments, audit_logs)
-- يجب تشغيله أولاً
-- ════════════════════════════════════════════════════════════════════

-- ────────────── Extensions ──────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ────────────── Enum Types ──────────────
-- 🔧 V24: نضيف كل الأدوار الإدارية من البداية لتجنّب ALTER TYPE لاحقاً
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'patient',
    'specialist',
    'admin',           -- legacy للتوافق العكسي
    'super_admin',     -- 🆕 أعلى صلاحيات
    'manager',         -- 🆕 إدارة عامة
    'support'          -- 🆕 دعم فني
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 🔧 V24: إزالة القيم غير المستخدمة (awaiting_payment, rated)
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ════════════════════════════════════════════════════════════════════
-- 👤 USERS TABLE
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  email VARCHAR(255) UNIQUE,
  role user_role DEFAULT 'patient' NOT NULL,
  governorate VARCHAR(50),

  -- معلومات إضافية للأخصائيين
  specialty VARCHAR(100),
  license_number VARCHAR(50),
  bio TEXT,

  -- إعدادات
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,

  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_governorate ON public.users(governorate);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- 📅 APPOINTMENTS TABLE
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- خدمة
  service_type VARCHAR(100) NOT NULL,
  service_id VARCHAR(100),

  -- أخصائي (سيتم استخدام assigned_specialist_id في 09)
  specialist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- الجدولة
  scheduled_at TIMESTAMPTZ NOT NULL,
  address TEXT NOT NULL,

  -- 🔧 V24: notes_encrypted فقط (احتفظنا بـ notes للتوافق الرجعي - سيتم حذفه في migration لاحق)
  -- ملاحظات مشفّرة بـ AES-256-GCM
  notes_encrypted TEXT,
  notes TEXT,  -- ⚠️ DEPRECATED: لا تكتب فيه - استخدم notes_encrypted

  -- بيانات
  estimated_price INTEGER,
  duration_minutes INTEGER,
  otp_channel VARCHAR(20),

  -- الحالة
  status appointment_status DEFAULT 'pending' NOT NULL,

  -- تواريخ
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_specialist ON public.appointments(specialist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON public.appointments(created_at DESC);


-- ════════════════════════════════════════════════════════════════════
-- 📋 AUDIT LOGS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);


-- ════════════════════════════════════════════════════════════════════
-- 🔧 Helper Functions
-- ════════════════════════════════════════════════════════════════════

-- Function: تحديث updated_at تلقائياً (الاسم الموحّد في كل المشروع)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ════════════════════════════════════════════════════════════════════
-- ⚙️ Triggers
-- ════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 🔐 RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ─── Users Policies ───
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Specialists can view patients in their appointments" ON public.users;
CREATE POLICY "Specialists can view patients in their appointments" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.specialist_id = auth.uid()
      AND appointments.user_id = users.id
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access users" ON public.users;
CREATE POLICY "Service role full access users" ON public.users
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');


-- ─── Appointments Policies ───
DROP POLICY IF EXISTS "Users see own appointments" ON public.appointments;
CREATE POLICY "Users see own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = specialist_id);

DROP POLICY IF EXISTS "Users create own appointments" ON public.appointments;
CREATE POLICY "Users create own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own appointments" ON public.appointments;
CREATE POLICY "Users update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = specialist_id);


-- ─── Audit Logs (read-only للمستخدمين) ───
DROP POLICY IF EXISTS "Users see own audit logs" ON public.audit_logs;
CREATE POLICY "Users see own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════
-- 👤 Auto-create user profile عند التسجيل (V24 — يدعم email signups)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  fallback_phone TEXT;
BEGIN
  -- 🔧 V24: توليد phone مؤقت إذا غير موجود (لدعم email/social signups)
  fallback_phone := COALESCE(
    NEW.phone,
    '+temp_' || substring(NEW.id::text, 1, 12)
  );

  INSERT INTO public.users (id, phone, email, role)
  VALUES (
    NEW.id,
    fallback_phone,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- في حالة فشل (مثلاً phone duplicate)، لا نُفشل الـ auth signup
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 01 Complete
-- ════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.users IS 'ملفات المستخدمين - مرضى وأخصائيون ومديرون';
COMMENT ON TABLE public.appointments IS 'المواعيد الطبية';
COMMENT ON TABLE public.audit_logs IS 'سجل العمليات المهمة';
COMMENT ON COLUMN public.appointments.notes IS 'DEPRECATED: استخدم notes_encrypted بدلاً منه';

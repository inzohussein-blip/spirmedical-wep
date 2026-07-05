-- ═══════════════════════════════════════════════════════════════════
-- 0001 — Core Foundation (Spir Medical)
-- ═══════════════════════════════════════════════════════════════════
-- أول وحدة في خط الأساس: الامتدادات + الأنواع (ENUMs) + الجداول الأساسية
-- (users, appointments, audit_logs، أدوار CRM، العائلة، الثيم، Realtime).
-- ✅ غير مُدمِّر: CREATE ... IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- الترتيب: 0001 → 0009 يبنيان المخطط الكامل (88 جدولاً)، ثم 0010_email_auth.
-- ⚠️ لإعادة بناء بيئة من الصفر استخدم supabase/reset/drop_all_public.sql أولاً.
-- راجع README.md في هذا المجلد.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 01_foundation.sql ───
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

-- 🔧 V33: أعمدة المختصّين (نُقلت من 05 — تُستخدم في policies مبكّرة بـ 03/04)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS specialist_type text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS specialist_bio text,
  ADD COLUMN IF NOT EXISTS specialist_certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specialist_years_exp integer,
  ADD COLUMN IF NOT EXISTS specialist_languages text[] DEFAULT ARRAY['ar']::text[],
  ADD COLUMN IF NOT EXISTS auto_reply_message text DEFAULT 'مرحباً! استلمنا طلبك وسنرد عليك في أقرب وقت. شكراً لاختياركم Spir Medical.',
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS specializations text[],
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

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


-- ─── 02_security.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🔐 Migration 02: SECURITY & RATE LIMITING (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- Idempotency keys + Rate limiting buckets + OTP attempts
-- 🔧 V24: إصلاح cleanup functions (DELETE...RETURNING غلط)
-- 🔧 V24: إضافة SECURITY DEFINER للـ cleanup functions
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 🔑 IDEMPOTENCY KEYS
-- ════════════════════════════════════════════════════════════════════
-- منع تكرار العمليات (مثل: ضغط زر "إنشاء حجز" مرتين)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  result JSONB,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_user ON public.idempotency_keys(user_id);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only - idempotency" ON public.idempotency_keys;
CREATE POLICY "Service role only - idempotency" ON public.idempotency_keys
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');


-- ════════════════════════════════════════════════════════════════════
-- 🚦 RATE LIMIT BUCKETS
-- ════════════════════════════════════════════════════════════════════
-- Fallback لـ Upstash Redis - يستخدم DB إذا Redis غير متاح
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_reset ON public.rate_limit_buckets(reset_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only - rate limits" ON public.rate_limit_buckets;
CREATE POLICY "Service role only - rate limits" ON public.rate_limit_buckets
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');


-- ════════════════════════════════════════════════════════════════════
-- 📱 OTP ATTEMPTS
-- ════════════════════════════════════════════════════════════════════
-- تتبّع محاولات OTP لمنع brute-force
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.otp_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  blocked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_attempts(phone);
CREATE INDEX IF NOT EXISTS idx_otp_blocked ON public.otp_attempts(blocked_until)
  WHERE blocked_until IS NOT NULL;

ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only - otp" ON public.otp_attempts;
CREATE POLICY "Service role only - otp" ON public.otp_attempts
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');


-- ════════════════════════════════════════════════════════════════════
-- 📞 USER TELEGRAM LINKS
-- ════════════════════════════════════════════════════════════════════
-- ربط حساب المستخدم بـ Telegram لاستلام OTP
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_telegram_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(100),
  linked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_telegram_user ON public.user_telegram_links(user_id);

ALTER TABLE public.user_telegram_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own telegram links" ON public.user_telegram_links;
CREATE POLICY "Users see own telegram links" ON public.user_telegram_links
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own telegram links" ON public.user_telegram_links;
CREATE POLICY "Users delete own telegram links" ON public.user_telegram_links
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access telegram" ON public.user_telegram_links;
CREATE POLICY "Service role full access telegram" ON public.user_telegram_links
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');


-- ════════════════════════════════════════════════════════════════════
-- 🧹 Cleanup Functions (V24 — مُصحَّح بـ GET DIAGNOSTICS)
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V24: استبدال DELETE...RETURNING 1 بـ GET DIAGNOSTICS ROW_COUNT
-- 🔧 V24: إضافة SECURITY DEFINER لتجاوز RLS عند الاستدعاء من cron

-- تنظيف الـ idempotency keys المنتهية
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تنظيف rate limit buckets المنتهية
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_buckets
  WHERE reset_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تنظيف OTP attempts القديمة
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.otp_attempts
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < NOW());

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════════
-- ⏰ pg_cron Schedules (V24 — جديد)
-- ════════════════════════════════════════════════════════════════════
-- 🟨 يتطلب تفعيل pg_cron من Supabase Dashboard:
--    Database → Extensions → pg_cron → Enable

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- إزالة الـ jobs القديمة (إن وُجدت)
    BEGIN PERFORM cron.unschedule('spir-cleanup-idempotency');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN PERFORM cron.unschedule('spir-cleanup-rate-limits');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN PERFORM cron.unschedule('spir-cleanup-otps');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- تنظيف idempotency_keys كل ساعة
    PERFORM cron.schedule(
      'spir-cleanup-idempotency',
      '0 * * * *',
      'SELECT public.cleanup_expired_idempotency();'
    );

    -- تنظيف rate_limit_buckets كل 15 دقيقة
    PERFORM cron.schedule(
      'spir-cleanup-rate-limits',
      '*/15 * * * *',
      'SELECT public.cleanup_expired_rate_limits();'
    );

    -- تنظيف otp_attempts كل ساعة
    PERFORM cron.schedule(
      'spir-cleanup-otps',
      '0 * * * *',
      'SELECT public.cleanup_expired_otps();'
    );

    RAISE NOTICE '✅ pg_cron schedules created successfully';
  ELSE
    RAISE NOTICE '⚠️ pg_cron extension not enabled. Cleanup jobs not scheduled. Enable from Supabase Dashboard → Database → Extensions.';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 02 Complete
-- ════════════════════════════════════════════════════════════════════


-- ─── 23_family_members.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 👨‍👩‍👧‍👦 Migration 23: Family Members (V25.8)
-- ════════════════════════════════════════════════════════════════════
-- نظام موحّد لإدارة أفراد العائلة:
--   - المريض يضيف أفراد عائلته
--   - أي طلب يمكن ربطه بفرد عائلة بدل نفسه
--   - المختص يرى اسم الفرد المعني تلقائياً
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. جدول أفراد العائلة ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- صاحب الحساب الأساسي
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- بيانات الفرد
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
    -- 'spouse' (زوج/زوجة)
    -- 'father' (أب)
    -- 'mother' (أم)
    -- 'son' (ابن)
    -- 'daughter' (ابنة)
    -- 'brother' (أخ)
    -- 'sister' (أخت)
    -- 'grandfather' (جد)
    -- 'grandmother' (جدة)
    -- 'other' (أخرى)
  
  -- الجنس + العمر (مهم للأطباء)
  gender TEXT CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  
  -- التواصل (اختياري - قد يكون للطفل لا رقم)
  phone TEXT,
  
  -- المعلومات الطبية الأساسية (للتشخيص السريع)
  blood_type TEXT,                  -- 'A+', 'O-', etc
  height_cm INTEGER,
  weight_kg NUMERIC,
  chronic_conditions TEXT[],        -- مثل: ['diabetes', 'hypertension']
  allergies TEXT[],                 -- مثل: ['penicillin', 'lactose']
  current_medications TEXT,         -- نص حر
  notes TEXT,                       -- ملاحظات إضافية
  
  -- صورة شخصية (اختياري)
  avatar_emoji TEXT DEFAULT '👤',   -- إيموجي افتراضي
  
  -- إعدادات
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_owner 
  ON public.family_members(owner_user_id) 
  WHERE is_active = TRUE;

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- ─── ربط appointments بفرد العائلة (يجب أن يسبق الـ policies التي تستخدمه) ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS family_member_id UUID 
    REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_family_member 
  ON public.appointments(family_member_id) 
  WHERE family_member_id IS NOT NULL;

-- قراءة: صاحب الحساب + المختصون الذين لديهم طلبات لهذا الفرد + الأدمن
DROP POLICY IF EXISTS "family_members_select_own" ON public.family_members;
CREATE POLICY "family_members_select_own"
  ON public.family_members FOR SELECT
  USING (
    auth.uid() = owner_user_id
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.family_member_id = family_members.id
        AND a.specialist_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- إدراج: صاحب الحساب فقط
DROP POLICY IF EXISTS "family_members_insert_own" ON public.family_members;
CREATE POLICY "family_members_insert_own"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- تعديل: صاحب الحساب فقط
DROP POLICY IF EXISTS "family_members_update_own" ON public.family_members;
CREATE POLICY "family_members_update_own"
  ON public.family_members FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- حذف: صاحب الحساب فقط
DROP POLICY IF EXISTS "family_members_delete_own" ON public.family_members;
CREATE POLICY "family_members_delete_own"
  ON public.family_members FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ملاحظة: ربط nursing_visit_history.family_member_id يتم في الملف 05
-- (حيث يُنشأ جدول nursing_visit_history).

-- ─── 4. View: عرض الطلب مع معلومات الفرد ────────────────
CREATE OR REPLACE VIEW public.appointments_with_target AS
SELECT
  a.*,
  COALESCE(fm.full_name, owner.full_name) as target_name,
  fm.gender as target_gender,
  COALESCE(
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, fm.date_of_birth))::int,
    NULL
  ) as target_age,
  fm.chronic_conditions as target_chronic_conditions,
  fm.allergies as target_allergies,
  fm.relation as target_relation,
  fm.avatar_emoji as target_avatar,
  CASE WHEN a.family_member_id IS NULL THEN 'self' ELSE 'family' END as target_type
FROM public.appointments a
LEFT JOIN public.family_members fm ON fm.id = a.family_member_id
LEFT JOIN public.users owner ON owner.id = a.user_id;

-- ─── 5. تعليقات ──────────────────────────────────────
COMMENT ON TABLE public.family_members IS
  'أفراد عائلة المستخدم - لتسجيل طلبات لغيره';

COMMENT ON COLUMN public.appointments.family_member_id IS
  'إذا NULL: الطلب لصاحب الحساب. غير NULL: لأحد أفراد عائلته';

COMMENT ON VIEW public.appointments_with_target IS
  'الطلبات مع المعلومات الكاملة عن المريض المعني (سواء المستخدم نفسه أو فرد عائلة)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 23 applied: Family Members system';
END $$;


-- ─── 13_app_theme.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🎨 Migration 13: App Theme Settings (V25 — Dynamic Theme System)
-- ════════════════════════════════════════════════════════════════════
-- يسمح للـ super_admin بتخصيص ألوان المنصة من admin44
-- الجدول يحوي صف واحد فقط (singleton row)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. الجدول ───
CREATE TABLE IF NOT EXISTS public.app_theme_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 5 ألوان رئيسية قابلة للتخصيص
  -- يجب أن تكون hex codes صحيحة (#RRGGBB)
  primary_color       text NOT NULL DEFAULT '#0E5C4D',  -- emerald
  primary_dark        text NOT NULL DEFAULT '#073B30',  -- emerald-deep
  primary_soft        text NOT NULL DEFAULT '#D9E5DF',  -- emerald-soft (highlights)
  accent_color        text NOT NULL DEFAULT '#B8540C',  -- amber (warnings)
  danger_color        text NOT NULL DEFAULT '#A82E3D',  -- rose (errors)

  -- اسم الـ theme (للعرض في admin)
  theme_name          text NOT NULL DEFAULT 'Default · افتراضي',

  -- هل مفعّل؟ (مفيد لاحقاً إذا أردنا multiple themes)
  is_active           boolean NOT NULL DEFAULT true,

  -- audit
  updated_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- ضمان وجود صف واحد فعّال
  CONSTRAINT valid_primary_color CHECK (primary_color ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_primary_dark CHECK (primary_dark ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_primary_soft CHECK (primary_soft ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_accent CHECK (accent_color ~* '^#[0-9a-f]{6}$'),
  CONSTRAINT valid_danger CHECK (danger_color ~* '^#[0-9a-f]{6}$')
);

-- فهرس على is_active لجلب الـ active theme بسرعة
CREATE INDEX IF NOT EXISTS idx_app_theme_active ON public.app_theme_settings(is_active) WHERE is_active = true;

-- ─── 2. trigger لتحديث updated_at تلقائياً ───
CREATE OR REPLACE FUNCTION public.update_theme_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_theme_updated_at ON public.app_theme_settings;
CREATE TRIGGER trg_theme_updated_at
  BEFORE UPDATE ON public.app_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_theme_updated_at();

-- ─── 3. Seed: إضافة الـ theme الافتراضي إن لم يوجد ───
INSERT INTO public.app_theme_settings (
  primary_color, primary_dark, primary_soft, accent_color, danger_color, theme_name, is_active
)
SELECT
  '#0E5C4D', '#073B30', '#D9E5DF', '#B8540C', '#A82E3D',
  'Default · افتراضي',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_theme_settings WHERE is_active = true
);

-- ─── 4. RLS Policies ───
ALTER TABLE public.app_theme_settings ENABLE ROW LEVEL SECURITY;

-- الجميع يقرأ (التطبيق يحتاج الألوان قبل تسجيل الدخول)
DROP POLICY IF EXISTS theme_read_all ON public.app_theme_settings;
CREATE POLICY theme_read_all
  ON public.app_theme_settings
  FOR SELECT
  USING (true);

-- فقط super_admin يعدّل
DROP POLICY IF EXISTS theme_update_super_admin ON public.app_theme_settings;
CREATE POLICY theme_update_super_admin
  ON public.app_theme_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- فقط super_admin يضيف themes جديدة (لاحقاً)
DROP POLICY IF EXISTS theme_insert_super_admin ON public.app_theme_settings;
CREATE POLICY theme_insert_super_admin
  ON public.app_theme_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- ─── 5. تعليقات للتوثيق ───
COMMENT ON TABLE public.app_theme_settings IS 'إعدادات ألوان التطبيق - قابلة للتعديل من admin44';
COMMENT ON COLUMN public.app_theme_settings.primary_color IS 'اللون الأساسي (CTAs, headers)';
COMMENT ON COLUMN public.app_theme_settings.primary_dark IS 'اللون الأساسي الداكن (hover states)';
COMMENT ON COLUMN public.app_theme_settings.primary_soft IS 'لون التمييز الناعم (selected items)';
COMMENT ON COLUMN public.app_theme_settings.accent_color IS 'لون التنبيهات (warnings)';
COMMENT ON COLUMN public.app_theme_settings.danger_color IS 'لون الأخطاء (errors, delete)';


-- ─── 05_realtime_admin.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🔴 Migration 05: REALTIME + ADMIN SUPPORT (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- Enable Realtime + Admin views for CRM project
-- 🔧 V24: حذف is_admin (سيُعرّف في 10 بشكل شامل)
-- 🔧 V24: Views بـ security_invoker لاحترام RLS
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 🔴 ENABLE REALTIME
-- ════════════════════════════════════════════════════════════════════

-- إضافة الجداول لـ realtime publication
DO $$
BEGIN
  -- Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- Chats
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  END IF;

  -- Appointments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication setup: %', SQLERRM;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- 👑 ADMIN ROLE HELPER — مؤقت
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V24: تعريف مبدئي بسيط هنا، سيُستبدل بنسخة شاملة في 10_admin_system
-- نحتاجه هنا لأن policies الـ admin تستخدمه في هذا الملف.
-- في 10، سيتم CREATE OR REPLACE له بنسخة تدعم super_admin/manager/support.

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('admin', 'super_admin', 'manager', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ════════════════════════════════════════════════════════════════════
-- 👑 ADMIN POLICIES - يرى كل شيء
-- ════════════════════════════════════════════════════════════════════

-- Admins يرون كل الـ users
DROP POLICY IF EXISTS "Admins see all users" ON public.users;
CREATE POLICY "Admins see all users" ON public.users
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all users" ON public.users;
CREATE POLICY "Admins update all users" ON public.users
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admins يرون كل المواعيد
DROP POLICY IF EXISTS "Admins see all appointments" ON public.appointments;
CREATE POLICY "Admins see all appointments" ON public.appointments
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all appointments" ON public.appointments;
CREATE POLICY "Admins update all appointments" ON public.appointments
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete appointments" ON public.appointments;
CREATE POLICY "Admins delete appointments" ON public.appointments
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Admins يرون كل الـ audit logs
DROP POLICY IF EXISTS "Admins see all audit logs" ON public.audit_logs;
CREATE POLICY "Admins see all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));





-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 05 Complete - الـ DB جاهزة للويب والـ CRM
-- ════════════════════════════════════════════════════════════════════

-- ملاحظة: لإنشاء أول admin user:
-- 1. سجّل عادياً من /register (سيُنشأ كـ patient)
-- 2. في SQL Editor، شغّل:
--    UPDATE public.users SET role = 'super_admin' WHERE phone = '+9647XX...';


-- ─── 06_crm_roles.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🎛️ Migration 06: CRM Roles Extension (V24 — مُبسَّط)
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V24: super_admin/manager/support أُضيفت في 01 مباشرة
--        هذا الملف الآن للأدوار التشغيلية الإضافية فقط (اختياري)
--
-- الأدوار المُعرّفة في 01_foundation:
--   patient, specialist, admin, super_admin, manager, support
--
-- الأدوار الاختيارية لمراحل مستقبلية (تُضاف فقط إذا احتجت):
--   crm_verifier  — للتحقق من مزودي الخدمة
--   crm_lab       — لمشغّلي المختبر
--   crm_dispatcher — للموزّع
--   crm_viewer    — للقراءة فقط (مدققون، شركاء)
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- ⚠️ ملاحظة: لا تُضف هذه الأدوار إلا إذا فعلاً ستستخدمها في الكود
-- ════════════════════════════════════════════════════════════════════
-- ALTER TYPE يعمل على النوع المُعرّف في 01_foundation
-- استخدم ADD VALUE IF NOT EXISTS للأمان

-- أدوار CRM اختيارية (مُعطّلة حالياً - فعّلها عند الحاجة):

-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'crm_verifier';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'crm_lab';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'crm_dispatcher';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'crm_viewer';


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 06 Complete
-- ════════════════════════════════════════════════════════════════════
--
-- 📋 لإنشاء أول super_admin:
--
-- 1) اذهب إلى Supabase Auth:
--    https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg/auth/users
--    → Add user → Create new user
--    → Email: admin@spirmedical.iq
--    → Password: <كلمة قوية>
--    → ✅ Auto Confirm User
--    → Create
--
-- 2) انسخ UUID المُنشأ من Auth Users
--
-- 3) شغّل هذا الـ SQL في SQL Editor (استبدل PASTE_UUID_HERE):
--
-- INSERT INTO public.users (id, phone, full_name, email, role)
-- VALUES (
--   'PASTE_UUID_HERE',
--   '+9647700000000',
--   'المدير العام',
--   'admin@spirmedical.iq',
--   'super_admin'
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   role = 'super_admin',
--   full_name = EXCLUDED.full_name,
--   email = EXCLUDED.email
-- RETURNING id, email, role;
--
-- 4) سجّل دخول في: https://spirmedical-wep.vercel.app/admin44
-- ════════════════════════════════════════════════════════════════════




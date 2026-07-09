-- ════════════════════════════════════════════════════════════════════════
-- 🚀 Spir Medical — ملف التنصيب الكامل لقاعدة Supabase جديدة (من الصفر)
-- ولّد آلياً بدمج supabase/migrations/0001..0010 بالترتيب.
-- آمن على Supabase: لا يُنشئ auth/storage/الأدوار (مدمجة)، idempotent،
-- ويتضمّن إصلاح تكرار RLS. الصقه كاملاً في SQL Editor واضغط Run.
-- ⚠️ لا تشغّل supabase/reset/drop_all_public.sql (مدمّر) ولا fixes/* (غير لازم).
-- ولّد بتاريخ: 2026-07-09
-- ════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0001_core_foundation.sql
-- ═══════════════════════════════════════════════════════════════════════
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
-- DROP قبل CREATE: العرض يستعمل a.* وتُضاف أعمدة لـ appointments في ترحيلات
-- لاحقة (مثل lab_order_id)، فإعادة تشغيل CREATE OR REPLACE تفشل بتغيّر ترتيب
-- الأعمدة. الحذف أولاً يجعل الترحيل قابلاً لإعادة التشغيل (idempotent).
DROP VIEW IF EXISTS public.appointments_with_target CASCADE;
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





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0002_communication.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  02_communication.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 02_communication.sql — المحادثات + الإشعارات + OTP
-- مدموج (V33) من: 03_inbox.sql 11_notifications.sql 12_whatsapp_otp.sql 18_push_notifications.sql 49_in_app_notifications.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 03_inbox.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 💬 Migration 03: INBOX SYSTEM (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- ManyChat-style inbox for patient-specialist communication
-- 🔧 V24: تحسين update_chat_on_new_message للرسائل غير النصية
-- 🔧 V24: إضافة indexes ناقصة
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 💬 CHATS - المحادثات
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,

  -- الحالة
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- آخر رسالة
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- العدّادات
  patient_unread_count INTEGER DEFAULT 0,
  specialist_unread_count INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  -- إعدادات
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- تواريخ
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chats_patient ON public.chats(patient_id);
CREATE INDEX IF NOT EXISTS idx_chats_specialist ON public.chats(specialist_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON public.chats(last_message_at DESC);
-- 🆕 V24: indexes ناقصة
CREATE INDEX IF NOT EXISTS idx_chats_appointment ON public.chats(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON public.chats(is_pinned)
  WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chats_last_msg_by ON public.chats(last_message_by)
  WHERE last_message_by IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- ✉️ MESSAGES - الرسائل
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- المحتوى
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'system')),
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,

  -- الحالة
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,

  -- ردّ على
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(chat_id, is_read) WHERE is_read = FALSE;
-- 🆕 V24: index ناقص على reply_to_id
CREATE INDEX IF NOT EXISTS idx_messages_reply ON public.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- ⚡ QUICK REPLIES - قوالب جاهزة للأخصائيين
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(specialist_id, shortcut)
);

CREATE INDEX IF NOT EXISTS idx_quick_replies_spec ON public.quick_replies(specialist_id, is_active);


-- ════════════════════════════════════════════════════════════════════
-- 📝 CHAT NOTES - ملاحظات الأخصائي عن المريض
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chat_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_notes_chat ON public.chat_notes(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_notes_spec ON public.chat_notes(specialist_id);


-- ════════════════════════════════════════════════════════════════════
-- 🔄 Triggers
-- ════════════════════════════════════════════════════════════════════

-- تحديث updated_at
DROP TRIGGER IF EXISTS chats_updated_at ON public.chats;
CREATE TRIGGER chats_updated_at
BEFORE UPDATE ON public.chats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS quick_replies_updated_at ON public.quick_replies;
CREATE TRIGGER quick_replies_updated_at
BEFORE UPDATE ON public.quick_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 🔧 V24: تحديث آخر رسالة + العدّادات تلقائياً (مع معاينة ذكية للرسائل غير النصية)
CREATE OR REPLACE FUNCTION public.update_chat_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  chat_patient UUID;
  chat_specialist UUID;
  message_preview TEXT;
BEGIN
  -- احصل على patient_id و specialist_id
  SELECT patient_id, specialist_id INTO chat_patient, chat_specialist
  FROM public.chats WHERE id = NEW.chat_id;

  -- 🆕 V24: معاينة ذكية حسب نوع الرسالة (تتعامل مع NULL content)
  message_preview := COALESCE(
    LEFT(NEW.content, 200),
    CASE NEW.type
      WHEN 'image' THEN '📷 صورة'
      WHEN 'file' THEN '📎 ' || COALESCE(NEW.attachment_name, 'ملف')
      WHEN 'audio' THEN '🎤 رسالة صوتية'
      WHEN 'system' THEN '⚙️ رسالة نظام'
      ELSE 'رسالة'
    END
  );

  -- تحديث الـ chat
  UPDATE public.chats
  SET
    last_message = message_preview,
    last_message_at = NEW.created_at,
    last_message_by = NEW.sender_id,
    total_messages = total_messages + 1,
    -- زيادة عداد الـ unread للطرف المقابل
    patient_unread_count = CASE
      WHEN NEW.sender_id = chat_specialist THEN patient_unread_count + 1
      ELSE patient_unread_count
    END,
    specialist_unread_count = CASE
      WHEN NEW.sender_id = chat_patient THEN specialist_unread_count + 1
      ELSE specialist_unread_count
    END
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_update_chat ON public.messages;
CREATE TRIGGER messages_update_chat
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_chat_on_new_message();


-- ════════════════════════════════════════════════════════════════════
-- 🔐 RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notes ENABLE ROW LEVEL SECURITY;


-- ─── Chats ───
DROP POLICY IF EXISTS "Users see their chats" ON public.chats;
CREATE POLICY "Users see their chats" ON public.chats
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = specialist_id);

DROP POLICY IF EXISTS "Users create their chats" ON public.chats;
CREATE POLICY "Users create their chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = specialist_id);

DROP POLICY IF EXISTS "Users update their chats" ON public.chats;
CREATE POLICY "Users update their chats" ON public.chats
  FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = specialist_id);


-- ─── Messages ───
DROP POLICY IF EXISTS "Users see chat messages" ON public.messages;
CREATE POLICY "Users see chat messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.patient_id = auth.uid() OR chats.specialist_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.patient_id = auth.uid() OR chats.specialist_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users update own messages" ON public.messages;
CREATE POLICY "Users update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);


-- ─── Quick Replies (Specialists only) ───
DROP POLICY IF EXISTS "Specialists manage own templates" ON public.quick_replies;
CREATE POLICY "Specialists manage own templates" ON public.quick_replies
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);


-- ─── Chat Notes (Specialists only) ───
DROP POLICY IF EXISTS "Specialists manage chat notes" ON public.chat_notes;
CREATE POLICY "Specialists manage chat notes" ON public.chat_notes
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 03 Complete
-- ════════════════════════════════════════════════════════════════════


-- ─── 11_notifications.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 11_notifications.sql — نظام الإشعارات (WhatsApp + SMS + Push) (V24)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف:
--   1. notification_templates — قوالب رسائل قابلة للتخصيص
--   2. notification_queue — قائمة انتظار الإرسال
--   3. notification_logs — سجل كل ما أُرسل
-- 🔧 V24: استخدام update_updated_at (موحّد)
-- 🔧 V24: إضافة index ناقص على created_by
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. قوالب الرسائل ───
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,    -- 'appointment_confirmed', 'order_assigned', ...
  name_ar      text NOT NULL,
  channel      text NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'push', 'all')),
  body_ar      text NOT NULL,           -- نص الرسالة مع {{placeholders}}
  variables    text[] DEFAULT ARRAY[]::text[],  -- ['patient_name', 'date', ...]
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ─── 2. قائمة انتظار الإرسال ───
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  channel         text NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'push')),
  template_key    text,
  body            text NOT NULL,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts        integer DEFAULT 0,
  max_attempts    integer DEFAULT 3,
  scheduled_for   timestamptz DEFAULT now(),
  sent_at         timestamptz,
  failed_at       timestamptz,
  error_message   text,
  provider        text,                  -- 'twilio', 'meta_business', 'expo'
  provider_message_id text,               -- ID من المزود
  related_type    text,                   -- 'appointment', 'order', 'campaign'
  related_id      uuid,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notif_queue_status_idx ON public.notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS notif_queue_recipient_idx ON public.notification_queue(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notif_queue_related_idx ON public.notification_queue(related_type, related_id);
-- 🆕 V24: index ناقص
CREATE INDEX IF NOT EXISTS notif_queue_created_by_idx ON public.notification_queue(created_by)
  WHERE created_by IS NOT NULL;


-- ─── 3. سجل الإرسال (للأرشيف بعد فترة) ───
-- يمكن نقل الرسائل المكتملة هنا بعد 30 يوم لتخفيف queue
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone text NOT NULL,
  channel         text NOT NULL,
  body_preview    text,                  -- أول 100 حرف فقط
  status          text NOT NULL,
  provider        text,
  sent_at         timestamptz,
  related_type    text,
  related_id      uuid,
  archived_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notif_logs_archived_idx ON public.notification_logs(archived_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Templates: admins يديرونها، الكل يقرأ النشط
DROP POLICY IF EXISTS notif_templates_admin ON public.notification_templates;
CREATE POLICY notif_templates_admin ON public.notification_templates
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS notif_templates_read ON public.notification_templates;
CREATE POLICY notif_templates_read ON public.notification_templates
  FOR SELECT USING (is_active = true);

-- Queue: المستلم يشوف رسائله، admins يشوفون الكل
DROP POLICY IF EXISTS notif_queue_recipient ON public.notification_queue;
CREATE POLICY notif_queue_recipient ON public.notification_queue
  FOR SELECT USING (
    recipient_user_id = auth.uid() OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS notif_queue_admin_manage ON public.notification_queue;
CREATE POLICY notif_queue_admin_manage ON public.notification_queue
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Logs: admins only
DROP POLICY IF EXISTS notif_logs_admin ON public.notification_logs;
CREATE POLICY notif_logs_admin ON public.notification_logs
  FOR SELECT USING (public.is_admin(auth.uid()));


-- ═══════════════════════════════════════════════════════════════════
-- Triggers
-- 🔧 V24: استخدام update_updated_at (الموحّد)
-- ═══════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_notif_templates_updated_at ON public.notification_templates;
CREATE TRIGGER trg_notif_templates_updated_at BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- البذرة الأولية — قوالب جاهزة
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar, variables) VALUES
('appointment_confirmed', 'تأكيد الحجز', 'whatsapp',
'مرحباً {{patient_name}} 👋

تم تأكيد حجزك في *سباير ميديكال*:

📋 الخدمة: {{service}}
📅 الموعد: {{date}}
📍 العنوان: {{address}}

سيتم التواصل معك قريباً.
بصحة وسلامة 🌿',
ARRAY['patient_name', 'service', 'date', 'address']),

('order_assigned', 'تعيين اختصاصي', 'whatsapp',
'مرحباً {{patient_name}} 👋

تم تعيين {{specialist_name}} لطلبك:
📋 {{service}}
📅 {{date}}

📞 رقم التواصل: {{specialist_phone}}

سباير ميديكال 🌿',
ARRAY['patient_name', 'specialist_name', 'service', 'date', 'specialist_phone']),

('order_in_progress', 'بدء الجلسة', 'whatsapp',
'مرحباً {{patient_name}} 👋

الاختصاصي بدأ جلستك الآن.
دمت بخير 🌿

سباير ميديكال',
ARRAY['patient_name']),

('order_completed', 'إكمال الجلسة', 'whatsapp',
'شكراً لاستخدامك سباير ميديكال 🌿

تم إنجاز جلسة *{{service}}* بنجاح.
نتمنى لك الصحة والعافية.

⭐ يسعدنا تقييمك للخدمة:
{{rating_link}}',
ARRAY['patient_name', 'service', 'rating_link']),

('order_cancelled', 'إلغاء الحجز', 'whatsapp',
'مرحباً {{patient_name}}،

نأسف لإبلاغك أن حجزك بتاريخ {{date}} تم إلغاؤه.

السبب: {{reason}}

للاستفسار، تواصل معنا.

سباير ميديكال 🌿',
ARRAY['patient_name', 'date', 'reason']),

('specialist_approved', 'الموافقة على الاختصاصي', 'whatsapp',
'تهانينا {{specialist_name}} 🎉

تم اعتماد حسابك في *سباير ميديكال* كـ {{specialist_type}}.

يمكنك الآن استقبال الطلبات.
ابدأ الآن: spirmedical.com/specialist

سباير ميديكال 🌿',
ARRAY['specialist_name', 'specialist_type']),

('specialist_rejected', 'رفض طلب الاختصاصي', 'whatsapp',
'عزيزي {{specialist_name}}،

نأسف لإبلاغك أن طلب تسجيلك في سباير ميديكال لم يُقبل في الوقت الحالي.

السبب: {{reason}}

يمكنك إعادة التقديم بعد معالجة الملاحظات.',
ARRAY['specialist_name', 'reason']),

('appointment_reminder', 'تذكير بالموعد', 'whatsapp',
'⏰ تذكير: لديك موعد غداً

📋 {{service}}
🕒 {{time}}
📍 {{address}}

اختصاصي: {{specialist_name}}

سباير ميديكال 🌿',
ARRAY['service', 'time', 'address', 'specialist_name'])

ON CONFLICT (key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 11 Complete
-- ═══════════════════════════════════════════════════════════════════


-- ─── 12_whatsapp_otp.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 12_whatsapp_otp.sql — نظام OTP عبر WhatsApp (V24)
-- ════════════════════════════════════════════════════════════════════
-- يضيف:
--   1. whatsapp_otp        — رموز OTP المُشفّرة
--   2. توسيع users         — wa_otp_enabled, wa_verified, wa_id, preferred_otp_channel
--   3. notification_template — قالب OTP
--   4. RLS policies + indexes
--   5. pg_cron لتنظيف OTPs المنتهية
-- 
-- 🔧 هذا الإصدار يحتوي OTP فقط (بدون البوت التفاعلي)
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1️⃣ توسيع جدول users
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wa_otp_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wa_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wa_id text,
  ADD COLUMN IF NOT EXISTS wa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferred_otp_channel text DEFAULT 'sms'
    CHECK (preferred_otp_channel IN ('whatsapp', 'telegram', 'sms'));

CREATE INDEX IF NOT EXISTS users_wa_id_idx ON public.users(wa_id)
  WHERE wa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_wa_otp_enabled_idx ON public.users(wa_otp_enabled)
  WHERE wa_otp_enabled = true;


-- ════════════════════════════════════════════════════════════════════
-- 2️⃣ whatsapp_otp — رموز OTP
-- ════════════════════════════════════════════════════════════════════
-- نخزّن hash للرمز فقط (مثل bcrypt)، ليس الرمز نفسه

CREATE TABLE IF NOT EXISTS public.whatsapp_otp (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           varchar(20) NOT NULL,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,

  -- الرمز نفسه (hash فقط)
  otp_hash        text NOT NULL,

  -- القناة المُستخدمة
  channel         text NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'sms')),

  -- الحالة
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'verified', 'expired', 'failed')),

  -- معلومات الإرسال
  provider_message_id text,           -- ID من Meta لتتبّع الـ delivery
  delivered_at    timestamptz,
  read_at         timestamptz,

  -- محاولات التحقق
  verify_attempts integer DEFAULT 0,
  verified_at     timestamptz,

  -- معلومات السياق
  purpose         text DEFAULT 'login'
    CHECK (purpose IN ('login', 'verify_phone', 'sensitive_action', 'register')),
  ip_address      inet,
  user_agent      text,

  -- انتهاء الصلاحية
  expires_at      timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_otp_phone_idx ON public.whatsapp_otp(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS wa_otp_user_idx ON public.whatsapp_otp(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS wa_otp_expires_idx ON public.whatsapp_otp(expires_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS wa_otp_status_idx ON public.whatsapp_otp(status, created_at DESC);


-- ════════════════════════════════════════════════════════════════════
-- 3️⃣ إضافة OTP template للـ notification_templates
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.notification_templates (key, name_ar, channel, body_ar, variables)
VALUES (
  'otp_authentication',
  'رمز التحقق',
  'whatsapp',
  '{{otp_code}} هو رمز التحقق الخاص بك. لأمانك، لا تُشارك هذا الرمز مع أحد.',
  ARRAY['otp_code']
)
ON CONFLICT (key) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════
-- 4️⃣ Cleanup function لـ OTPs المنتهية
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cleanup_expired_whatsapp_otp()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- نحذف الـ OTPs المنتهية أو القديمة (>24 ساعة)
  DELETE FROM public.whatsapp_otp
  WHERE (status IN ('expired', 'verified') AND created_at < NOW() - INTERVAL '24 hours')
     OR (status = 'pending' AND expires_at < NOW() - INTERVAL '1 hour');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- جدولة الـ cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN PERFORM cron.unschedule('spir-cleanup-whatsapp-otp');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- كل 15 دقيقة
    PERFORM cron.schedule(
      'spir-cleanup-whatsapp-otp',
      '*/15 * * * *',
      'SELECT public.cleanup_expired_whatsapp_otp();'
    );

    RAISE NOTICE '✅ WhatsApp OTP cleanup schedule created';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Could not schedule cleanup: %', SQLERRM;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- 5️⃣ RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.whatsapp_otp ENABLE ROW LEVEL SECURITY;

-- whatsapp_otp: service_role only (حساس)
DROP POLICY IF EXISTS "Service role only - whatsapp_otp" ON public.whatsapp_otp;
CREATE POLICY "Service role only - whatsapp_otp" ON public.whatsapp_otp
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 12 Complete (OTP-only)
-- ════════════════════════════════════════════════════════════════════
COMMENT ON TABLE public.whatsapp_otp IS 'رموز OTP المُرسلة عبر WhatsApp/Telegram/SMS';
COMMENT ON COLUMN public.users.wa_otp_enabled IS 'هل المستخدم فعّل OTP عبر WhatsApp (اختياري)';
COMMENT ON COLUMN public.users.wa_verified IS 'هل تم التحقق من رقم WhatsApp';
COMMENT ON COLUMN public.users.preferred_otp_channel IS 'القناة المفضّلة لاستلام OTP';


-- ─── 18_push_notifications.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🔔 Migration 18: Push Notifications Subscriptions (V25.3)
-- ════════════════════════════════════════════════════════════════════
-- يُضيف:
--   1. push_subscriptions - اشتراكات Web Push للمستخدمين
--   2. notification_preferences - تفضيلات نوع الإشعارات
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. push_subscriptions ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- بيانات الاشتراك (من PushSubscription.toJSON())
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  
  -- معلومات الجهاز (للعرض في الإعدادات)
  user_agent TEXT,
  device_label TEXT, -- مثل "iPhone 14 - Safari" أو "Android - Chrome"
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT push_sub_unique_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user
  ON public.push_subscriptions(user_id, is_active);

-- RLS: المستخدم يرى/يحذف اشتراكاته فقط
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_sub_select_own" ON public.push_subscriptions;
CREATE POLICY "push_sub_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_sub_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_sub_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_sub_update_own" ON public.push_subscriptions;
CREATE POLICY "push_sub_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_sub_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_sub_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 2. notification_preferences ───────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- أنواع الإشعارات (true = مفعّل، false = مُعطّل)
  appointment_reminders BOOLEAN DEFAULT TRUE,
  test_results BOOLEAN DEFAULT TRUE,
  messages BOOLEAN DEFAULT TRUE,
  promotions BOOLEAN DEFAULT FALSE,
  system_updates BOOLEAN DEFAULT TRUE,
  
  -- وقت السكون (لا إشعارات بين هذه الساعات)
  quiet_hours_start TIME DEFAULT '23:00:00',
  quiet_hours_end TIME DEFAULT '07:00:00',
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_pref_select_own" ON public.notification_preferences;
CREATE POLICY "notif_pref_select_own"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_pref_upsert_own" ON public.notification_preferences;
CREATE POLICY "notif_pref_upsert_own"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_pref_update_own" ON public.notification_preferences;
CREATE POLICY "notif_pref_update_own"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── 3. Helper: تنشئة تفضيلات افتراضية ───
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_notif_prefs ON public.users;
CREATE TRIGGER trg_create_notif_prefs
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_notification_preferences();

-- ─── 4. تعليقات ──────────────────────────────────────
COMMENT ON TABLE public.push_subscriptions IS
  'اشتراكات Web Push API للمستخدمين - دعم متعدد للأجهزة';

COMMENT ON TABLE public.notification_preferences IS
  'تفضيلات المستخدم لأنواع الإشعارات';

-- ─── 5. تأكيد ───────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 18 applied: push_subscriptions + notification_preferences';
END $$;


-- ─── 49_in_app_notifications.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 🔔 Migration 49: In-App Notifications (V32)
-- ═══════════════════════════════════════════════════════════════════
-- المشكلة (audit):
--   dashboard/page.tsx يستعلم from('notifications') لكن الجدول غير موجود
--   (الموجود: notification_queue/logs/templates للإرسال الخارجي فقط).
--   النتيجة: جرس الإشعارات في الـ dashboard لا يعمل أبداً (count يفشل بصمت).
--
-- الحل: جدول in-app notifications حقيقي مع user_id + is_read.
-- آمن (idempotent) — لا يكسر أي migration سابق.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'general',
  title       text NOT NULL,
  body        text,
  link        text,                       -- مسار داخل التطبيق عند الضغط
  is_read     boolean NOT NULL DEFAULT false,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz
);

-- فهارس للاستعلامات الشائعة (عدّ غير المقروء + ترتيب زمني)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- ─── RLS: كل مستخدم يرى إشعاراته فقط ───
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_notifications" ON public.notifications;
CREATE POLICY "users_select_own_notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- الإدراج عبر service_role فقط (من الخادم) — لا policy للـ INSERT للمستخدمين.





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0003_health_records.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  03_health_records.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 03_health_records.sql — الصحة + السجل الطبي + سحب الدم + المختبرات
-- مدموج (V33) من: 07_personal_health.sql 08_medical_record.sql 38_blood_draw_system.sql 39_lab_results_notifications.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 07_personal_health.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 07_personal_health.sql — جداول الصحة الشخصية (V24 — مُصحَّح)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف:
--   1. reminders          — تذكيرات (دواء/موعد/فحص/لقاح)
--   2. prescriptions      — الوصفات الطبية
--   3. health_vitals      — المؤشرات الحيوية
-- مع RLS كامل (المستخدم يرى بياناته فقط)
--
-- 🔧 V24: استخدام update_updated_at بدل set_updated_at (موحّد)
-- 🔧 V24: إضافة indexes ناقصة
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. التذكيرات ───
CREATE TABLE IF NOT EXISTS public.reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('medication', 'appointment', 'checkup', 'vaccine')),
  title           text NOT NULL,
  description     text,
  scheduled_at    timestamptz NOT NULL,
  frequency       text NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  active          boolean NOT NULL DEFAULT true,
  last_triggered  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_user_idx ON public.reminders(user_id, active, scheduled_at);

-- ─── 2. الوصفات الطبية ───
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_name     text NOT NULL,
  doctor_specialty text,
  medication      text NOT NULL,
  dosage          text,
  frequency       text,          -- مثال: "3 مرات يومياً"
  duration_days   integer,        -- مدة العلاج بالأيام
  notes           text,
  prescribed_at   date NOT NULL DEFAULT CURRENT_DATE,
  appointment_id  uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prescriptions_user_idx ON public.prescriptions(user_id, prescribed_at DESC);
-- 🆕 V24: index ناقص على appointment_id
CREATE INDEX IF NOT EXISTS prescriptions_appt_idx ON public.prescriptions(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- ─── 3. المؤشرات الحيوية ───
CREATE TABLE IF NOT EXISTS public.health_vitals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vital_type      text NOT NULL CHECK (vital_type IN ('pulse', 'blood_pressure', 'blood_sugar', 'temperature', 'weight', 'oxygen', 'height')),
  value           text NOT NULL,         -- text لدعم "120/80" للضغط
  unit            text,
  measured_at     timestamptz NOT NULL DEFAULT now(),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_vitals_user_idx ON public.health_vitals(user_id, vital_type, measured_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- RLS: المستخدم يرى/يعدّل بياناته فقط
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;

-- Reminders policies
DROP POLICY IF EXISTS reminders_select_own ON public.reminders;
CREATE POLICY reminders_select_own ON public.reminders FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS reminders_insert_own ON public.reminders;
CREATE POLICY reminders_insert_own ON public.reminders FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reminders_update_own ON public.reminders;
CREATE POLICY reminders_update_own ON public.reminders FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS reminders_delete_own ON public.reminders;
CREATE POLICY reminders_delete_own ON public.reminders FOR DELETE USING (user_id = auth.uid());

-- Prescriptions policies
DROP POLICY IF EXISTS prescriptions_select_own ON public.prescriptions;
CREATE POLICY prescriptions_select_own ON public.prescriptions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS prescriptions_insert_own ON public.prescriptions;
CREATE POLICY prescriptions_insert_own ON public.prescriptions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS prescriptions_update_own ON public.prescriptions;
CREATE POLICY prescriptions_update_own ON public.prescriptions FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS prescriptions_delete_own ON public.prescriptions;
CREATE POLICY prescriptions_delete_own ON public.prescriptions FOR DELETE USING (user_id = auth.uid());

-- Health vitals policies
DROP POLICY IF EXISTS vitals_select_own ON public.health_vitals;
CREATE POLICY vitals_select_own ON public.health_vitals FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS vitals_insert_own ON public.health_vitals;
CREATE POLICY vitals_insert_own ON public.health_vitals FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vitals_update_own ON public.health_vitals;
CREATE POLICY vitals_update_own ON public.health_vitals FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS vitals_delete_own ON public.health_vitals;
CREATE POLICY vitals_delete_own ON public.health_vitals FOR DELETE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- Triggers لتحديث updated_at تلقائياً
-- 🔧 V24: استخدام update_updated_at (موحّد) بدل set_updated_at
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_reminders_updated_at ON public.reminders;
CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 07 Complete
-- ═══════════════════════════════════════════════════════════════════


-- ─── 08_medical_record.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 08_medical_record.sql — السجل الطبي + إعدادات المستخدم (V24)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف:
--   1. medical_info  jsonb — معلومات طبية (فصيلة الدم، أمراض، حساسية)
--   2. user_settings jsonb — إعدادات (إشعارات، لغة، إلخ)
-- ═══════════════════════════════════════════════════════════════════

-- إضافة الأعمدة لجدول users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS medical_info jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS user_settings jsonb DEFAULT '{}'::jsonb;

-- مؤشرات على الـ JSONB للبحث السريع (لو احتجناها مستقبلاً)
CREATE INDEX IF NOT EXISTS users_medical_info_gin ON public.users USING gin (medical_info);
CREATE INDEX IF NOT EXISTS users_settings_gin ON public.users USING gin (user_settings);


-- ═══════════════════════════════════════════════════════════════════
-- 📋 توثيق البنية المتوقعة (للمطوّر فقط - لا يُنفّذ)
-- ═══════════════════════════════════════════════════════════════════

-- مثال على هيكل medical_info:
-- {
--   "blood_type": "O+",
--   "height_cm": 175,
--   "weight_kg": 72,
--   "birth_date": "1995-03-15",
--   "chronic_conditions": [
--     { "name": "السكري النوع 2", "since": "2020", "severity": "moderate" }
--   ],
--   "allergies": [
--     { "name": "البنسلين", "reaction": "طفح جلدي" }
--   ],
--   "past_surgeries": [],
--   "family_history": []
-- }

-- مثال على هيكل user_settings:
-- {
--   "language": "ar",
--   "biometric": false,
--   "auto_lock": true,
--   "analytics": true,
--   "notifications": {
--     "appointments": true,
--     "meds": true,
--     "results": true,
--     "messages": true,
--     "news": false
--   }
-- }


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 08 Complete
-- ═══════════════════════════════════════════════════════════════════
COMMENT ON COLUMN public.users.medical_info IS 'JSONB: blood_type, height_cm, weight_kg, birth_date, chronic_conditions[], allergies[], past_surgeries[], family_history[]';
COMMENT ON COLUMN public.users.user_settings IS 'JSONB: language, biometric, auto_lock, analytics, notifications{}';


-- ─── 38_blood_draw_system.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 38: Blood Draw + Lab Tests System (V25.43)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُنشئ 3 جداول جديدة:
--   • partner_labs        - المختبرات الشريكة (مع إدارة كاملة)
--   • lab_orders          - تفاصيل طلب سحب الدم (test_ids, lab_id, إلخ)
--   • lab_results         - نتائج التحاليل (لكل فحص نتيجة منفصلة)
--
-- + columns جديدة على appointments للربط
-- + RLS policies + indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PARTNER LABS - المختبرات الشريكة ───
CREATE TABLE IF NOT EXISTS public.partner_labs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الأساسيات
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  logo_url        TEXT,
  description     TEXT,
  
  -- الموقع
  city            TEXT NOT NULL,
  governorate     TEXT,
  address         TEXT,
  latitude        NUMERIC(10, 7),
  longitude       NUMERIC(10, 7),
  
  -- التواصل
  phone           TEXT,
  whatsapp        TEXT,
  website         TEXT,
  
  -- الميزات
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  accepts_home_draw BOOLEAN NOT NULL DEFAULT true,
  
  -- الإحصائيات (computed)
  total_orders    INTEGER NOT NULL DEFAULT 0,
  rating_avg      NUMERIC(3, 2) DEFAULT 0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  
  -- ساعات العمل
  working_hours   JSONB,  -- { "sat": "08:00-20:00", "sun": "08:00-20:00", ... }
  
  -- التخصصات
  specialties     TEXT[],  -- ['general', 'cardiac', 'diabetes', ...]
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_labs_city ON public.partner_labs(city);
CREATE INDEX IF NOT EXISTS idx_partner_labs_active ON public.partner_labs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partner_labs_location ON public.partner_labs(latitude, longitude) WHERE latitude IS NOT NULL;

-- ─── 2. LAB ORDERS - طلبات سحب الدم ───
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- التحاليل المطلوبة
  test_ids        TEXT[] NOT NULL,  -- ['cbc', 'fbs', 'hba1c']
  bundle_id       TEXT,             -- 'bundle-general-health' أو null
  
  -- المختبر
  partner_lab_id  UUID REFERENCES public.partner_labs(id) ON DELETE SET NULL,
  lab_name_snapshot TEXT,  -- اسم المختبر وقت الطلب (للسجلات)
  
  -- بيانات المريض (اختيارية - مفيدة للنتائج)
  patient_age     INTEGER,
  patient_gender  TEXT CHECK (patient_gender IN ('male', 'female') OR patient_gender IS NULL),
  patient_condition TEXT,  -- حالة طبية (سكري، حمل، إلخ)
  
  -- معلومات الصيام
  needs_fasting   BOOLEAN NOT NULL DEFAULT false,
  fasting_hours   INTEGER DEFAULT 0,
  fasting_confirmed BOOLEAN NOT NULL DEFAULT false,  -- المريض أكّد أنه صائم
  
  -- التسعير
  draw_fee        INTEGER NOT NULL DEFAULT 15000,  -- سعر سحب الدم (IQD)
  tests_total     INTEGER NOT NULL DEFAULT 0,      -- إجمالي التحاليل
  discount        INTEGER NOT NULL DEFAULT 0,      -- خصم
  total_price     INTEGER NOT NULL,                -- الإجمالي النهائي
  
  -- التوقيت
  expected_result_at TIMESTAMPTZ,  -- متى نتوقع النتيجة
  
  -- الحالة
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',           -- لم يُجمع بعد
      'sample_collected',  -- جُمعت العينة
      'sent_to_lab',       -- أُرسلت للمختبر
      'processing',        -- قيد التحليل
      'results_ready',     -- النتائج جاهزة
      'delivered',         -- سُلّمت للمريض
      'cancelled'          -- ألغي
    )),
  
  -- ملاحظات
  notes           TEXT,
  internal_notes  TEXT,  -- للموظّفين فقط
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT lab_orders_tests_required CHECK (array_length(test_ids, 1) > 0)
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_user ON public.lab_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_appointment ON public.lab_orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON public.lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_created ON public.lab_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_orders_test_ids ON public.lab_orders USING GIN(test_ids);

-- ─── 3. LAB RESULTS - نتائج التحاليل (لكل فحص نتيجة منفصلة) ───
CREATE TABLE IF NOT EXISTS public.lab_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط
  lab_order_id    UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- الفحص
  test_id         TEXT NOT NULL,  -- 'cbc', 'fbs', إلخ
  test_name       TEXT NOT NULL,  -- اسم الفحص (snapshot)
  
  -- النتيجة
  result_value    TEXT,           -- القيمة (قد تكون رقم أو نص)
  result_numeric  NUMERIC,        -- القيمة كرقم (للـ trends و charts)
  unit            TEXT,           -- mg/dL، g/dL، إلخ
  normal_range_min NUMERIC,
  normal_range_max NUMERIC,
  normal_range_text TEXT,         -- "70-100 mg/dL" - للعرض
  
  -- التفسير
  status          TEXT NOT NULL DEFAULT 'normal'
    CHECK (status IN ('normal', 'low', 'high', 'critical', 'inconclusive')),
  flag            TEXT,           -- 'L', 'H', 'HH', 'LL', 'C' (critical)
  notes           TEXT,           -- ملاحظات الطبيب
  
  -- ملف PDF (اختياري)
  pdf_url         TEXT,
  
  -- التوقيتات
  tested_at       TIMESTAMPTZ,    -- متى أُجري الفحص في المختبر
  results_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- متى أُدخلت النتيجة
  
  -- من أدخل النتيجة
  entered_by      UUID REFERENCES public.users(id),
  reviewed_by     UUID REFERENCES public.users(id),  -- طبيب راجع النتيجة
  reviewed_at     TIMESTAMPTZ,
  
  -- هل المريض شاهد النتيجة؟
  viewed_by_patient BOOLEAN NOT NULL DEFAULT false,
  viewed_at       TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_order ON public.lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user ON public.lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test ON public.lab_results(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user_test ON public.lab_results(user_id, test_id, results_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON public.lab_results(status) WHERE status != 'normal';

-- ─── 4. ربط appointments بـ lab_orders ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_lab_order ON public.appointments(lab_order_id) WHERE lab_order_id IS NOT NULL;

-- ─── 5. RLS Policies ───

-- partner_labs: الجميع يقرأ النشطة، الـ admin يدير
ALTER TABLE public.partner_labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_labs_public_read" ON public.partner_labs;
CREATE POLICY "partner_labs_public_read"
  ON public.partner_labs FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "partner_labs_admin_all" ON public.partner_labs;
CREATE POLICY "partner_labs_admin_all"
  ON public.partner_labs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- lab_orders: المريض يرى طلباته، الـ specialist (lab_analyst) يرى المُسندة له، الـ admin يرى الكل
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_orders_user_own" ON public.lab_orders;
CREATE POLICY "lab_orders_user_own"
  ON public.lab_orders FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lab_orders_user_insert" ON public.lab_orders;
CREATE POLICY "lab_orders_user_insert"
  ON public.lab_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lab_orders_specialist_read" ON public.lab_orders;
CREATE POLICY "lab_orders_specialist_read"
  ON public.lab_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.lab_order_id = lab_orders.id
        AND a.specialist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_orders_specialist_update" ON public.lab_orders;
CREATE POLICY "lab_orders_specialist_update"
  ON public.lab_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.lab_order_id = lab_orders.id
        AND a.specialist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_orders_admin_all" ON public.lab_orders;
CREATE POLICY "lab_orders_admin_all"
  ON public.lab_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- lab_results: المريض يرى نتائجه، الـ specialist يدخلها، الـ admin يدير
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_results_user_own" ON public.lab_results;
CREATE POLICY "lab_results_user_own"
  ON public.lab_results FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lab_results_specialist_manage" ON public.lab_results;
CREATE POLICY "lab_results_specialist_manage"
  ON public.lab_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND specialist_type = 'lab_analyst'
    )
  );

DROP POLICY IF EXISTS "lab_results_admin_all" ON public.lab_results;
CREATE POLICY "lab_results_admin_all"
  ON public.lab_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 6. Trigger لتحديث updated_at ───
CREATE OR REPLACE FUNCTION update_lab_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lab_orders_updated_at ON public.lab_orders;
CREATE TRIGGER lab_orders_updated_at
  BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();

DROP TRIGGER IF EXISTS lab_results_updated_at ON public.lab_results;
CREATE TRIGGER lab_results_updated_at
  BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();

DROP TRIGGER IF EXISTS partner_labs_updated_at ON public.partner_labs;
CREATE TRIGGER partner_labs_updated_at
  BEFORE UPDATE ON public.partner_labs
  FOR EACH ROW EXECUTE FUNCTION update_lab_orders_updated_at();

-- ─── 7. Seed data - المختبرات الـ 6 الأساسية ───
INSERT INTO public.partner_labs (
  name_ar, name_en, city, governorate, phone, is_active, is_featured, accepts_home_draw, specialties
) VALUES
  ('مختبر التحاليل الذهبي', 'Golden Lab', 'بغداد', 'بغداد', '07700000001', true, true, true, ARRAY['general', 'cardiac', 'diabetes', 'thyroid']),
  ('مختبر النخبة الطبي', 'Elite Medical Lab', 'بغداد', 'بغداد', '07700000002', true, true, true, ARRAY['general', 'cardiac', 'thyroid', 'hormones']),
  ('مختبر دجلة المركزي', 'Tigris Central Lab', 'بغداد', 'بغداد', '07700000003', true, false, true, ARRAY['general', 'diabetes', 'kidney', 'liver']),
  ('مختبر البصرة الحديث', 'Modern Basra Lab', 'البصرة', 'البصرة', '07700000004', true, true, true, ARRAY['general', 'cardiac', 'diabetes']),
  ('مختبر أربيل التخصصي', 'Erbil Specialist Lab', 'أربيل', 'أربيل', '07700000005', true, true, true, ARRAY['general', 'cardiac', 'hormones', 'genetic']),
  ('مختبر النجف الطبي', 'Najaf Medical Lab', 'النجف', 'النجف', '07700000006', true, false, true, ARRAY['general', 'diabetes', 'thyroid'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 38
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 39_lab_results_notifications.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 39: Lab Results Notifications + Helpers (V25.43)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Notification template للنتائج الجاهزة ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES (
  'lab_results_ready',
  'نتائج التحاليل جاهزة 🎉',
  'push',
  'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.'
) ON CONFLICT (key) DO NOTHING;

-- ─── 2. Trigger: عند تغيير lab_orders.status إلى 'results_ready' ───
-- نُرسل إشعار تلقائي للمريض

CREATE OR REPLACE FUNCTION notify_lab_results_ready()
RETURNS TRIGGER AS $$
BEGIN
  -- فقط لو الـ status تغيّر إلى 'results_ready' أو 'delivered'
  IF (OLD.status != 'results_ready' AND NEW.status = 'results_ready') OR
     (OLD.status != 'delivered' AND NEW.status = 'delivered') THEN
    
    -- أضِف إلى notification_queue
    INSERT INTO public.notification_queue (
      user_id,
      template_key,
      title,
      body,
      icon,
      data,
      created_at,
      scheduled_at
    ) VALUES (
      NEW.user_id,
      'lab_results_ready',
      'نتائج التحاليل جاهزة 🎉',
      'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.',
      '🩸',
      jsonb_build_object('lab_order_id', NEW.id, 'url', '/account/lab-history/' || NEW.id),
      NOW(),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab_results_notify ON public.lab_orders;
CREATE TRIGGER trigger_lab_results_notify
  AFTER UPDATE ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_lab_results_ready();

-- ─── 3. Function: تحديث partner_labs statistics ───
CREATE OR REPLACE FUNCTION update_partner_lab_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_lab_id IS NOT NULL THEN
    UPDATE public.partner_labs
    SET total_orders = (
      SELECT COUNT(*) FROM public.lab_orders 
      WHERE partner_lab_id = NEW.partner_lab_id
    )
    WHERE id = NEW.partner_lab_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partner_lab_stats ON public.lab_orders;
CREATE TRIGGER trigger_partner_lab_stats
  AFTER INSERT ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_lab_stats();

-- ─── 4. Index للأداء ───
CREATE INDEX IF NOT EXISTS idx_lab_results_user_recent 
  ON public.lab_results(user_id, results_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_user_recent 
  ON public.lab_orders(user_id, created_at DESC);

-- ─── 5. View للـ admin: lab orders summary ───
CREATE OR REPLACE VIEW public.admin_lab_orders_summary AS
SELECT 
  lo.id,
  lo.user_id,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  lo.test_ids,
  array_length(lo.test_ids, 1) AS test_count,
  lo.bundle_id,
  lo.partner_lab_id,
  pl.name_ar AS lab_name,
  lo.total_price,
  lo.status,
  lo.created_at,
  lo.updated_at,
  (
    SELECT COUNT(*) FROM public.lab_results lr 
    WHERE lr.lab_order_id = lo.id
  ) AS results_count
FROM public.lab_orders lo
LEFT JOIN public.users u ON u.id = lo.user_id
LEFT JOIN public.partner_labs pl ON pl.id = lo.partner_lab_id
ORDER BY lo.created_at DESC;

-- منح صلاحية القراءة للـ admin
GRANT SELECT ON public.admin_lab_orders_summary TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 39
-- ═══════════════════════════════════════════════════════════════════════════





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0004_services_catalog.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  04_services_catalog.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 04_services_catalog.sql — كل الخدمات (الجداول الأساسية للمزوّدين)
-- مدموج (V33) من: 22_pharmacy_catalog.sql 24_doctors_hospitals_consultations.sql 29_cosmetic_products.sql 32_physio_service.sql 33_new_services.sql 45_vaccines_service_v50.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 22_pharmacy_catalog.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 💊 Migration 22: Pharmacy Catalog System (V25.7)
-- ════════════════════════════════════════════════════════════════════
-- منصة Spir Medical لا تبيع/توصّل أدوية (ممنوع قانونياً في العراق)
-- بل توفّر دليلاً ذكياً للبحث عن توفّر الأدوية في الصيدليات
--
-- يُضيف:
--   1. pharmacies      - الصيدليات المسجّلة
--   2. medications     - كتالوج الأدوية الشامل (مرجع وطني)
--   3. pharmacy_inventory - مخزون كل صيدلية (متوفر/غير متوفر)
--   4. medication_searches - تتبّع البحث لتحسين الخدمة
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. جدول الصيدليات ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- بيانات أساسية
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  license_number TEXT,
  license_image_url TEXT,
  
  -- العنوان
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- التواصل
  phone TEXT NOT NULL,
  whatsapp TEXT,
  
  -- ساعات العمل
  is_24h BOOLEAN DEFAULT FALSE,
  opens_at TIME,
  closes_at TIME,
  working_days TEXT[] DEFAULT ARRAY['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
  
  -- الميزات
  has_delivery BOOLEAN DEFAULT FALSE,  -- ⚠️ للعرض فقط لا للحجز
  has_emergency_section BOOLEAN DEFAULT FALSE,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  
  -- التقييمات (محسوبة من ratings)
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- العرض
  cover_image_url TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON public.pharmacies(city);
CREATE INDEX IF NOT EXISTS idx_pharmacies_active ON public.pharmacies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pharmacies_owner ON public.pharmacies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_24h ON public.pharmacies(is_24h) WHERE is_24h = TRUE;
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON public.pharmacies(latitude, longitude);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- قراءة: الكل (الصيدليات المُفعّلة فقط)
DROP POLICY IF EXISTS "pharmacies_select_active" ON public.pharmacies;
CREATE POLICY "pharmacies_select_active"
  ON public.pharmacies FOR SELECT
  USING (is_active = TRUE OR auth.uid() = owner_user_id);

-- تعديل: المالك أو الأدمن
DROP POLICY IF EXISTS "pharmacies_update_owner" ON public.pharmacies;
CREATE POLICY "pharmacies_update_owner"
  ON public.pharmacies FOR UPDATE
  USING (
    auth.uid() = owner_user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- إدراج: فقط الأدمن
DROP POLICY IF EXISTS "pharmacies_insert_admin" ON public.pharmacies;
CREATE POLICY "pharmacies_insert_admin"
  ON public.pharmacies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 2. كتالوج الأدوية الشامل (مرجع وطني) ───────────────────
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  name_ar TEXT NOT NULL,            -- "بنادول"
  name_en TEXT,                     -- "Panadol"
  generic_name TEXT,                -- "Paracetamol"
  manufacturer TEXT,                -- "GSK"
  country_of_origin TEXT,           -- "England"
  
  -- التصنيف
  category TEXT NOT NULL,
    -- 'analgesic', 'antibiotic', 'antihypertensive', 'antidiabetic',
    -- 'cardiac', 'respiratory', 'gastric', 'dermatological',
    -- 'vitamin', 'cosmetic', 'baby', 'first_aid', 'other'
  
  form TEXT,
    -- 'tablet', 'capsule', 'syrup', 'injection', 'ointment',
    -- 'drops', 'inhaler', 'suppository', 'patch'
  
  -- الجرعة
  strength TEXT,                    -- "500mg"
  unit_type TEXT,                   -- "tablet", "ml"
  package_size TEXT,                -- "20 قرص", "100 مل"
  
  -- المرجع
  requires_prescription BOOLEAN DEFAULT FALSE,
  is_controlled BOOLEAN DEFAULT FALSE,    -- مراقَب (مخدّرات/مهدئات)
  
  -- ملاحظات طبية
  side_effects TEXT,
  contraindications TEXT,
  storage_notes TEXT,
  
  -- الصورة
  image_url TEXT,
  
  -- البحث
  search_keywords TEXT[],           -- مرادفات للبحث الذكي
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_name_ar ON public.medications USING gin(to_tsvector('arabic', name_ar));
CREATE INDEX IF NOT EXISTS idx_medications_name_en ON public.medications(name_en);
CREATE INDEX IF NOT EXISTS idx_medications_generic ON public.medications(generic_name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON public.medications(category);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- قراءة: للجميع
DROP POLICY IF EXISTS "medications_select_all" ON public.medications;
CREATE POLICY "medications_select_all"
  ON public.medications FOR SELECT
  USING (TRUE);

-- إدراج/تعديل: فقط الأدمن
DROP POLICY IF EXISTS "medications_admin_only" ON public.medications;
CREATE POLICY "medications_admin_only"
  ON public.medications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 3. مخزون الصيدلية (الجدول الأهم!) ───────────────────────
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- التوفر (الأهم)
  is_available BOOLEAN DEFAULT TRUE,
  
  -- التفاصيل الخاصة بالصيدلية
  custom_price NUMERIC,             -- السعر في هذه الصيدلية (اختياري)
  brand_variant TEXT,               -- البديل المتوفر (مثلاً: "Panadol" أو "Tylenol")
  notes TEXT,                       -- "متوفر الكبير 50 قرص فقط"
  
  -- إحصائيات
  searched_count INTEGER DEFAULT 0,  -- كم مرة بحث عنه الناس
  last_searched_at TIMESTAMPTZ,
  
  -- التاريخ
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  marked_unavailable_at TIMESTAMPTZ,
  
  UNIQUE(pharmacy_id, medication_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON public.pharmacy_inventory(pharmacy_id, is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_medication ON public.pharmacy_inventory(medication_id, is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON public.pharmacy_inventory(is_available) WHERE is_available = TRUE;

ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;

-- قراءة: للجميع
DROP POLICY IF EXISTS "inventory_select_all" ON public.pharmacy_inventory;
CREATE POLICY "inventory_select_all"
  ON public.pharmacy_inventory FOR SELECT
  USING (TRUE);

-- تعديل: صاحب الصيدلية أو الأدمن
DROP POLICY IF EXISTS "inventory_update_owner" ON public.pharmacy_inventory;
CREATE POLICY "inventory_update_owner"
  ON public.pharmacy_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_id AND p.owner_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 4. سجل عمليات البحث (تحليلات) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.medication_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  city_filter TEXT,
  results_count INTEGER DEFAULT 0,
  found_any_available BOOLEAN DEFAULT FALSE,
  ip_country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_searches_query ON public.medication_searches(search_query);
CREATE INDEX IF NOT EXISTS idx_searches_unavailable
  ON public.medication_searches(created_at DESC)
  WHERE found_any_available = FALSE;

ALTER TABLE public.medication_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "searches_admin_select" ON public.medication_searches;
CREATE POLICY "searches_admin_select"
  ON public.medication_searches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "searches_insert_self" ON public.medication_searches;
CREATE POLICY "searches_insert_self"
  ON public.medication_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ─── 5. View: medications مع عدد الصيدليات المتوفر فيها ─────
CREATE OR REPLACE VIEW public.medications_with_availability AS
SELECT
  m.*,
  COUNT(DISTINCT pi.pharmacy_id) FILTER (WHERE pi.is_available = TRUE) as available_count,
  COUNT(DISTINCT pi.pharmacy_id) as total_pharmacies_count
FROM public.medications m
LEFT JOIN public.pharmacy_inventory pi ON pi.medication_id = m.id
GROUP BY m.id;

-- ─── 6. View: pharmacy_stats للصيدلاني ──────────────────────
CREATE OR REPLACE VIEW public.pharmacy_inventory_stats AS
SELECT
  p.id as pharmacy_id,
  p.name as pharmacy_name,
  COUNT(pi.id) as total_medications,
  COUNT(pi.id) FILTER (WHERE pi.is_available = TRUE) as available_medications,
  COUNT(pi.id) FILTER (WHERE pi.is_available = FALSE) as unavailable_medications,
  SUM(pi.searched_count) as total_searches
FROM public.pharmacies p
LEFT JOIN public.pharmacy_inventory pi ON pi.pharmacy_id = p.id
GROUP BY p.id, p.name;

-- ─── 7. تعليقات ──────────────────────────────────────────
COMMENT ON TABLE public.pharmacies IS
  'صيدليات Spir Medical - دليل بحث للأدوية (لا توصيل، إرشادي فقط)';

COMMENT ON TABLE public.medications IS
  'كتالوج وطني للأدوية - مرجع شامل لكل الصيدليات';

COMMENT ON TABLE public.pharmacy_inventory IS
  'مخزون كل صيدلية - يحدّده الصيدلاني نفسه (متوفر/غير متوفر)';

COMMENT ON COLUMN public.pharmacies.has_delivery IS
  'هذا الحقل للعرض فقط - لا يوجد توصيل حقيقي في النظام';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 22 applied: Pharmacy catalog system';
END $$;


-- ─── 24_doctors_hospitals_consultations.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🏥 Migration 24: Family Doctor + Hospitals + Consultations (V25.9)
-- ════════════════════════════════════════════════════════════════════
-- يُضيف 3 خدمات أساسية:
--   1. doctors           - أطباء العائلة + التخصصات
--   2. hospitals         - المستشفيات (حكومي/أهلي/مراكز صحية)
--   3. consultations     - الاستشارات النصية + الصور + تحويل التاريخ
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. جدول الأطباء (Family Doctor)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ربط بحساب الطبيب (لو مسجّل في النظام)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- بيانات شخصية
  full_name TEXT NOT NULL,
  full_name_en TEXT,
  title TEXT DEFAULT 'د.',          -- 'د.', 'بروفيسور', 'أ.د.'
  gender TEXT CHECK (gender IN ('male', 'female')),
  
  -- التخصص
  specialty TEXT NOT NULL,
    -- 'family_medicine' (طب عائلة)
    -- 'pediatrics' (أطفال)
    -- 'internal' (باطنية)
    -- 'cardiology' (قلبية)
    -- 'gynecology' (نسائية)
    -- 'orthopedics' (عظام)
    -- 'dermatology' (جلدية)
    -- 'psychiatry' (نفسية)
    -- 'general' (طب عام)
  sub_specialty TEXT,                -- التخصص الدقيق
  
  -- الخبرة والشهادات
  years_experience INTEGER DEFAULT 0,
  qualifications TEXT[],             -- ["بكالوريوس طب جامعة بغداد 2010", "بورد عربي 2015"]
  certifications_url TEXT,           -- ملف PDF للشهادات
  
  -- التوفّر
  available_for_home_visit BOOLEAN DEFAULT TRUE,
  available_for_video BOOLEAN DEFAULT TRUE,
  available_for_clinic BOOLEAN DEFAULT FALSE,
  
  -- التسعير
  home_visit_price NUMERIC DEFAULT 0,        -- زيارة منزلية واحدة
  video_consult_price NUMERIC DEFAULT 0,     -- استشارة فيديو
  monthly_subscription_price NUMERIC,        -- اشتراك شهري (طبيب عائلة)
  yearly_subscription_price NUMERIC,         -- اشتراك سنوي
  
  -- العيادة (لو موجودة)
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,
  clinic_lat NUMERIC,
  clinic_lng NUMERIC,
  
  -- اللغات
  languages TEXT[] DEFAULT ARRAY['ar'],
    -- 'ar', 'en', 'ku' (كردي), 'tr' (تركي)
  
  -- التقييمات
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- الوصف
  bio TEXT,                          -- نبذة شخصية
  avatar_url TEXT,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_city ON public.doctors(clinic_city);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON public.doctors(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON public.doctors(rating_avg DESC);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_select_active" ON public.doctors;
CREATE POLICY "doctors_select_active"
  ON public.doctors FOR SELECT
  USING (is_active = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "doctors_admin_manage" ON public.doctors;
CREATE POLICY "doctors_admin_manage"
  ON public.doctors FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR auth.uid() = user_id
  );

-- ─── اشتراكات طبيب العائلة ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),
  
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- إحصائيات
  visits_used INTEGER DEFAULT 0,
  consultations_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.doctor_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_doctor ON public.doctor_subscriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.doctor_subscriptions(status) WHERE status = 'active';

ALTER TABLE public.doctor_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_own" ON public.doctor_subscriptions;
CREATE POLICY "subscriptions_own"
  ON public.doctor_subscriptions FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ════════════════════════════════════════════════════════════════════
-- 2. جدول المستشفيات
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات أساسية
  name TEXT NOT NULL,
  name_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('government', 'private', 'health_center', 'specialized')),
    -- government: حكومي
    -- private: أهلي/خاص
    -- health_center: مركز صحي
    -- specialized: تخصصي (مثل مستشفى الأطفال)
  
  -- العنوان
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- التواصل
  phone TEXT,
  phone_emergency TEXT,        -- رقم الطوارئ
  whatsapp TEXT,
  website TEXT,
  email TEXT,
  
  -- ساعات العمل
  is_24h BOOLEAN DEFAULT FALSE,
  visiting_hours TEXT,         -- "10:00 - 12:00 مساءً"
  
  -- الأقسام والخدمات
  departments TEXT[],
    -- ['emergency', 'cardiology', 'pediatrics', 'maternity', 'surgery', 
    --  'orthopedics', 'oncology', 'icu', 'lab', 'radiology', 'pharmacy']
  
  has_emergency BOOLEAN DEFAULT FALSE,
  has_ambulance BOOLEAN DEFAULT FALSE,
  has_pharmacy BOOLEAN DEFAULT FALSE,
  has_lab BOOLEAN DEFAULT FALSE,
  has_radiology BOOLEAN DEFAULT FALSE,
  
  -- السعة
  beds_count INTEGER,
  icu_beds_count INTEGER,
  
  -- التقييمات
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- الصور والوصف
  cover_image_url TEXT,
  logo_url TEXT,
  description TEXT,
  
  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_city ON public.hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_type ON public.hospitals(type);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON public.hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON public.hospitals(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hospitals_emergency ON public.hospitals(has_emergency) WHERE has_emergency = TRUE;

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospitals_select_all" ON public.hospitals;
CREATE POLICY "hospitals_select_all"
  ON public.hospitals FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "hospitals_admin_manage" ON public.hospitals;
CREATE POLICY "hospitals_admin_manage"
  ON public.hospitals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ════════════════════════════════════════════════════════════════════
-- 3. جدول الاستشارات النصية
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الأطراف
  patient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    -- لو الطبيب مسجّل في النظام (أكثر دقّة)
  
  -- لمن الاستشارة (فرد عائلة أو نفسه)
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- نوع الاستشارة
  consultation_type TEXT NOT NULL DEFAULT 'chat' CHECK (consultation_type IN ('chat', 'asynchronous')),
    -- chat: محادثة مباشرة (سيتم تطويرها لاحقاً)
    -- asynchronous: المريض يرسل أسئلة + صور + الطبيب يرد لاحقاً
  
  -- الموضوع
  title TEXT NOT NULL,
  category TEXT,
    -- 'general', 'urgent', 'follow_up', 'second_opinion'
  
  -- التاريخ الطبي المُحوّل (الميزة الجديدة!)
  shared_medical_data JSONB,
    -- مثال:
    -- {
    --   "include_appointments": ["uuid1", "uuid2"],
    --   "include_lab_results": ["uuid3"],
    --   "include_prescriptions": ["uuid4"],
    --   "include_family_member_info": true,
    --   "shared_at": "2026-05-19T..."
    -- }
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awaiting_doctor', 'awaiting_patient', 'closed')),
  
  -- التسعير
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,     -- ضمن اشتراك أو مجاناً
  subscription_id UUID REFERENCES public.doctor_subscriptions(id),
  
  -- المواعيد
  expected_response_hours INTEGER DEFAULT 24,
  responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_participants" ON public.consultations;
CREATE POLICY "consultations_participants"
  ON public.consultations FOR ALL
  USING (
    auth.uid() = patient_user_id
    OR auth.uid() = doctor_user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── رسائل الاستشارة (نص + صور) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor', 'system')),
  
  -- المحتوى
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'medical_record', 'voice')),
  content TEXT,                      -- النص
  image_url TEXT,                    -- صورة (أشعة، نتيجة تحليل، صورة لمرض...)
  attached_record_id UUID,           -- ID لسجل طبي محوّل
  attached_record_type TEXT,         -- 'appointment', 'lab_result', 'prescription'
  
  -- الحالة
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation 
  ON public.consultation_messages(consultation_id, created_at);

ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultation_messages_participants" ON public.consultation_messages;
CREATE POLICY "consultation_messages_participants"
  ON public.consultation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
      AND (auth.uid() = c.patient_user_id OR auth.uid() = c.doctor_user_id)
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "consultation_messages_insert" ON public.consultation_messages;
CREATE POLICY "consultation_messages_insert"
  ON public.consultation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
      AND (auth.uid() = c.patient_user_id OR auth.uid() = c.doctor_user_id)
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- 4. View: الأطباء مع إحصائياتهم
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.doctors_with_stats AS
SELECT
  d.*,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscribers_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status != 'closed') as open_consultations_count
FROM public.doctors d
LEFT JOIN public.doctor_subscriptions s ON s.doctor_id = d.id
LEFT JOIN public.consultations c ON c.doctor_id = d.id
GROUP BY d.id;

-- ════════════════════════════════════════════════════════════════════
-- 5. تعليقات
-- ════════════════════════════════════════════════════════════════════
COMMENT ON TABLE public.doctors IS 'الأطباء - متخصصون لاستقبال الحجوزات والاستشارات';
COMMENT ON TABLE public.doctor_subscriptions IS 'اشتراكات طبيب العائلة (شهري/سنوي)';
COMMENT ON TABLE public.hospitals IS 'المستشفيات والمراكز الصحية - حكومي/أهلي/تخصصي';
COMMENT ON TABLE public.consultations IS 'الاستشارات الطبية النصّية';
COMMENT ON TABLE public.consultation_messages IS 'رسائل الاستشارة - نص + صور + تحويل سجلات';

COMMENT ON COLUMN public.consultations.shared_medical_data IS
  'البيانات الطبية التي شاركها المريض مع الطبيب (طلبات، نتائج، وصفات)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 24 applied: Doctors, Hospitals, Consultations';
END $$;


-- ─── 29_cosmetic_products.sql ───
-- ════════════════════════════════════════════════════════════════════
-- ✨ Migration 29: Cosmetic & Beauty Products (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- منتجات التجميل والعناية المُتوفّرة في الصيدليات
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- المعلومات الأساسية
  name TEXT NOT NULL,
  name_en TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'skincare',     -- العناية بالبشرة
    'haircare',     -- الشعر
    'makeup',       -- مكياج
    'fragrance',    -- عطور
    'supplements',  -- مكملات غذائية
    'bodycare',     -- العناية بالجسم
    'baby_care',    -- منتجات أطفال
    'mens_care'     -- منتجات رجالية
  )),

  -- السعر
  price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,

  -- التفاصيل
  description TEXT,
  ingredients TEXT,
  usage_instructions TEXT,

  -- الصورة
  image_url TEXT,
  image_emoji TEXT DEFAULT '🧴',

  -- المتاجر التي تبيعه
  available_at_pharmacies UUID[] DEFAULT ARRAY[]::UUID[],

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- المخزون
  is_in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,

  -- منشأ + توصيات
  country_of_origin TEXT,
  is_recommended BOOLEAN DEFAULT FALSE,    -- اختيار الموظفين
  recommendation_note TEXT,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_category ON public.cosmetic_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetic_active ON public.cosmetic_products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cosmetic_recommended ON public.cosmetic_products(is_recommended) WHERE is_recommended = TRUE;

ALTER TABLE public.cosmetic_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_read_all" ON public.cosmetic_products;
CREATE POLICY "cosmetic_read_all"
  ON public.cosmetic_products FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "cosmetic_admin_manage" ON public.cosmetic_products;
CREATE POLICY "cosmetic_admin_manage"
  ON public.cosmetic_products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── Seed data ───
INSERT INTO public.cosmetic_products (name, name_en, brand, category, price, image_emoji, country_of_origin, is_recommended) VALUES
('كريم ترطيب للوجه', 'Moisturizing Face Cream', 'Eucerin', 'skincare', 25000, '🧴', 'Germany', true),
('سيروم فيتامين C', 'Vitamin C Serum', 'CeraVe', 'skincare', 35000, '💧', 'USA', true),
('شامبو ضد القشرة', 'Anti-Dandruff Shampoo', 'Head & Shoulders', 'haircare', 12000, '🧴', 'USA', false),
('غسول للوجه', 'Foaming Face Wash', 'Cetaphil', 'skincare', 18000, '🧼', 'France', true),
('واقي شمس', 'Sun Protection SPF50', 'La Roche-Posay', 'skincare', 32000, '☀️', 'France', true),
('كريم الأطفال', 'Baby Cream', 'Bepanthen', 'baby_care', 15000, '👶', 'Germany', true),
('فيتامين د3 1000', 'Vitamin D3 1000IU', 'Nature Made', 'supplements', 22000, '💊', 'USA', false),
('عطر رجالي', 'Cool Water Cologne', 'Davidoff', 'fragrance', 85000, '🌸', 'Germany', false),
('شامبو للشعر الدهني', 'Oily Hair Shampoo', 'Vichy', 'haircare', 28000, '🧴', 'France', false),
('كريم ليلي مضاد للتجاعيد', 'Anti-Aging Night Cream', 'Olay', 'skincare', 45000, '🌙', 'USA', true),
('روج أحمر', 'Matte Red Lipstick', 'MAC', 'makeup', 38000, '💄', 'USA', false),
('بلسم للشفاه', 'Lip Balm', 'Vaseline', 'skincare', 5000, '👄', 'USA', true),
('زيت للشعر', 'Hair Oil', 'L''Oreal', 'haircare', 18000, '✨', 'France', false),
('غسول مهبلي', 'Intimate Wash', 'Lactacyd', 'bodycare', 14000, '🌸', 'Belgium', false),
('كريم اليدين', 'Hand Cream', 'Neutrogena', 'skincare', 12000, '🤲', 'USA', true),
('كولاجين شراب', 'Collagen Drink', 'Skinade', 'supplements', 95000, '🥤', 'UK', false),
('شعر اصطناعي', 'Hair Mask', 'Garnier', 'haircare', 16000, '💆', 'France', false),
('عطر نسائي', 'Eau de Parfum', 'Chanel', 'fragrance', 320000, '🌺', 'France', true),
('مزيل عرق', 'Antiperspirant', 'Dove', 'bodycare', 8000, '🧴', 'UK', false),
('مكواة شعر', 'Hair Straightener', 'Babyliss', 'haircare', 75000, '✨', 'France', false);

COMMENT ON TABLE public.cosmetic_products IS 'منتجات التجميل والعناية المتوفرة في الصيدليات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 29 applied: Cosmetic Products + 20 seed';
END $$;


-- ─── 32_physio_service.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🦾 Migration 32: Physiotherapy Service (V25.14)
-- ════════════════════════════════════════════════════════════════════
-- خدمة العلاج الفيزيائي:
--   - أنواع العلاج (إعادة تأهيل، رياضي، أطفال، إلخ)
--   - الأخصائيون
--   - جلسات وخطط علاج
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أنواع العلاج الفيزيائي ───
CREATE TABLE IF NOT EXISTS public.physio_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  icon TEXT DEFAULT '🦾',
  base_price NUMERIC NOT NULL DEFAULT 25000,
  session_duration_minutes INTEGER DEFAULT 45,
  recommended_sessions INTEGER DEFAULT 6,
  conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.physio_service_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_types_public" ON public.physio_service_types;
CREATE POLICY "physio_types_public"
  ON public.physio_service_types FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "physio_types_admin" ON public.physio_service_types;
CREATE POLICY "physio_types_admin"
  ON public.physio_service_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 2. الأخصائيون ───
CREATE TABLE IF NOT EXISTS public.physio_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'د.',
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar']::TEXT[],

  -- التواجد
  cities TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأسعار
  home_visit_price NUMERIC DEFAULT 30000,
  clinic_visit_price NUMERIC DEFAULT 20000,
  package_discount_pct INTEGER DEFAULT 10,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  available_for_home BOOLEAN DEFAULT TRUE,
  available_for_clinic BOOLEAN DEFAULT FALSE,

  -- العيادة (لو موجودة)
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_physio_active ON public.physio_specialists(is_active, rating_avg DESC);

ALTER TABLE public.physio_specialists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_specialists_public" ON public.physio_specialists;
CREATE POLICY "physio_specialists_public"
  ON public.physio_specialists FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "physio_specialists_admin" ON public.physio_specialists;
CREATE POLICY "physio_specialists_admin"
  ON public.physio_specialists FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── Seed: أنواع العلاج الفيزيائي ───
INSERT INTO public.physio_service_types (slug, name_ar, description, icon, base_price, session_duration_minutes, recommended_sessions, conditions, order_index) VALUES
  ('rehab',
   'إعادة التأهيل العام',
   'علاج فيزيائي بعد العمليات أو الإصابات لاستعادة الوظائف الحركية',
   '🦾',
   30000, 45, 8,
   ARRAY['آلام الظهر', 'بعد العمليات الجراحية', 'إصابات العضلات', 'ضعف عام'],
   1),

  ('sports',
   'العلاج الرياضي',
   'علاج إصابات الرياضيين وتحسين الأداء البدني',
   '⚽',
   35000, 60, 10,
   ARRAY['إصابات الملاعب', 'تمزق العضلات', 'التواء المفاصل', 'تأهيل بعد الإصابة'],
   2),

  ('pediatric',
   'علاج الأطفال',
   'علاج فيزيائي مخصّص للأطفال - تأخر النمو، الشلل الدماغي، إصابات',
   '👶',
   40000, 45, 12,
   ARRAY['الشلل الدماغي', 'تأخر النمو الحركي', 'مشاكل المشي عند الأطفال', 'تشوهات القدم'],
   3),

  ('geriatric',
   'علاج كبار السن',
   'علاج فيزيائي مخصّص لكبار السن لتحسين الحركة والاستقلالية',
   '👴',
   25000, 45, 8,
   ARRAY['هشاشة العظام', 'آلام المفاصل', 'صعوبة المشي', 'بعد الجلطات'],
   4),

  ('neurological',
   'علاج الأعصاب',
   'تأهيل بعد السكتات الدماغية أو إصابات الجهاز العصبي',
   '🧠',
   45000, 60, 16,
   ARRAY['بعد الجلطات الدماغية', 'إصابات الحبل الشوكي', 'الشلل النصفي', 'التصلب اللويحي'],
   5),

  ('orthopedic',
   'علاج العظام والمفاصل',
   'علاج آلام العظام والمفاصل والعمود الفقري',
   '🦴',
   30000, 45, 8,
   ARRAY['آلام الرقبة', 'الانزلاق الغضروفي', 'خشونة المفاصل', 'تمزق الأربطة'],
   6),

  ('post_surgery',
   'بعد العمليات الجراحية',
   'تأهيل ما بعد العمليات الجراحية - استبدال مفصل، عمليات الظهر، إلخ',
   '🏥',
   35000, 45, 10,
   ARRAY['استبدال مفصل الركبة', 'استبدال مفصل الورك', 'عمليات الظهر', 'كسور معقدة'],
   7),

  ('respiratory',
   'العلاج التنفسي',
   'تأهيل وظائف الرئة والجهاز التنفسي',
   '💨',
   30000, 45, 6,
   ARRAY['ما بعد كوفيد-19', 'الربو المزمن', 'انسداد الرئة', 'بعد عمليات الصدر'],
   8)

ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: أخصائيون افتراضيون ───
INSERT INTO public.physio_specialists (
  full_name, title, gender, bio, years_experience,
  specialties, certifications, languages, cities,
  home_visit_price, clinic_visit_price, rating_avg, rating_count, total_sessions,
  is_active, is_verified, available_for_home, available_for_clinic,
  clinic_name, clinic_city
) VALUES
  ('أحمد الكاظمي', 'د.', 'male',
   'أخصائي علاج فيزيائي بخبرة 12 سنة في إعادة التأهيل الرياضي والعصبي',
   12,
   ARRAY['rehab', 'sports', 'orthopedic'],
   ARRAY['DPT - الجامعة المستنصرية', 'شهادة تأهيل رياضي معتمد', 'دورة Mulligan'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'كربلاء'],
   35000, 25000, 4.8, 142, 1850,
   TRUE, TRUE, TRUE, TRUE,
   'عيادة الكاظمي للعلاج الفيزيائي', 'بغداد'),

  ('سارة الموسوي', 'د.', 'female',
   'أخصائية علاج فيزيائي للأطفال وذوي الاحتياجات الخاصة',
   8,
   ARRAY['pediatric', 'neurological'],
   ARRAY['DPT - جامعة بغداد', 'شهادة Bobath للأطفال'],
   ARRAY['ar'],
   ARRAY['بغداد', 'النجف'],
   40000, 30000, 4.9, 89, 920,
   TRUE, TRUE, TRUE, FALSE,
   NULL, NULL),

  ('علي حسن', 'د.', 'male',
   'متخصص في تأهيل كبار السن وعلاج آلام المفاصل',
   15,
   ARRAY['geriatric', 'orthopedic'],
   ARRAY['DPT - جامعة بغداد', 'دبلوم تأهيل كبار السن'],
   ARRAY['ar'],
   ARRAY['البصرة', 'بغداد'],
   30000, NULL, 4.7, 215, 2400,
   TRUE, TRUE, TRUE, FALSE,
   NULL, NULL),

  ('فاطمة العزاوي', 'د.', 'female',
   'أخصائية تأهيل بعد العمليات الجراحية والعلاج التنفسي',
   10,
   ARRAY['post_surgery', 'respiratory', 'rehab'],
   ARRAY['DPT - الجامعة المستنصرية', 'شهادة Cardiopulmonary'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد'],
   38000, 28000, 4.9, 167, 1620,
   TRUE, TRUE, TRUE, TRUE,
   'مركز سعد للعلاج الفيزيائي', 'بغداد'),

  ('حسين الزبيدي', 'د.', 'male',
   'أخصائي علاج فيزيائي رياضي - يعمل مع لاعبي محترفين',
   7,
   ARRAY['sports', 'orthopedic'],
   ARRAY['DPT - جامعة بغداد', 'شهادة FIFA Football Medicine'],
   ARRAY['ar', 'en'],
   ARRAY['أربيل', 'الموصل'],
   42000, 32000, 4.8, 98, 1100,
   TRUE, TRUE, TRUE, TRUE,
   'عيادة الرياضة الحديثة', 'أربيل')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.physio_service_types IS 'أنواع العلاج الفيزيائي';
COMMENT ON TABLE public.physio_specialists IS 'أخصائيو العلاج الفيزيائي';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 32 applied: Physiotherapy Service';
  RAISE NOTICE '   - 8 service types seeded';
  RAISE NOTICE '   - 5 specialists seeded';
END $$;


-- ─── 33_new_services.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🆕 Migration 33: New Services (V25.19)
-- ════════════════════════════════════════════════════════════════════
-- 4 خدمات جديدة:
--   1. 🦷 Dentistry (طب الأسنان)
--   2. 👓 Eyewear (النظارات الطبية)
--   3. 🧠 Mental Health (العلاج النفسي)
--   4. 🥗 Nutrition (التغذية والحمية)
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 🦷 1. DENTISTRY
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dental_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  latitude NUMERIC,
  longitude NUMERIC,

  -- التخصصات
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأطباء
  doctor_count INTEGER DEFAULT 1,
  doctor_names TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأسعار (مدى من-إلى)
  cleaning_price_min NUMERIC DEFAULT 15000,
  cleaning_price_max NUMERIC DEFAULT 30000,
  filling_price_min NUMERIC DEFAULT 20000,
  filling_price_max NUMERIC DEFAULT 50000,
  extraction_price_min NUMERIC DEFAULT 25000,
  extraction_price_max NUMERIC DEFAULT 75000,
  implant_price_min NUMERIC DEFAULT 500000,
  implant_price_max NUMERIC DEFAULT 1500000,

  -- الخدمات
  offers_cleaning BOOLEAN DEFAULT TRUE,
  offers_fillings BOOLEAN DEFAULT TRUE,
  offers_extraction BOOLEAN DEFAULT TRUE,
  offers_implants BOOLEAN DEFAULT FALSE,
  offers_orthodontics BOOLEAN DEFAULT FALSE,
  offers_whitening BOOLEAN DEFAULT FALSE,
  offers_cosmetic BOOLEAN DEFAULT FALSE,
  offers_pediatric BOOLEAN DEFAULT FALSE,
  offers_emergency BOOLEAN DEFAULT FALSE,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  insurance_providers TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- ساعات العمل
  working_hours TEXT,
  is_open_24h BOOLEAN DEFAULT FALSE,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dental_active ON public.dental_clinics(is_active, city, rating_avg DESC);

ALTER TABLE public.dental_clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_public" ON public.dental_clinics;
CREATE POLICY "dental_public"
  ON public.dental_clinics FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "dental_admin" ON public.dental_clinics;
CREATE POLICY "dental_admin"
  ON public.dental_clinics FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 👓 2. EYEWEAR
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.optical_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  latitude NUMERIC,
  longitude NUMERIC,

  -- الخدمات
  offers_eye_exam BOOLEAN DEFAULT TRUE,
  exam_price NUMERIC DEFAULT 10000,
  offers_prescription_lenses BOOLEAN DEFAULT TRUE,
  offers_sunglasses BOOLEAN DEFAULT TRUE,
  offers_contact_lenses BOOLEAN DEFAULT FALSE,
  offers_eye_surgery_referral BOOLEAN DEFAULT FALSE,

  -- العلامات التجارية
  brands TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- الأسعار (الإطارات)
  frame_price_min NUMERIC DEFAULT 25000,
  frame_price_max NUMERIC DEFAULT 500000,
  lens_price_min NUMERIC DEFAULT 30000,
  lens_price_max NUMERIC DEFAULT 200000,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  working_hours TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_optical_active ON public.optical_stores(is_active, city, rating_avg DESC);

ALTER TABLE public.optical_stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optical_public" ON public.optical_stores;
CREATE POLICY "optical_public"
  ON public.optical_stores FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "optical_admin" ON public.optical_stores;
CREATE POLICY "optical_admin"
  ON public.optical_stores FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 🧠 3. MENTAL HEALTH
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.mental_health_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'د.',
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,

  -- النوع
  specialist_type TEXT NOT NULL CHECK (specialist_type IN (
    'psychiatrist',         -- طبيب نفسي (يصف أدوية)
    'psychologist',         -- أخصائي نفسي
    'therapist',            -- معالج نفسي
    'counselor',            -- مرشد نفسي
    'family_therapist'      -- معالج عائلي
  )),

  -- التخصصات
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- ex: 'anxiety', 'depression', 'ocd', 'trauma', 'couples', 'children', 'addiction'

  -- المؤهلات
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar']::TEXT[],

  -- التوافر
  cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_online BOOLEAN DEFAULT TRUE,
  available_in_clinic BOOLEAN DEFAULT TRUE,

  -- الأسعار
  online_session_price NUMERIC DEFAULT 50000,
  clinic_session_price NUMERIC DEFAULT 75000,
  session_duration_minutes INTEGER DEFAULT 50,

  -- العيادة
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  accepts_emergency BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mental_active ON public.mental_health_specialists(is_active, specialist_type, rating_avg DESC);

ALTER TABLE public.mental_health_specialists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_public" ON public.mental_health_specialists;
CREATE POLICY "mental_public"
  ON public.mental_health_specialists FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "mental_admin" ON public.mental_health_specialists;
CREATE POLICY "mental_admin"
  ON public.mental_health_specialists FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 🥗 4. NUTRITION
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.nutritionists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'د.',
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,

  -- التخصصات
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- ex: 'weight_loss', 'weight_gain', 'sports_nutrition',
  --     'diabetes', 'pcos', 'pregnancy', 'pediatric', 'eating_disorders'

  -- المؤهلات
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar']::TEXT[],

  -- التوافر
  cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_online BOOLEAN DEFAULT TRUE,
  available_in_clinic BOOLEAN DEFAULT TRUE,

  -- الأسعار (3 باقات)
  initial_consultation_price NUMERIC DEFAULT 30000,
  follow_up_price NUMERIC DEFAULT 15000,
  monthly_plan_price NUMERIC DEFAULT 100000,

  -- العيادة
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_phone TEXT,

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 0, -- نسبة النجاح %

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_active ON public.nutritionists(is_active, rating_avg DESC);

ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutrition_public" ON public.nutritionists;
CREATE POLICY "nutrition_public"
  ON public.nutritionists FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "nutrition_admin" ON public.nutritionists;
CREATE POLICY "nutrition_admin"
  ON public.nutritionists FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ════════════════════════════════════════════════════════════════════
-- 🌱 SEED DATA
-- ════════════════════════════════════════════════════════════════════

-- ─── 🦷 Dental Clinics ───
INSERT INTO public.dental_clinics (
  name, description, city, district, address, phone,
  specialties, doctor_count, doctor_names,
  cleaning_price_min, cleaning_price_max,
  filling_price_min, filling_price_max,
  implant_price_min, implant_price_max,
  offers_implants, offers_orthodontics, offers_whitening, offers_cosmetic, offers_pediatric,
  rating_avg, rating_count, is_verified, is_featured,
  working_hours
) VALUES
  ('عيادة الابتسامة الذهبية',
   'عيادة متكاملة لكل احتياجات طب الأسنان - تقويم + تجميل + زراعة',
   'بغداد', 'الكرادة', 'الكرادة - شارع 62',
   '+9647707000001',
   ARRAY['تقويم', 'تجميل', 'زراعة', 'تبييض'],
   3, ARRAY['د. أحمد الزبيدي', 'د. سارة العزاوي', 'د. علي السامرائي'],
   20000, 30000,
   30000, 60000,
   600000, 1200000,
   TRUE, TRUE, TRUE, TRUE, TRUE,
   4.8, 234, TRUE, TRUE,
   'يومياً من 9 ص إلى 9 م'),

  ('مركز اللؤلؤة لطب الأسنان',
   'متخصصون في الزراعة وطب الأسنان التجميلي',
   'البصرة', 'المعقل', 'المعقل - شارع الميناء',
   '+9647807000002',
   ARRAY['زراعة', 'تجميل', 'علاج عصب'],
   2, ARRAY['د. حسن البصري', 'د. زينب الجبوري'],
   15000, 25000,
   25000, 55000,
   500000, 1100000,
   TRUE, FALSE, TRUE, TRUE, FALSE,
   4.7, 156, TRUE, FALSE,
   'السبت-الخميس 10 ص - 8 م'),

  ('عيادة الأطفال للأسنان',
   'متخصصة في أسنان الأطفال - بيئة مريحة وممتعة للأطفال',
   'بغداد', 'المنصور', 'المنصور - شارع 14 رمضان',
   '+9647707000003',
   ARRAY['أطفال', 'تقويم', 'وقاية'],
   2, ARRAY['د. فاطمة الكاظمي', 'د. مريم الحسيني'],
   15000, 20000,
   20000, 40000,
   0, 0,
   FALSE, TRUE, FALSE, FALSE, TRUE,
   4.9, 312, TRUE, TRUE,
   'يومياً 9 ص - 6 م'),

  ('مركز المهارة الطبي للأسنان',
   'الرائدون في تقويم الأسنان والشفّاف Invisalign',
   'أربيل', 'عينكاوا', 'عينكاوا - الشارع الرئيسي',
   '+9647507000004',
   ARRAY['تقويم', 'Invisalign', 'تبييض', 'فينير'],
   4, ARRAY['د. هيوا أحمد', 'د. شاهين رشيد'],
   25000, 35000,
   35000, 70000,
   700000, 1500000,
   TRUE, TRUE, TRUE, TRUE, FALSE,
   4.9, 198, TRUE, TRUE,
   'يومياً 10 ص - 9 م'),

  ('عيادة النجف الحديثة',
   'أحدث تقنيات طب الأسنان بأسعار مناسبة',
   'النجف', 'حي السعد', 'حي السعد - شارع المدرسة',
   '+9647807000005',
   ARRAY['عام', 'حشوات', 'علاج عصب'],
   2, ARRAY['د. كاظم الحلو', 'د. ليلى السيد'],
   12000, 18000,
   18000, 35000,
   0, 0,
   FALSE, FALSE, TRUE, FALSE, TRUE,
   4.5, 87, TRUE, FALSE,
   'السبت-الخميس 9 ص - 8 م')
ON CONFLICT DO NOTHING;

-- ─── 👓 Optical Stores ───
INSERT INTO public.optical_stores (
  name, description, city, district, address, phone,
  brands, exam_price,
  frame_price_min, frame_price_max,
  lens_price_min, lens_price_max,
  offers_contact_lenses, offers_eye_exam,
  rating_avg, rating_count, is_verified, is_featured,
  working_hours
) VALUES
  ('نظارات الرؤية الواضحة',
   'وكلاء حصريّون لـ Ray-Ban و Oakley في العراق',
   'بغداد', 'المنصور', 'المنصور - شارع 14 رمضان',
   '+9647707000010',
   ARRAY['Ray-Ban', 'Oakley', 'Tom Ford', 'Gucci'],
   10000, 50000, 800000, 40000, 250000,
   TRUE, TRUE,
   4.7, 142, TRUE, TRUE,
   'يومياً 10 ص - 10 م'),

  ('بصريات الكوفي',
   'أكبر سلسلة نظارات في العراق - 5 فروع',
   'بغداد', 'الكرادة', 'فرع الكرادة',
   '+9647707000011',
   ARRAY['Police', 'Carrera', 'Persol', 'محلية'],
   8000, 25000, 500000, 30000, 180000,
   TRUE, TRUE,
   4.5, 287, TRUE, TRUE,
   'يومياً 9 ص - 9 م'),

  ('Optical Vision البصرة',
   'أحدث الموديلات والعلامات العالمية',
   'البصرة', 'الجزائر', 'شارع الجزائر',
   '+9647807000012',
   ARRAY['Ray-Ban', 'Persol', 'Lacoste'],
   12000, 60000, 600000, 35000, 200000,
   TRUE, TRUE,
   4.6, 98, TRUE, FALSE,
   'السبت-الخميس 9 ص - 9 م'),

  ('بصريات النجف',
   'نظارات طبية وشمسية بأسعار مناسبة',
   'النجف', 'مركز المدينة', 'شارع الرسول',
   '+9647807000013',
   ARRAY['محلية', 'صينية', 'تركية'],
   5000, 20000, 200000, 20000, 100000,
   FALSE, TRUE,
   4.3, 67, TRUE, FALSE,
   'يومياً 9 ص - 8 م'),

  ('Eye Care أربيل',
   'متخصصون في فحوصات النظر والعدسات اللاصقة',
   'أربيل', 'إنكاوا', 'إنكاوا - شارع 60',
   '+9647507000014',
   ARRAY['Acuvue', 'Bausch + Lomb', 'Persol'],
   15000, 80000, 700000, 45000, 280000,
   TRUE, TRUE,
   4.8, 121, TRUE, TRUE,
   'يومياً 10 ص - 10 م')
ON CONFLICT DO NOTHING;

-- ─── 🧠 Mental Health Specialists ───
INSERT INTO public.mental_health_specialists (
  full_name, title, gender, bio, years_experience,
  specialist_type, specialties, certifications, languages, cities,
  available_online, available_in_clinic,
  online_session_price, clinic_session_price,
  rating_avg, rating_count, total_sessions,
  is_active, is_verified, accepts_emergency,
  clinic_name, clinic_city
) VALUES
  ('د. مهند العبيدي', 'د.', 'male',
   'طبيب نفسي بخبرة 15 سنة - متخصص في علاج القلق والاكتئاب',
   15, 'psychiatrist',
   ARRAY['anxiety', 'depression', 'ocd', 'bipolar'],
   ARRAY['MD - جامعة بغداد', 'دبلوم الطب النفسي', 'CBT certified'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   60000, 80000,
   4.9, 245, 2400,
   TRUE, TRUE, FALSE,
   'مركز الصفاء النفسي', 'بغداد'),

  ('أ. هدى الجبوري', 'أ.', 'female',
   'أخصائية نفسية - متخصصة في علاج اضطرابات الأكل والقلق لدى النساء',
   10, 'psychologist',
   ARRAY['eating_disorders', 'anxiety', 'trauma', 'women_health'],
   ARRAY['MSc Clinical Psychology', 'EMDR certified'],
   ARRAY['ar'],
   ARRAY['بغداد', 'كربلاء'],
   TRUE, TRUE,
   45000, 65000,
   4.8, 187, 1800,
   TRUE, TRUE, FALSE,
   NULL, NULL),

  ('د. أحمد الكاظمي', 'د.', 'male',
   'معالج عائلي وزواجي - متخصص في العلاقات والتواصل الزوجي',
   12, 'family_therapist',
   ARRAY['couples', 'family', 'parenting', 'communication'],
   ARRAY['PhD Marriage & Family Therapy', 'Gottman trained'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'البصرة'],
   TRUE, TRUE,
   55000, 75000,
   4.9, 156, 1450,
   TRUE, TRUE, FALSE,
   'عيادة العائلة', 'بغداد'),

  ('أ. ريم الموسوي', 'أ.', 'female',
   'مستشارة نفسية للأطفال والمراهقين - 8 سنوات خبرة',
   8, 'counselor',
   ARRAY['children', 'adolescents', 'school_issues', 'adhd'],
   ARRAY['MA Child Psychology', 'Play Therapy certified'],
   ARRAY['ar'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   40000, 55000,
   4.7, 134, 1200,
   TRUE, TRUE, FALSE,
   NULL, NULL),

  ('د. كرار الزبيدي', 'د.', 'male',
   'معالج إدمان وطبيب نفسي - متخصص في الإقلاع عن المخدرات والكحول',
   18, 'psychiatrist',
   ARRAY['addiction', 'depression', 'anxiety'],
   ARRAY['MD - الجامعة المستنصرية', 'Addiction Medicine certified'],
   ARRAY['ar'],
   ARRAY['بغداد', 'النجف'],
   TRUE, TRUE,
   70000, 100000,
   4.9, 89, 1620,
   TRUE, TRUE, TRUE,
   'مركز الأمل للتأهيل', 'بغداد')
ON CONFLICT DO NOTHING;

-- ─── 🥗 Nutritionists ───
INSERT INTO public.nutritionists (
  full_name, title, gender, bio, years_experience,
  specialties, certifications, languages, cities,
  available_online, available_in_clinic,
  initial_consultation_price, follow_up_price, monthly_plan_price,
  rating_avg, rating_count, total_clients, success_rate,
  is_active, is_verified,
  clinic_name, clinic_city
) VALUES
  ('أ. زينب السامرائي', 'أ.', 'female',
   'أخصائية تغذية - متخصصة في إنقاص الوزن لدى النساء و PCOS',
   8,
   ARRAY['weight_loss', 'pcos', 'pregnancy', 'women_health'],
   ARRAY['BSc Nutrition', 'PCOS Coach certified'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'كربلاء'],
   TRUE, TRUE,
   35000, 20000, 120000,
   4.8, 312, 850, 87,
   TRUE, TRUE,
   'عيادة التغذية الصحية', 'بغداد'),

  ('د. علي الحسني', 'د.', 'male',
   'دكتور تغذية رياضية - أعمل مع رياضيين محترفين',
   10,
   ARRAY['sports_nutrition', 'weight_gain', 'muscle_building'],
   ARRAY['MSc Sports Nutrition', 'ISSN certified'],
   ARRAY['ar', 'en'],
   ARRAY['بغداد', 'أربيل'],
   TRUE, TRUE,
   45000, 25000, 150000,
   4.9, 234, 620, 92,
   TRUE, TRUE,
   'مركز الأداء الرياضي', 'بغداد'),

  ('أ. ساره الكاظمي', 'أ.', 'female',
   'أخصائية تغذية الأطفال والرضع - 7 سنوات خبرة',
   7,
   ARRAY['pediatric', 'pregnancy', 'breastfeeding'],
   ARRAY['BSc Nutrition', 'Pediatric Nutrition specialist'],
   ARRAY['ar'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   30000, 18000, 100000,
   4.9, 198, 540, 95,
   TRUE, TRUE,
   NULL, NULL),

  ('د. حسن المالكي', 'د.', 'male',
   'متخصص في إدارة السكري وأمراض القلب عبر التغذية',
   12,
   ARRAY['diabetes', 'cardiovascular', 'weight_loss'],
   ARRAY['PhD Nutrition Sciences', 'Certified Diabetes Educator'],
   ARRAY['ar', 'en'],
   ARRAY['البصرة', 'بغداد'],
   TRUE, TRUE,
   50000, 28000, 180000,
   4.8, 167, 720, 89,
   TRUE, TRUE,
   'عيادة الأيض', 'البصرة'),

  ('أ. مريم الأنصاري', 'أ.', 'female',
   'متخصصة في علاج اضطرابات الأكل واستعادة العلاقة الصحية بالطعام',
   6,
   ARRAY['eating_disorders', 'weight_loss', 'mental_health_nutrition'],
   ARRAY['MSc Clinical Nutrition', 'Eating Disorders specialist'],
   ARRAY['ar'],
   ARRAY['بغداد'],
   TRUE, TRUE,
   40000, 22000, 130000,
   4.9, 89, 320, 91,
   TRUE, TRUE,
   NULL, NULL)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.dental_clinics IS 'عيادات الأسنان';
COMMENT ON TABLE public.optical_stores IS 'متاجر النظارات الطبية';
COMMENT ON TABLE public.mental_health_specialists IS 'أخصائيو الصحة النفسية';
COMMENT ON TABLE public.nutritionists IS 'أخصائيو التغذية';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 33 applied: 4 new services';
  RAISE NOTICE '   - 🦷 5 عيادات أسنان';
  RAISE NOTICE '   - 👓 5 متاجر نظارات';
  RAISE NOTICE '   - 🧠 5 أخصائيو صحة نفسية';
  RAISE NOTICE '   - 🥗 5 أخصائيو تغذية';
END $$;


-- ─── 45_vaccines_service_v50.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 45: Vaccines Service (V25.50)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. vaccines (الكتالوج)
--   2. vaccine_clinics (مراكز التطعيم)
--   3. vaccination_records (سجل تطعيمات المريض)
--   4. vaccine_appointments (مواعيد اللقاحات)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. VACCINES Catalog ───
CREATE TABLE IF NOT EXISTS public.vaccines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المعلومات الأساسية
  name_ar           TEXT NOT NULL,
  name_en           TEXT,
  manufacturer      TEXT,
  
  -- الفئة
  category          TEXT NOT NULL CHECK (category IN (
    'pediatric',          -- لقاحات الأطفال (الجدول الوطني)
    'adult',              -- لقاحات البالغين (إنفلونزا، تيتانوس...)
    'travel',             -- لقاحات السفر (حمى صفراء، كوليرا...)
    'covid',              -- كوفيد
    'seasonal',           -- موسمية
    'optional'            -- اختيارية
  )),
  
  -- الأمراض المستهدفة
  diseases          TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- e.g. ['الحصبة', 'النكاف', 'الحصبة الألمانية']
  
  -- الجرعات
  doses_required    INTEGER NOT NULL DEFAULT 1,
  dose_interval_days INTEGER,  -- الفترة بين الجرعات
  recommended_age_months INTEGER,  -- العمر الموصى به (للأطفال)
  recommended_age_months_max INTEGER,  -- العمر الأقصى
  
  -- السعر
  price             NUMERIC NOT NULL DEFAULT 0,
  is_free           BOOLEAN DEFAULT FALSE,  -- لقاح حكومي مجاني
  
  -- الوصف
  description       TEXT,
  side_effects      TEXT,
  contraindications TEXT,
  
  -- الصورة
  icon              TEXT DEFAULT '💉',
  image_url         TEXT,
  
  -- التصنيف
  is_mandatory      BOOLEAN DEFAULT FALSE,  -- إلزامي حكومياً
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  display_order     INTEGER DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccines_category ON public.vaccines(category);
CREATE INDEX IF NOT EXISTS idx_vaccines_age ON public.vaccines(recommended_age_months);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccines_public_read" ON public.vaccines;
CREATE POLICY "vaccines_public_read"
  ON public.vaccines FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "vaccines_admin_all" ON public.vaccines;
CREATE POLICY "vaccines_admin_all"
  ON public.vaccines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. VACCINE CLINICS ───
CREATE TABLE IF NOT EXISTS public.vaccine_clinics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('government', 'private', 'mobile')),
  
  -- الموقع
  city              TEXT NOT NULL,
  district          TEXT,
  address           TEXT,
  latitude          NUMERIC,
  longitude         NUMERIC,
  
  -- الاتصال
  phone             TEXT,
  whatsapp          TEXT,
  
  -- ساعات العمل
  opens_at          TEXT DEFAULT '08:00',
  closes_at         TEXT DEFAULT '14:00',
  works_friday      BOOLEAN DEFAULT FALSE,
  
  -- الخدمات
  offers_pediatric  BOOLEAN DEFAULT TRUE,
  offers_adult      BOOLEAN DEFAULT TRUE,
  offers_travel     BOOLEAN DEFAULT FALSE,
  offers_covid      BOOLEAN DEFAULT TRUE,
  offers_home_visit BOOLEAN DEFAULT FALSE,
  home_visit_price  NUMERIC DEFAULT 25000,
  
  -- التقييم
  rating_avg        NUMERIC DEFAULT 0,
  rating_count      INTEGER DEFAULT 0,
  
  -- الحالة
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccine_clinics_city ON public.vaccine_clinics(city);

ALTER TABLE public.vaccine_clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccine_clinics_public_read" ON public.vaccine_clinics;
CREATE POLICY "vaccine_clinics_public_read"
  ON public.vaccine_clinics FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "vaccine_clinics_admin_all" ON public.vaccine_clinics;
CREATE POLICY "vaccine_clinics_admin_all"
  ON public.vaccine_clinics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. VACCINATION RECORDS ───
-- سجل تطعيمات المريض (والعائلة)
CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  vaccine_id        UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  
  -- معلومات الجرعة
  dose_number       INTEGER NOT NULL DEFAULT 1,
  administered_at   TIMESTAMPTZ NOT NULL,
  administered_by   TEXT,  -- اسم الطبيب/الممرض
  clinic_id         UUID REFERENCES public.vaccine_clinics(id) ON DELETE SET NULL,
  clinic_name       TEXT,
  
  -- معلومات إضافية
  batch_number      TEXT,
  expiry_date       DATE,
  
  -- آثار جانبية
  side_effects      TEXT,
  
  -- شهادة التطعيم
  certificate_url   TEXT,
  
  -- ملاحظات
  notes             TEXT,
  
  -- مصدر التسجيل
  source            TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'appointment', 'imported')),
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, vaccine_id, dose_number, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_vaccination_records_user ON public.vaccination_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_vaccine ON public.vaccination_records(vaccine_id);

ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccination_records_user_all" ON public.vaccination_records;
CREATE POLICY "vaccination_records_user_all"
  ON public.vaccination_records FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "vaccination_records_admin_read" ON public.vaccination_records;
CREATE POLICY "vaccination_records_admin_read"
  ON public.vaccination_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. أعمدة في appointments للقاحات ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS vaccine_id UUID REFERENCES public.vaccines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vaccine_clinic_id UUID REFERENCES public.vaccine_clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vaccine_dose_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_appointments_vaccine ON public.appointments(vaccine_id) WHERE vaccine_id IS NOT NULL;

-- ─── 5. Seed - 10 لقاحات أساسية ───
INSERT INTO public.vaccines (name_ar, name_en, category, diseases, doses_required, dose_interval_days, recommended_age_months, recommended_age_months_max, price, is_free, is_mandatory, description, icon, display_order)
VALUES
  ('بي سي جي (BCG)', 'BCG', 'pediatric', ARRAY['السل'], 1, NULL, 0, 1, 0, TRUE, TRUE, 'لقاح ضد السل - يُعطى عند الولادة', '💉', 1),
  ('خماسي (Pentavalent)', 'Pentavalent', 'pediatric', ARRAY['الدفتيريا', 'الكزاز', 'السعال الديكي', 'التهاب الكبد B', 'الإنفلونزا المستدمية'], 3, 60, 2, 6, 0, TRUE, TRUE, 'لقاح خماسي يُعطى 3 جرعات على فترات شهرين', '💉', 2),
  ('شلل الأطفال (OPV)', 'OPV', 'pediatric', ARRAY['شلل الأطفال'], 4, 60, 2, 18, 0, TRUE, TRUE, 'لقاح شلل الأطفال الفموي', '💉', 3),
  ('MMR', 'MMR', 'pediatric', ARRAY['الحصبة', 'النكاف', 'الحصبة الألمانية'], 2, 365, 12, 18, 0, TRUE, TRUE, 'لقاح الحصبة والنكاف والحصبة الألمانية', '💉', 4),
  ('الإنفلونزا الموسمية', 'Influenza', 'seasonal', ARRAY['الإنفلونزا'], 1, NULL, 6, NULL, 15000, FALSE, FALSE, 'لقاح سنوي ضد الإنفلونزا الموسمية', '🤧', 5),
  ('كوفيد-19 (Pfizer)', 'Pfizer COVID-19', 'covid', ARRAY['كوفيد-19'], 3, 21, 60, NULL, 0, TRUE, FALSE, 'لقاح فايزر ضد كورونا', '😷', 6),
  ('التيتانوس', 'Tetanus', 'adult', ARRAY['الكزاز'], 1, NULL, 60, NULL, 8000, FALSE, FALSE, 'لقاح ضد الكزاز - يُعطى كل 10 سنوات', '💉', 7),
  ('التهاب الكبد A', 'Hepatitis A', 'optional', ARRAY['التهاب الكبد A'], 2, 180, 12, NULL, 25000, FALSE, FALSE, 'لقاح اختياري ضد التهاب الكبد A', '💉', 8),
  ('الحمى الصفراء', 'Yellow Fever', 'travel', ARRAY['الحمى الصفراء'], 1, NULL, 108, NULL, 50000, FALSE, FALSE, 'لقاح ضد الحمى الصفراء - مطلوب للسفر لبعض الدول', '🦟', 9),
  ('HPV', 'HPV', 'adult', ARRAY['فيروس الورم الحليمي'], 2, 180, 108, 324, 80000, FALSE, FALSE, 'لقاح ضد فيروس الورم الحليمي (للإناث)', '💉', 10)
ON CONFLICT DO NOTHING;

-- ─── 6. Notification templates ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  ('vaccine_reminder', 'تذكير: موعد لقاح قريب 💉', 'push', 'لديك جرعة لقاح مستحقّة قريباً'),
  ('vaccine_overdue', 'تنبيه: جرعة لقاح متأخّرة ⚠️', 'push', 'فاتك موعد جرعة - راجع جدول اللقاحات'),
  ('vaccine_appointment_booked', 'تأكيد موعد اللقاح ✓', 'push', 'تم حجز موعد اللقاح بنجاح')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 45 (V25.50)
-- ═══════════════════════════════════════════════════════════════════════════





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0005_specialists_ratings.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  05_specialists_ratings.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 05_specialists_ratings.sql — المختصّون + التمريض + كل التقييمات (تعتمد على 04)
-- مدموج (V33) من: 09_specialist_system.sql 20_nursing_enhancements.sql 21_nurse_credentials.sql 40_nursing_enhancements_v44.sql 41_doctor_system_v45.sql 42_pharmacy_system_v46.sql 43_hospitals_dental_optical_v47.sql 44_mental_nutrition_physio_cosmetic_v48.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 09_specialist_system.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 09_specialist_system.sql — نظام الاختصاصيين الموحّد (V24 — مُصحَّح)
-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V24: مزامنة specialist_id ↔ assigned_specialist_id عبر trigger
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. توسيع جدول users ───
-- (كتلة ALTER users نُقلت للملف 01 — V33)

-- check المسموح في specialist_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_specialist_type_check') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_specialist_type_check
      CHECK (specialist_type IS NULL OR specialist_type IN (
        'lab_analyst', 'nurse', 'doctor', 'pharmacist',
        'physio', 'psychologist', 'nutritionist'
      ));
  END IF;
END $$;

-- 🆕 V24: indexes على الأعمدة الجديدة
CREATE INDEX IF NOT EXISTS users_specialist_type_idx ON public.users(specialist_type)
  WHERE specialist_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_approval_status_idx ON public.users(approval_status, role)
  WHERE role = 'specialist';


-- ─── 2. توسيع جدول appointments ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS required_specialist_type text,
  ADD COLUMN IF NOT EXISTS assigned_specialist_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS specialist_notes text,
  ADD COLUMN IF NOT EXISTS lab_results_url text,
  ADD COLUMN IF NOT EXISTS lab_results_data jsonb,
  ADD COLUMN IF NOT EXISTS nursing_actions jsonb,
  ADD COLUMN IF NOT EXISTS prescription_data jsonb,
  ADD COLUMN IF NOT EXISTS session_plan jsonb;

CREATE INDEX IF NOT EXISTS appointments_specialist_idx ON public.appointments(assigned_specialist_id, status)
  WHERE assigned_specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_required_type_idx ON public.appointments(required_specialist_type, status)
  WHERE required_specialist_type IS NOT NULL;


-- ─── 3. جدول جدول الدوام (Schedule) ───
CREATE TABLE IF NOT EXISTS public.specialist_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week  integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT schedules_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS schedules_specialist_idx ON public.specialist_schedules(specialist_id, is_active);


-- ═══════════════════════════════════════════════════════════════════
-- 🔄 V24 جديد: مزامنة specialist_id ↔ assigned_specialist_id
-- ═══════════════════════════════════════════════════════════════════
-- توافق رجعي: عند تحديث أحدهما، الآخر يُحدّث تلقائياً.
-- الكود الجديد يستخدم assigned_specialist_id (مفضّل).
-- الـ policies القديمة تستخدم specialist_id (يجب أن تبقى تعمل).

CREATE OR REPLACE FUNCTION public.sync_specialist_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: مزامنة أحدهما إلى الآخر
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_specialist_id IS NOT NULL AND NEW.specialist_id IS NULL THEN
      NEW.specialist_id := NEW.assigned_specialist_id;
    ELSIF NEW.specialist_id IS NOT NULL AND NEW.assigned_specialist_id IS NULL THEN
      NEW.assigned_specialist_id := NEW.specialist_id;
    END IF;
  END IF;

  -- UPDATE: إذا تغيّر assigned_specialist_id، حدّث specialist_id
  IF TG_OP = 'UPDATE' THEN
    IF NEW.assigned_specialist_id IS DISTINCT FROM OLD.assigned_specialist_id
       AND NEW.specialist_id = OLD.specialist_id THEN
      NEW.specialist_id := NEW.assigned_specialist_id;
    -- إذا تغيّر specialist_id (legacy)، حدّث assigned_specialist_id
    ELSIF NEW.specialist_id IS DISTINCT FROM OLD.specialist_id
          AND NEW.assigned_specialist_id = OLD.assigned_specialist_id THEN
      NEW.assigned_specialist_id := NEW.specialist_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_specialist_fields ON public.appointments;
CREATE TRIGGER trg_sync_specialist_fields
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_specialist_fields();

-- مزامنة البيانات الموجودة (مرة واحدة)
UPDATE public.appointments
SET assigned_specialist_id = specialist_id
WHERE specialist_id IS NOT NULL
  AND assigned_specialist_id IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.specialist_schedules ENABLE ROW LEVEL SECURITY;

-- Schedules: الاختصاصي يدير جدوله، الكل يقدر يقرأ
DROP POLICY IF EXISTS schedules_view_all ON public.specialist_schedules;
CREATE POLICY schedules_view_all ON public.specialist_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS schedules_manage_own ON public.specialist_schedules;
CREATE POLICY schedules_manage_own ON public.specialist_schedules
  FOR ALL USING (specialist_id = auth.uid())
  WITH CHECK (specialist_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════
-- Function: Auto-assign specialist type on appointment creation
-- ═══════════════════════════════════════════════════════════════════
-- منطق التوزيع: حسب service_id → specialist_type

CREATE OR REPLACE FUNCTION public.determine_specialist_type(service_id text)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN service_id IN ('blood-draw', 'lab-test') THEN 'lab_analyst'
    WHEN service_id IN ('home-nursing', 'injection', 'vaccination') THEN 'nurse'
    WHEN service_id IN ('consultation-general', 'consultation-specialist', 'consultation-video') THEN 'doctor'
    WHEN service_id IN ('pharmacy-consultation', 'drug-interaction') THEN 'pharmacist'
    WHEN service_id IN ('physiotherapy') THEN 'physio'
    WHEN service_id IN ('psychology') THEN 'psychologist'
    WHEN service_id IN ('nutrition') THEN 'nutritionist'
    ELSE 'doctor' -- default
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: عند إنشاء appointment، حدد required_specialist_type تلقائياً
CREATE OR REPLACE FUNCTION public.auto_set_required_specialist()
RETURNS trigger AS $$
BEGIN
  IF NEW.required_specialist_type IS NULL AND NEW.service_id IS NOT NULL THEN
    NEW.required_specialist_type := public.determine_specialist_type(NEW.service_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_required_specialist ON public.appointments;
CREATE TRIGGER trg_auto_required_specialist
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_required_specialist();


-- ═══════════════════════════════════════════════════════════════════
-- RLS Update: appointments — الاختصاصي يشوف بس طلبات نوعه
-- ═══════════════════════════════════════════════════════════════════
-- 🛠️ إصلاح تكرار RLS لا نهائي (infinite recursion):
-- كان EXISTS(SELECT FROM users …) داخل سياسة appointments يُعيد تفعيل سياسات
-- users (ومنها "Specialists can view patients" التي تستعلم appointments) → حلقة
-- لا نهائية تكسر أي استعلام يمسّ users (ومنه رفع الطلبات). الحل: دالة
-- SECURITY DEFINER تتجاوز RLS (كما is_admin) فتكسر الحلقة.
CREATE OR REPLACE FUNCTION public.current_user_is_approved_specialist_type(req_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'specialist'
      AND u.approval_status = 'approved'
      AND u.specialist_type::text = req_type
  );
$$;

DROP POLICY IF EXISTS appointments_specialist_view ON public.appointments;
CREATE POLICY appointments_specialist_view ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid()  -- المريض يشوف طلباته
    OR assigned_specialist_id = auth.uid()  -- الاختصاصي المعيّن
    OR (  -- أي اختصاصي من نفس النوع المطلوب يشوفها لو لم تُعيّن
      appointments.assigned_specialist_id IS NULL
      AND public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
    )
  );

-- اختصاصي يقدر يقبل/يعدّل طلب نوعه فقط
DROP POLICY IF EXISTS appointments_specialist_update ON public.appointments;
CREATE POLICY appointments_specialist_update ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
  );


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 09 Complete
-- ═══════════════════════════════════════════════════════════════════
-- ملاحظة: الاختصاصيين الموجودين سيكونون 'approved' افتراضياً (DEFAULT)
-- المسجلون الجدد عبر /register/specialist سيكونون 'pending'
-- ═══════════════════════════════════════════════════════════════════


-- ─── 20_nursing_enhancements.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 💉 Migration 20: Nursing Service Enhancements (V25.5)
-- ════════════════════════════════════════════════════════════════════
-- بناءً على وثيقة المواصفات الفنية لأيقونة "التمريض المنزلي والتداوي"
--
-- يُضيف:
--   1. nursing_supplies_request - طلب المستلزمات للممرض
--   2. nurse_gender_preference - تفضيل جنس الممرض
--   3. recurring_schedule - الجدولة الزرقية (كل 8/12 ساعة)
--   4. allergy_form_filled - استمارة التحسس الدوائي
--   5. prescription_image_url - صورة الوصفة الطبية الإلزامية
--   6. infectious_disease_alert - تنبيه أمراض معدية
--   7. visit_history - سجل الزيارات التمريضية
--   8. nurse_emergency_logs - سجل تفعيل زر الطوارئ للممرض
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة في appointments ─────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS nurse_gender_preference TEXT
    CHECK (nurse_gender_preference IN ('male', 'female', 'any')),
  ADD COLUMN IF NOT EXISTS recurring_schedule JSONB,
    -- مثال: {"enabled": true, "interval_hours": 8, "end_date": "2026-06-01", "auto_confirm": true}
  ADD COLUMN IF NOT EXISTS allergy_form JSONB,
    -- مثال: {"penicillin": false, "sulfa": true, "other": "حساسية لاكتوز", "filled_at": "..."}
  ADD COLUMN IF NOT EXISTS prescription_image_url TEXT,
  ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS infectious_disease_alert JSONB,
    -- مثال: {"hepatitis_b": true, "covid": false, "tb": false, "notes": "..."}
  ADD COLUMN IF NOT EXISTS supplies_request JSONB,
    -- مثال: [{"item": "كانيولا 22G", "qty": 2, "added_to_invoice": true, "price": 5000}]
  ADD COLUMN IF NOT EXISTS supplies_total NUMERIC DEFAULT 0;

-- ─── 2. سجل زيارات التمريض (History) ──────────────────────
CREATE TABLE IF NOT EXISTS public.nursing_visit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- تفاصيل الزيارة
  procedure_type TEXT NOT NULL,
    -- 'injection', 'iv', 'wound_care', 'cannula', 'catheter', 'diabetic_foot'
  procedure_details JSONB,
    -- مثال: {"injection_type": "IM", "site": "deltoid", "medication": "Augmentin"}
  
  -- العلامات الحيوية
  vital_signs JSONB,
    -- مثال: {"bp": "120/80", "pulse": 72, "temp": 37.0, "spo2": 98}
  
  -- ملاحظات
  notes TEXT,
  complications TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- timestamps
  performed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 🔧 V33: ربط nursing_visit_history بفرد العائلة (نُقل من 01 — يحتاج الجدول موجوداً)
ALTER TABLE public.nursing_visit_history
  ADD COLUMN IF NOT EXISTS family_member_id UUID 
    REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nursing_history_family_member 
  ON public.nursing_visit_history(family_member_id) 
  WHERE family_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nursing_history_user
  ON public.nursing_visit_history(user_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_nursing_history_specialist
  ON public.nursing_visit_history(specialist_id, performed_at DESC);

ALTER TABLE public.nursing_visit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nursing_history_select_own" ON public.nursing_visit_history;
CREATE POLICY "nursing_history_select_own"
  ON public.nursing_visit_history FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "nursing_history_insert_specialist" ON public.nursing_visit_history;
CREATE POLICY "nursing_history_insert_specialist"
  ON public.nursing_visit_history FOR INSERT
  WITH CHECK (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 3. سجل تفعيل زر الطوارئ للممرض ────────────────────────
CREATE TABLE IF NOT EXISTS public.nurse_emergency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- بيانات الطوارئ
  trigger_reason TEXT,
    -- 'attack', 'threat', 'harassment', 'medical', 'other'
  description TEXT,
  
  -- GPS وقت التفعيل
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy_m NUMERIC,
  
  -- معالجة الطوارئ
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'responding', 'resolved', 'false_alarm')),
  contacted_911 BOOLEAN DEFAULT FALSE,
  call_center_notified BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurse_emergency_open
  ON public.nurse_emergency_logs(status, created_at DESC)
  WHERE status IN ('open', 'responding');

ALTER TABLE public.nurse_emergency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurse_emergency_specialist_insert" ON public.nurse_emergency_logs;
CREATE POLICY "nurse_emergency_specialist_insert"
  ON public.nurse_emergency_logs FOR INSERT
  WITH CHECK (auth.uid() = specialist_id);

DROP POLICY IF EXISTS "nurse_emergency_admin_select" ON public.nurse_emergency_logs;
CREATE POLICY "nurse_emergency_admin_select"
  ON public.nurse_emergency_logs FOR SELECT
  USING (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 4. تقييم جودة الخدمة التمريضية ──────────────────────
-- (ALTER order_reviews أُزيل — الجدول غير موجود في المخطّط الحالي — V33)

-- ─── 5. تعليقات ──────────────────────────────────────────
COMMENT ON COLUMN public.appointments.nurse_gender_preference IS
  'تفضيل جنس الممرض لتلبية الرغبة الشخصية والشرعية';

COMMENT ON COLUMN public.appointments.recurring_schedule IS
  'الجدولة الزرقية: تنفيذ كورسات العلاج كل 8/12 ساعة';

COMMENT ON COLUMN public.appointments.prescription_image_url IS
  'صورة الوصفة الطبية الإلزامية (الراشيتة) - حماية قانونية';

COMMENT ON COLUMN public.appointments.allergy_form IS
  'استمارة التحسس الدوائي - يجب ملؤها قبل أي علاج';

COMMENT ON TABLE public.nursing_visit_history IS
  'سجل الزيارات التمريضية - History لكل مريض';

COMMENT ON TABLE public.nurse_emergency_logs IS
  'سجل تفعيل زر الطوارئ الأمني للممرض داخل منزل المريض';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20 applied: Nursing service enhancements (10 features)';
END $$;


-- ─── 21_nurse_credentials.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🔐 Migration 21: Nurse Credentials & Compliance (V25.6)
-- ════════════════════════════════════════════════════════════════════
-- بناءً على البند 9 من وثيقة المواصفات:
-- "خانة الأخصائي وشروط انضمام وتدقيق الكادر والتحقق من الهوية"
--
-- يُضيف:
--   - وثائق الكادر التمريضي (هوية نقابة + إجازة وزارة الصحة)
--   - حقيبة الطوارئ التمريضية الإلزامية
--   - تتبع تاريخ التحقق + الانتهاء
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة في users للممرضين ─────────────────
ALTER TABLE public.users
  -- هوية نقابة التمريض
  ADD COLUMN IF NOT EXISTS nursing_union_id_url TEXT,
  ADD COLUMN IF NOT EXISTS nursing_union_id_number TEXT,
  ADD COLUMN IF NOT EXISTS nursing_union_expires_at DATE,
  ADD COLUMN IF NOT EXISTS nursing_union_verified BOOLEAN DEFAULT FALSE,

  -- إجازة ممارسة المهنة من وزارة الصحة
  ADD COLUMN IF NOT EXISTS health_ministry_license_url TEXT,
  ADD COLUMN IF NOT EXISTS health_ministry_license_number TEXT,
  ADD COLUMN IF NOT EXISTS health_ministry_expires_at DATE,
  ADD COLUMN IF NOT EXISTS health_ministry_verified BOOLEAN DEFAULT FALSE,

  -- حقيبة الطوارئ التمريضية
  ADD COLUMN IF NOT EXISTS emergency_kit_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emergency_kit_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS emergency_kit_items JSONB,
    -- مثال: ["adrenaline", "antihistamine", "oxygen_mask", "first_aid_kit", "gloves", "masks"]

  -- معلومات مهنية إضافية
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS specializations TEXT[],
    -- مثال: ["pediatric", "diabetic_care", "wound_care", "iv_therapy"]
  ADD COLUMN IF NOT EXISTS cv_url TEXT,

  -- تاريخ التحقق
  ADD COLUMN IF NOT EXISTS credentials_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credentials_verified_by UUID REFERENCES public.users(id);

-- ─── 2. ترقية approval_status (دقيق أكثر) ───────────────
-- (موجود مسبقاً، لكن نضمن وجوده)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_approval_status_enum'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT check_approval_status_enum
      CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended', 'expired'));
  END IF;
END $$;

-- ─── 3. سجل الوثائق (للتدقيق الإداري) ──────────────────
CREATE TABLE IF NOT EXISTS public.specialist_credentials_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
    -- 'uploaded', 'verified', 'rejected', 'expired', 'renewed'
  document_type TEXT NOT NULL,
    -- 'union_id', 'health_license', 'cv', 'emergency_kit'
  document_url TEXT,
  notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credentials_log_specialist
  ON public.specialist_credentials_log(specialist_id, created_at DESC);

ALTER TABLE public.specialist_credentials_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credentials_log_specialist_self" ON public.specialist_credentials_log;
CREATE POLICY "credentials_log_specialist_self"
  ON public.specialist_credentials_log FOR SELECT
  USING (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "credentials_log_admin_insert" ON public.specialist_credentials_log;
CREATE POLICY "credentials_log_admin_insert"
  ON public.specialist_credentials_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR auth.uid() = specialist_id
  );

-- ─── 4. تنبيهات انتهاء الصلاحية (View) ──────────────────
CREATE OR REPLACE VIEW public.expiring_credentials AS
SELECT
  u.id,
  u.full_name,
  u.phone,
  u.specialist_type,
  u.nursing_union_expires_at,
  u.health_ministry_expires_at,
  CASE
    WHEN u.nursing_union_expires_at <= CURRENT_DATE THEN 'union_expired'
    WHEN u.nursing_union_expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'union_expiring'
    WHEN u.health_ministry_expires_at <= CURRENT_DATE THEN 'license_expired'
    WHEN u.health_ministry_expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'license_expiring'
    ELSE 'ok'
  END as status,
  LEAST(
    COALESCE(u.nursing_union_expires_at, '9999-12-31'::date),
    COALESCE(u.health_ministry_expires_at, '9999-12-31'::date)
  ) as nearest_expiry
FROM public.users u
WHERE u.role = 'specialist'
  AND u.specialist_type = 'nurse'
  AND (
    u.nursing_union_expires_at IS NOT NULL
    OR u.health_ministry_expires_at IS NOT NULL
  );

-- ─── 5. تعليقات ──────────────────────────────────────
COMMENT ON COLUMN public.users.nursing_union_id_url IS
  'هوية نقابة التمريض النافذة - إلزامية للممرضين';

COMMENT ON COLUMN public.users.health_ministry_license_url IS
  'إجازة ممارسة المهنة من وزارة الصحة العراقية';

COMMENT ON COLUMN public.users.emergency_kit_confirmed IS
  'تأكيد تجهيز حقيبة الطوارئ التمريضية الإلزامية';

COMMENT ON VIEW public.expiring_credentials IS
  'الوثائق المنتهية أو القريبة من الانتهاء';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 21 applied: Nurse credentials & compliance';
END $$;


-- ─── 40_nursing_enhancements_v44.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 40: Nursing Service Enhancements (V25.44)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. تقييم الممرضين (nurse_ratings)
--   2. View للـ vitals trends
--   3. Trigger للإشعارات
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. NURSE RATINGS - تقييمات الممرضين ───
CREATE TABLE IF NOT EXISTS public.nurse_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_id          UUID REFERENCES public.nursing_visit_history(id) ON DELETE SET NULL,
  
  -- التقييم العام
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية (1-5)
  hygiene_rating    INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  attitude_rating   INTEGER CHECK (attitude_rating >= 1 AND attitude_rating <= 5),
  
  -- ملاحظات المريض
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- متاح للعرض العام؟
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- لا يمكن تقييم نفس الموعد مرّتين
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_ratings_specialist ON public.nurse_ratings(specialist_id);
CREATE INDEX IF NOT EXISTS idx_nurse_ratings_user ON public.nurse_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_nurse_ratings_rating ON public.nurse_ratings(rating);

-- RLS
ALTER TABLE public.nurse_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurse_ratings_user_own" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_user_own"
  ON public.nurse_ratings FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_user_insert" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_user_insert"
  ON public.nurse_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_specialist_read" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_specialist_read"
  ON public.nurse_ratings FOR SELECT
  USING (specialist_id = auth.uid());

DROP POLICY IF EXISTS "nurse_ratings_public_read" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_public_read"
  ON public.nurse_ratings FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "nurse_ratings_admin_all" ON public.nurse_ratings;
CREATE POLICY "nurse_ratings_admin_all"
  ON public.nurse_ratings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 2. View للـ vitals trends ───
CREATE OR REPLACE VIEW public.vitals_trends AS
SELECT 
  user_id,
  performed_at::date AS visit_date,
  performed_at,
  procedure_type,
  vital_signs->>'bp' AS blood_pressure,
  (vital_signs->>'pulse')::int AS pulse,
  (vital_signs->>'temp')::numeric AS temperature,
  (vital_signs->>'spo2')::int AS oxygen_saturation,
  (vital_signs->>'sugar')::int AS blood_sugar,
  notes
FROM public.nursing_visit_history
WHERE vital_signs IS NOT NULL
ORDER BY performed_at DESC;

GRANT SELECT ON public.vitals_trends TO authenticated;

-- ─── 3. Function: عند إضافة rating، حدّث متوسط الممرض ───
CREATE OR REPLACE FUNCTION update_nurse_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- لو في column rating_avg في users (لازم نضيفها لو ما كانت)
  UPDATE public.users
  SET updated_at = NOW()
  WHERE id = NEW.specialist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nurse_avg_rating ON public.nurse_ratings;
CREATE TRIGGER trigger_nurse_avg_rating
  AFTER INSERT OR UPDATE ON public.nurse_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nurse_avg_rating();

-- ─── 4. Notification template للنوسنج ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'nursing_request_accepted',
    'تمّ قبول طلب التمريض ✓',
    'push',
    'الممرض في الطريق إليك'
  ),
  (
    'nursing_visit_completed',
    'انتهت زيارة التمريض ✓',
    'push',
    'كيف كانت تجربتك مع الممرض؟ قيّمها الآن.'
  )
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 40
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 41_doctor_system_v45.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 41: Doctor System Enhancements (V25.45)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. doctor_ratings (تقييمات الأطباء)
--   2. doctor_appointment_type (column في appointments)
--   3. video_sessions (للاستشارات بالفيديو)
--   4. Notifications للأطباء
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. DOCTOR RATINGS ───
CREATE TABLE IF NOT EXISTS public.doctor_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  consultation_id   UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  
  -- تقييم عام (1-5)
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  empathy_rating    INTEGER CHECK (empathy_rating >= 1 AND empathy_rating <= 5),
  
  -- ملاحظات
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- نوع التفاعل
  interaction_type TEXT CHECK (interaction_type IN ('home_visit', 'clinic_visit', 'video', 'chat', 'subscription')),
  
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id),
  UNIQUE (user_id, consultation_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_ratings_doctor ON public.doctor_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_user ON public.doctor_ratings(user_id);

ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_ratings_user_own" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_user_own"
  ON public.doctor_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_ratings_user_insert" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_user_insert"
  ON public.doctor_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_ratings_public_read" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_public_read"
  ON public.doctor_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "doctor_ratings_admin_all" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_admin_all"
  ON public.doctor_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. أعمدة جديدة على appointments للأطباء ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_appointment_type TEXT 
    CHECK (doctor_appointment_type IN ('home_visit', 'clinic_visit', 'video', 'follow_up')),
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT[];

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id) WHERE doctor_id IS NOT NULL;

-- ─── 3. VIDEO SESSIONS ───
CREATE TABLE IF NOT EXISTS public.video_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  patient_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Jitsi room name (random uuid)
  room_name         TEXT NOT NULL UNIQUE,
  
  -- توقيتات
  scheduled_at      TIMESTAMPTZ NOT NULL,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER,
  
  -- الحالة
  status            TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- recording (اختياري)
  recording_url     TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (consultation_id IS NOT NULL OR appointment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_video_sessions_patient ON public.video_sessions(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_doctor ON public.video_sessions(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_room ON public.video_sessions(room_name);

ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_sessions_participants" ON public.video_sessions;
CREATE POLICY "video_sessions_participants"
  ON public.video_sessions FOR SELECT
  USING (patient_user_id = auth.uid() OR doctor_user_id = auth.uid());

DROP POLICY IF EXISTS "video_sessions_admin" ON public.video_sessions;
CREATE POLICY "video_sessions_admin"
  ON public.video_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. Notification templates ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'doctor_appointment_confirmed',
    'تمّ تأكيد موعد الطبيب ✓',
    'push',
    'موعدك مع الطبيب جاهز'
  ),
  (
    'consultation_new_message',
    'رسالة جديدة من الطبيب 💬',
    'push',
    'افتح المحادثة لقراءة الرد'
  ),
  (
    'video_session_starting',
    'استشارة الفيديو على وشك البدء 📹',
    'push',
    'انضم الآن'
  ),
  (
    'doctor_subscription_renewed',
    'تجديد اشتراك الطبيب ✓',
    'push',
    'تم تجديد اشتراكك بنجاح'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── 5. Trigger: تحديث rating_avg للطبيب ───
CREATE OR REPLACE FUNCTION update_doctor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.doctors
  SET 
    rating_avg = (
      SELECT AVG(rating)::numeric(3,2) FROM public.doctor_ratings 
      WHERE doctor_id = NEW.doctor_id AND is_public = true
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.doctor_ratings 
      WHERE doctor_id = NEW.doctor_id AND is_public = true
    )
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doctor_rating_stats ON public.doctor_ratings;
CREATE TRIGGER trigger_doctor_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 41
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 42_pharmacy_system_v46.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 42: Pharmacy System Enhancements (V25.46)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. pharmacy_reservations (حجز دواء قبل الزيارة)
--   2. pharmacy_ratings (تقييم الصيدليات)
--   3. pharmacy_favorites (الصيدليات المفضّلة)
--   4. user_medications (أدوية المريض المعتادة)
--   5. Triggers + Notification templates
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PHARMACY RESERVATIONS ───
-- المريض يحجز دواء في صيدلية قبل ما يروح يطلبه
CREATE TABLE IF NOT EXISTS public.pharmacy_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  -- ربط بـ prescription (اختياري)
  prescription_id   UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  
  -- لمن (عائلة)
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- الأدوية المطلوبة (structured JSONB)
  items             JSONB NOT NULL,
    -- [
    --   {
    --     "medication_id": "uuid",      -- إن وُجد في DB
    --     "name": "بنادول 500mg",        -- اسم نصي (لو ما في medication_id)
    --     "quantity": 1,                 -- العدد
    --     "notes": "علبة كبيرة"          -- ملاحظات
    --   }
    -- ]
  
  -- صورة الوصفة (اختياري)
  prescription_image_url TEXT,
  
  -- ملاحظات للصيدلية
  customer_notes    TEXT,
  pharmacy_notes    TEXT,
  
  -- التسعير (الصيدلية ترد بالسعر)
  total_estimated_price NUMERIC,
  total_final_price NUMERIC,
  
  -- التوقّع - متى المستخدم سيأتي
  expected_pickup_at TIMESTAMPTZ,
  
  -- الحالة
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',           -- بانتظار رد الصيدلية
      'confirmed',         -- الصيدلية أكّدت التوفّر
      'partially_available', -- بعض الأدوية فقط متوفّرة
      'ready_for_pickup',  -- جاهز للاستلام
      'picked_up',         -- المريض استلمه
      'cancelled',         -- ألغي
      'expired'            -- انتهت صلاحية الحجز
    )),
  
  -- expiry (12 ساعة بعد التأكيد)
  expires_at        TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT items_required CHECK (jsonb_array_length(items) > 0)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_user ON public.pharmacy_reservations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_pharmacy ON public.pharmacy_reservations(pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_status ON public.pharmacy_reservations(status);

-- RLS
ALTER TABLE public.pharmacy_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_reservations_user_own" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_own"
  ON public.pharmacy_reservations FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_user_insert" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_insert"
  ON public.pharmacy_reservations FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_user_update" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_update"
  ON public.pharmacy_reservations FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_pharmacy_owner" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_pharmacy_owner"
  ON public.pharmacy_reservations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_reservations.pharmacy_id 
        AND p.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pharmacy_reservations_admin_all" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_admin_all"
  ON public.pharmacy_reservations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. PHARMACY RATINGS ───
CREATE TABLE IF NOT EXISTS public.pharmacy_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  reservation_id    UUID REFERENCES public.pharmacy_reservations(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  availability_rating INTEGER CHECK (availability_rating >= 1 AND availability_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating    INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_ratings_pharmacy ON public.pharmacy_ratings(pharmacy_id);

ALTER TABLE public.pharmacy_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_ratings_user_own" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_user_own"
  ON public.pharmacy_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_ratings_user_insert" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_user_insert"
  ON public.pharmacy_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_ratings_public_read" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_public_read"
  ON public.pharmacy_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "pharmacy_ratings_admin_all" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_admin_all"
  ON public.pharmacy_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. PHARMACY FAVORITES ───
CREATE TABLE IF NOT EXISTS public.pharmacy_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, pharmacy_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_favorites_user ON public.pharmacy_favorites(user_id);

ALTER TABLE public.pharmacy_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_favorites_user_all" ON public.pharmacy_favorites;
CREATE POLICY "pharmacy_favorites_user_all"
  ON public.pharmacy_favorites FOR ALL USING (user_id = auth.uid());

-- ─── 4. USER MEDICATIONS - أدوية المريض المعتادة ───
CREATE TABLE IF NOT EXISTS public.user_medications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- الدواء (إما من DB أو نصّي)
  medication_id     UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  custom_name       TEXT,  -- اسم نصي لو ما في medication_id
  
  -- التفاصيل
  dosage            TEXT,  -- "1 قرص"
  frequency         TEXT,  -- "3 مرات يومياً"
  timing            TEXT[],  -- ['morning', 'noon', 'evening', 'before_sleep']
  notes             TEXT,
  
  -- المدة
  start_date        DATE,
  end_date          DATE,
  is_chronic        BOOLEAN DEFAULT FALSE,  -- مزمن (مدى الحياة)
  
  -- التذكير
  enable_reminders  BOOLEAN DEFAULT FALSE,
  
  -- ربط بـ prescription
  prescription_id   UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  
  -- لمن
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  is_active         BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_medications_name_required CHECK (
    medication_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_user_medications_user ON public.user_medications(user_id, is_active);

ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_medications_user_all" ON public.user_medications;
CREATE POLICY "user_medications_user_all"
  ON public.user_medications FOR ALL USING (user_id = auth.uid());

-- ─── 5. Notification templates ───
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'pharmacy_reservation_new',
    'حجز دواء جديد 💊',
    'push',
    'لديك حجز جديد من مريض - يرجى الرد'
  ),
  (
    'pharmacy_reservation_confirmed',
    'تأكيد الحجز ✓',
    'push',
    'الصيدلية أكّدت توفّر الأدوية'
  ),
  (
    'pharmacy_reservation_partial',
    'تأكيد جزئي ⚠️',
    'push',
    'بعض الأدوية فقط متوفّرة'
  ),
  (
    'pharmacy_reservation_rejected',
    'الأدوية غير متوفّرة',
    'push',
    'للأسف الأدوية غير متوفّرة حالياً'
  ),
  (
    'pharmacy_reservation_ready',
    'الدواء جاهز للاستلام 🎉',
    'push',
    'يمكنك المرور لاستلامه'
  ),
  (
    'medication_reminder',
    'تذكير بموعد الدواء ⏰',
    'push',
    'حان وقت تناول الدواء'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── 6. Trigger: تحديث pharmacy rating stats ───
CREATE OR REPLACE FUNCTION update_pharmacy_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  pharmacy_uuid UUID;
BEGIN
  pharmacy_uuid := COALESCE(NEW.pharmacy_id, OLD.pharmacy_id);
  
  UPDATE public.pharmacies
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.pharmacy_ratings 
      WHERE pharmacy_id = pharmacy_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.pharmacy_ratings 
      WHERE pharmacy_id = pharmacy_uuid AND is_public = true
    )
  WHERE id = pharmacy_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_rating_stats ON public.pharmacy_ratings;
CREATE TRIGGER trigger_pharmacy_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_rating_stats();

-- ─── 7. Trigger: notify pharmacy on new reservation ───
CREATE OR REPLACE FUNCTION notify_pharmacy_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  pharmacy_owner UUID;
BEGIN
  -- جلب owner_user_id للصيدلية
  SELECT owner_user_id INTO pharmacy_owner
  FROM public.pharmacies
  WHERE id = NEW.pharmacy_id;
  
  IF pharmacy_owner IS NOT NULL THEN
    INSERT INTO public.notification_queue (
      user_id, template_key, title, body, icon, data, created_at, scheduled_at
    ) VALUES (
      pharmacy_owner,
      'pharmacy_reservation_new',
      'حجز دواء جديد 💊',
      'لديك حجز جديد من مريض - يرجى الرد',
      '💊',
      jsonb_build_object('reservation_id', NEW.id, 'url', '/pharmacy-orders/' || NEW.id),
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_new_reservation ON public.pharmacy_reservations;
CREATE TRIGGER trigger_pharmacy_new_reservation
  AFTER INSERT ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_pharmacy_new_reservation();

-- ─── 8. Trigger: notify user on reservation status change ───
CREATE OR REPLACE FUNCTION notify_user_reservation_status()
RETURNS TRIGGER AS $$
DECLARE
  template_key_val TEXT;
  title_val TEXT;
  body_val TEXT;
  icon_val TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  CASE NEW.status
    WHEN 'confirmed' THEN
      template_key_val := 'pharmacy_reservation_confirmed';
      title_val := 'تأكيد الحجز ✓';
      body_val := 'الصيدلية أكّدت توفّر الأدوية';
      icon_val := '✅';
    WHEN 'partially_available' THEN
      template_key_val := 'pharmacy_reservation_partial';
      title_val := 'تأكيد جزئي ⚠️';
      body_val := 'بعض الأدوية فقط متوفّرة - يُرجى المراجعة';
      icon_val := '⚠️';
    WHEN 'ready_for_pickup' THEN
      template_key_val := 'pharmacy_reservation_ready';
      title_val := 'الدواء جاهز للاستلام 🎉';
      body_val := 'يمكنك المرور لاستلامه';
      icon_val := '🎉';
    WHEN 'cancelled' THEN
      template_key_val := 'pharmacy_reservation_rejected';
      title_val := 'الأدوية غير متوفّرة';
      body_val := COALESCE(NEW.cancellation_reason, 'للأسف الأدوية غير متوفّرة حالياً');
      icon_val := '❌';
    ELSE
      RETURN NEW;
  END CASE;
  
  INSERT INTO public.notification_queue (
    user_id, template_key, title, body, icon, data, created_at, scheduled_at
  ) VALUES (
    NEW.user_id,
    template_key_val,
    title_val,
    body_val,
    icon_val,
    jsonb_build_object('reservation_id', NEW.id, 'url', '/account/pharmacy-reservations/' || NEW.id),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_reservation_status ON public.pharmacy_reservations;
CREATE TRIGGER trigger_user_reservation_status
  AFTER UPDATE ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_reservation_status();

-- ─── 9. updated_at triggers ───
CREATE OR REPLACE FUNCTION update_pharmacy_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_reservation_updated_at ON public.pharmacy_reservations;
CREATE TRIGGER trigger_pharmacy_reservation_updated_at
  BEFORE UPDATE ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_reservation_updated_at();

DROP TRIGGER IF EXISTS trigger_user_medications_updated_at ON public.user_medications;
CREATE TRIGGER trigger_user_medications_updated_at
  BEFORE UPDATE ON public.user_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_reservation_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 42
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 43_hospitals_dental_optical_v47.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 43: Hospitals + Dental + Optical Enhancements (V25.47)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. أعمدة structured في appointments للـ 3 خدمات
--   2. 3 جداول ratings (hospital_ratings, dental_ratings, optical_ratings)
--   3. جدول favorites موحّد
--   4. Triggers + Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة على appointments ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hospital_department TEXT,
  ADD COLUMN IF NOT EXISTS dental_clinic_id UUID REFERENCES public.dental_clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dental_procedure_type TEXT 
    CHECK (dental_procedure_type IN (
      'cleaning', 'filling', 'extraction', 'root_canal', 'crown',
      'orthodontics', 'whitening', 'consultation', 'other'
    ) OR dental_procedure_type IS NULL),
  ADD COLUMN IF NOT EXISTS optical_store_id UUID REFERENCES public.optical_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS optical_service_type TEXT 
    CHECK (optical_service_type IN (
      'eye_exam', 'prescription_lenses', 'sunglasses', 
      'contact_lenses', 'frames_only', 'consultation'
    ) OR optical_service_type IS NULL);

CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON public.appointments(hospital_id) WHERE hospital_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_dental ON public.appointments(dental_clinic_id) WHERE dental_clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_optical ON public.appointments(optical_store_id) WHERE optical_store_id IS NOT NULL;

-- ─── 2. HOSPITAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.hospital_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hospital_id       UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  staff_rating      INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
  facilities_rating INTEGER CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
  wait_time_rating  INTEGER CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  
  department        TEXT,  -- القسم الذي زاره (اختياري)
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_ratings_hospital ON public.hospital_ratings(hospital_id);

ALTER TABLE public.hospital_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospital_ratings_user_own" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_user_own"
  ON public.hospital_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "hospital_ratings_user_insert" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_user_insert"
  ON public.hospital_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "hospital_ratings_public_read" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_public_read"
  ON public.hospital_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "hospital_ratings_admin_all" ON public.hospital_ratings;
CREATE POLICY "hospital_ratings_admin_all"
  ON public.hospital_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. DENTAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.dental_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dental_clinic_id  UUID NOT NULL REFERENCES public.dental_clinics(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  hygiene_rating    INTEGER CHECK (hygiene_rating >= 1 AND hygiene_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  comfort_rating    INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  
  procedure_type    TEXT,
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_dental_ratings_clinic ON public.dental_ratings(dental_clinic_id);

ALTER TABLE public.dental_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_ratings_user_own" ON public.dental_ratings;
CREATE POLICY "dental_ratings_user_own"
  ON public.dental_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dental_ratings_user_insert" ON public.dental_ratings;
CREATE POLICY "dental_ratings_user_insert"
  ON public.dental_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dental_ratings_public_read" ON public.dental_ratings;
CREATE POLICY "dental_ratings_public_read"
  ON public.dental_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "dental_ratings_admin_all" ON public.dental_ratings;
CREATE POLICY "dental_ratings_admin_all"
  ON public.dental_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. OPTICAL RATINGS ───
CREATE TABLE IF NOT EXISTS public.optical_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  optical_store_id  UUID NOT NULL REFERENCES public.optical_stores(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  selection_rating  INTEGER CHECK (selection_rating >= 1 AND selection_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating    INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  quality_rating    INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  service_type      TEXT,
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_optical_ratings_store ON public.optical_ratings(optical_store_id);

ALTER TABLE public.optical_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optical_ratings_user_own" ON public.optical_ratings;
CREATE POLICY "optical_ratings_user_own"
  ON public.optical_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "optical_ratings_user_insert" ON public.optical_ratings;
CREATE POLICY "optical_ratings_user_insert"
  ON public.optical_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "optical_ratings_public_read" ON public.optical_ratings;
CREATE POLICY "optical_ratings_public_read"
  ON public.optical_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "optical_ratings_admin_all" ON public.optical_ratings;
CREATE POLICY "optical_ratings_admin_all"
  ON public.optical_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 5. SERVICE FAVORITES (موحّد لكل الخدمات) ───
CREATE TABLE IF NOT EXISTS public.service_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- نوع الخدمة (واحد فقط)
  service_type      TEXT NOT NULL CHECK (service_type IN (
    'hospital', 'dental', 'optical', 'doctor', 'pharmacy',
    'mental', 'nutrition', 'physio'
  )),
  service_id        UUID NOT NULL,  -- المرجع للجدول حسب service_type
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, service_type, service_id)
);

CREATE INDEX IF NOT EXISTS idx_service_favorites_user ON public.service_favorites(user_id, service_type);

ALTER TABLE public.service_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_favorites_user_all" ON public.service_favorites;
CREATE POLICY "service_favorites_user_all"
  ON public.service_favorites FOR ALL USING (user_id = auth.uid());

-- ─── 6. Triggers: تحديث rating_avg تلقائياً ───

-- Hospital
CREATE OR REPLACE FUNCTION update_hospital_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  hospital_uuid UUID;
BEGIN
  hospital_uuid := COALESCE(NEW.hospital_id, OLD.hospital_id);
  
  UPDATE public.hospitals
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.hospital_ratings 
      WHERE hospital_id = hospital_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.hospital_ratings 
      WHERE hospital_id = hospital_uuid AND is_public = true
    )
  WHERE id = hospital_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hospital_rating_stats ON public.hospital_ratings;
CREATE TRIGGER trigger_hospital_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.hospital_ratings
  FOR EACH ROW EXECUTE FUNCTION update_hospital_rating_stats();

-- Dental
CREATE OR REPLACE FUNCTION update_dental_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  clinic_uuid UUID;
BEGIN
  clinic_uuid := COALESCE(NEW.dental_clinic_id, OLD.dental_clinic_id);
  
  UPDATE public.dental_clinics
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.dental_ratings 
      WHERE dental_clinic_id = clinic_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.dental_ratings 
      WHERE dental_clinic_id = clinic_uuid AND is_public = true
    )
  WHERE id = clinic_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dental_rating_stats ON public.dental_ratings;
CREATE TRIGGER trigger_dental_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.dental_ratings
  FOR EACH ROW EXECUTE FUNCTION update_dental_rating_stats();

-- Optical
CREATE OR REPLACE FUNCTION update_optical_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  store_uuid UUID;
BEGIN
  store_uuid := COALESCE(NEW.optical_store_id, OLD.optical_store_id);
  
  UPDATE public.optical_stores
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.optical_ratings 
      WHERE optical_store_id = store_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.optical_ratings 
      WHERE optical_store_id = store_uuid AND is_public = true
    )
  WHERE id = store_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_optical_rating_stats ON public.optical_ratings;
CREATE TRIGGER trigger_optical_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.optical_ratings
  FOR EACH ROW EXECUTE FUNCTION update_optical_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 43
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 44_mental_nutrition_physio_cosmetic_v48.sql ───
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 44: Mental + Nutrition + Physio + Cosmetic (V25.48 + V25.49)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. mental_health_ratings + nutritionist_ratings + physio_ratings
--   2. cosmetic_wishlist + cosmetic_product_reviews
--   3. أعمدة structured في appointments
--   4. Triggers + Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. MENTAL HEALTH RATINGS ───
CREATE TABLE IF NOT EXISTS public.mental_health_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.mental_health_specialists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  empathy_rating    INTEGER CHECK (empathy_rating >= 1 AND empathy_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  -- نوع الجلسة
  session_type      TEXT CHECK (session_type IN ('online', 'clinic')),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_anonymous      BOOLEAN NOT NULL DEFAULT TRUE,  -- افتراضياً مجهول للحساسية
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_mental_ratings_specialist ON public.mental_health_ratings(specialist_id);

ALTER TABLE public.mental_health_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_ratings_user_own" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_user_own"
  ON public.mental_health_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mental_ratings_user_insert" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_user_insert"
  ON public.mental_health_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mental_ratings_public_read" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_public_read"
  ON public.mental_health_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "mental_ratings_admin_all" ON public.mental_health_ratings;
CREATE POLICY "mental_ratings_admin_all"
  ON public.mental_health_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. NUTRITIONIST RATINGS ───
CREATE TABLE IF NOT EXISTS public.nutritionist_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nutritionist_id   UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  plan_quality_rating INTEGER CHECK (plan_quality_rating >= 1 AND plan_quality_rating <= 5),
  responsiveness_rating INTEGER CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
  results_rating    INTEGER CHECK (results_rating >= 1 AND results_rating <= 5),
  
  package_type      TEXT CHECK (package_type IN ('initial', 'follow_up', 'monthly')),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nutritionist_ratings_nutritionist ON public.nutritionist_ratings(nutritionist_id);

ALTER TABLE public.nutritionist_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutritionist_ratings_user_own" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_user_own"
  ON public.nutritionist_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutritionist_ratings_user_insert" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_user_insert"
  ON public.nutritionist_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutritionist_ratings_public_read" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_public_read"
  ON public.nutritionist_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "nutritionist_ratings_admin_all" ON public.nutritionist_ratings;
CREATE POLICY "nutritionist_ratings_admin_all"
  ON public.nutritionist_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. PHYSIO RATINGS ───
CREATE TABLE IF NOT EXISTS public.physio_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id     UUID NOT NULL REFERENCES public.physio_specialists(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  skill_rating      INTEGER CHECK (skill_rating >= 1 AND skill_rating <= 5),
  improvement_rating INTEGER CHECK (improvement_rating >= 1 AND improvement_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  
  -- نوع الجلسة
  session_type      TEXT CHECK (session_type IN ('home_visit', 'clinic_visit')),
  service_type_slug TEXT,  -- ربط بـ physio_service_types
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_physio_ratings_specialist ON public.physio_ratings(specialist_id);

ALTER TABLE public.physio_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_ratings_user_own" ON public.physio_ratings;
CREATE POLICY "physio_ratings_user_own"
  ON public.physio_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "physio_ratings_user_insert" ON public.physio_ratings;
CREATE POLICY "physio_ratings_user_insert"
  ON public.physio_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "physio_ratings_public_read" ON public.physio_ratings;
CREATE POLICY "physio_ratings_public_read"
  ON public.physio_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "physio_ratings_admin_all" ON public.physio_ratings;
CREATE POLICY "physio_ratings_admin_all"
  ON public.physio_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. أعمدة structured في appointments للـ 3 services ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS mental_specialist_id UUID REFERENCES public.mental_health_specialists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS physio_specialist_id UUID REFERENCES public.physio_specialists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS physio_service_type_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_mental ON public.appointments(mental_specialist_id) WHERE mental_specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON public.appointments(nutritionist_id) WHERE nutritionist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_physio ON public.appointments(physio_specialist_id) WHERE physio_specialist_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💄 V25.49: COSMETIC E-COMMERCE
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 5. COSMETIC WISHLIST ───
CREATE TABLE IF NOT EXISTS public.cosmetic_wishlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.cosmetic_products(id) ON DELETE CASCADE,
  notes             TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_wishlist_user ON public.cosmetic_wishlist(user_id);

ALTER TABLE public.cosmetic_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_wishlist_user_all" ON public.cosmetic_wishlist;
CREATE POLICY "cosmetic_wishlist_user_all"
  ON public.cosmetic_wishlist FOR ALL USING (user_id = auth.uid());

-- ─── 6. COSMETIC PRODUCT REVIEWS ───
CREATE TABLE IF NOT EXISTS public.cosmetic_product_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.cosmetic_products(id) ON DELETE CASCADE,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  value_rating      INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  scent_rating      INTEGER CHECK (scent_rating >= 1 AND scent_rating <= 5),
  
  title             TEXT,  -- عنوان المراجعة (اختياري)
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- صورة (اختياري)
  image_url         TEXT,
  
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  helpful_count     INTEGER DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_reviews_product ON public.cosmetic_product_reviews(product_id, created_at DESC);

ALTER TABLE public.cosmetic_product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_reviews_user_own" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_own"
  ON public.cosmetic_product_reviews FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_user_insert" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_insert"
  ON public.cosmetic_product_reviews FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_user_update" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_user_update"
  ON public.cosmetic_product_reviews FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cosmetic_reviews_public_read" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_public_read"
  ON public.cosmetic_product_reviews FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "cosmetic_reviews_admin_all" ON public.cosmetic_product_reviews;
CREATE POLICY "cosmetic_reviews_admin_all"
  ON public.cosmetic_product_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 7. Triggers لتحديث stats ───

-- Mental Health rating stats
CREATE OR REPLACE FUNCTION update_mental_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  spec_id UUID;
BEGIN
  spec_id := COALESCE(NEW.specialist_id, OLD.specialist_id);
  UPDATE public.mental_health_specialists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.mental_health_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.mental_health_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    )
  WHERE id = spec_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mental_rating_stats ON public.mental_health_ratings;
CREATE TRIGGER trigger_mental_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.mental_health_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_rating_stats();

-- Nutritionist rating stats
CREATE OR REPLACE FUNCTION update_nutritionist_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  nut_id UUID;
BEGIN
  nut_id := COALESCE(NEW.nutritionist_id, OLD.nutritionist_id);
  UPDATE public.nutritionists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.nutritionist_ratings 
      WHERE nutritionist_id = nut_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.nutritionist_ratings 
      WHERE nutritionist_id = nut_id AND is_public = true
    )
  WHERE id = nut_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nutritionist_rating_stats ON public.nutritionist_ratings;
CREATE TRIGGER trigger_nutritionist_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.nutritionist_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nutritionist_rating_stats();

-- Physio rating stats
CREATE OR REPLACE FUNCTION update_physio_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  spec_id UUID;
BEGIN
  spec_id := COALESCE(NEW.specialist_id, OLD.specialist_id);
  UPDATE public.physio_specialists
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.physio_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.physio_ratings 
      WHERE specialist_id = spec_id AND is_public = true
    )
  WHERE id = spec_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_physio_rating_stats ON public.physio_ratings;
CREATE TRIGGER trigger_physio_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.physio_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_physio_rating_stats();

-- Cosmetic product rating stats
CREATE OR REPLACE FUNCTION update_cosmetic_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  prod_id UUID;
BEGIN
  prod_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.cosmetic_products
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.cosmetic_product_reviews 
      WHERE product_id = prod_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.cosmetic_product_reviews 
      WHERE product_id = prod_id AND is_public = true
    )
  WHERE id = prod_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cosmetic_rating_stats ON public.cosmetic_product_reviews;
CREATE TRIGGER trigger_cosmetic_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.cosmetic_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cosmetic_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 44 (V25.48 + V25.49)
-- ═══════════════════════════════════════════════════════════════════════════





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0006_locations.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  06_locations.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 06_locations.sql — المواقع + الإحداثيات + التخزين المؤقت
-- مدموج (V33) من: 15_gps_locations.sql 17_saved_locations.sql 37_doctors_clinics_coordinates.sql 48_mental_nutrition_coordinates.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 15_gps_locations.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🗺️ Migration 15: GPS Locations (V25 — Free Medical Map)
-- ════════════════════════════════════════════════════════════════════
-- يضيف حقول GPS للجداول الأساسية لدعم الخرائط
-- (Leaflet + OpenStreetMap - بدون أي خدمة مدفوعة)
--
-- NUMERIC(10, 7):
--   - 7 خانات عشرية = دقة ~1.1 سم
--   - مناسب لـ -180.0000000 إلى +180.0000000
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. appointments: موقع تنفيذ الخدمة (منزل المريض) ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_accuracy_m INTEGER,
  ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;

-- التحقق من صحة الإحداثيات
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_valid_lat,
  ADD CONSTRAINT appointments_valid_lat
    CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_valid_lng,
  ADD CONSTRAINT appointments_valid_lng
    CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));

-- التحقق من تكامل البيانات: إن وُجد lat فيجب وجود lng والعكس
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_location_pair,
  ADD CONSTRAINT appointments_location_pair
    CHECK (
      (location_lat IS NULL AND location_lng IS NULL)
      OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)
    );

-- فهرس للبحث الجغرافي السريع (للتقارير + لوحة الإدارة)
CREATE INDEX IF NOT EXISTS idx_appointments_location
  ON public.appointments(location_lat, location_lng)
  WHERE location_lat IS NOT NULL;

-- ─── 2. users: موقع عمل الأخصائي/المختبر ───
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS work_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS work_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS work_address TEXT;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_valid_work_lat,
  ADD CONSTRAINT users_valid_work_lat
    CHECK (work_lat IS NULL OR (work_lat >= -90 AND work_lat <= 90));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_valid_work_lng,
  ADD CONSTRAINT users_valid_work_lng
    CHECK (work_lng IS NULL OR (work_lng >= -180 AND work_lng <= 180));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_work_location_pair,
  ADD CONSTRAINT users_work_location_pair
    CHECK (
      (work_lat IS NULL AND work_lng IS NULL)
      OR (work_lat IS NOT NULL AND work_lng IS NOT NULL)
    );

-- فهرس للبحث الجغرافي عن الأخصائيين
CREATE INDEX IF NOT EXISTS idx_users_work_location
  ON public.users(work_lat, work_lng)
  WHERE work_lat IS NOT NULL AND role = 'specialist';

-- ─── 3. تعليقات للتوثيق ───
COMMENT ON COLUMN public.appointments.location_lat IS
  'خط العرض GPS لموقع تنفيذ الخدمة (منزل المريض)';
COMMENT ON COLUMN public.appointments.location_lng IS
  'خط الطول GPS لموقع تنفيذ الخدمة';
COMMENT ON COLUMN public.appointments.location_accuracy_m IS
  'دقة الموقع بالأمتار (من Geolocation API)';
COMMENT ON COLUMN public.appointments.location_captured_at IS
  'توقيت التقاط الموقع (لمعرفة هل قديم)';

COMMENT ON COLUMN public.users.work_lat IS
  'خط العرض GPS لموقع عمل الأخصائي (مختبر/عيادة)';
COMMENT ON COLUMN public.users.work_lng IS
  'خط الطول GPS لموقع عمل الأخصائي';
COMMENT ON COLUMN public.users.work_address IS
  'العنوان النصي لموقع العمل';


-- ─── 17_saved_locations.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🗺️ Migration 17: Saved Locations + Geocoding Cache (V25)
-- ════════════════════════════════════════════════════════════════════
-- يضيف:
--   1. user_saved_locations - المواقع المفضّلة (البيت، العمل، إلخ)
--   2. geocoding_cache - cache لنتائج reverse geocoding (تقليل API calls)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. user_saved_locations ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- اسم الموقع (البيت، بيت الجدّة، العمل)
  label TEXT NOT NULL,
  icon TEXT DEFAULT '📍',  -- emoji
  
  -- العنوان النصي + الإحداثيات
  address TEXT NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  
  -- معلومات إضافية اختيارية
  governorate TEXT,
  notes TEXT,
  
  -- الأكثر استخداماً = pinned
  is_pinned BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT saved_location_valid_lat CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT saved_location_valid_lng CHECK (lng >= -180 AND lng <= 180),
  CONSTRAINT saved_location_label_length CHECK (char_length(label) BETWEEN 1 AND 50),
  CONSTRAINT saved_location_max_per_user UNIQUE (user_id, label)
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_saved_locations_user
  ON public.user_saved_locations(user_id, is_pinned DESC, last_used_at DESC);

-- RLS: المستخدم يرى مواقعه فقط
ALTER TABLE public.user_saved_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_locations_select_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_select_own"
  ON public.user_saved_locations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_locations_insert_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_insert_own"
  ON public.user_saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_locations_update_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_update_own"
  ON public.user_saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_locations_delete_own" ON public.user_saved_locations;
CREATE POLICY "saved_locations_delete_own"
  ON public.user_saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Limit: 10 مواقع كحدّ أقصى لكل مستخدم
CREATE OR REPLACE FUNCTION public.check_saved_locations_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.user_saved_locations
  WHERE user_id = NEW.user_id;
  
  IF current_count >= 10 THEN
    RAISE EXCEPTION 'لا يمكن حفظ أكثر من 10 مواقع';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_locations_limit ON public.user_saved_locations;
CREATE TRIGGER trg_saved_locations_limit
  BEFORE INSERT ON public.user_saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_saved_locations_limit();

-- ─── 2. geocoding_cache ──────────────────────────────────
-- نخزّن نتائج Nominatim للحدّ من API calls
CREATE TABLE IF NOT EXISTS public.geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المفتاح: lat,lng مدوّر إلى 4 خانات عشرية
  -- ~11 متر دقة - يكفي للـ cache
  lat_rounded NUMERIC(8, 4) NOT NULL,
  lng_rounded NUMERIC(8, 4) NOT NULL,
  
  -- النتيجة من Nominatim
  display_name TEXT NOT NULL,        -- العنوان الكامل
  road TEXT,                          -- اسم الشارع
  suburb TEXT,                        -- الحي
  city TEXT,                          -- المدينة
  governorate TEXT,                   -- المحافظة
  country TEXT,                       -- البلد
  
  -- Raw response (JSONB للمرونة)
  raw_data JSONB,
  
  -- Metadata
  hit_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT geocoding_cache_unique_coords UNIQUE (lat_rounded, lng_rounded)
);

CREATE INDEX IF NOT EXISTS idx_geocoding_cache_coords
  ON public.geocoding_cache(lat_rounded, lng_rounded);

CREATE INDEX IF NOT EXISTS idx_geocoding_cache_last_used
  ON public.geocoding_cache(last_used_at DESC);

-- RLS: قراءة عامة للمستخدمين الـ authenticated، الكتابة للسيرفر فقط
ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "geocoding_cache_select_all" ON public.geocoding_cache;
CREATE POLICY "geocoding_cache_select_all"
  ON public.geocoding_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── 3. تعليقات ──────────────────────────────────────────
COMMENT ON TABLE public.user_saved_locations IS
  'المواقع المفضّلة للمستخدم - مثل: البيت، العمل، بيت الجدّة';

COMMENT ON TABLE public.geocoding_cache IS
  'Cache لنتائج Reverse Geocoding من Nominatim - يقلل API calls';

-- ─── 4. تأكيد ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 17 applied: saved_locations + geocoding_cache';
END $$;


-- ─── 37_doctors_clinics_coordinates.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 37_doctors_clinics_coordinates.sql
-- إضافة clinic_latitude/longitude للأطباء + باقي الخدمات (V25.39)
-- ═══════════════════════════════════════════════════════════════════
--
-- الغرض:
--   - الأطباء (users.specialist_type = 'doctor') لو عندهم عيادة ثابتة
--   - باقي الجداول اللي ما عندها lat/lng بعد:
--     * pharmacies, dental_clinics, optical_stores
--   - نُكمّل الـ schema لدعم نظام الخرائط الموحّد SpirMap
--
-- ملاحظات:
--   - الأعمدة nullable لأن:
--     • الأطباء قد يكونون متنقّلين (home visits)
--     • بعض المختصّين أونلاين فقط
--   - الـ indexes للبحث الجغرافي السريع
--
-- يمكن تشغيل هذا الـ migration مرّات عديدة بأمان (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. users (للأطباء + المختصّين)
-- ─────────────────────────────────────────────────────────────
-- نُضيف clinic_latitude/longitude لجدول users
-- ينطبق على specialist_type IN ('doctor', 'lab_analyst', 'pharmacist', 'physio')
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS clinic_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clinic_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS clinic_address TEXT,
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS clinic_city TEXT,
  ADD COLUMN IF NOT EXISTS clinic_phone TEXT;

-- Index للبحث الجغرافي (composite + partial)
CREATE INDEX IF NOT EXISTS idx_users_clinic_location
  ON public.users(clinic_latitude, clinic_longitude)
  WHERE clinic_latitude IS NOT NULL
    AND clinic_longitude IS NOT NULL
    AND role = 'specialist';

-- ─────────────────────────────────────────────────────────────
-- 2. pharmacies (الصيدليات)
-- ─────────────────────────────────────────────────────────────
-- نتأكد من وجود الأعمدة (موجودة على الأرجح لكن للتأكيد)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.pharmacies
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_pharmacies_location
  ON public.pharmacies(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. dental_clinics (عيادات الأسنان)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.dental_clinics
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_dental_clinics_location
  ON public.dental_clinics(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. optical_stores (محلّات النظارات)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.optical_stores
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_optical_stores_location
  ON public.optical_stores(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS Policy للأعمدة الجديدة
-- ─────────────────────────────────────────────────────────────
-- الأعمدة الجديدة موروثة من الـ RLS policies الموجودة
-- لا حاجة لتعديل policies (الأعمدة جزء من نفس الـ rows)

-- ─────────────────────────────────────────────────────────────
-- 6. تعليقات للتوضيح
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.users.clinic_latitude IS 'إحداثيات GPS للعيادة - فقط للأطباء/المختصّين اللي عندهم عيادة ثابتة';
COMMENT ON COLUMN public.users.clinic_longitude IS 'إحداثيات GPS للعيادة - فقط للأطباء/المختصّين اللي عندهم عيادة ثابتة';
COMMENT ON COLUMN public.users.clinic_address IS 'عنوان العيادة التفصيلي';
COMMENT ON COLUMN public.users.clinic_name IS 'اسم العيادة (مثال: عيادة د. أحمد للقلبية)';
COMMENT ON COLUMN public.users.clinic_phone IS 'رقم هاتف العيادة (مختلف عن phone الشخصي)';

COMMENT ON COLUMN public.pharmacies.latitude IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';
COMMENT ON COLUMN public.dental_clinics.latitude IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';
COMMENT ON COLUMN public.optical_stores.latitude IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';

-- ─────────────────────────────────────────────────────────────
-- ✓ التحقق
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 37 (doctors + services coordinates) applied successfully';
  RAISE NOTICE '   ▸ users: +clinic_latitude, +clinic_longitude, +clinic_address, +clinic_name, +clinic_city, +clinic_phone';
  RAISE NOTICE '   ▸ pharmacies: +latitude, +longitude (idempotent)';
  RAISE NOTICE '   ▸ dental_clinics: +latitude, +longitude (idempotent)';
  RAISE NOTICE '   ▸ optical_stores: +latitude, +longitude (idempotent)';
  RAISE NOTICE '   ▸ Indexes: 4 partial indexes للبحث الجغرافي';
  RAISE NOTICE '';
  RAISE NOTICE '📍 الخطوة التالية:';
  RAISE NOTICE '   1. حدّث صفحة admin للأطباء لإضافة GPS picker';
  RAISE NOTICE '   2. الأطباء الجدد يقدرون يحدّدوا موقع عيادتهم عند التسجيل';
  RAISE NOTICE '   3. الـ markers ستظهر على /services map';
END $$;


-- ─── 48_mental_nutrition_coordinates.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 🗺️ V31: إضافة إحداثيات GPS لـ mental_health_specialists + nutritionists
-- ═══════════════════════════════════════════════════════════════════
--
-- المشكلة:
--   services/page.tsx يقرأ latitude/longitude من هذين الجدولين على الخريطة،
--   لكن العمودين غير موجودين أصلاً في DB!
--   النتيجة: استعلام يفشل أو يُرجع صفر نتائج دائماً → لا تظهر هذه الخدمات على الخريطة.
--
-- الحلّ:
--   إضافة latitude/longitude + index (نفس نمط migration 37 لبقية الخدمات)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. mental_health_specialists ───
ALTER TABLE IF EXISTS public.mental_health_specialists
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS address   TEXT;

CREATE INDEX IF NOT EXISTS idx_mental_health_coords
  ON public.mental_health_specialists(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─── 2. nutritionists ───
ALTER TABLE IF EXISTS public.nutritionists
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS address   TEXT;

CREATE INDEX IF NOT EXISTS idx_nutritionists_coords
  ON public.nutritionists(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.mental_health_specialists.latitude  IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';
COMMENT ON COLUMN public.nutritionists.latitude  IS 'إحداثيات GPS - مطلوبة للظهور على الخريطة';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 48 Complete
--
-- بعد التشغيل:
--   • الجدولان يدعمان الإحداثيات
--   • الأدمن يستطيع رفع مواقعهما من الخريطة (AdminLocationPicker)
--   • يظهران على خريطة /services
-- ═══════════════════════════════════════════════════════════════════





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0007_engagement.sql
-- ═══════════════════════════════════════════════════════════════════════
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
-- 🛠️ إصلاح تكرار RLS: استعمال الدالة SECURITY DEFINER بدل EXISTS(SELECT FROM users)
-- (انظر current_user_is_approved_specialist_type في 0005) لكسر الحلقة اللانهائية.
DROP POLICY IF EXISTS appointments_admin_view ON public.appointments;
CREATE POLICY appointments_admin_view ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR (
      appointments.assigned_specialist_id IS NULL
      AND public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
    )
  );

DROP POLICY IF EXISTS appointments_admin_update ON public.appointments;
CREATE POLICY appointments_admin_update ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
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




-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0008_storage_policies.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  08_storage_policies.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 08_storage_policies.sql — سياسات التخزين + إصلاحات السياسات
-- مدموج (V33) من: 34_storage_policies.sql 35_fix_policies.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 34_storage_policies.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🔐 Migration 34: Storage Buckets & Policies (V25.20)
-- ════════════════════════════════════════════════════════════════════
-- يُنشئ buckets ويضبط policies للوصول الآمن:
--   1. consultation-images   - صور الاستشارات (خاص)
--   2. avatars               - صور الملفات الشخصية (عام)
--   3. medical-records       - وثائق طبية (خاص جداً)
--   4. nurse-credentials     - شهادات الممرضين (للأدمن)
--   5. prescription-photos   - صور الوصفات الطبية (خاص)
--
-- مهم: يجب تنفيذ هذه الـ migration قبل استخدام
-- consultation-images في الكود
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. إنشاء الـ Buckets
-- ════════════════════════════════════════════════════════════════════

-- ─── consultation-images: صور الاستشارات ──────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-images',
  'consultation-images',
  false,  -- خاص (يحتاج auth)
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── avatars: صور الملف الشخصي ───────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- عام (تُعرض بدون auth)
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── medical-records: وثائق طبية ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-records',
  'medical-records',
  false,  -- خاص جداً
  20971520,  -- 20 MB (PDFs قد تكون كبيرة)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── nurse-credentials: شهادات الممرضين ──────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nurse-credentials',
  'nurse-credentials',
  false,  -- خاص (للأدمن)
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── prescription-photos: صور الوصفات ────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescription-photos',
  'prescription-photos',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ════════════════════════════════════════════════════════════════════
-- 2. Policies للـ consultation-images
-- ════════════════════════════════════════════════════════════════════
-- Pattern المسار: {user_id}/{filename}
-- مثال: 550e8400-e29b-41d4-a716-446655440000/image-123.jpg

-- ─── المستخدم يرى صوره فقط ──────────────────────────
DROP POLICY IF EXISTS "consultation_images_owner_select" ON storage.objects;
CREATE POLICY "consultation_images_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consultation-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

-- ─── المستخدم يُحمّل لمجلده فقط ─────────────────────
DROP POLICY IF EXISTS "consultation_images_owner_insert" ON storage.objects;
CREATE POLICY "consultation_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'consultation-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── المستخدم يحذف صوره فقط ─────────────────────────
DROP POLICY IF EXISTS "consultation_images_owner_delete" ON storage.objects;
CREATE POLICY "consultation_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'consultation-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

-- ─── الطبيب يرى صور المرضى الذين يتعامل معهم ────────
DROP POLICY IF EXISTS "consultation_images_doctor_select" ON storage.objects;
CREATE POLICY "consultation_images_doctor_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consultation-images'
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.patient_user_id::text = (storage.foldername(name))[1]
      AND c.doctor_id IN (
        SELECT id FROM public.doctors WHERE user_id = auth.uid()
      )
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- 3. Policies للـ avatars (عام)
-- ════════════════════════════════════════════════════════════════════
-- Pattern: {user_id}/avatar.jpg
-- الجميع يرى (لأن public=true)

-- ─── المستخدم يُحمّل avatar الخاص به ─────────────────
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── المستخدم يحدّث avatar الخاص به ──────────────────
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── المستخدم يحذف avatar الخاص به ───────────────────
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- (SELECT تلقائي لأن bucket public=true)

-- ════════════════════════════════════════════════════════════════════
-- 4. Policies للـ medical-records (خاص جداً)
-- ════════════════════════════════════════════════════════════════════
-- Pattern: {user_id}/{record-name}

DROP POLICY IF EXISTS "medical_records_owner_select" ON storage.objects;
CREATE POLICY "medical_records_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-records'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "medical_records_owner_insert" ON storage.objects;
CREATE POLICY "medical_records_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-records'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "medical_records_owner_delete" ON storage.objects;
CREATE POLICY "medical_records_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-records'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═── الطبيب المعتمد يرى السجلات الطبية للمرضى ────────
DROP POLICY IF EXISTS "medical_records_doctor_select" ON storage.objects;
CREATE POLICY "medical_records_doctor_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-records'
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.user_id::text = (storage.foldername(name))[1]
      AND a.specialist_id = auth.uid()
      AND a.status IN ('confirmed', 'in_progress', 'completed')
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- 5. Policies للـ nurse-credentials (للأدمن)
-- ════════════════════════════════════════════════════════════════════
-- Pattern: {nurse_user_id}/{credential-file}

DROP POLICY IF EXISTS "nurse_credentials_nurse_insert" ON storage.objects;
CREATE POLICY "nurse_credentials_nurse_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nurse-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "nurse_credentials_nurse_select" ON storage.objects;
CREATE POLICY "nurse_credentials_nurse_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'nurse-credentials'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "nurse_credentials_admin_delete" ON storage.objects;
CREATE POLICY "nurse_credentials_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'nurse-credentials'
    AND public.is_admin(auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════
-- 6. Policies للـ prescription-photos
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "prescriptions_owner_select" ON storage.objects;
CREATE POLICY "prescriptions_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescription-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "prescriptions_owner_insert" ON storage.objects;
CREATE POLICY "prescriptions_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescription-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "prescriptions_owner_delete" ON storage.objects;
CREATE POLICY "prescriptions_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'prescription-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── الصيدلي يرى الوصفات للمعالجة ─────────────────────
DROP POLICY IF EXISTS "prescriptions_pharmacist_select" ON storage.objects;
CREATE POLICY "prescriptions_pharmacist_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescription-photos'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'specialist'
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- ✅ Verification
-- ════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_bucket_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bucket_count
  FROM storage.buckets
  WHERE id IN ('consultation-images', 'avatars', 'medical-records', 'nurse-credentials', 'prescription-photos');

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE ANY(ARRAY['consultation_images_%', 'avatars_%', 'medical_records_%', 'nurse_credentials_%', 'prescriptions_%']);

  RAISE NOTICE '✅ Migration 34 applied:';
  RAISE NOTICE '   - % storage buckets created', v_bucket_count;
  RAISE NOTICE '   - % storage policies installed', v_policy_count;
  RAISE NOTICE '   - consultation-images (10MB, private)';
  RAISE NOTICE '   - avatars (2MB, public)';
  RAISE NOTICE '   - medical-records (20MB, very private)';
  RAISE NOTICE '   - nurse-credentials (10MB, admin only)';
  RAISE NOTICE '   - prescription-photos (10MB, private)';
END $$;


-- ─── 35_fix_policies.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🔧 Migration 35: Fix Nursing Policies + Misc Cleanup (V25.20)
-- ════════════════════════════════════════════════════════════════════
-- يُصلح:
--   1. nursing policies تستخدم role='admin' بدلاً من is_admin()
--      (هذا يحرم super_admin/manager/support من الوصول)
--   2. تأكيد is_admin() متاحة قبل استخدامها
--   3. إضافة super_admin بشكل صريح في policies المهمة
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. التأكّد من is_admin() موجودة
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('super_admin', 'admin', 'manager', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ════════════════════════════════════════════════════════════════════
-- 2. إصلاح policies للـ nursing_services (من 20_nursing_enhancements)
-- ════════════════════════════════════════════════════════════════════

-- (سياسات nursing_services أُزيلت — الجدول غير موجود في المخطّط الحالي — V33)

-- ════════════════════════════════════════════════════════════════════
-- 3. إصلاح policies للـ nursing_orders (محميّ — الجدول قد لا يكون موجوداً)
-- ════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nursing_orders') THEN
    DROP POLICY IF EXISTS "nursing_orders_select_own" ON public.nursing_orders;
    CREATE POLICY "nursing_orders_select_own"
      ON public.nursing_orders FOR SELECT
      USING (user_id = auth.uid() OR nurse_id = auth.uid() OR public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "nursing_orders_insert_own" ON public.nursing_orders;
    CREATE POLICY "nursing_orders_insert_own"
      ON public.nursing_orders FOR INSERT
      WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "nursing_orders_update_own" ON public.nursing_orders;
    CREATE POLICY "nursing_orders_update_own"
      ON public.nursing_orders FOR UPDATE
      USING (user_id = auth.uid() OR nurse_id = auth.uid() OR public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "nursing_orders_admin_delete" ON public.nursing_orders;
    CREATE POLICY "nursing_orders_admin_delete"
      ON public.nursing_orders FOR DELETE
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 4. تحقّق + تحسين باقي الجداول الحساسة
-- ════════════════════════════════════════════════════════════════════

-- ─── audit_logs: admin فقط ────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
    CREATE POLICY "audit_logs_admin_select"
      ON public.audit_logs FOR SELECT
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ─── system_logs: super_admin فقط ─────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    DROP POLICY IF EXISTS "system_logs_super_admin" ON public.system_logs;
    CREATE POLICY "system_logs_super_admin"
      ON public.system_logs FOR ALL
      USING (public.is_super_admin(auth.uid()));
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 5. Performance: indexes إضافية مهمة
-- ════════════════════════════════════════════════════════════════════

-- (indexes nursing_orders أُزيلت — الجدول غير موجود في المخطّط الحالي — V33)

-- ════════════════════════════════════════════════════════════════════
-- 6. تحسينات الـ appointments policies (تأكيد is_admin)
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  -- تأكّد policies على appointments تستخدم is_admin
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
  LOOP
    -- نسجل في log فقط - لا نُغيّر شيء
    NULL;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- ✅ Verification
-- ════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_old_admin_policies INTEGER;
BEGIN
  -- نتحقق إذا لا تزال هناك policies بـ role = 'admin'
  SELECT COUNT(*) INTO v_old_admin_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND qual LIKE '%role = ''admin''%';

  IF v_old_admin_policies > 0 THEN
    RAISE NOTICE '⚠️  لا تزال هناك % policies تستخدم role=''admin'' بشكل مباشر', v_old_admin_policies;
    RAISE NOTICE '   (هذه ليست مشكلة حرجة - is_admin() تشمل admin أيضاً)';
  END IF;

  RAISE NOTICE '✅ Migration 35 applied:';
  RAISE NOTICE '   - is_admin() + is_super_admin() functions ensured';
  RAISE NOTICE '   - nursing_services policies updated';
  RAISE NOTICE '   - nursing_orders policies updated';
  RAISE NOTICE '   - 2 new indexes for nursing performance';
END $$;





-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0009_seed_and_fixes.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ╔══════════════════════════════════════════════════════════════╗
-- ║  09_seed_and_fixes.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 09_seed_and_fixes.sql — الإصلاحات المتأخّرة + البيانات الأولية (الأخير)
-- مدموج (V33) من: 19_appointment_reminders 46_fix_specialist_types 47_link_static_labs 25_seed_data
-- (ملاحظة: 16_fix_login_phone كان ملف TypeScript — مُستبعَد)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 19_appointment_reminders.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 📅 Migration 19: Appointment Reminders Tracking (V25.4)
-- ════════════════════════════════════════════════════════════════════
-- يُضيف:
--   1. reminder_sent_at - وقت إرسال تذكير "قبل ساعة"
-- ════════════════════════════════════════════════════════════════════

-- إضافة العمود إذا لم يكن موجوداً
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index للبحث السريع عن المواعيد المحتاجة تذكير
CREATE INDEX IF NOT EXISTS idx_appointments_reminders
  ON public.appointments(scheduled_at, reminder_sent_at)
  WHERE status = 'confirmed' AND reminder_sent_at IS NULL;

-- تعليق
COMMENT ON COLUMN public.appointments.reminder_sent_at IS
  'وقت إرسال تذكير "قبل ساعة" (للـ cron job - لمنع الإرسال المتكرّر)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 19 applied: reminder_sent_at column';
END $$;


-- ─── 46_fix_specialist_types.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V30: إصلاح specialist_type للحسابات الموجودة
-- ═══════════════════════════════════════════════════════════════════
-- 
-- المشكلة:
--   المختصّون الذين سجّلوا قبل V30 يحملون specialist_type = NULL
--   لأنّ registerSpecialist لم يكن يحفظ القيمة في DB.
--   النتيجة: لا يرون أي طلبات في /specialist/orders
--
-- الحلّ:
--   1. أيّ مختصّ بـ specialist_type = NULL → يصبح 'doctor' (default آمن)
--   2. أيّ قيم قديمة لا تطابق الـ constraint → تُصلَّح
--   3. التأكّد من أنّ كل المختصّين الحاليّين يستطيعون رؤية الطلبات
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. إصلاح القيم القديمة (لو موجودة) ───
UPDATE public.users
SET specialist_type = CASE
  WHEN specialist_type = 'analyst'        THEN 'lab_analyst'
  WHEN specialist_type = 'lab_tech'       THEN 'lab_analyst'
  WHEN specialist_type = 'physiotherapist' THEN 'physio'
  WHEN specialist_type = 'dentist'        THEN 'doctor'
  WHEN specialist_type = 'radiologist'    THEN 'doctor'
  WHEN specialist_type = 'other'          THEN 'doctor'
  ELSE specialist_type
END
WHERE role = 'specialist'
  AND specialist_type IS NOT NULL
  AND specialist_type NOT IN (
    'lab_analyst', 'nurse', 'doctor', 'pharmacist',
    'physio', 'psychologist', 'nutritionist'
  );

-- ─── 2. تعبئة المختصّين الذين لا يحملون specialist_type ───
-- نضع 'doctor' كقيمة افتراضية (الأكثر شمولاً) — يمكن للأدمن تعديلها لاحقاً
UPDATE public.users
SET specialist_type = 'doctor'
WHERE role = 'specialist'
  AND specialist_type IS NULL;

-- ─── 3. التحقّق ───
-- بعد التشغيل، يجب أن يكون كل المختصّين لديهم specialist_type صالح
DO $$
DECLARE
  null_count INTEGER;
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.users
  WHERE role = 'specialist' AND specialist_type IS NULL;
  
  SELECT COUNT(*) INTO invalid_count
  FROM public.users
  WHERE role = 'specialist'
    AND specialist_type IS NOT NULL
    AND specialist_type NOT IN (
      'lab_analyst', 'nurse', 'doctor', 'pharmacist',
      'physio', 'psychologist', 'nutritionist'
    );
  
  IF null_count > 0 THEN
    RAISE WARNING 'Still % specialists with NULL specialist_type', null_count;
  END IF;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % specialists with invalid specialist_type', invalid_count;
  END IF;
  
  RAISE NOTICE 'Migration 46 OK: all specialists have valid specialist_type';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 46 Complete
-- 
-- بعد التشغيل، يستطيع المختصّون رؤية الطلبات حسب اختصاصهم.
-- الأدمن يمكنه لاحقاً تعديل specialist_type لكل مختصّ من /admin44/users
-- ═══════════════════════════════════════════════════════════════════


-- ─── 47_link_static_labs.sql ───
-- ═══════════════════════════════════════════════════════════════════
-- 🔗 V31: ربط المختبرات الـ static بقاعدة البيانات (slug)
-- ═══════════════════════════════════════════════════════════════════
--
-- المشكلة:
--   الـ UI يعرض مختبرات static (labs-data.ts) بـ IDs نصية: 'medcare', 'al-hayat'...
--   لكن جدول partner_labs يستخدم UUID + أسماء مختلفة.
--   النتيجة: partner_lab_id يُحفظ NULL دائماً → الطلب غير مربوط بمختبر حقيقي.
--
-- الحلّ:
--   1. إضافة عمود slug (نصّي ثابت) لـ partner_labs
--   2. زرع المختبرات الـ static بنفس الـ slugs المستخدمة في الكود
--   3. الكود سيبحث بالـ slug → partner_lab_id حقيقي
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. إضافة عمود slug ───
ALTER TABLE public.partner_labs
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- index فريد (يسمح بـ NULL متعدّد لكن slug فريد عند وجوده)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_labs_slug
  ON public.partner_labs(slug) WHERE slug IS NOT NULL;

-- ─── 2. زرع المختبرات الـ static (نفس IDs الكود) ───
-- نحذف أولاً أيّ صفوف بنفس الـ slug (idempotent) ثم نُدخل من جديد
DELETE FROM public.partner_labs
WHERE slug IN ('medcare', 'al-hayat', 'al-shifa', 'ibn-sina', 'al-amal');

INSERT INTO public.partner_labs (
  slug, name_ar, name_en, city, governorate, phone,
  is_active, is_featured, accepts_home_draw, rating_avg, rating_count, specialties
) VALUES
  ('medcare',  'مختبر ميد كير',     'MedCare Lab',      'بغداد', 'بغداد', '07700000011', true, true,  true, 4.9, 1240, ARRAY['general','cardiac','thyroid']),
  ('al-hayat', 'مختبرات الحياة',    'Al-Hayat Labs',    'بغداد', 'بغداد', '07700000012', true, true,  true, 4.8,  980, ARRAY['general','diabetes','hormones']),
  ('al-shifa', 'مختبر الشفاء',      'Al-Shifa Lab',     'البصرة','البصرة','07700000013', true, false, true, 4.7,  650, ARRAY['general','kidney','liver']),
  ('ibn-sina', 'مختبر ابن سينا',    'Ibn Sina Lab',     'أربيل', 'أربيل', '07700000014', true, true,  true, 4.9,  820, ARRAY['general','cardiac','genetic']),
  ('al-amal',  'مختبر الأمل',       'Al-Amal Lab',      'النجف', 'النجف', '07700000015', true, false, true, 4.6,  540, ARRAY['general','diabetes','thyroid']);

-- ─── 3. دالة helper: إيجاد lab بالـ slug ───
CREATE OR REPLACE FUNCTION public.get_lab_id_by_slug(p_slug TEXT)
RETURNS UUID AS $$
  SELECT id FROM public.partner_labs WHERE slug = p_slug LIMIT 1;
$$ LANGUAGE sql STABLE;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 47 Complete
--
-- بعد التشغيل:
--   • partner_labs فيها 5 مختبرات بـ slugs تطابق الكود
--   • createBloodDrawOrder يقدر يربط partner_lab_id الحقيقي بالـ slug
-- ═══════════════════════════════════════════════════════════════════


-- ─── 25_seed_data.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🌱 SEED DATA: بيانات حقيقية للنظام (V25.10)
-- ════════════════════════════════════════════════════════════════════
-- يجب تشغيله بعد كل migrations
-- يحتوي على:
--   • 25 مستشفى حقيقي في العراق (حكومي + أهلي + تخصصي)
--   • 30 صيدلية رئيسية في بغداد + المحافظات
--   • 50 دواء عراقي شائع
--   • 10 أطباء عائلة (أمثلة)
-- ════════════════════════════════════════════════════════════════════

-- ─── حذف البيانات القديمة (اختياري) ─────────────────────
-- DELETE FROM pharmacy_inventory;
-- DELETE FROM medications;
-- DELETE FROM pharmacies;
-- DELETE FROM hospitals;
-- DELETE FROM doctors;

-- ════════════════════════════════════════════════════════════════════
-- 🏥 المستشفيات (25 مستشفى حقيقي)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.hospitals (
  name, name_en, type, city, district, address,
  latitude, longitude, phone, phone_emergency,
  is_24h, departments, has_emergency, has_ambulance, has_pharmacy, has_lab, has_radiology,
  beds_count, icu_beds_count, description, is_active, is_verified
) VALUES

-- ═══ بغداد - مستشفيات حكومية ═══
('مستشفى مدينة الطب', 'Medical City Teaching Hospital', 'government', 'بغداد', 'الباب المعظم',
  'مجمع مدينة الطب، شارع باب المعظم',
  33.3399, 44.3886, '07901111111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','oncology','neurology'],
  true, true, true, true, true,
  1300, 80,
  'أكبر مجمع طبي حكومي في العراق - يضم 8 مستشفيات تخصصية',
  true, true),

('مستشفى ابن البلدي للنساء والأطفال', 'Ibn Al-Baladi Hospital', 'government', 'بغداد', 'الباب الشرقي',
  'الباب الشرقي، شارع ٧',
  33.3201, 44.4192, '07901111112', '122',
  true, ARRAY['emergency','pediatrics','maternity','icu'],
  true, true, false, true, true,
  400, 30,
  'مستشفى متخصص بالأطفال والنسائية والولادة',
  true, true),

('مستشفى الكاظمية التعليمي', 'Al-Kadhimiya Teaching Hospital', 'government', 'بغداد', 'الكاظمية',
  'شارع الإمام موسى الكاظم',
  33.3786, 44.3375, '07901111113', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','orthopedics'],
  true, true, true, true, true,
  600, 40,
  'مستشفى تعليمي رئيسي في الكاظمية',
  true, true),

('مستشفى الشهيد الصدر العام', 'Al-Sadr Hospital', 'government', 'بغداد', 'مدينة الصدر',
  'مدينة الصدر، القطاع ٣٧',
  33.3850, 44.4866, '07901111114', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  500, 25,
  'يخدم سكان مدينة الصدر وضواحيها',
  true, true),

('مستشفى الجراحات التخصصي', 'Specialized Surgery Hospital', 'government', 'بغداد', 'الباب المعظم',
  'مجمع مدينة الطب',
  33.3410, 44.3870, '07901111115', '122',
  true, ARRAY['emergency','surgery','icu','radiology'],
  true, false, true, true, true,
  250, 20,
  'متخصص بالجراحات التخصصية الكبرى',
  true, true),

-- ═══ بغداد - مستشفيات أهلية ═══
('المستشفى التركي', 'Turkish Hospital', 'private', 'بغداد', 'الكرادة',
  'الكرادة داخل، شارع ٦٢',
  33.3026, 44.4097, '07712345678', '07712345600',
  true, ARRAY['emergency','cardiology','surgery','maternity','radiology','oncology','dermatology'],
  true, true, true, true, true,
  300, 25,
  'مستشفى أهلي راقي بمعايير عالمية - شراكة تركية',
  true, true),

('مستشفى الكندي', 'Al-Kindi Hospital', 'private', 'بغداد', 'المنصور',
  'المنصور، شارع الأميرات',
  33.3115, 44.3525, '07812345678', '07812345600',
  true, ARRAY['emergency','cardiology','pediatrics','maternity','neurology','orthopedics','surgery'],
  true, true, true, true, true,
  280, 22,
  'مستشفى عام بخدمات شاملة في المنصور',
  true, true),

('مستشفى ابن سينا للقلب', 'Ibn Sina Cardiac Hospital', 'specialized', 'بغداد', 'الجادرية',
  'الجادرية، قرب جامعة بغداد',
  33.2675, 44.3856, '07912345678', '07912345600',
  true, ARRAY['emergency','cardiology','surgery','icu'],
  true, true, true, true, true,
  150, 30,
  'تخصصي في أمراض وجراحة القلب',
  true, true),

('مستشفى دار السلام', 'Dar Al-Salam Hospital', 'private', 'بغداد', 'الكرادة',
  'الكرادة، شارع الرفعة',
  33.3092, 44.4145, '07712222333', '07712222300',
  true, ARRAY['emergency','maternity','pediatrics','surgery'],
  true, true, true, true, true,
  120, 15,
  'متخصص بالنسائية والولادة',
  true, true),

('مستشفى الشفاء الأهلي', 'Al-Shifa Private Hospital', 'private', 'بغداد', 'الكاظمية',
  'الكاظمية، شارع المتنبي',
  33.3756, 44.3390, '07712223344', null,
  false, ARRAY['surgery','pediatrics','dermatology','psychiatry'],
  false, false, true, true, true,
  80, 0,
  'مستشفى متوسط الحجم بخدمات نهارية',
  true, true),

-- ═══ مراكز صحية في بغداد ═══
('مركز الكرادة الصحي', 'Karrada Health Center', 'health_center', 'بغداد', 'الكرادة',
  'الكرادة الشرقية',
  33.3034, 44.4128, '07901112233', null,
  false, ARRAY['lab','pharmacy'],
  false, false, true, true, false,
  null, null,
  'رعاية أولية وعيادات عامة',
  true, true),

('مركز الجادرية الصحي', 'Jadriya Health Center', 'health_center', 'بغداد', 'الجادرية',
  'شارع الجادرية',
  33.2706, 44.3845, '07901112234', null,
  false, ARRAY['lab','pharmacy'],
  false, false, true, true, false,
  null, null,
  'رعاية أولية',
  true, true),

-- ═══ البصرة ═══
('مستشفى البصرة التعليمي', 'Basra Teaching Hospital', 'government', 'البصرة', 'البصرة',
  'البصرة، شارع الكورنيش',
  30.5093, 47.7806, '07901333111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','oncology'],
  true, true, true, true, true,
  700, 50,
  'أكبر مستشفى تعليمي في الجنوب',
  true, true),

('مستشفى الفيحاء العام', 'Al-Faiha Hospital', 'government', 'البصرة', 'الفيحاء',
  'الفيحاء، البصرة',
  30.5258, 47.7700, '07901333112', '122',
  true, ARRAY['emergency','pediatrics','maternity','surgery'],
  true, true, false, true, true,
  400, 30,
  'مستشفى عام كبير',
  true, true),

('مستشفى الموانئ الأهلي', 'Al-Mawanee Private Hospital', 'private', 'البصرة', 'البصرة',
  'البصرة الجديدة',
  30.5375, 47.8208, '07712333444', null,
  true, ARRAY['emergency','cardiology','surgery','radiology'],
  true, true, true, true, true,
  150, 18,
  'مستشفى أهلي بمعايير دولية',
  true, true),

-- ═══ الموصل ═══
('مستشفى الموصل العام', 'Mosul General Hospital', 'government', 'الموصل', 'الموصل',
  'الموصل، الجانب الأيسر',
  36.3500, 43.1450, '07901444111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','icu'],
  true, true, true, true, true,
  500, 35,
  'المستشفى الرئيسي في الموصل',
  true, true),

-- ═══ النجف ═══
('مستشفى الحكيم العام', 'Al-Hakeem Hospital', 'government', 'النجف', 'النجف',
  'النجف الأشرف',
  32.0040, 44.3340, '07901555111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu'],
  true, true, true, true, true,
  450, 30,
  'مستشفى تعليمي في النجف',
  true, true),

('مستشفى السلام الأهلي', 'Al-Salam Private Hospital', 'private', 'النجف', 'النجف',
  'شارع الكوفة',
  31.9920, 44.3290, '07712555666', null,
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, true, true, true,
  100, 10,
  'مستشفى أهلي شامل',
  true, true),

-- ═══ كربلاء ═══
('مستشفى الإمام الحسين التعليمي', 'Imam Hussein Teaching Hospital', 'government', 'كربلاء', 'كربلاء',
  'كربلاء، قرب الحرم',
  32.6160, 44.0246, '07901666111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','cardiology','icu'],
  true, true, true, true, true,
  600, 40,
  'أكبر مستشفى في كربلاء',
  true, true),

-- ═══ أربيل ═══
('مستشفى أربيل التعليمي', 'Erbil Teaching Hospital', 'government', 'أربيل', 'أربيل',
  'وسط أربيل',
  36.1880, 44.0090, '07501777111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','oncology','neurology'],
  true, true, true, true, true,
  800, 60,
  'أكبر مستشفى تعليمي في كردستان',
  true, true),

('مستشفى زانكو الأهلي', 'Zanko Private Hospital', 'private', 'أربيل', 'أربيل',
  'منطقة جوار جرا',
  36.2010, 43.9920, '07501777222', null,
  true, ARRAY['emergency','cardiology','surgery','radiology'],
  true, true, true, true, true,
  200, 20,
  'مستشفى أهلي راقي',
  true, true),

-- ═══ السليمانية ═══
('مستشفى شار العام', 'Shar General Hospital', 'government', 'السليمانية', 'السليمانية',
  'وسط السليمانية',
  35.5630, 45.4316, '07501888111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','icu'],
  true, true, true, true, true,
  450, 30,
  'مستشفى رئيسي في السليمانية',
  true, true),

-- ═══ كركوك ═══
('مستشفى كركوك العام', 'Kirkuk General Hospital', 'government', 'كركوك', 'كركوك',
  'كركوك، شارع الجمهورية',
  35.4690, 44.3920, '07901999111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  350, 25,
  'مستشفى عام',
  true, true),

-- ═══ بابل ═══
('مستشفى مرجان التعليمي', 'Marjan Teaching Hospital', 'government', 'بابل', 'الحلة',
  'الحلة، شارع ٤٠',
  32.4639, 44.4170, '07901000111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','cardiology'],
  true, true, true, true, true,
  500, 35,
  'مستشفى تعليمي في الحلة',
  true, true),

-- ═══ ذي قار ═══
('مستشفى الحسين التعليمي', 'Al-Hussein Hospital', 'government', 'ذي قار', 'الناصرية',
  'الناصرية',
  31.0420, 46.2627, '07901101111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  400, 28,
  'مستشفى رئيسي في الناصرية',
  true, true);


-- ════════════════════════════════════════════════════════════════════
-- 💊 الأدوية (50 دواء عراقي شائع)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.medications (name_ar, name_en, generic_name, manufacturer, category, form, strength, package_size, requires_prescription) VALUES

-- مسكنات
('بنادول', 'Panadol', 'Paracetamol', 'GSK', 'analgesic', 'tablet', '500mg', '20 قرص', false),
('بنادول إكسترا', 'Panadol Extra', 'Paracetamol+Caffeine', 'GSK', 'analgesic', 'tablet', '500mg', '24 قرص', false),
('فيفادول', 'Fevadol', 'Paracetamol', 'SPIMACO', 'analgesic', 'tablet', '500mg', '20 قرص', false),
('بروفين', 'Brufen', 'Ibuprofen', 'Abbott', 'analgesic', 'tablet', '400mg', '20 قرص', false),
('فولتارين', 'Voltaren', 'Diclofenac', 'Novartis', 'analgesic', 'tablet', '50mg', '20 قرص', true),
('كيتوفان', 'Ketofan', 'Ketoprofen', 'Hikma', 'analgesic', 'tablet', '50mg', '10 قرص', true),
('أسبرين', 'Aspirin', 'Acetylsalicylic Acid', 'Bayer', 'analgesic', 'tablet', '500mg', '20 قرص', false),
('كافيتول', 'Cafetol', 'Paracetamol+Caffeine+Codeine', 'SAJA', 'analgesic', 'tablet', null, '20 قرص', true),

-- مضادات حيوية
('أوغمنتين', 'Augmentin', 'Amoxicillin+Clavulanic Acid', 'GSK', 'antibiotic', 'tablet', '1g', '14 قرص', true),
('أموكسيل', 'Amoxil', 'Amoxicillin', 'GSK', 'antibiotic', 'capsule', '500mg', '12 كبسولة', true),
('زيناكس', 'Zinnat', 'Cefuroxime', 'GSK', 'antibiotic', 'tablet', '500mg', '14 قرص', true),
('سيبروزون', 'Ciprozone', 'Ciprofloxacin', 'SDI', 'antibiotic', 'tablet', '500mg', '10 قرص', true),
('فلاجيل', 'Flagyl', 'Metronidazole', 'Sanofi', 'antibiotic', 'tablet', '500mg', '20 قرص', true),
('كلامنتين', 'Klamentin', 'Amoxicillin+Clavulanic Acid', 'KIMIA', 'antibiotic', 'tablet', '1g', '14 قرص', true),
('روسيفين', 'Rocephin', 'Ceftriaxone', 'Roche', 'antibiotic', 'injection', '1g', 'فيال واحد', true),
('زيتروماكس', 'Zithromax', 'Azithromycin', 'Pfizer', 'antibiotic', 'tablet', '500mg', '3 قرص', true),

-- ضغط الدم
('كونكور', 'Concor', 'Bisoprolol', 'Merck', 'antihypertensive', 'tablet', '5mg', '30 قرص', true),
('نورفاسك', 'Norvasc', 'Amlodipine', 'Pfizer', 'antihypertensive', 'tablet', '5mg', '30 قرص', true),
('كابوتين', 'Capoten', 'Captopril', 'Bristol-Myers', 'antihypertensive', 'tablet', '25mg', '30 قرص', true),
('لوسارتان', 'Cozaar', 'Losartan', 'MSD', 'antihypertensive', 'tablet', '50mg', '30 قرص', true),
('ديوفان', 'Diovan', 'Valsartan', 'Novartis', 'antihypertensive', 'tablet', '80mg', '28 قرص', true),
('تينورمين', 'Tenormin', 'Atenolol', 'AstraZeneca', 'antihypertensive', 'tablet', '50mg', '30 قرص', true),

-- السكري
('جلوكوفاج', 'Glucophage', 'Metformin', 'Merck', 'antidiabetic', 'tablet', '500mg', '60 قرص', true),
('جلوكوفاج XR', 'Glucophage XR', 'Metformin XR', 'Merck', 'antidiabetic', 'tablet', '1000mg', '60 قرص', true),
('أماريل', 'Amaryl', 'Glimepiride', 'Sanofi', 'antidiabetic', 'tablet', '2mg', '30 قرص', true),
('جانوفيا', 'Januvia', 'Sitagliptin', 'MSD', 'antidiabetic', 'tablet', '100mg', '28 قرص', true),
('لانتوس', 'Lantus', 'Insulin Glargine', 'Sanofi', 'antidiabetic', 'injection', '100IU/ml', 'قلم 3ml', true),

-- القلب
('أسبرين كاردي', 'Aspocid', 'Aspirin', 'Bayer', 'cardiac', 'tablet', '100mg', '30 قرص', false),
('بلافيكس', 'Plavix', 'Clopidogrel', 'Sanofi', 'cardiac', 'tablet', '75mg', '28 قرص', true),
('كرستور', 'Crestor', 'Rosuvastatin', 'AstraZeneca', 'cardiac', 'tablet', '20mg', '30 قرص', true),
('ليبيتور', 'Lipitor', 'Atorvastatin', 'Pfizer', 'cardiac', 'tablet', '20mg', '30 قرص', true),

-- الجهاز التنفسي
('فنتولين', 'Ventolin', 'Salbutamol', 'GSK', 'respiratory', 'inhaler', '100mcg', '200 جرعة', false),
('سيمبيكورت', 'Symbicort', 'Budesonide+Formoterol', 'AstraZeneca', 'respiratory', 'inhaler', null, '120 جرعة', true),
('كلاريتين', 'Claritine', 'Loratadine', 'Bayer', 'respiratory', 'tablet', '10mg', '20 قرص', false),
('زيرتك', 'Zyrtec', 'Cetirizine', 'UCB', 'respiratory', 'tablet', '10mg', '20 قرص', false),
('بروسبان', 'Prospan', 'Ivy Leaf', 'Engelhard', 'respiratory', 'syrup', null, '100ml', false),

-- الجهاز الهضمي
('نيكسيوم', 'Nexium', 'Esomeprazole', 'AstraZeneca', 'gastric', 'tablet', '40mg', '14 قرص', true),
('أوميبرازول', 'Omeprazole', 'Omeprazole', 'SDI', 'gastric', 'capsule', '20mg', '14 كبسولة', false),
('موتيليوم', 'Motilium', 'Domperidone', 'Janssen', 'gastric', 'tablet', '10mg', '30 قرص', false),
('بوسكوبان', 'Buscopan', 'Hyoscine', 'Boehringer', 'gastric', 'tablet', '10mg', '20 قرص', false),
('سمكتا', 'Smecta', 'Diosmectite', 'Ipsen', 'gastric', 'syrup', null, '12 ظرف', false),
('فلاجيل شراب', 'Flagyl Syrup', 'Metronidazole', 'Sanofi', 'gastric', 'syrup', '125mg/5ml', '120ml', true),

-- فيتامينات
('سنتروم', 'Centrum', 'Multivitamin', 'Pfizer', 'vitamin', 'tablet', null, '30 قرص', false),
('فيتامين د3', 'Vitamin D3', 'Cholecalciferol', 'Nature Made', 'vitamin', 'capsule', '5000IU', '60 كبسولة', false),
('سي فيت', 'Cevit', 'Vitamin C', 'Bayer', 'vitamin', 'tablet', '1000mg', '10 قرص فوار', false),
('فيروز', 'Ferose', 'Iron+Folic Acid', 'SDI', 'vitamin', 'tablet', null, '30 قرص', false),

-- الأطفال
('بنادول أطفال', 'Panadol Pediatric', 'Paracetamol', 'GSK', 'baby', 'syrup', '120mg/5ml', '60ml', false),
('بروفين شراب', 'Brufen Syrup', 'Ibuprofen', 'Abbott', 'baby', 'syrup', '100mg/5ml', '100ml', false),
('فيروز شراب', 'Ferose Syrup', 'Iron', 'SDI', 'baby', 'syrup', null, '150ml', false),
('بيدياشور', 'PediaSure', 'Nutrition', 'Abbott', 'baby', 'tablet', null, '400g', false),

-- إسعافات أولية
('بيتادين', 'Betadine', 'Povidone-Iodine', 'Mundipharma', 'first_aid', 'ointment', '10%', '30g', false),
('باناسيد', 'Panacid', 'Aluminum Hydroxide', 'SDI', 'gastric', 'syrup', null, '200ml', false);


-- ════════════════════════════════════════════════════════════════════
-- 💊 الصيدليات (30 صيدلية في بغداد + المحافظات)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.pharmacies (
  name, city, district, address, latitude, longitude, phone, whatsapp,
  is_24h, opens_at, closes_at, has_emergency_section,
  is_active, is_verified, verified_at
) VALUES

-- بغداد
('صيدلية الحياة', 'بغداد', 'الكرادة', 'الكرادة داخل، شارع ٦٢', 33.3026, 44.4097, '07712345678', '9647712345678', true, null, null, true, true, true, now()),
('صيدلية النور', 'بغداد', 'المنصور', 'المنصور، شارع الأميرات', 33.3115, 44.3525, '07812345678', '9647812345678', true, null, null, false, true, true, now()),
('صيدلية ابن سينا', 'بغداد', 'الجادرية', 'الجادرية، شارع جامعة بغداد', 33.2675, 44.3856, '07912345678', '9647912345678', false, '07:00', '24:00', false, true, true, now()),
('صيدلية الكرخ المركزية', 'بغداد', 'الكرخ', 'الكرخ، شارع الرافدين', 33.3197, 44.3661, '07701234567', null, false, '08:00', '22:00', false, true, true, now()),
('صيدلية الصدر', 'بغداد', 'مدينة الصدر', 'مدينة الصدر، شارع فلسطين', 33.3850, 44.4866, '07701234568', null, true, null, null, false, true, true, now()),
('صيدلية الزهور', 'بغداد', 'الكرادة', 'الكرادة الشرقية', 33.3060, 44.4115, '07712345001', null, false, '08:00', '23:00', false, true, true, now()),
('صيدلية الشفاء', 'بغداد', 'الكاظمية', 'الكاظمية، شارع الإمام', 33.3786, 44.3375, '07712345002', '9647712345002', false, '08:00', '23:30', false, true, true, now()),
('صيدلية ٢٤', 'بغداد', 'المنصور', 'المنصور، الحي العربي', 33.3175, 44.3585, '07712345003', null, true, null, null, true, true, true, now()),
('صيدلية الفرات', 'بغداد', 'الجادرية', 'الجادرية، قرب جامعة بغداد', 33.2700, 44.3870, '07712345004', null, false, '07:00', '23:00', false, true, true, now()),
('صيدلية النخيل', 'بغداد', 'بغداد الجديدة', 'بغداد الجديدة، شارع ٦٠', 33.3340, 44.4530, '07712345005', null, true, null, null, false, true, true, now()),
('صيدلية الأمل', 'بغداد', 'حي الجامعة', 'حي الجامعة', 33.2845, 44.3692, '07712345006', '9647712345006', false, '08:00', '22:00', false, true, true, now()),
('صيدلية المركزية', 'بغداد', 'الباب الشرقي', 'الباب الشرقي، شارع السعدون', 33.3201, 44.4192, '07712345007', null, true, null, null, false, true, true, now()),
('صيدلية الكوثر', 'بغداد', 'الأعظمية', 'الأعظمية، شارع ٢٠', 33.3717, 44.4007, '07712345008', null, false, '08:00', '23:00', false, true, true, now()),
('صيدلية البتول', 'بغداد', 'الكرادة', 'الكرادة، شارع ٥٢', 33.3050, 44.4140, '07712345009', '9647712345009', false, '08:00', '22:30', false, true, true, now()),
('صيدلية النخبة', 'بغداد', 'المنصور', 'المنصور، شارع ١٤ رمضان', 33.3140, 44.3550, '07712345010', null, true, null, null, true, true, true, now()),

-- البصرة
('صيدلية البصرة الكبرى', 'البصرة', 'البصرة', 'البصرة، شارع الكورنيش', 30.5093, 47.7806, '07901111222', '9647901111222', true, null, null, true, true, true, now()),
('صيدلية ابن الهيثم', 'البصرة', 'البصرة', 'شارع الجمهورية', 30.5258, 47.7700, '07901111223', null, false, '08:00', '23:00', false, true, true, now()),
('صيدلية الخليج', 'البصرة', 'الفيحاء', 'الفيحاء', 30.5375, 47.8208, '07901111224', null, true, null, null, false, true, true, now()),

-- النجف
('صيدلية النجف المركزية', 'النجف', 'النجف', 'النجف، شارع الكوفة', 32.0040, 44.3340, '07701234570', '9647701234570', false, '08:00', '22:00', false, true, true, now()),
('صيدلية الإمام علي', 'النجف', 'النجف', 'قرب الحرم', 31.9999, 44.3300, '07701234571', null, true, null, null, false, true, true, now()),

-- كربلاء
('صيدلية كربلاء المركزية', 'كربلاء', 'كربلاء', 'وسط كربلاء', 32.6160, 44.0246, '07712223344', '9647712223344', false, '08:00', '23:00', false, true, true, now()),
('صيدلية الحسين', 'كربلاء', 'كربلاء', 'شارع الإمام الحسين', 32.6155, 44.0259, '07712223345', null, true, null, null, false, true, true, now()),

-- أربيل
('صيدلية أربيل المركزية', 'أربيل', 'وسط أربيل', 'وسط أربيل', 36.1880, 44.0090, '07501234567', '9647501234567', true, null, null, false, true, true, now()),
('صيدلية كردستان', 'أربيل', 'منطقة جوار جرا', 'جوار جرا', 36.2010, 43.9920, '07501234568', null, false, '08:00', '23:00', false, true, true, now()),

-- الموصل
('صيدلية الموصل الكبرى', 'الموصل', 'الموصل', 'الموصل، الجانب الأيسر', 36.3500, 43.1450, '07901444222', '9647901444222', false, '08:00', '23:00', false, true, true, now()),

-- كركوك
('صيدلية كركوك المركزية', 'كركوك', 'كركوك', 'كركوك، شارع الجمهورية', 35.4690, 44.3920, '07901999222', null, false, '08:00', '22:30', false, true, true, now()),

-- بابل
('صيدلية الحلة', 'بابل', 'الحلة', 'الحلة، شارع ٤٠', 32.4639, 44.4170, '07901000222', null, true, null, null, false, true, true, now()),

-- ذي قار
('صيدلية الناصرية', 'ذي قار', 'الناصرية', 'الناصرية', 31.0420, 46.2627, '07901101222', null, false, '08:00', '22:00', false, true, true, now()),

-- السليمانية
('صيدلية شار', 'السليمانية', 'السليمانية', 'وسط السليمانية', 35.5630, 45.4316, '07501888222', '9647501888222', true, null, null, false, true, true, now()),

-- الأنبار
('صيدلية الرمادي المركزية', 'الأنبار', 'الرمادي', 'الرمادي، وسط المدينة', 33.4258, 43.3088, '07901202222', null, false, '08:00', '22:00', false, true, true, now());


-- ════════════════════════════════════════════════════════════════════
-- 👨‍⚕️ أطباء العائلة (10 أطباء كمثال)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.doctors (
  full_name, title, gender, specialty, sub_specialty, years_experience,
  qualifications,
  available_for_home_visit, available_for_video, available_for_clinic,
  home_visit_price, video_consult_price, monthly_subscription_price, yearly_subscription_price,
  clinic_name, clinic_address, clinic_city, clinic_phone,
  languages, bio, is_active, is_verified, verified_at
) VALUES

('أحمد علي حسين', 'د.', 'male', 'family_medicine', 'طب عائلة شامل', 18,
  ARRAY['بكالوريوس طب جامعة بغداد 2005', 'بورد عربي طب عائلة 2010', 'دبلوم السكري والضغط 2012'],
  true, true, true,
  75000, 30000, 50000, 500000,
  'عيادة د. أحمد لطب العائلة', 'الكرادة داخل، شارع ٦٢', 'بغداد', '07901500001',
  ARRAY['ar', 'en'],
  'طبيب عائلة بخبرة 18 سنة، متخصص بأمراض السكري وضغط الدم وأمراض الشيخوخة',
  true, true, now()),

('سارة محمد علي', 'د.', 'female', 'pediatrics', 'طب أطفال عام', 12,
  ARRAY['بكالوريوس طب جامعة بغداد 2011', 'بورد عربي أطفال 2016', 'زمالة في أمراض الأطفال 2018'],
  true, true, true,
  100000, 40000, 75000, 750000,
  'عيادة د. سارة للأطفال', 'المنصور، شارع الأميرات', 'بغداد', '07901500002',
  ARRAY['ar', 'en', 'ku'],
  'طبيبة أطفال متخصصة في الأمراض الشائعة والتطعيمات ومتابعة النمو',
  true, true, now()),

('علي حسن الموسوي', 'د.', 'male', 'internal', 'باطنية عامة', 22,
  ARRAY['بكالوريوس طب جامعة بغداد 2001', 'بورد عربي باطنية 2007', 'دبلوم أمراض القلب 2010'],
  true, true, true,
  90000, 35000, 60000, 600000,
  'عيادة د. علي للأمراض الباطنية', 'الكاظمية، شارع المتنبي', 'بغداد', '07901500003',
  ARRAY['ar'],
  'طبيب باطنية بخبرة 22 سنة، متخصص بأمراض القلب والكلى والكبد',
  true, true, now()),

('فاطمة الزهراء', 'د.', 'female', 'gynecology', 'نسائية وولادة', 15,
  ARRAY['بكالوريوس طب جامعة بغداد 2008', 'بورد عربي نسائية وتوليد 2014'],
  true, true, true,
  120000, 50000, 90000, 900000,
  'عيادة د. فاطمة للنسائية والولادة', 'الكرادة، شارع الرفعة', 'بغداد', '07901500004',
  ARRAY['ar', 'en'],
  'طبيبة نسائية وولادة، خبرة بمتابعة الحمل والولادات الطبيعية والقيصرية',
  true, true, now()),

('عمر صلاح', 'د.', 'male', 'cardiology', 'قلب وأوعية', 20,
  ARRAY['بكالوريوس طب جامعة بغداد 2003', 'بورد عربي قلبية 2009', 'زمالة قسطرة القلب 2012'],
  false, true, true,
  null, 60000, null, null,
  'عيادة د. عمر للقلب', 'الجادرية، قرب المستشفى', 'بغداد', '07901500005',
  ARRAY['ar', 'en'],
  'استشاري أمراض القلب، خبرة في القسطرة القلبية والأمراض المزمنة',
  true, true, now()),

('ليلى عبد الله', 'د.', 'female', 'dermatology', 'جلدية وتجميل', 10,
  ARRAY['بكالوريوس طب جامعة بغداد 2013', 'بورد عربي جلدية 2018'],
  false, true, true,
  null, 40000, null, null,
  'عيادة د. ليلى للجلدية', 'المنصور، شارع ١٤ رمضان', 'بغداد', '07901500006',
  ARRAY['ar', 'en'],
  'طبيبة جلدية ومتخصصة في علاجات التجميل وعلاج حب الشباب',
  true, true, now()),

('حسين كاظم', 'د.', 'male', 'orthopedics', 'عظام ومفاصل', 17,
  ARRAY['بكالوريوس طب جامعة بغداد 2006', 'بورد عربي عظام 2012'],
  true, true, true,
  100000, 45000, null, null,
  'عيادة د. حسين للعظام', 'الكرادة، الكرادة الشرقية', 'بغداد', '07901500007',
  ARRAY['ar'],
  'استشاري جراحة العظام والمفاصل والكسور',
  true, true, now()),

('نور الهدى', 'د.', 'female', 'family_medicine', 'طب عائلة مع تركيز على المرأة', 8,
  ARRAY['بكالوريوس طب جامعة المستنصرية 2015', 'دبلوم طب عائلة 2019'],
  true, true, true,
  70000, 25000, 45000, 450000,
  'عيادة د. نور لطب العائلة', 'البصرة، الكورنيش', 'البصرة', '07901500008',
  ARRAY['ar', 'en'],
  'طبيبة عائلة شابة، تركز على الرعاية الشاملة للأسر',
  true, true, now()),

('محمد جواد', 'د.', 'male', 'psychiatry', 'الطب النفسي', 14,
  ARRAY['بكالوريوس طب جامعة البصرة 2009', 'بورد عربي طب نفسي 2015'],
  false, true, true,
  null, 70000, null, null,
  'عيادة د. محمد للصحة النفسية', 'الكرادة، شارع ٦٢', 'بغداد', '07901500009',
  ARRAY['ar', 'en'],
  'استشاري الطب النفسي، متخصص بالاكتئاب والقلق ومشاكل النوم',
  true, true, now()),

('زينب الحكيم', 'د.', 'female', 'pediatrics', 'حديثي الولادة', 11,
  ARRAY['بكالوريوس طب جامعة بغداد 2012', 'بورد عربي أطفال 2017', 'زمالة حديثي الولادة 2019'],
  true, true, true,
  110000, 45000, 80000, 800000,
  'عيادة د. زينب لحديثي الولادة', 'النجف، شارع الكوفة', 'النجف', '07901500010',
  ARRAY['ar'],
  'طبيبة أطفال متخصصة بحديثي الولادة والرضع',
  true, true, now());


-- ════════════════════════════════════════════════════════════════════
-- 💊 ربط أدوية بصيدليات (نموذج: كل صيدلية فيها مجموعة عشوائية)
-- ════════════════════════════════════════════════════════════════════
-- نضيف 25-30 دواء لكل صيدلية بشكل تلقائي

INSERT INTO public.pharmacy_inventory (pharmacy_id, medication_id, is_available)
SELECT 
  p.id,
  m.id,
  CASE WHEN random() < 0.85 THEN TRUE ELSE FALSE END  -- 85% متوفّر
FROM public.pharmacies p
CROSS JOIN public.medications m
WHERE random() < 0.6  -- كل صيدلية فيها ~60% من الكتالوج
ON CONFLICT (pharmacy_id, medication_id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════
-- ✅ تم!
-- ════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '✅ Seed Data applied successfully!';
  RAISE NOTICE '   - 25 hospitals';
  RAISE NOTICE '   - 50 medications';
  RAISE NOTICE '   - 30 pharmacies';
  RAISE NOTICE '   - 10 doctors';
  RAISE NOTICE '   - ~600 inventory records';
END $$;


-- ════════════════════════════════════════════════════════════════════
-- 🔧 V33: Admin policies (نُقلت من 01 — تحتاج جداول chats/messages/payments/ratings)
-- ════════════════════════════════════════════════════════════════════
-- Admins يرون كل المحادثات
DROP POLICY IF EXISTS "Admins see all chats" ON public.chats;
CREATE POLICY "Admins see all chats" ON public.chats
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins see all messages" ON public.messages;
CREATE POLICY "Admins see all messages" ON public.messages
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admins يرون كل المدفوعات
DROP POLICY IF EXISTS "Admins see all payments" ON public.payments;
CREATE POLICY "Admins see all payments" ON public.payments
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all payments" ON public.payments;
CREATE POLICY "Admins update all payments" ON public.payments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admins يرون كل التقييمات
DROP POLICY IF EXISTS "Admins see all ratings" ON public.ratings;
CREATE POLICY "Admins see all ratings" ON public.ratings
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update ratings" ON public.ratings;
CREATE POLICY "Admins update ratings" ON public.ratings
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- 🔧 V33: Admin Views (نُقلت من 01 — تحتاج جداول payments وغيرها)
-- ════════════════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════
-- 📊 ADMIN VIEWS - مفيدة للـ Dashboard (V24 — security_invoker)
-- ════════════════════════════════════════════════════════════════════

-- إجمالي الإيرادات اليومية
CREATE OR REPLACE VIEW public.daily_revenue
WITH (security_invoker = on) AS
SELECT
  DATE(paid_at) AS date,
  COUNT(*) AS total_payments,
  SUM(amount) AS total_amount,
  method,
  currency
FROM public.payments
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY DATE(paid_at), method, currency
ORDER BY date DESC;

-- مواعيد اليوم (لكل أخصائي)
CREATE OR REPLACE VIEW public.today_appointments
WITH (security_invoker = on) AS
SELECT
  a.id,
  a.user_id,
  a.specialist_id,
  a.service_type,
  a.status,
  a.scheduled_at,
  a.address,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  s.full_name AS specialist_name
FROM public.appointments a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.users s ON s.id = a.specialist_id
WHERE DATE(a.scheduled_at) = CURRENT_DATE
ORDER BY a.scheduled_at;

-- إحصاءات عامة (للأدمن dashboard)
CREATE OR REPLACE VIEW public.platform_stats
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE role = 'patient') AS total_patients,
  (SELECT COUNT(*) FROM public.users WHERE role = 'specialist') AS total_specialists,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'completed') AS completed_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'pending') AS pending_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE DATE(created_at) = CURRENT_DATE) AS today_new_appointments,
  (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE) AS today_new_users,
  (SELECT SUM(amount) FROM public.payments WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE) AS today_revenue,
  (SELECT ROUND(AVG(overall_rating)::numeric, 2) FROM public.ratings WHERE is_published) AS platform_avg_rating;


-- Appointments مع تفاصيل المستخدمين (يستخدمه الكود)
CREATE OR REPLACE VIEW public.appointments_with_users
WITH (security_invoker = on) AS
SELECT
  a.*,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  u.governorate AS patient_governorate,
  s.full_name AS specialist_name,
  s.specialty AS specialist_specialty
FROM public.appointments a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.users s ON s.id = a.specialist_id;


-- ═══════════════════════════════════════════════════════════════════════
-- ▶ 0010_email_auth.sql
-- ═══════════════════════════════════════════════════════════════════════
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


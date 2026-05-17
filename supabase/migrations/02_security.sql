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

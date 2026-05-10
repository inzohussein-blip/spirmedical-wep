-- ════════════════════════════════════════════════════════════════════
-- 📁 ملف 3 من 3 — Rate Limit Buckets
-- ════════════════════════════════════════════════════════════════════
-- Migration: rate_limit_buckets
-- Created: 2026-05-10
-- Purpose: Rate limiting persistent عبر serverless instances
--          (بديل لـ Upstash Redis)
--
-- يحتوي على:
--   1. جدول rate_limit_buckets
--   2. Indexes للأداء
--   3. RLS (service_role فقط)
--   4. دالة increment_rate_limit() للتشغيل atomic
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- TABLE
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL,
  UNIQUE(bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket
  ON public.rate_limit_buckets(bucket_key, reset_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_reset
  ON public.rate_limit_buckets(reset_at);

-- ─────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────────────────

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.rate_limit_buckets;
CREATE POLICY "service_role_only"
  ON public.rate_limit_buckets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- FUNCTION: increment_rate_limit
-- ─────────────────────────────────────────────────────────
-- دالة atomic لزيادة العدّاد + إرجاع الحالة في عملية واحدة
-- الاستخدام:
--   SELECT * FROM increment_rate_limit('user:123:login', 5, 60);
-- يعيد: (allowed, remaining, retry_after_seconds)

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_bucket_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := DATE_TRUNC('second', v_now);
  v_reset_at TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
  v_count INTEGER;
BEGIN
  -- نظّف القديم تلقائياً
  DELETE FROM public.rate_limit_buckets
  WHERE reset_at < v_now;

  -- upsert (إدراج أو تحديث)
  INSERT INTO public.rate_limit_buckets(bucket_key, count, window_start, reset_at)
  VALUES (p_bucket_key, 1, v_window_start, v_reset_at)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET count = rate_limit_buckets.count + 1
  RETURNING count INTO v_count;

  -- أعِد النتيجة
  RETURN QUERY SELECT
    (v_count <= p_max),
    GREATEST(0, p_max - v_count),
    CASE WHEN v_count > p_max THEN p_window_seconds ELSE 0 END;
END;
$$;

-- توثيق
COMMENT ON TABLE public.rate_limit_buckets IS
  'Rate limit counters. Use increment_rate_limit() function instead of direct access.';

COMMENT ON FUNCTION public.increment_rate_limit IS
  'Atomic rate limit increment. Returns (allowed, remaining, retry_after_seconds).';

-- ════════════════════════════════════════════════════════════════════
-- ✅ انتهى الملف 3 — اكتمل setup قاعدة البيانات بالكامل
-- ════════════════════════════════════════════════════════════════════
-- تحقق من الإعداد الكامل:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   ORDER BY table_name;
--
-- يجب أن ترى:
--   ✓ appointments
--   ✓ audit_logs
--   ✓ idempotency_keys
--   ✓ rate_limit_buckets
--   ✓ users
--
-- اختبار دالة rate limit:
--   SELECT * FROM increment_rate_limit('test:1', 5, 60);
--   (يجب أن ترى: t | 4 | 0)
-- ════════════════════════════════════════════════════════════════════

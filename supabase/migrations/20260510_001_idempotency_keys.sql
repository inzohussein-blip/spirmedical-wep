-- ════════════════════════════════════════════════════════════════════
-- 📁 ملف 2 من 3 — Idempotency Keys
-- ════════════════════════════════════════════════════════════════════
-- Migration: idempotency_keys
-- Created: 2026-05-10
-- Purpose: حماية من double-submit للعمليات الحساسة
--          (مثل ضغط زر "حجز" مرتين بسرعة)
--
-- يُستخدمه: src/lib/idempotency.ts
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index للتنظيف الدوري
CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON public.idempotency_keys(expires_at);

-- RLS — فقط service role يصل
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- احذف policy القديم إن وُجد ثم أنشئه
DROP POLICY IF EXISTS "service_role_full_access" ON public.idempotency_keys;
CREATE POLICY "service_role_full_access"
  ON public.idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- توثيق
COMMENT ON TABLE public.idempotency_keys IS
  'Idempotency keys for double-submit protection. Expires after 24 hours.';

-- ════════════════════════════════════════════════════════════════════
-- ✅ انتهى الملف 2
-- ════════════════════════════════════════════════════════════════════
-- تحقق من إنشاء الجدول:
--   SELECT * FROM public.idempotency_keys LIMIT 1;
-- ثم نفّذ الملف 3 (rate_limit_buckets)
-- ════════════════════════════════════════════════════════════════════

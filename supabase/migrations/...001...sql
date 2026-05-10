-- ════════════════════════════════════════════════════════════════════
-- Migration: idempotency_keys
-- Created: 2026-05-10
-- Purpose: حماية من double-submit للعمليات الحساسة (الحجوزات، الدفع)
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

CREATE POLICY "service_role_full_access"
  ON public.idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- التنظيف التلقائي (ينفّذه pg_cron إذا متوفر)
COMMENT ON TABLE public.idempotency_keys IS
  'Idempotency keys for double-submit protection. Expires after 24 hours.';

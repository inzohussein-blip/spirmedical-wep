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

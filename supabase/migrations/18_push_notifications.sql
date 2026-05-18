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

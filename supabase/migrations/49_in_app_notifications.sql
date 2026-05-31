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

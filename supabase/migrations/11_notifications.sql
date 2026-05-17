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

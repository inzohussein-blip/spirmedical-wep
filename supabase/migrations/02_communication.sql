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

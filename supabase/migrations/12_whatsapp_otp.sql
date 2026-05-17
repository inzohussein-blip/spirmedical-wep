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

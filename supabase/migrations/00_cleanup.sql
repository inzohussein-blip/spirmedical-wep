-- ════════════════════════════════════════════════════════════════════
-- 🧹 Migration 00: CLEANUP (V24 — مع جداول V22-V23)
-- ════════════════════════════════════════════════════════════════════
-- يتسامح مع غياب الجداول/الـ Triggers (لن يفشل أبداً)
-- آمن للتشغيل أكثر من مرة (idempotent)
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إسقاط الـ Views (CASCADE يحذف dependencies)
-- ════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.appointments_with_users CASCADE;
DROP VIEW IF EXISTS public.today_appointments CASCADE;
DROP VIEW IF EXISTS public.platform_stats CASCADE;
DROP VIEW IF EXISTS public.daily_revenue CASCADE;
DROP VIEW IF EXISTS public.specialist_stats CASCADE;


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إسقاط الجداول مباشرة (CASCADE يحذف triggers + foreign keys)
-- ════════════════════════════════════════════════════════════════════

-- 🆕 V24: جداول Notifications
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.notification_templates CASCADE;

-- 🆕 V22-V23: جداول Admin System
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.patient_notes CASCADE;
DROP TABLE IF EXISTS public.patient_tags CASCADE;
DROP TABLE IF EXISTS public.admin_actions CASCADE;

-- 🆕 V21: Specialist System
DROP TABLE IF EXISTS public.specialist_schedules CASCADE;

-- 🆕 V20: Personal Health
DROP TABLE IF EXISTS public.health_vitals CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;

-- جداول الـ Inbox
DROP TABLE IF EXISTS public.chat_notes CASCADE;
DROP TABLE IF EXISTS public.quick_replies CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;

-- جداول Payments & Ratings
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;

-- جداول Security
DROP TABLE IF EXISTS public.idempotency_keys CASCADE;
DROP TABLE IF EXISTS public.rate_limit_buckets CASCADE;
DROP TABLE IF EXISTS public.otp_attempts CASCADE;
DROP TABLE IF EXISTS public.user_telegram_links CASCADE;

-- جداول core (أخيراً)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إسقاط Triggers على auth.users (لا تُحذف بـ CASCADE)
-- ════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إسقاط الـ Functions
-- ════════════════════════════════════════════════════════════════════

-- Core triggers
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_chat_on_new_message() CASCADE;

-- Cleanup
DROP FUNCTION IF EXISTS public.cleanup_expired_idempotency() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_rate_limits() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;

-- Admin helpers
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;

-- Specialist
DROP FUNCTION IF EXISTS public.determine_specialist_type(text) CASCADE;
DROP FUNCTION IF EXISTS public.auto_set_required_specialist() CASCADE;
DROP FUNCTION IF EXISTS public.sync_specialist_fields() CASCADE;
DROP FUNCTION IF EXISTS public.sync_specialist_fields_insert() CASCADE;


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إسقاط Custom Types
-- ════════════════════════════════════════════════════════════════════

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إزالة من Realtime publication (آمن - يتجاهل الأخطاء)
-- ════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.chats;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.notification_queue;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إزالة pg_cron jobs الموجودة (إن وُجدت)
-- ════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN PERFORM cron.unschedule('spir-cleanup-idempotency');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN PERFORM cron.unschedule('spir-cleanup-rate-limits');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN PERFORM cron.unschedule('spir-cleanup-otps');
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- ✅ التحقق - عرض الجداول المتبقية (يجب أن يكون 0)
-- ════════════════════════════════════════════════════════════════════

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Cleanup successful! Database is clean.'
    ELSE '⚠️ Some tables still exist: ' || string_agg(table_name, ', ')
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'users', 'appointments', 'audit_logs',
    'chats', 'messages', 'quick_replies', 'chat_notes',
    'payments', 'ratings',
    'idempotency_keys', 'rate_limit_buckets', 'otp_attempts', 'user_telegram_links',
    'reminders', 'prescriptions', 'health_vitals',
    'specialist_schedules',
    'admin_actions', 'patient_tags', 'patient_notes', 'campaigns', 'coupons',
    'notification_templates', 'notification_queue', 'notification_logs'
  );

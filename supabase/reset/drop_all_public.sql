-- ═══════════════════════════════════════════════════════════════════
-- ⚠️⚠️  خطر: هذا السكربت يُسقط كل جداول/views/دوال schema public  ⚠️⚠️
-- ═══════════════════════════════════════════════════════════════════
-- ليس migration — موجود خارج مجلد migrations عمداً كي لا يُطبَّق تلقائياً.
-- استخدمه فقط لإعادة بناء بيئة تطوير/staging من الصفر، ثم طبّق migrations.
-- 🚫 لا تشغّله على الإنتاج إطلاقاً — يمسح كل البيانات.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- 🏥 Spir Medical — كل الـ migrations في ملف واحد (V33)
-- شغّل هذا الملف مرّة واحدة في Supabase SQL Editor
-- ✅ يُنظّف الجداول القديمة ديناميكياً (يتجاهل PostGIS) ثم يبني 88 جدولاً
-- ═══════════════════════════════════════════════════════════════════



-- ╔══════════════════════════════════════════════════════════════╗
-- ║  01_core_foundation.sql
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- 📦 01_core_foundation.sql — البنية + الأمان + الأدوار + Realtime + العائلة + الثيم
-- مدموج (V33) من: 00_cleanup.sql 01_foundation.sql 02_security.sql 23_family_members.sql 13_app_theme.sql 05_realtime_admin.sql 06_crm_roles.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 00_cleanup.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🧹 Migration 00: CLEANUP (V24 — مع جداول V22-V23)
-- ════════════════════════════════════════════════════════════════════
-- يتسامح مع غياب الجداول/الـ Triggers (لن يفشل أبداً)
-- آمن للتشغيل أكثر من مرة (idempotent)
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ إسقاط شامل وديناميكي لكل جداول وviews الـ public
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V33: بدل قائمة ثابتة، نحذف كل جدول/view موجود في schema public.
-- هذا يضمن نظافة 100% مهما كانت الجداول القديمة المتبقّية (يحلّ مشكلة 120 جدول).
-- CASCADE يحذف triggers + foreign keys + dependent objects تلقائياً.
-- ENUMs محميّة (تُحذف لاحقاً بشكل منفصل).

DO $$
DECLARE
  r RECORD;
BEGIN
  -- احذف كل الـ views (ما عدا التابعة لإضافات مثل PostGIS)
  FOR r IN (
    SELECT v.viewname FROM pg_views v
    WHERE v.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_class c ON c.oid = d.objid
        WHERE c.relname = v.viewname
          AND c.relnamespace = 'public'::regnamespace
          AND d.deptype = 'e'
      )
  ) LOOP
    BEGIN
      EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    EXCEPTION WHEN OTHERS THEN NULL;  -- تجاهل كائنات الإضافات النظامية
    END;
  END LOOP;

  -- احذف كل الـ materialized views
  FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
    BEGIN
      EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(r.matviewname) || ' CASCADE';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  -- احذف كل الجداول (ما عدا التابعة لإضافات مثل PostGIS spatial_ref_sys)
  FOR r IN (
    SELECT t.tablename FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_class c ON c.oid = d.objid
        WHERE c.relname = t.tablename
          AND c.relnamespace = 'public'::regnamespace
          AND d.deptype = 'e'
      )
  ) LOOP
    BEGIN
      EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    EXCEPTION WHEN OTHERS THEN NULL;  -- تجاهل كائنات الإضافات النظامية
    END;
  END LOOP;
END $$;




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



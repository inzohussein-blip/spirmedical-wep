-- ════════════════════════════════════════════════════════════════════
-- 🔒 إغلاق ستّ عروضٍ باقية تتجاوز RLS
-- ════════════════════════════════════════════════════════════════════
--
-- الترحيل 0012 عالج سبعة عروض، وبقيت **ستّة** لم تدخل قائمته. وهي
-- `SECURITY DEFINER` — أي تعمل بصلاحيات مالكها فتتجاوز RLS تجاوزاً
-- كاملاً — و**ممنوحة لـ`anon`**، والمفتاح المجهول يُشحن في حزمة
-- المتصفّح. أي أنّ من يفتح الموقع يملك ما يكفي لقراءتها كلّها عبر
-- `/rest/v1/<view>`.
--
-- ── الإثبات (نُفِّذ على القاعدة الحيّة قبل هذا الترحيل) ──
-- أُدرج موعدٌ واحد لطفلٍ من `family_members`، ثمّ:
--
--     SET LOCAL ROLE anon;
--     SELECT target_name, target_chronic_conditions,
--            target_allergies, address, target_age
--     FROM public.appointments_with_target;
--
-- فأعاد: «طفل المريض» · {سكري نوع ١} · {بنسلين} ·
--        «بغداد - المنصور - محلة 601» · 11
--
-- اسم مريضٍ قاصر وتشخيصه وحساسيّته وعنوان بيته — لدور `anon`.
--
-- ── ما تكشفه البقيّة ──
--   • `expiring_credentials`         : اسم كلّ ممرّض و**رقم هاتفه**.
--   • `pharmacy_inventory_stats`     : عدّادات بحثٍ داخلية لكل صيدلية.
--   • `analytics_summary`            : أحداث المنصّة ومستخدموها الفريدون.
--   • `doctors_with_stats`           : عدد المشتركين والاستشارات المفتوحة
--     لكل طبيب — مشتقّة من `doctor_subscriptions` و`consultations`
--     الخاصّين، فيتسرّب مجموعٌ عن جداول محميّة.
--   • `medications_with_availability`: توافر الأدوية لكل صيدلية.
--
-- ── لماذا السحب الكامل لا مجرّد `security_invoker` ──
-- لا سطر واحد في التطبيق يقرأ أيّاً من الستّة (فُحصت الشجرة كلّها: لا
-- `.from()` ولا استعلام مبني نصّياً). فهي سطح هجومٍ صافٍ بلا مقابل.
-- نسحب المنح **و**نضبط `security_invoker` معاً: السحب يُغلق الباب،
-- و`security_invoker` يضمن أنّ إعادة منحٍ مستقبليةً لن تُعيد التجاوز.
--
-- من يحتاج إحداها لاحقاً (لوحة إدارة مثلاً) يقرؤها بـ`service_role`
-- أو يُمنح صراحةً — بعد أن صارت تحترم RLS.
-- ════════════════════════════════════════════════════════════════════

-- ── تراجعٌ سبّبه الترحيل 0016 ──
-- 0012 سحب `anon` من `vitals_trends` و`admin_lab_orders_summary`، ثمّ جاء
-- 0016 بـ`GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon` فأعاد
-- منحهما — والمِنحة الشاملة تشمل المنظورات. بقيا `security_invoker` فلم
-- تُخترق سياسات الصفوف، لكنّ السحب عاد إلى الصفر. لذا يشملهما هذا الترحيل.
--
-- ── انحراف الملفّات عن القاعدة ──
-- خمسة منظورات (`appointments_with_users`, `daily_revenue`,
-- `platform_stats`, `specialist_stats`, `today_appointments`) كانت
-- `security_invoker` على القاعدة الحيّة بينما **لا سطر في ملفّات الترحيل
-- يجعلها كذلك**. فإعادة بناء القاعدة من الملفّات كانت ستُعيدها
-- `SECURITY DEFINER` مسرِّبة. تُدرَج هنا كي يتطابق الملفّ مع الواقع.
--
-- لا شيء من الثلاثة عشر يُقرأ من كود التطبيق (فُحصت الشجرة كلّها).

DO $$
DECLARE
  v text;
  views text[] := ARRAY[
    -- الستّة التي فاتت 0012
    'appointments_with_target',
    'expiring_credentials',
    'analytics_summary',
    'doctors_with_stats',
    'medications_with_availability',
    'pharmacy_inventory_stats',
    -- خمسةٌ طُبِّقت حيّاً ولم تُسجَّل في ملفّ
    'appointments_with_users',
    'daily_revenue',
    'platform_stats',
    'specialist_stats',
    'today_appointments',
    -- اثنان أعاد 0016 منحَهما لـ`anon`
    'vitals_trends',
    'admin_lab_orders_summary'
  ];
BEGIN
  FOREACH v IN ARRAY views LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v AND c.relkind = 'v'
    ) THEN
      -- ١. تحترم سياسات الصفوف الخاصّة بالمستدعي لا بالمالك
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', v);

      -- ٢. لا وصول للأدوار العامّة (لا كود يقرؤها أصلاً)
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v);
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', v);

      RAISE NOTICE 'secured view: %', v;
    END IF;
  END LOOP;
END $$;

-- ملاحظة: `geometry_columns` و`geography_columns` عرضان تابعان لامتداد
-- PostGIS ولا مِنَح عليهما لـ`anon`/`authenticated` أصلاً، فلا يُمسّان.

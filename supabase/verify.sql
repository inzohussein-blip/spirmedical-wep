-- ════════════════════════════════════════════════════════════════════════
-- ✅ سكربت تحقّق ما بعد التنصيب — شغّله في Supabase SQL Editor بعد setup
-- يعرض صفوف "check | ok | detail". المفروض تكون كل النتائج ✅.
-- ════════════════════════════════════════════════════════════════════════

-- 1) عدد جداول public (المتوقّع ~90)
SELECT
  'tables_count' AS check,
  CASE WHEN count(*) >= 85 THEN '✅' ELSE '❌' END AS ok,
  count(*)::text || ' جدول' AS detail
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL
-- 2) الجداول الحرجة لرفع الطلبات موجودة
SELECT 'core_tables',
  CASE WHEN count(*) = 5 THEN '✅' ELSE '❌ ناقص' END,
  string_agg(t, ', ')
FROM (SELECT unnest(ARRAY['users','appointments','lab_orders','partner_labs','ratings']) AS t) x
WHERE to_regclass('public.' || t) IS NOT NULL

UNION ALL
-- 3) buckets التخزين (المتوقّع 5)
SELECT 'storage_buckets',
  CASE WHEN count(*) >= 5 THEN '✅' ELSE '❌' END,
  string_agg(id, ', ')
FROM storage.buckets

UNION ALL
-- 4) RLS مفعّل على الجداول الحسّاسة
SELECT 'rls_enabled',
  CASE WHEN bool_and(c.relrowsecurity) THEN '✅' ELSE '❌' END,
  string_agg(c.relname || '=' || c.relrowsecurity::text, ', ')
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('users','appointments','lab_orders')

UNION ALL
-- 5) دالة إصلاح تكرار RLS موجودة (تعني أنّ 0005 طُبّق مع الإصلاح)
SELECT 'rls_fix_function',
  CASE WHEN count(*) = 1 THEN '✅' ELSE '❌ مفقود — أعد تطبيق 0005' END,
  'current_user_is_approved_specialist_type'
FROM pg_proc WHERE proname = 'current_user_is_approved_specialist_type'

UNION ALL
-- 6) سياسات appointments لا تحوي استعلام users داخلي (سبب التكرار)
SELECT 'appointments_no_recursion',
  CASE WHEN count(*) = 0 THEN '✅' ELSE '❌ لا يزال فيها التكرار' END,
  count(*)::text || ' سياسة فيها EXISTS(SELECT FROM users)'
FROM pg_policies
WHERE tablename='appointments' AND coalesce(qual,with_check) ILIKE '%from users%'

UNION ALL
-- 7) محفّز إنشاء ملف المستخدم عند التسجيل موجود
SELECT 'signup_trigger',
  CASE WHEN count(*) >= 1 THEN '✅' ELSE '❌' END,
  'on_auth_user_created'
FROM pg_trigger WHERE tgname = 'on_auth_user_created'

ORDER BY 1;

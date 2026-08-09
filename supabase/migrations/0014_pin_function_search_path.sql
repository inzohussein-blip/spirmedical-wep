-- ════════════════════════════════════════════════════════════════════
-- 0014 — تثبيت `search_path` لدوالّ المشروع
-- ════════════════════════════════════════════════════════════════════
--
-- 🚨 الثغرة (٥٦ دالّة، منها ١٦ بـ`SECURITY DEFINER`):
-- دالّة بلا `search_path` مثبَّت تُحلّ أسماء الجداول والدوالّ داخلها وفق
-- `search_path` **الخاص بالمُستدعي**. فمن يستطيع إنشاء كائنات في مخطّطٍ
-- يسبق `public` يستطيع أن يجعل الدالّة تقرأ جدوله هو بدل جدولنا.
--
-- في دالّة `SECURITY DEFINER` — وهي تُنفَّذ بصلاحيات مالكها `postgres` —
-- يصير هذا تصعيد صلاحيات مكتملاً: `is_admin` أو `handle_new_user` أو
-- `verify_start_otp` تعمل على بيانات يتحكّم بها المهاجم بصلاحيات المالك.
--
-- ✅ الإصلاح: `SET search_path = public, pg_temp` على كل دالّة من دوالّ
-- المشروع.
--   • تثبيت المسار يُلغي أثر `search_path` الذي يضبطه المستدعي — وهو
--     ناقل الهجوم نفسه.
--   • `pg_temp` **أخيراً** عمداً: لو تقدّم لأمكن حجب جداولنا بجداول
--     مؤقّتة يُنشئها المهاجم.
--   • `public` يبقى في المسار، فلا تحتاج أجسام الدوالّ إلى إعادة كتابة
--     بأسماء مؤهَّلة بالكامل — وهو ما كان سيمسّ ٥٦ دالّة بلا داعٍ.
--
-- ⚠️ دوالّ الامتدادات (PostGIS و pg_trgm) مستثناة عبر `pg_depend`:
-- ملكيّتها للامتداد، وتعديلها يكسر ترقياته. الاستثناء بالتبعيّة لا
-- بمطابقة الأسماء — فبعض دوالّ المشروع موجودة في القاعدة الحيّة وليست
-- في ملفّات الترحيل (انحراف قائم).
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  fn RECORD;
  altered INT := 0;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      -- ليس لها search_path مثبَّت بعد
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c
        WHERE c LIKE 'search_path=%'
      )
      -- ليست مملوكة لامتداد
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid
          AND d.classid = 'pg_proc'::regclass
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.signature);
    altered := altered + 1;
  END LOOP;

  RAISE NOTICE 'search_path pinned on % function(s)', altered;
END $$;

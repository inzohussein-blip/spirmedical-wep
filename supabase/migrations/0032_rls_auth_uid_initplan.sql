-- ════════════════════════════════════════════════════════════════════════
-- 0032: ٢١٤ سياسةً كانت تُنادي auth.uid() لكلّ صفّ — والصواب مرّةً للاستعلام
-- ════════════════════════════════════════════════════════════════════════
--
-- مدقّق Supabase يرصدها باسم `auth_rls_initplan` على ٩٢ جدولاً، أثقلُها
-- `appointments` (١٠) و`users` (٨) و`lab_results` (٦).
--
-- السبب أنّ `auth.uid()` دالّةٌ مُستقرّة (STABLE) لا ثابتة، فيعجز المُخطِّط
-- عن رفعها خارج المسح ما دامت مكتوبةً هكذا:
--
--     USING (auth.uid() = user_id)
--
-- فتُنفَّذ لكلّ صفٍّ يمرّ عليه الفحص. ولفّها في استعلامٍ فرعيّ يجعلها
-- InitPlan — تُحسب مرّةً واحدةً قبل المسح ويُعاد استعمال قيمتها:
--
--     USING ((SELECT auth.uid()) = user_id)
--
-- والتحويل لا يمسّ المعنى: الدالّة تُرجع القيمة نفسها طوال العبارة، فالفرق
-- في عدد مرّات الحساب لا في نتيجته. وهو ما توصي به Supabase نفسها.
--
-- ─── لماذا يُولَّد من الفهرس لا يُكتب يدوياً ───
--
-- ٢١٤ سياسةً على ٩٢ جدولاً؛ إعادةُ كتابتها يدوياً تعني ٢١٤ فرصةً لخطأٍ
-- مطبعيٍّ في تعبيرٍ **أمنيّ**. فالكتلة أدناه تقرأ التعبير القائم من
-- `pg_get_expr` وتُعيد كتابته بلفٍّ نصّيٍّ واحد، فيستحيل أن تنحرف عن
-- الأصل في شيءٍ سوى اللفّ.
--
-- ─── ما أُثبت قبل التطبيق ───
--
-- جُرّب في معاملةٍ مُلغاة، ثمّ أُعيدت فيها الفحوص السلوكيّة نفسها التي
-- أُجريت في هذه الجلسة على `lab_results` و`service_switches` و`users`.
-- النتائج الثماني متطابقةٌ حرفياً قبل اللفّ وبعده:
--
--     غريب يقرأ نتائج مختبر ......... ٠ / ٠
--     غريب يحذفها .................. ٠ / ٠
--     محلّل مُسنَد يقرأ .............. ١ / ١
--     محلّل مُسنَد يُدخل .............. ١ / ١
--     محلّل مُسنَد يحدّث الطلب ........ ١ / ١
--     مريض يعدّل مفتاح خدمة ......... ٠ / ٠
--     مريض يقرأ ملفّه ............... ١ / ١
--     زائر يقرأ مفاتيح الخدمات ...... ٢٠ / ٢٠
--
-- ولم يتغيّر مجموع السياسات: ٢٥٣ قبلُ وبعد.

DO $do$
DECLARE
  r  record;
  nq text;
  nc text;
  n  integer := 0;
BEGIN
  FOR r IN
    SELECT p.polname,
           c.relname                                AS tbl,
           pg_get_expr(p.polqual,      p.polrelid)  AS q,
           pg_get_expr(p.polwithcheck, p.polrelid)  AS c
      FROM pg_policy p
      JOIN pg_class     c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       -- نداءٌ غيرُ ملفوفٍ في مكانٍ ما من السياسة
       AND (coalesce(pg_get_expr(p.polqual,      p.polrelid), '') ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)'
         OR coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)')
  LOOP
    -- النظرة الخلفية `(?<!SELECT )` تمنع اللفّ المزدوج عند إعادة التشغيل:
    -- Postgres يعرض الملفوف `( SELECT auth.uid() AS uid)`، ولولا هذا
    -- الشرط لتحوّل في المرّة الثانية إلى `(SELECT (SELECT auth.uid()))`.
    nq := regexp_replace(r.q, '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(SELECT auth.\1())', 'g');
    nc := regexp_replace(r.c, '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(SELECT auth.\1())', 'g');

    IF r.q IS NOT NULL AND r.c IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s) WITH CHECK (%s)',
                     r.polname, r.tbl, nq, nc);
    ELSIF r.q IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.polname, r.tbl, nq);
    ELSE
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (%s)', r.polname, r.tbl, nc);
    END IF;

    n := n + 1;
  END LOOP;

  RAISE NOTICE 'سياساتٌ لُفّت: %', n;
END $do$;

-- حارسٌ في الترحيل نفسه: إن بقيت سياسةٌ غير ملفوفة فقد أخفق التحويل،
-- ولا نريد ترحيلاً «ينجح» وهو لم يفعل شيئاً.
DO $check$
DECLARE
  leftover integer;
BEGIN
  SELECT count(*) INTO leftover
    FROM pg_policy p
    JOIN pg_class     c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND (coalesce(pg_get_expr(p.polqual,      p.polrelid), '') ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)'
       OR coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)');

  IF leftover > 0 THEN
    RAISE EXCEPTION 'بقيت % سياسةً بنداءٍ غير ملفوف', leftover;
  END IF;
END $check$;

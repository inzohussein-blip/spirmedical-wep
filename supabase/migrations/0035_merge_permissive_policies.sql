-- ════════════════════════════════════════════════════════════════════════
-- 0035: دمج السياسات المتساهلة المتكرّرة على الأمر نفسه
-- ════════════════════════════════════════════════════════════════════════
--
-- Postgres يصل السياسات المتساهلة بـ`OR`. فسياستان `SELECT` على الجدول
-- نفسه للدور نفسه تُقيَّمان **كلتاهما** لكلّ صفّ، ونتيجتُهما مساويةٌ
-- تماماً لسياسةٍ واحدة تعبيرُها `(الأولى) OR (الثانية)`.
--
-- فالدمج هنا إعادةُ صياغةٍ لا تغييرَ صلاحية — بحكم تعريف «المتساهلة» لا
-- بحكم ظنّي. ٢٨ مجموعة، ٦٧ سياسةً تصير ٢٨: المجموع ٢٥٣ ⇐ ٢١٤.
--
-- ─── ما لم يُدمَج، ولماذا ───
--
-- مدقّق Supabase يعدّ ٣٩٨ ملاحظة، وهذه تعالج منها ما كان **الأمرُ فيه
-- واحداً**. الباقي تداخلُ سياسةٍ `FOR ALL` مع سياساتٍ لأوامرَ مفردة على
-- الجدول نفسه — ودمجُ `ALL` في `SELECT` ليس إعادةَ صياغة: `ALL` تحكم
-- أربعة أوامر، وطيُّها في واحدٍ يغيّر الثلاثة الأخرى. فتلك تحتاج قراراً
-- في التصميم لا تحويلاً آلياً، وتُركت.
--
-- ─── دقّةٌ في الدمج ───
--
-- سياسةُ `UPDATE` بلا `WITH CHECK` تستعمل `USING` في الفحص أيضاً. فلو
-- جُمعت `USING`ات وحدها وأُهملت هذه القاعدة لضاق الفحصُ على من كان يمرّ.
-- ولذلك: `merged_check = OR(with_check أو USING عند غيابه)`.
--
-- ─── ما أُثبت ───
--
-- قِيست عشرُ حالاتٍ سلوكيّة **قبل** الدمج، ثمّ أُعيدت بعده في معاملةٍ
-- مُلغاة. النتائج متطابقةٌ في العشر:
--
--     غريب يقرأ نتائج ٠ · يحذف ٠ · يرى مواعيد ٢
--     مُسنَد يقرأ نتائج ١ · يرى مواعيد ٣ · يحدّث الطلب ١
--     مريض يرى موعده ١ · يقرأ ملفّه ١ · يعدّل مفتاحاً ٠
--     زائر يقرأ المفاتيح ٢٠
--
-- (رقما «يرى مواعيد ٢ و٣» ليسا خطأً طارئاً: المختصّ المعتمَد يرى المواعيد
--  غير المُسنَدة من نوع اختصاصه — طابورٌ مفتوحٌ مقصودٌ في التصميم القائم.)

DO $do$
DECLARE
  g       record;
  p       record;
  usings  text[];
  checks  text[];
  mu      text;
  mc      text;
  newname text;
  rolelist text;
  n       integer := 0;
BEGIN
  FOR g IN
    SELECT tablename, cmd, roles
      FROM pg_policies
     WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
     GROUP BY tablename, cmd, roles
    HAVING count(*) > 1
     ORDER BY tablename, cmd
  LOOP
    usings := '{}';
    checks := '{}';

    FOR p IN
      SELECT policyname, qual, with_check
        FROM pg_policies
       WHERE schemaname = 'public' AND tablename = g.tablename
         AND cmd = g.cmd AND roles = g.roles AND permissive = 'PERMISSIVE'
       ORDER BY policyname
    LOOP
      IF p.qual IS NOT NULL THEN
        usings := usings || ('(' || p.qual || ')');
      END IF;
      IF g.cmd IN ('INSERT', 'UPDATE', 'ALL') THEN
        checks := checks || ('(' || coalesce(p.with_check, p.qual) || ')');
      END IF;
    END LOOP;

    mu := CASE WHEN array_length(usings, 1) > 0 THEN array_to_string(usings, ' OR ') END;
    mc := CASE WHEN array_length(checks, 1) > 0 THEN array_to_string(checks, ' OR ') END;

    newname  := left(g.tablename || '_' || lower(g.cmd) || '_unified', 63);
    rolelist := array_to_string(g.roles, ', ');

    -- تُحذف الأصول قبل الإنشاء كي لا يصطدم الاسم الجديد بأحدها
    FOR p IN
      SELECT policyname FROM pg_policies
       WHERE schemaname = 'public' AND tablename = g.tablename
         AND cmd = g.cmd AND roles = g.roles AND permissive = 'PERMISSIVE'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, g.tablename);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR %s TO %s %s %s',
      newname, g.tablename, g.cmd, rolelist,
      CASE WHEN mu IS NOT NULL THEN 'USING (' || mu || ')' ELSE '' END,
      CASE WHEN mc IS NOT NULL THEN 'WITH CHECK (' || mc || ')' ELSE '' END
    );

    n := n + 1;
  END LOOP;

  RAISE NOTICE 'groups merged: %', n;
END $do$;

-- حارسٌ في الترحيل: لا يجوز أن «ينجح» وهو لم يدمج شيئاً
DO $check$
DECLARE leftover integer;
BEGIN
  SELECT count(*) INTO leftover FROM (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
     GROUP BY tablename, cmd, roles HAVING count(*) > 1) x;

  IF leftover > 0 THEN
    RAISE EXCEPTION 'بقيت % مجموعةً متعدّدةَ السياسات على الأمر نفسه', leftover;
  END IF;
END $check$;

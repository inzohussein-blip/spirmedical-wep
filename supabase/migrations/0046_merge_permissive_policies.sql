-- ═══════════════════════════════════════════════════════════════════
-- 0046 — سياسةٌ واحدة لكلّ (جدول، أمر) بدل سياساتٍ متراكبة
-- ═══════════════════════════════════════════════════════════════════
--
-- بموافقة المالك الصريحة.
--
-- المدقّق: 323 تنبيه «multiple_permissive_policies» على 45 جدولاً. النمط
-- الغالب: سياسةُ مشرفٍ «FOR ALL» فوق سياساتٍ لكلّ أمر، فتُقيَّم كلُّها لكلّ
-- صفّ في كلّ استعلام.
--
-- التحويل مكافئٌ حرفيّاً: Postgres يجمع السياسات المتساهلة بـOR — عباراتُ
-- USING فيما بينها، وعباراتُ WITH CHECK فيما بينها (والسياسةُ بلا WITH CHECK
-- تُحتسب بـUSING). فالسياسةُ المدمجة لكلّ أمر:
--   USING      = OR لعبارات USING لكلّ سياسةٍ تنطبق على الأمر (ALL أو هو)
--   WITH CHECK = OR لـ coalesce(WITH CHECK, USING) للسياسات نفسها
-- تُولَّد عند التشغيل من الكتالوج بـ pg_get_expr (لا نسخاً باليد)، فيُراجَع
-- المنطقُ لا ١٧٦ سياسة. وتفشل الكتلةُ كلُّها إن وُجدت سياسةٌ مقيِّدة أو
-- سياسةٌ بلا USING لأمرٍ يحتاجه، بدل أن تُخمّن.
--
-- لا يُمسّ: جداولُ بلا تراكب؛ و lab_results (سياساتُها لأدوارٍ محدّدة،
-- ودمجُ أدوارٍ مختلفة ليس OR خالصاً)؛ والسياساتُ لأدوارٍ غير PUBLIC.
--
-- قِيس في BEGIN … ROLLBACK قبل التطبيق: لكلّ جدولٍ من الـ44 ولكلّ هويّة
-- (زائر، مريض، مشرف، مستخدمٌ بلا بيانات) عددُ الصفوف التي تُقرأ وتُحدَّث
-- وتُحذف — قبل وبعد. انظر ترويسة النتيجة في سجلّ الالتزام.
--
-- ⚠️ تغييرٌ مقصودٌ واحد في آخر الملف: bug_reports.
-- ═══════════════════════════════════════════════════════════════════

DO $merge$
DECLARE
  drops   text[];
  creates text[];
  bad     int;
  stmt    text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy pol JOIN pg_class c ON c.oid = pol.polrelid
             JOIN pg_namespace ns ON ns.oid = c.relnamespace
             WHERE ns.nspname = 'public' AND NOT pol.polpermissive) THEN
    RAISE EXCEPTION '0046: سياسةٌ مقيِّدة موجودة — الدمجُ بـOR لا يكافئها';
  END IF;

  WITH p AS (
    SELECT c.relname t, pol.polname n, pol.polcmd cmd,
           pg_get_expr(pol.polqual, pol.polrelid) q,
           pg_get_expr(pol.polwithcheck, pol.polrelid) wc
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public' AND pol.polpermissive AND pol.polroles = '{0}'  -- PUBLIC وحده
  ),
  cmds(c, name, o) AS (VALUES ('r','SELECT',1), ('a','INSERT',2), ('w','UPDATE',3), ('d','DELETE',4)),
  tabs AS (
    SELECT DISTINCT p.t FROM p JOIN cmds ON p.cmd = cmds.c OR p.cmd = '*'
    WHERE p.t <> 'lab_results'
    GROUP BY p.t, cmds.c HAVING count(*) > 1
  ),
  grp AS (
    SELECT tabs.t, cmds.name, cmds.o, cmds.c,
           count(*) n_app, bool_or(p.cmd = '*') has_all,
           array_agg(p.n ORDER BY p.n) names,
           bool_or(cmds.c IN ('r','w','d') AND p.q IS NULL) bad_using,
           string_agg('(' || p.q || ')', ' OR ' ORDER BY p.n)
             FILTER (WHERE cmds.c IN ('r','w','d')) using_expr,
           string_agg('(' || coalesce(p.wc, p.q) || ')', ' OR ' ORDER BY p.n)
             FILTER (WHERE cmds.c IN ('a','w')) check_expr
    FROM tabs JOIN cmds ON true
    JOIN p ON p.t = tabs.t AND (p.cmd = cmds.c OR p.cmd = '*')
    GROUP BY tabs.t, cmds.name, cmds.o, cmds.c
  ),
  todo AS (SELECT * FROM grp WHERE n_app > 1 OR has_all)
  SELECT
    (SELECT count(*) FROM todo WHERE bad_using),
    (SELECT array_agg(DISTINCT format('DROP POLICY %I ON public.%I', x, t))
       FROM todo, unnest(names) x),
    (SELECT array_agg(
       format('CREATE POLICY %I ON public.%I FOR %s', t || '_' || lower(name) || '_merged', t, name)
       || CASE WHEN using_expr IS NOT NULL THEN ' USING (' || using_expr || ')' ELSE '' END
       || CASE WHEN check_expr IS NOT NULL THEN ' WITH CHECK (' || check_expr || ')' ELSE '' END
       ORDER BY t, o)
     FROM todo)
  INTO bad, drops, creates;

  IF bad > 0 THEN
    RAISE EXCEPTION '0046: % سياسة بلا USING لأمرٍ يحتاجه — لا تخمين', bad;
  END IF;

  FOREACH stmt IN ARRAY coalesce(drops, '{}')   LOOP EXECUTE stmt; END LOOP;
  FOREACH stmt IN ARRAY coalesce(creates, '{}') LOOP EXECUTE stmt; END LOOP;
  RAISE NOTICE '0046: أُسقطت % ودُمجت في %', cardinality(drops), cardinality(creates);
END
$merge$;

-- ─── تغييرٌ مقصود: لا إدراجَ في bug_reports ───
-- كان «WITH CHECK (true)» لدور PUBLIC (يشمل anon): أيُّ زائرٍ يُدرج ما شاء.
-- زرُّ الإبلاغ أُزيل من التطبيق (وفعلُه الخادميّ)، فلا مسارَ مشروعَ للإدراج.
-- المشرف يقرأ ويُحدّث ويحذف كما كان؛ service_role يتخطّى RLS إن احتيج.
DROP POLICY IF EXISTS bug_reports_insert_merged ON public.bug_reports;

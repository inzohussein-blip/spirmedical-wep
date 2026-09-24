-- ════════════════════════════════════════════════════════════════════════
-- 0043: سويبُ `search_path` لم يكن يبلغ مخطَّط `private`
-- ════════════════════════════════════════════════════════════════════════
--
-- الترحيل 0014 ثبّت `search_path` على دوالّ المشروع كلّها — لكنّه يمسح
-- `WHERE n.nspname = 'public'` وحدها. ومخطَّط `private` أُنشئ **بعده**
-- في 0024، فكلّ دالّةٍ وُضعت فيه منذئذٍ خارج المسح.
--
-- وقد أدرك المدقّقُ ذلك على دالّتَي المُشغِّل اللتين كتبتُهما في 0038
-- و0039 (`chats_participants_immutable` و`consultations_participants_immutable`).
-- وهما `SECURITY INVOKER` وتستدعيان `private.is_admin` مؤهَّلةً بمخطّطها،
-- فالخطرُ فيهما نظريّ — لكنّ القاعدةَ لا تُستثنى بحسب كلّ حالة، وإلّا لم
-- تبقَ قاعدة.
--
-- ─── الإصلاح ───
--
-- ① المصدرُ أوّلاً: الدالّتان صار كلٌّ منهما تُعلن `SET search_path` في
--    تعريفها (0038 و0039)، فالنشرُ النظيف سليمٌ بلا هذا الترحيل.
-- ② والسويبُ هنا لقاعدةٍ قائمةٍ لم يُعَد نشرُها، ويشمل المخطّطين معاً كي
--    لا يتكرّر الإغفال مع مخطَّطٍ ثالث.
--
-- و`pg_temp` أخيراً عمداً، للسبب المشروح في 0014: لو تقدّم لأمكن حجبُ
-- جداولنا بجداول مؤقّتةٍ يُنشئها المهاجم.

DO $$
DECLARE
  fn      RECORD;
  altered int := 0;
  left_over int;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname IN ('public', 'private')
       AND NOT EXISTS (
         SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c
          WHERE c LIKE 'search_path=%'
       )
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

  -- نجاحُ العبارات ليس دليلاً: يُقاس الباقي
  SELECT count(*) INTO left_over
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname IN ('public', 'private')
     AND NOT EXISTS (
       SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
     );

  IF left_over > 0 THEN
    RAISE EXCEPTION 'بقيت % دالّةً بلا search_path مثبَّت', left_over;
  END IF;

  RAISE NOTICE 'search_path pinned on % function(s)', altered;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 0024: إخراج دوالّ SECURITY DEFINER من المخطّط المكشوف
-- ════════════════════════════════════════════════════════════════════════
--
-- الترحيل 0023 أغلق **الاستغلال**: `generate_referral_code` صارت ترفض
-- معرّفاً ليس معرّف صاحب الجلسة، و`is_admin` لا تُجيب عن غير السائل.
-- لكنّ الدوالّ الأربع بقيت **مكشوفة** على `/rest/v1/rpc/`: الحارس في
-- الجسم، والباب مفتوح.
--
-- وهذا الترحيل يُغلق الباب نفسه. أربع دوالّ `SECURITY DEFINER` يبلغها
-- `anon` أو `authenticated`، ولكلٍّ علاجُه:


-- ─────────────────────────────────────────────────────────────────────
-- ١. ثلاث دوالّ تفويضٍ تنتقل إلى مخطّطٍ غير مكشوف
-- ─────────────────────────────────────────────────────────────────────
--
-- `is_admin` و`is_super_admin` و`current_user_is_approved_specialist_type`
-- تُستدعى من **٤٤ سياسة RLS** ولا يستدعيها الكود إطلاقاً — فوجودها في
-- `public` كشفٌ بلا مستفيد.
--
-- ولا يجوز سحب EXECUTE منها (قِيس في 0023: تصفّح الزائر يسقط بـ42501،
-- لأنّ تعبير السياسة يُنفَّذ بصلاحية الدور القارئ). والنقل يحلّ ما لا
-- يحلّه السحب: PostgREST لا يُظهر إلّا المخطّطات المكشوفة، والسياسات تبقى
-- عاملةً لأنّها تخزّن **مُعرّف الدالّة (OID)** لا اسمها النصّي.
--
-- قِيس قبل التطبيق في معاملةٍ مُتراجَعٍ عنها:
--   • السياسات الأربعون ما زالت تشير للدالّة بعد النقل — بلا إعادة كتابة
--   • قراءة الزائر والمستخدم: OK
--   • `SELECT public.is_admin(...)` → 42883 undefined function
--
-- ويبقى `GRANT USAGE` على المخطّط و`EXECUTE` على الدوالّ لازمَين: تقييم
-- السياسة يفحص الصلاحيتين معاً.

CREATE SCHEMA IF NOT EXISTS private;
COMMENT ON SCHEMA private IS
  'دوالٌّ داخلية لا تُكشف على REST. تُستدعى من سياسات RLS فقط.';

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.is_admin(uuid)       SET SCHEMA private;
ALTER FUNCTION public.is_super_admin(uuid) SET SCHEMA private;
ALTER FUNCTION public.current_user_is_approved_specialist_type(text) SET SCHEMA private;


-- ─────────────────────────────────────────────────────────────────────
-- ٢. `generate_referral_code` لم تكن تحتاج DEFINER أصلاً
-- ─────────────────────────────────────────────────────────────────────
--
-- سياسات `referral_codes` تكفي وحدها:
--
--   referral_lookup_by_code   SELECT  USING (true)
--   referral_own_insert       INSERT  WITH CHECK (user_id = auth.uid())
--
-- فحصُ التفرّد يقرأ كلّ الرموز (السياسة الأولى)، والإدراج محصورٌ بصاحب
-- الجلسة (الثانية). أي أنّ التفويض الذي كتبتُه يدوياً في 0023 موجودٌ
-- أصلاً في RLS — والـDEFINER كان يُعطّله لا يستعمله.
--
-- والتحويل إلى `SECURITY INVOKER` يُخرجها من إنذار المدقّق دون أن تُسحب
-- منها EXECUTE (فالتطبيق يستدعيها بمفتاح المستخدم).
--
-- وأُسقطت `ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code`:
-- هي بعينها ما جعل الثغرة **مُتلِفة** لا مُزعجة فقط — تبديلُ رمزٍ موزَّع.
-- بديلُها إعادةُ الرمز القائم: النتيجة صارت مُتماثلة (idempotent)، ولا
-- تحتاج سياسة UPDATE (ولا توجد واحدة).
--
-- الشرط الصريح يبقى رغم أنّ RLS تكفي: رسالةٌ واضحة خيرٌ من رفضٍ صامت،
-- ودفاعٌ ثانٍ إن تراخت سياسةٌ يوماً.

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'لا يجوز توليد رمز إحالةٍ لمستخدمٍ آخر'
      USING ERRCODE = '42501';
  END IF;

  -- متماثلة: من له رمزٌ يستعيده هو نفسه لا رمزاً جديداً
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_code := UPPER(SUBSTRING(MD5(p_user_id::TEXT || NOW()::TEXT || random()::TEXT) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_code);

    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, v_code)
  RETURNING code INTO v_code;

  RETURN v_code;
END;
$function$;


-- ─────────────────────────────────────────────────────────────────────
-- ٣. `spatial_ref_sys` — لا شيء هنا، وهذا هو الخبر
-- ─────────────────────────────────────────────────────────────────────
--
-- جدولٌ مرجعيّ من PostGIS (تعريفات الإسقاطات الجغرافية)، مكشوفٌ بلا RLS.
-- لا سطر في هذا القسم عمداً: كلا العلاجين متعذّر، والقياس أثبت ذلك.
--
--   • **تفعيل RLS**: مالكه `supabase_admin` ونحن `postgres`، فالمحاولة
--     تُردّ بـ`42501 must be owner of table spatial_ref_sys`.
--
--   • **سحب القراءة**: كتبتُه أوّلاً ظنّاً أنّه المخرج، ونجحت العبارة بلا
--     خطأ — ثمّ أظهر اختبار السلوك أنّ `anon` ما زال يقرأ الجدول. والسبب
--     في الـACL:
--
--         {supabase_admin=arwdDxtm/supabase_admin, =r/supabase_admin}
--                                                  ↑ PUBLIC له SELECT
--
--     المنحة صادرةٌ عن `supabase_admin`، وPostgres **يتجاهل بصمت** سحب
--     منحةٍ لم تُصدِرها أنت. فالعبارة تنجح ولا تفعل شيئاً.
--
-- الدرس نفسه تكرّر مرّتين في يومين (الأولى في 0023 مع دوالّ المُشغِّلات):
-- **نجاحُ REVOKE ليس دليلاً على تغيّر الصلاحية.** الدليل الوحيد
-- `has_table_privilege` بعده — أو محاولةُ قراءةٍ بالدور نفسه.
--
-- وبقاء الجدول مكشوفاً غير ضارّ هنا: محتواه تعريفاتُ إسقاطاتٍ عامّة
-- منشورة، لا بيانات مشروع. والمشروع لا يستعمل PostGIS أصلاً — صفر أعمدة
-- geometry/geography، صفر فهارس مكانية، ولا استدعاء في كودنا. فالمخرج
-- الوحيد الحقيقيّ إسقاطُ الامتداد، وهو قرارُ مالكٍ لا قرارُ ترحيل.


-- ─────────────────────────────────────────────────────────────────────
-- ٤. `pg_trgm` ينتقل خارج `public`
-- ─────────────────────────────────────────────────────────────────────
--
-- امتدادٌ في `public` يزاحم أسماء المخطّط ويُكشف على REST. النقل ممكنٌ
-- ومُقاس (نجح في معاملةٍ مُتراجَعٍ عنها)، والامتداد غير مستعمل أصلاً:
-- صفر فهارس trgm وصفر إشارةٍ في الكود.
--
-- و`postgis` **لا يقبل النقل**: `0A000 extension "postgis" does not
-- support SET SCHEMA` — قيدٌ من الامتداد نفسه لا من صلاحياتنا. يبقى
-- إنذاره قائماً، ولا حيلة فيه سوى إسقاط الامتداد (قرارُ مالك).

ALTER EXTENSION pg_trgm SET SCHEMA extensions;

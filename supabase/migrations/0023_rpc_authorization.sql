-- ════════════════════════════════════════════════════════════════════════
-- 0023: تفويضٌ على دوالّ RPC المكشوفة
-- ════════════════════════════════════════════════════════════════════════
--
-- ثلاث مسائل كشفها مدقّق Supabase، ولكلٍّ منها علاجٌ مختلف — والعلاج الذي
-- يقترحه المدقّق نفسه (REVOKE) صحيحٌ في واحدةٍ منها فقط، وكارثيٌّ في أخرى.


-- ─────────────────────────────────────────────────────────────────────
-- ١. `generate_referral_code(uuid)` — كتابةٌ على صفّ مستخدمٍ آخر
-- ─────────────────────────────────────────────────────────────────────
--
-- الدالّة `SECURITY DEFINER` فتتخطّى RLS، وتقبل أيّ `uuid` دون أن تقارنه
-- بـ`auth.uid()`، وتنتهي بـ:
--
--     INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code)
--     ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code
--
-- و`EXECUTE` ممنوحٌ لـ`authenticated`. فأيّ مستخدمٍ مسجَّل يستدعيها عبر
-- `/rest/v1/rpc/generate_referral_code` بمعرّف شخصٍ آخر **فيُبدّل رمز
-- إحالته**. ليس تسريب بيانات بل كتابةٌ عبر حدّ RLS: من وزّع رمزه على
-- أصدقائه يفقده بلا إشعار، وتضيع إحالاتُه.
--
-- المستدعي الوحيد في `src/` يمرّر `user.id` أي معرّف نفسه
-- (`account/rewards/actions.ts`)، فالشرط لا يكسر شيئاً قائماً. ونسخةُ
-- المُشغِّل (بلا وسائط) التي تولّد الرمز عند التسجيل لا تُمسّ.

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  -- التفويض أوّلاً: لا يولّد أحدٌ رمزاً لغيره
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'لا يجوز توليد رمز إحالةٍ لمستخدمٍ آخر'
      USING ERRCODE = '42501';
  END IF;

  LOOP
    -- توليد كود 6 أحرف (uppercase + numbers)
    v_code := UPPER(SUBSTRING(MD5(p_user_id::TEXT || NOW()::TEXT) FROM 1 FOR 6));

    -- التحقق من عدم وجوده
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_code);

    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code
  RETURNING code INTO v_code;

  RETURN v_code;
END;
$function$;


-- ─────────────────────────────────────────────────────────────────────
-- ٢. `is_admin` / `is_super_admin` — استكشافٌ بلا تسجيل دخول
-- ─────────────────────────────────────────────────────────────────────
--
-- كلتاهما `SECURITY DEFINER` تقبلان `uuid` وتُنفَّذان من `anon`، فمن يعرف
-- معرّف مستخدمٍ يسأل بلا حساب: هل هذا مشرف؟
--
-- **ولا يجوز سحب EXECUTE هنا.** السياسات التي تستدعيهما مُعرَّفة لـPUBLIC
-- أي أنّ `anon` يُقيّمها في كلّ قراءة، وتعبيرُ السياسة يُنفَّذ بصلاحية
-- الدور القارئ لا صلاحية مالك الجدول. قِستُ ذلك في معاملةٍ مُتراجَعٍ عنها:
--
--     قبل السحب → OK
--     بعد السحب → 42501 permission denied for function is_admin
--
-- أي أنّ تطبيق ما يقترحه المدقّق حرفياً كان يُسقط تصفّح الزائر بالكامل.
--
-- العلاج في جسم الدالّة: تُجيب عن صاحب الجلسة دائماً (وهو ما تفعله كلّ
-- السياسات: `is_admin(auth.uid())`)، ولا تُجيب عن غيره إلّا إن كان السائل
-- مشرفاً بنفسه. غير ذلك `false` — فشلٌ مُغلَق: يمنع ولا يمنح.

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF user_id IS DISTINCT FROM auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager', 'support')
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('super_admin', 'admin', 'manager', 'support')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF user_id IS DISTINCT FROM auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager', 'support')
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role = 'super_admin'
  );
END;
$function$;


-- ─────────────────────────────────────────────────────────────────────
-- ٣. دوالّ المُشغِّلات مكشوفةٌ على REST بلا داعٍ
-- ─────────────────────────────────────────────────────────────────────
--
-- ٣٨ دالّةً نوعُ إرجاعها `trigger` تحمل EXECUTE لـ`anon` و`authenticated`،
-- فتظهر كلّها في `/rest/v1/rpc/`. تسعٌ منها صارت `SECURITY DEFINER` في
-- الترحيل 0019 (إصلاح عدّ التقييمات) فازداد ظهورها في المدقّق.
--
-- استدعاؤها المباشر يفشل أصلاً (Postgres يرفض نداء دالّة مُشغِّل خارج
-- مُشغِّل)، لكنّ الكشف بلا فائدة هو سطحُ هجومٍ بلا مقابل.
--
-- والسؤال الذي يمنع السحب عادةً: هل يحتاج المُشغِّل EXECUTE عند الإطلاق؟
-- قِستُه في معاملةٍ مُتراجَعٍ عنها — جدولٌ ومُشغِّلٌ مؤقّتان، سُحب EXECUTE
-- ثمّ أُدرج صفٌّ بدور `authenticated`:
--
--     trigger_ran_value = 42   caller_can_execute = false
--
-- أي أنّ الصلاحية تُفحص عند **إنشاء** المُشغِّل لا عند إطلاقه. ثمّ أُعيد
-- القياس على البنية الحقيقية: إدراجٌ في `doctor_ratings` بعد سحبٍ كامل،
-- فارتفع `doctors.rating_count` من ٠ إلى ١ — أي أنّ إصلاح الترحيل 0019
-- يبقى عاملاً.
--
-- **و`PUBLIC` جزءٌ لازمٌ من السحب.** الصيغة الأولى كانت
-- `FROM anon, authenticated` وحدَها، وقياسُها أظهر
-- `has_function_privilege` ما زالت `true`: الصلاحية موروثةٌ من المنحة
-- الافتراضية لـPUBLIC لا ممنوحةً للدورين صراحةً، فالسحب منهما بلا أثر.
--
-- الاستثناء: ما تملكه الامتدادات (PostGIS) — لا نملك تغييره ولا يعنينا.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'trigger'::regtype
      -- ما لا يملكه امتداد
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
  END LOOP;
END $$;

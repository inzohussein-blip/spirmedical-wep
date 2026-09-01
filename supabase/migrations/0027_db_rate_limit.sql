-- ════════════════════════════════════════════════════════════════════════
-- 0027: تحديد المعدّل في القاعدة — الجدول مبنيٌّ ولا أحد يستطيع الكتابة فيه
-- ════════════════════════════════════════════════════════════════════════
--
-- `checkRateLimit` يحرس محيط المصادقة كلَّه: إرسال رمز OTP والتحقّق منه،
-- والدخول، والتسجيل، وطوارئ التمريض، وطلب حذف البيانات.
--
-- وله طبقتان فقط: Upstash Redis إن ضُبط، وإلّا **ذاكرة العملية**. و
-- `UPSTASH_REDIS_REST_URL=` فارغٌ في `.env.example`، أي أنّ الوضع
-- الافتراضي هو الذاكرة — وعلى منصّةٍ عديمة الحالة (serverless) لكلّ نسخةٍ
-- عدّادُها، فالحدّ الفعليّ = الحدّ × عدد النسخ الحيّة. التعليق في
-- `rate-limit.ts` يعترف بذلك: «في serverless multi-instance، هذا غير دقيق».
--
-- وفي القاعدة جدولٌ مبنيٌّ لهذا الغرض بالضبط — `rate_limit_buckets`
-- (bucket_key مفتاحاً أساسياً · count · reset_at) — **لا يستعمله الكود
-- إطلاقاً**. والسبب أنّه غير قابلٍ للاستعمال أصلاً:
--
--     ACL:    {postgres=arwdDxtm, anon=r, authenticated=arwd}
--     السياسة: (auth.jwt() ->> 'role') = 'service_role'
--
-- أي أنّ السياسة تشترط `service_role` بينما **`service_role` بلا مِنحةٍ
-- واحدة**، و`authenticated` يملك arwd (تحجبه RLS، لكنّها مِنحةٌ في غير
-- محلّها على جدولٍ وُصف بأنّه «للدور الخدميّ فقط»).
--
-- فهذا الترحيل يجعله صالحاً للاستعمال:
--
--   ١. دالّةٌ ذرّية `consume_rate_limit` تزيد العدّاد وتُعيد القرار في
--      عبارةٍ واحدة (`INSERT … ON CONFLICT DO UPDATE … RETURNING`)، فلا
--      سباق بين قراءةٍ وكتابة.
--   ٢. `SECURITY DEFINER` لأنّها تكتب في جدولٍ محميّ — لكن **مسحوبةُ
--      EXECUTE من PUBLIC وanon وauthenticated**، فلا تظهر لأحدٍ عبر
--      `/rest/v1/rpc/` إلّا للدور الخدميّ. (وهو ما يبقيها خارج الثابت ١٥
--      في `health-check.sql`.)
--   ٣. تصحيح المِنح على الجدول نفسه: للدور الخدميّ ما يحتاجه، ويُسحب من
--      `anon` و`authenticated` ما لا يحتاجانه.
--
-- ودلالاتها مطابقة لنسخة الذاكرة في `checkRateLimitMemory`: تُحتسب
-- المحاولة الحالية، و`remaining` ما تبقّى بعدها، و`retryAfterSeconds`
-- صفرٌ ما دام مسموحاً.

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
)
RETURNS TABLE (allowed boolean, remaining integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_count integer;
  v_reset timestamptz;
BEGIN
  IF p_key IS NULL OR p_max IS NULL OR p_max < 1
     OR p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit arguments' USING ERRCODE = '22023';
  END IF;

  -- عبارةٌ واحدة: الزيادة والتصفير عند انتهاء النافذة معاً، تحت قفل الصفّ
  INSERT INTO public.rate_limit_buckets AS b (bucket_key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket_key) DO UPDATE
    SET count = CASE WHEN b.reset_at <= now() THEN 1 ELSE b.count + 1 END,
        reset_at = CASE WHEN b.reset_at <= now()
                        THEN now() + make_interval(secs => p_window_seconds)
                        ELSE b.reset_at END
  RETURNING b.count, b.reset_at INTO v_count, v_reset;

  allowed := v_count <= p_max;
  remaining := GREATEST(0, p_max - v_count);
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_reset - now())))::integer)
  END;
  RETURN NEXT;
END;
$function$;

-- الدالّة تكتب نيابةً عن مالكها، فلا يحتاج المستدعي مِنحةً على الجدول.
-- ويبقى الوصول محصوراً بالدور الخدميّ.
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer)
  TO service_role;

-- تصحيح مِنح الجدول: للدور الخدميّ ما يحتاجه، ولا شيء لمن لا يحتاج.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_buckets TO service_role;
REVOKE ALL ON public.rate_limit_buckets FROM anon, authenticated;

-- تنظيف الدلاء المنتهية: يمنع نموّ الجدول بلا حدّ.
--
-- تصحيحٌ لاحق (الترحيل 0034): كان هنا فهرسٌ باسم
-- `idx_rate_limit_buckets_reset` على `(reset_at)` — وهو تكرارٌ حرفيّ
-- لـ`idx_rate_limit_reset` المُنشَأ في 0001 على العمود نفسه. و`IF NOT
-- EXISTS` لا يحمي من ذلك: هو يفحص **الاسم** لا التعريف، فمرّ الاثنان
-- معاً. فهرسان متطابقان يعنيان ضعفَ كلفة الكتابة بلا أيّ مكسبٍ في القراءة.
-- الفهرس الأقدم يكفي، فحُذف هذا.

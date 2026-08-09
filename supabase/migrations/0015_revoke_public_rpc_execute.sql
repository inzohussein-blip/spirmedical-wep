-- ════════════════════════════════════════════════════════════════════
-- 0015 — سحب EXECUTE العامّ عن دوالّ SECURITY DEFINER
-- ════════════════════════════════════════════════════════════════════
--
-- 🚨 الثغرة (حرجة — كتابة لا قراءة):
-- Postgres يمنح `EXECUTE` إلى `PUBLIC` افتراضياً على كل دالّة. و PostgREST
-- يكشف كل دالّة في `public` عبر `/rest/v1/rpc/<name>`. فكل دالّة
-- `SECURITY DEFINER` — تُنفَّذ بصلاحيات `postgres` وتتجاوز RLS — صارت
-- قابلة للاستدعاء من **أي زائر** بالمفتاح العامّ الذي يصل كل متصفّح.
--
-- أخطر مثالين، وكلاهما بلا أي فحص لهوية المستدعي:
--
--   add_wallet_transaction(p_user_id, p_type, p_amount, p_points, …)
--     تُنفّذ مباشرةً:
--       UPDATE public.users
--       SET wallet_balance = wallet_balance + p_amount,
--           loyalty_points = loyalty_points + p_points
--       WHERE id = p_user_id;
--     ⇒ أيّ شخص يشحن رصيد أيّ حساب بأيّ مبلغ، بلا تسجيل دخول.
--
--   create_prescription_from_order(p_order_id, p_diagnosis, p_medications, …)
--     تُدرج في `prescriptions` بلا مصادقة ⇒ **تزوير وصفة طبّية**.
--
-- ويُضاف إليهما: `verify_start_otp` / `verify_end_otp` (تخمين رموز
-- التحقّق)، و`increment_rate_limit` (استنزاف حدود غيرك)، و`is_admin` /
-- `is_super_admin` (استكشاف من هو الإداري)، ودوالّ `cleanup_*`.
--
-- ✅ الإصلاح: سحب `EXECUTE` من `PUBLIC` و`anon` و`authenticated` عن كل
-- دالّة `SECURITY DEFINER` من دوالّ المشروع. هذه الدوالّ إمّا تُستدعى من
-- مشغّلات داخل القاعدة (فلا تحتاج منحاً للعميل)، أو من الخادم بمفتاح
-- `service_role` (وهو يتجاوز المنح).
--
-- الاستثناء الوحيد: `generate_referral_code(uuid)` — يستدعيها إجراء
-- خادميّ بجلسة المستخدم، فتُعاد لـ`authenticated` فقط دون `anon`.
--
-- تحقّقٌ سبق التطبيق: مسح الشجرة أظهر أنّ التطبيق يستدعي دالّتين فقط عبر
-- `.rpc(` — `generate_referral_code` و`increment_search_count` — فلا مسار
-- قائم ينكسر بهذا السحب.
--
-- ⚠️ دوالّ الامتدادات (PostGIS مثل `st_estimatedextent`) مستثناة عبر
-- `pg_depend`: سحب صلاحياتها يكسر الامتداد نفسه.
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  fn RECORD;
  revoked INT := 0;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef                     -- SECURITY DEFINER فقط
      AND NOT EXISTS (                    -- ليست مملوكة لامتداد
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid
          AND d.classid = 'pg_proc'::regclass
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.signature);
    revoked := revoked + 1;
  END LOOP;

  RAISE NOTICE 'EXECUTE revoked on % SECURITY DEFINER function(s)', revoked;
END $$;

-- الاستثناء: يستدعيها إجراء خادميّ بجلسة المستخدم (لا anon)
GRANT EXECUTE ON FUNCTION public.generate_referral_code(uuid) TO authenticated;

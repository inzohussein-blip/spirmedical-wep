-- ════════════════════════════════════════════════════════════════════════
-- 0041: مفتاحُ الخدمة لا يقرأ ولا يكتب شيئاً — والخادمُ كلُّه معطَّلٌ عليه
-- ════════════════════════════════════════════════════════════════════════
--
-- الترحيل 0016 فتح «البوّابة الأولى» (المنح) لـ`anon` و`authenticated`،
-- وترك `service_role` عمداً، وفي ترويسته السببُ صريحاً:
--
--     «مسارات التسجيل و OTP وإنشاء الحساب تستعمل service_role
--       (createAdminClient) فلا يمسّها تقييد anon»
--     «البيانات المبذورة أُدخلت بمفتاح service_role الذي يتجاوز البوّابتين»
--
-- والافتراضُ خاطئ. `service_role` يحمل `rolbypassrls = t` فيتخطّى **RLS
-- وحدها**. أمّا `GRANT` فلا يتخطّاه أحدٌ غير المالك والمستخدم الخارق، وهو
-- ليس عضواً في أيّ دورٍ آخر (قِسْتُه: `pg_auth_members` → لا شيء).
--
-- ─── المُقاس بدور `service_role` نفسه ───
--
--     ①_تحديثُ users .............. مرفوض 42501
--     ②_**قراءةُ** users .......... مرفوضة 42501
--     ③_دالّةُ حدّ المعدّل ......... تعمل (SECURITY DEFINER تُنفَّذ بمالكها)
--
-- ومنحُ الإدراج كان قائماً في جدولٍ واحدٍ من ٩٢.
--
-- أي أنّ كلَّ ما يمرّ بـ`createAdminClient()` ميّتٌ اليوم: نداءُ OAuth في
-- `/auth/callback`، ومساراتُ التسجيل، وإنشاءُ المستخدمين من لوحة المشرف،
-- والبذر، وإرسالُ رمز تحقّق البريد والتحقّقُ منه. ولا يظهر الخللُ في
-- الاختبارات لأنّ الدوالّ المُفوَّضة (كحدّ المعدّل) تعمل بمالكها فتنجح.
--
-- ─── الإصلاح ───
--
-- تُمنح الجداولُ والتسلسلات لـ`service_role`، وهو ما تفعله Supabase نفسها
-- افتراضاً. ولا يوسّع هذا سطحَ الهجوم: الدورُ يتخطّى RLS أصلاً، فالمنحُ لا
-- يفتح له صفّاً جديداً — بل يجعل تخطّيه ذا معنى. ولا يُبلَغ إلّا بمفتاحٍ
-- سرّيٍّ لا يصل المتصفّح (`SUPABASE_SERVICE_ROLE_KEY` بلا `NEXT_PUBLIC_`).

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- الجداول التي تُنشأ لاحقاً — كي لا يعود الخلل مع كلّ ترحيل
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- نجاحُ `GRANT` ليس دليلاً أكثر من نجاح `REVOKE`. يُقاس.
DO $$
DECLARE missing int;
BEGIN
  SELECT count(*) INTO missing
    FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     AND NOT has_table_privilege('service_role', format('public.%I', table_name), 'SELECT');
  IF missing > 0 THEN
    RAISE EXCEPTION 'ما يزال % جدولاً بلا قراءةٍ لـservice_role', missing;
  END IF;
END $$;

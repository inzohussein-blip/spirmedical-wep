-- ════════════════════════════════════════════════════════════════════
-- 🩺 فحص سلامة قاعدة البيانات
-- ════════════════════════════════════════════════════════════════════
--
-- لماذا هذا الملفّ موجود:
-- الحارسات في `tests/` تفحص **الكود وملفّات الترحيل**. وقد تبيّن مراراً
-- أنّ ذلك لا يكفي: القاعدة الحيّة تنحرف عن الملفّات، والانحراف صامت.
--
-- ثلاثة أعطال حقيقية لم يكشفها أيّ اختبار كود، وكلّها يكشفها هذا الملفّ:
--
--   • بوّابة `GRANT` كانت مغلقة على الجداول الـ91 كلّها، فسياساتُ RLS
--     الـ246 لم تُقيَّم قطّ وكل استعلام يُردّ بـ42501.
--   • ستّة منظورات `SECURITY DEFINER` ممنوحة لـ`anon` تكشف مواعيد
--     المرضى وأمراضهم المزمنة وعناوينهم.
--   • خمسة حسابات حقيقية في `auth.users` بلا صفٍّ في `public.users`،
--     فتدخل المصادقة ثمّ تفشل كلّ سياسة RLS تعتمد على الملفّ.
--
-- يشغَّل بمفتاح `service_role` (لوحة Supabase / MCP). للقراءة فقط —
-- لا يكتب شيئاً. كل صفٍّ في النتيجة **مشكلة تستحقّ النظر**؛ النتيجة
-- الفارغة تعني سلامة.
-- ════════════════════════════════════════════════════════════════════

WITH

-- ─── ١. حسابات مصادقة بلا ملفّ شخصي ───
-- تدخل بنجاح ثمّ تصطدم بجدارٍ صامت: كل سياسة تقرأ `public.users`
-- (الدور، الاعتماد، is_admin) تُقيَّم على لا شيء.
orphan_auth AS (
  SELECT 'حساب مصادقة بلا ملفّ' AS issue,
         au.email AS detail,
         'يدخل ثمّ تفشل كل سياسة RLS تعتمد على public.users' AS impact
  FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
),

-- ─── ٢. ملفّات بلا حساب مصادقة ───
orphan_profile AS (
  SELECT 'ملفّ بلا حساب مصادقة', COALESCE(u.email, u.phone),
         'صفّ ميّت لا يستطيع صاحبه الدخول'
  FROM public.users u
  WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id)
),

-- ─── ٣. جداول بلا أيّ مِنحة ───
-- البوّابة الأولى في Postgres: بلا GRANT لا تُقيَّم RLS أصلاً.
no_grants AS (
  SELECT 'جدول بلا مِنحة لأيّ دور عميل', c.relname::text,
         'كل استعلام يُردّ 42501 مهما كانت السياسات'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public' AND g.table_name = c.relname
        AND g.grantee IN ('anon', 'authenticated')
    )
    AND NOT EXISTS (   -- جداول الامتدادات ليست مسؤوليتنا
      SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.objid = c.oid AND d.deptype = 'e'
    )
),

-- ─── ٤. جداول مكشوفة بلا RLS ───
rls_off AS (
  SELECT 'جدول مكشوف بلا RLS', c.relname::text,
         'مِنحة بلا سياسة = قراءة كل الصفوف'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
    AND EXISTS (
      SELECT 1 FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public' AND g.table_name = c.relname
        AND g.grantee IN ('anon', 'authenticated')
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.objid = c.oid AND d.deptype = 'e'
    )
),

-- ─── ٥. جداول عليها RLS لكن بلا سياسة واحدة ───
-- أسوأ من الاثنين: تبدو محميّة وهي مقفلة تماماً على العملاء.
rls_no_policy AS (
  SELECT 'RLS مفعّلة بلا أيّ سياسة', c.relname::text,
         'مقفل كلّياً على العملاء — يبدو محميّاً وهو معطّل'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
    AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)
    AND EXISTS (
      SELECT 1 FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public' AND g.table_name = c.relname
        AND g.grantee IN ('anon', 'authenticated')
    )
),

-- ─── ٦. منظورات تتجاوز RLS وهي مكشوفة ───
definer_views AS (
  SELECT 'منظور SECURITY DEFINER مكشوف', c.relname::text,
         'يعمل بصلاحيات مالكه فيتجاوز RLS تجاوزاً كاملاً'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'v'
    AND COALESCE(c.reloptions::text, '') NOT LIKE '%security_invoker=on%'
    AND EXISTS (
      SELECT 1 FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public' AND g.table_name = c.relname
        AND g.grantee IN ('anon', 'authenticated')
    )
),

-- ─── ٧. دوالّ بلا search_path مثبَّت ───
-- في دالّة SECURITY DEFINER يعني ذلك تصعيد صلاحيات عبر خطف الأسماء.
loose_search_path AS (
  SELECT 'دالّة بلا search_path مثبَّت', p.proname::text,
         CASE WHEN p.prosecdef THEN 'SECURITY DEFINER — خطر خطف الأسماء'
              ELSE 'سلوك يتغيّر بحسب مسار المستدعي' END
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) cfg
                    WHERE cfg LIKE 'search_path=%')
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.objid = p.oid AND d.deptype = 'e'
    )
),

-- ─── ٨. مختصّون معتمَدون بلا نوع ───
-- لا يظهر لهم أيّ طلب: التوجيه كلّه يمرّ عبر `specialist_type`.
specialist_no_type AS (
  SELECT 'مختصّ معتمَد بلا نوع', COALESCE(u.full_name, u.phone)::text,
         'لا يصله أيّ طلب — التوجيه يعتمد على specialist_type'
  FROM public.users u
  WHERE u.role = 'specialist' AND u.approval_status = 'approved'
    AND u.specialist_type IS NULL
),

-- ─── ٩. طلبات بلا وجهة ───
-- `hospital-booking` وحدها تُترك NULL عمداً؛ ما عداها طلبٌ يتيم.
unrouted_appointments AS (
  SELECT 'طلب بلا نوع مختصّ مطلوب', a.id::text,
         'لا يظهر في طابور أيّ مختصّ'
  FROM public.appointments a
  WHERE a.required_specialist_type IS NULL
    AND a.service_id IS DISTINCT FROM 'hospital-booking'
    AND a.status IN ('pending', 'confirmed')
),

-- ─── ١٠. مشغّلات إحصاءات التقييم بصلاحية المستدعي ───
-- تحديثها لصفّ مقدّم الخدمة يخضع لـRLS، وسياسات المُقدّمين تسمح للمشرف
-- أو لصاحب الصفّ وحدهما — لا للمريض المُقيِّم. فيُطابَق صفر صفوف بصمت
-- ولا يتحرّك معدّل التقييم المعروض أبداً. (عطلٌ مُقاس، أصلحه الترحيل 0019)
invoker_rating_triggers AS (
  SELECT 'مشغّل تقييم بصلاحية المستدعي', p.proname::text,
         'تحديث الإحصاءات يسقط بصمت تحت RLS — تقييمات المرضى لا تُحتسب'
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND p.prosrc LIKE '%rating_avg =%'   -- تُسنِد الإحصاءة فعلاً، لا تذكرها في تعليق
    AND NOT p.prosecdef
),

-- ─── ١١. أعلام وعدّادات تقبل NULL ───
-- عمودٌ بقيمةٍ افتراضية ثابتة لا معنى لـNULL فيه: لا عدّاد «مجهول» ولا
-- علَم «غير معروف». وجودها يدفع `| null` إلى الأنواع المولَّدة فتنكسر
-- واجهات التطبيق الصحيحة. (١٩٨ عموداً، ثبّتها الترحيل 0020)
nullable_flags AS (
  SELECT 'عمود علَم/عدّاد يقبل NULL', (c.table_name || '.' || c.column_name)::text,
         'قيمةٌ افتراضية ثابتة مع قبول NULL — تناقض في النمذجة'
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
   AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public' AND c.is_nullable = 'YES'
    AND c.data_type IN ('integer','bigint','smallint','numeric','double precision','boolean')
    AND c.column_default ~ '^[0-9]+(\.[0-9]+)?$|^true$|^false$'
),

-- ─── ١٢. عمودٌ عليه أكثر من قيد CHECK يحصر قيمه ───
-- قيود CHECK **تتقاطع ولا تتّحد**: القيمة يجب أن تمرّ من كلّ قيد. فعمودٌ
-- عليه قيدان بمفرداتٍ مختلفة تكون مفرداته الفعلية **تقاطعهما** — والقيم
-- التي يسمح بها الأوسع وحده لا يمكن تخزينها أبداً، وهي فخٌّ لمن يقرأه.
-- (كان على `users.approval_status`؛ أسقط الترحيل 0022 الأوسع)
contradictory_checks AS (
  SELECT 'عمود بقيدَي CHECK متقاطعين',
         (tbl || '.' || col)::text,
         ('المفردات الفعلية هي تقاطع القيود: ' || constraints)
  FROM (
    SELECT c.relname AS tbl, a.attname AS col,
           string_agg(con.conname, ' + ' ORDER BY con.conname) AS constraints,
           count(*) AS n
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN unnest(con.conkey) k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE n.nspname = 'public' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%= ANY %'
    GROUP BY c.relname, a.attname
  ) s
  WHERE n > 1
)

SELECT * FROM orphan_auth
UNION ALL SELECT * FROM orphan_profile
UNION ALL SELECT * FROM no_grants
UNION ALL SELECT * FROM rls_off
UNION ALL SELECT * FROM rls_no_policy
UNION ALL SELECT * FROM definer_views
UNION ALL SELECT * FROM loose_search_path
UNION ALL SELECT * FROM specialist_no_type
UNION ALL SELECT * FROM unrouted_appointments
UNION ALL SELECT * FROM invoker_rating_triggers
UNION ALL SELECT * FROM nullable_flags
UNION ALL SELECT * FROM contradictory_checks
ORDER BY 1, 2;

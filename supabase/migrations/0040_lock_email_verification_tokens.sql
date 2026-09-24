-- ════════════════════════════════════════════════════════════════════════
-- 0040: انتحالُ بريدِ غيرك — رمزُ تحقّقٍ يزرعه المهاجم بنفسه
-- ════════════════════════════════════════════════════════════════════════
--
-- على `email_verification_tokens` سياسةُ إدراجٍ اسمُها يصف نفسه:
--
--     CREATE POLICY "anyone_can_create_token" … FOR INSERT WITH CHECK (true)
--
-- فأيُّ مستخدمٍ مُسجَّلٍ يُدرج صفّاً بـ`user_id` من يشاء، و`token` يختاره،
-- و`expires_at` يمدّه عشر سنين. ثمّ يزور `/auth/verify-email?token=…`،
-- فيقرأ الخادمُ الصفَّ بمفتاح الخدمة ويُصدّقه ويُنفّذ:
--
--     users.email_verified := true
--     auth.admin.updateUserById(user_id, { email_confirm: true })
--
-- ─── المُثبَت في معاملةٍ مُلغاة ───
--
--     ①_مستخدمٌ مُسجَّلٌ يزرع رمزاً لحسابِ غيره ... نجح، صفوف=١
--     ②_الخادم يجد الرمز ويُصدّقه ............... صاحبه: الضحيّة، صالحٌ حتى ٢٠٣٦
--
-- والأثر أنّ ملكيّة البريد لم تعد تُثبت شيئاً: من سجّل بعنوانٍ لا يملكه
-- كان يُمنع من الدخول (`signInWithEmail` يشترط `email_verified`)، فصار
-- يُصدّق نفسه بلا أن تصله رسالة. وفي منصّةٍ يُعتمد فيها المختصّون ببريدٍ
-- مؤسّسيّ، هذا انتحالُ صفة.
--
-- ولاحظ أنّ `anon` لم يكن يبلغها: لا `INSERT` ممنوحةً له أصلاً. فالسياسة
-- المفتوحة وحدها لم تكن كافية — المنحةُ هي التي حدّت الضرر. قِستُ الاثنين:
--
--     has_table_privilege('anon',          …, 'INSERT') → false
--     has_table_privilege('authenticated', …, 'INSERT') → true
--
-- ─── الإصلاح ───
--
-- لا حاجة إلى إدراجٍ من العميل أصلاً: `sendEmailVerification` يكتب الرمزَ
-- بمفتاح الخدمة، وهو يتخطّى RLS. فتُسقط السياسة **وتُسحب المنحة** معاً —
-- السياسةُ وحدها لا تكفي إن عادت منحةٌ يوماً، والمنحةُ وحدها لا تكفي إن
-- عادت سياسة.
--
-- وتبقى `token_owner_can_read` كما هي: قراءةُ المرء رمزَ نفسه لا تضرّ.

DROP POLICY IF EXISTS "anyone_can_create_token" ON public.email_verification_tokens;

REVOKE INSERT, UPDATE, DELETE ON public.email_verification_tokens FROM anon, authenticated;

-- نجاحُ `REVOKE` ليس دليلاً: سحبُ منحةٍ لم تُعطَ يمرّ صامتاً. فيُقاس.
DO $$
DECLARE r text; bad text := '';
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(r, 'public.email_verification_tokens', 'INSERT')
       OR has_table_privilege(r, 'public.email_verification_tokens', 'UPDATE')
       OR has_table_privilege(r, 'public.email_verification_tokens', 'DELETE') THEN
      bad := bad || r || ' ';
    END IF;
  END LOOP;
  IF bad <> '' THEN
    RAISE EXCEPTION 'ما تزال الكتابة ممنوحةً لـ: %', bad;
  END IF;
END $$;

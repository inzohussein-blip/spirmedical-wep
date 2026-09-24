-- ════════════════════════════════════════════════════════════════════════
-- 0036: مختصٌّ يُلغي موعداً لا يراه — وهو مُسنَدٌ إلى زميله
-- ════════════════════════════════════════════════════════════════════════
--
-- سياسةُ القراءة على `appointments` تشترط في ذراع «الطابور المفتوح» أن
-- يكون الموعد بلا إسناد:
--
--     (assigned_specialist_id IS NULL
--      AND private.current_user_is_approved_specialist_type(required_specialist_type))
--
-- وسياسةُ التعديل كانت تحمل الذراع نفسها **بلا هذا الشرط**:
--
--     private.current_user_is_approved_specialist_type(required_specialist_type)
--
-- أي: كلّ مختصٍّ معتمَدٍ من النوع المطلوب يعدّل **كلّ** موعدٍ من نوعه في
-- المنصّة، حتى المُسنَد لغيره.
--
-- ─── لماذا لم تظهر في أوّل فحص ───
--
-- جرّبتُ أوّلاً `UPDATE … WHERE id = '…'` فأرجع صفراً، فظننتُ الشبهة
-- موهومة. والسبب أنّ Postgres يُطبّق سياسةَ **القراءة** أيضاً متى قرأت
-- العبارةُ أعمدةً — وشرطُ `WHERE` قراءة — فحرستها القراءةُ الأضيق.
--
-- ثمّ جرّبتُ تعديلاً **بلا شرطٍ ولا RETURNING**:
--
--     UPDATE public.appointments SET status = 'cancelled';
--
-- فلا تُستدعى سياسةُ القراءة، وتبقى سياسةُ التعديل وحدها — وهي الواسعة.
-- المُثبَت في معاملةٍ مُلغاة قبل الإصلاح:
--
--     هل يرى موعد الممرّض «ب»؟ .......... ٠
--     تعديلٌ شاملٌ — صفوفٌ تأثّرت ........ ١
--     حالة موعد «ب» بعدها .............. cancelled
--
-- ويبلغه المهاجم من PostgREST بطلبٍ واحد: `PATCH /appointments` بجسم
-- `{"status":"cancelled"}` بلا مُرشِّح.
--
-- ─── الدرس المُعمَّم ───
--
-- **لا يجوز أن تكون سياسةُ التعديل أوسع من سياسة القراءة**، لأنّ التعديل
-- غير المُرشَّح يتخطّى القراءة. يحرسه `tests/rls-update-scope.test.ts`.
--
-- ─── ما بعد الإصلاح، مُثبَتاً ───
--
--     الهجوم الشامل: موعد «ب» المُسنَد .... confirmed (لم يُمسّ)
--     الموعد الحرّ ..................... cancelled (مشروع: طابورٌ مفتوح)
--     إسنادُ حرٍّ إلى زميل .............. مرفوض 42501 ← حمايةٌ جديدة
--     التقاطُ حرٍّ لنفسه ................ ١ (باقٍ)
--     المُسنَد يعدّل موعده ............... ١ (باقٍ)
--     المريض يعدّل موعده ............... ١ (باقٍ)

DROP POLICY IF EXISTS appointments_update_unified ON public.appointments;

CREATE POLICY appointments_update_unified ON public.appointments
  AS PERMISSIVE FOR UPDATE TO public
  USING (
    private.is_admin((SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
    OR specialist_id = (SELECT auth.uid())
    OR assigned_specialist_id = (SELECT auth.uid())
    OR (assigned_specialist_id IS NULL
        AND private.current_user_is_approved_specialist_type(required_specialist_type))
  )
  -- `WITH CHECK` يمنع كذلك إسنادَ موعدٍ حرٍّ إلى **شخصٍ آخر**: الصفُّ الجديد
  -- يجب أن يمرّ بالشرط نفسه، فلا يبقى الملتقِطُ إلّا نفسَه.
  WITH CHECK (
    private.is_admin((SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
    OR specialist_id = (SELECT auth.uid())
    OR assigned_specialist_id = (SELECT auth.uid())
    OR (assigned_specialist_id IS NULL
        AND private.current_user_is_approved_specialist_type(required_specialist_type))
  );

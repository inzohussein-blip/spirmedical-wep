-- ════════════════════════════════════════════════════════════════════════
-- إصلاح إنتاجي: تكرار RLS اللانهائي على users ↔ appointments
-- (السبب المرجّح لفشل "رفع الطلبات" على الموقع الحيّ)
-- ════════════════════════════════════════════════════════════════════════
--
-- المشكلة (مُعاد إنتاجها ومؤكَّدة على Postgres حقيقي):
--   سياسة users «الأخصائي يرى مرضاه» تستعلم appointments، وسياسات appointments
--   (specialist/admin view/update) كانت تُشغّل EXISTS(SELECT FROM users …) داخلياً
--   → إعادة تفعيل سياسات users → حلقة لا نهائية تكسر أي استعلام يمسّ users،
--   ومنه إدراج lab_orders + appointments عند رفع الطلب:
--     ERROR: infinite recursion detected in policy for relation "users"
--
-- الحل: دالة SECURITY DEFINER تتجاوز RLS (كما is_admin الموجودة) فتكسر الحلقة،
--   وتُستعمل بدل الاستعلام الداخلي في سياسات appointments الأربع.
--
-- خصائص هذا السكربت:
--   ✅ آمن للإنتاج: غير مُدمِّر (لا DROP TABLE/COLUMN، لا حذف بيانات).
--   ✅ Idempotent: يمكن تشغيله أكثر من مرّة بلا ضرر.
--   ✅ لا يُضعِف الأمان: نفس منطق الصلاحيات، فقط بلا تكرار.
--
-- كيفية التطبيق: Supabase Dashboard → SQL Editor → الصق ونفّذ.
-- بعده: جرّب رفع طلب من التطبيق، وتحقّق أنّه يظهر في «طلباتي» وفي الأدمن.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1) دالة SECURITY DEFINER: هل المستخدم الحالي أخصائي معتمد من النوع المطلوب؟
--    SECURITY DEFINER تُنفَّذ بصلاحية المالك فتتجاوز RLS على users → لا حلقة.
CREATE OR REPLACE FUNCTION public.current_user_is_approved_specialist_type(req_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'specialist'
      AND u.approval_status = 'approved'
      AND u.specialist_type::text = req_type
  );
$$;

-- 2) إعادة تعريف سياسات appointments الأربع بلا استعلام users داخلي.

-- 2a) الأخصائي يرى طلبات نوعه غير المُعيّنة
DROP POLICY IF EXISTS appointments_specialist_view ON public.appointments;
CREATE POLICY appointments_specialist_view ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR (
      appointments.assigned_specialist_id IS NULL
      AND public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
    )
  );

-- 2b) الأخصائي يعدّل طلبات نوعه
DROP POLICY IF EXISTS appointments_specialist_update ON public.appointments;
CREATE POLICY appointments_specialist_update ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
  );

-- 2c) عرض الأدمن/الأخصائي
DROP POLICY IF EXISTS appointments_admin_view ON public.appointments;
CREATE POLICY appointments_admin_view ON public.appointments
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR (
      appointments.assigned_specialist_id IS NULL
      AND public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
    )
  );

-- 2d) تحديث الأدمن/الأخصائي
DROP POLICY IF EXISTS appointments_admin_update ON public.appointments;
CREATE POLICY appointments_admin_update ON public.appointments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_specialist_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.current_user_is_approved_specialist_type(appointments.required_specialist_type::text)
  );

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- تحقّق (اختياري): يجب أن يعمل هذا الاستعلام بلا خطأ recursion.
--   SELECT count(*) FROM public.appointments;   -- كـ authenticated
-- إن استمرّ الخطأ بعد التطبيق، فقد يكون هناك سياسات users أخرى ذاتية التكرار؛
-- شغّل التالي لعرض كل سياسات users ثم راسِلني بالنتيجة:
--   SELECT policyname, cmd, coalesce(qual, with_check) AS using_expr
--   FROM pg_policies WHERE schemaname='public' AND tablename='users';
-- ════════════════════════════════════════════════════════════════════════

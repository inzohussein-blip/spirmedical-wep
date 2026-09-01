-- ════════════════════════════════════════════════════════════════════════
-- 0028: نتائج المختبر — كلّ محلّلٍ كان يقرأ ويعدّل ويحذف نتائج كلّ المرضى
-- ════════════════════════════════════════════════════════════════════════
--
-- السياسة القائمة على `lab_results`:
--
--     lab_results_specialist_manage  ALL
--     USING (EXISTS (SELECT 1 FROM users
--                     WHERE users.id = auth.uid()
--                       AND users.specialist_type = 'lab_analyst'))
--
-- لا تسأل عن أيّ طلبٍ ولا عن أيّ مريض. تسأل سؤالاً واحداً: أهذا الحساب
-- محلّل مختبرات؟ فمن أجاب بنعم فتح سجلّ التحاليل كلّه — قراءةً وتعديلاً
-- وحذفاً — لكلّ مريضٍ في المنصّة. لا الاعتماد يُشترط ولا عدم الإيقاف.
--
-- والدليل تجربةٌ في معاملةٍ مُلغاة: محلّلان معتمَدان، أحدهما مُسنَدٌ لطلب
-- المريض والآخر لا صلة له به البتّة. حذف الغريبُ نتيجة فحص HIV للمريض
-- وأرجع Postgres `n = 1`. لا خطأ ولا منع.
--
-- والمفارقة أنّ الجدول الشقيق مضبوطٌ أصلاً: `lab_orders_specialist_read`
-- تربط الاختصاصيّ بالموعد الحامل للطلب. والكود نفسه في
-- `specialist/orders/[id]/actions.ts` يتحقّق من الإسناد قبل الحفظ:
--
--     if (appointment.assigned_specialist_id !== user.id &&
--         appointment.specialist_id !== user.id && role !== 'admin')
--       return { ok: false, error: 'not_assigned' };
--
-- فالتضييق أدناه لا يُضيّق على أحد: هو يُنزل السياسة إلى ما يفرضه الكود
-- ويسدّ الطريق على من يتجاوز الكود إلى PostgREST مباشرةً.
--
-- الجدول اليوم صفر صفوف وعدد محلّلي المختبرات صفر، فلا صفَّ قائماً يتأثّر.

-- ─── ١) إسقاط السياسة المفتوحة ───
DROP POLICY IF EXISTS lab_results_specialist_manage ON public.lab_results;

-- ─── ٢) قراءة: المحلّل المُسنَد إلى الموعد الحامل لهذا الطلب وحده ───
CREATE POLICY lab_results_analyst_read ON public.lab_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_results.lab_order_id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.specialist_type = 'lab_analyst'
         AND u.approval_status = 'approved'
         AND COALESCE(u.is_suspended, false) = false
    )
  );

-- ─── ٣) إدخال ───
-- يُضاف هنا شرطان لا وجود لهما في السياسة القديمة:
--   • `entered_by = auth.uid()` فلا يُنسب إدخالٌ إلى محلّلٍ آخر
--   • `user_id` مساوٍ لصاحب الموعد، فلا تُعلَّق نتيجةٌ على مريضٍ غير مريض
--     الطلب — وهو ما كانت السياسة المفتوحة تسمح به بلا اعتراض
CREATE POLICY lab_results_analyst_insert ON public.lab_results
  FOR INSERT TO authenticated
  WITH CHECK (
    entered_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_results.lab_order_id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
         AND a.user_id = lab_results.user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.specialist_type = 'lab_analyst'
         AND u.approval_status = 'approved'
         AND COALESCE(u.is_suspended, false) = false
    )
  );

-- ─── ٤) تعديل ───
CREATE POLICY lab_results_analyst_update ON public.lab_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_results.lab_order_id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.specialist_type = 'lab_analyst'
         AND u.approval_status = 'approved'
         AND COALESCE(u.is_suspended, false) = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_results.lab_order_id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
         AND a.user_id = lab_results.user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.specialist_type = 'lab_analyst'
         AND u.approval_status = 'approved'
         AND COALESCE(u.is_suspended, false) = false
    )
  );

-- ─── ٥) حذف ───
-- الكود يحذف نتائج الطلب كلّها قبل إعادة إدخالها (استبدالٌ لا إلحاق)،
-- فالحذف لازمٌ له — لكن في حدود طلبه هو.
CREATE POLICY lab_results_analyst_delete ON public.lab_results
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_results.lab_order_id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.specialist_type = 'lab_analyst'
         AND u.approval_status = 'approved'
         AND COALESCE(u.is_suspended, false) = false
    )
  );

-- ─── ٦) مواءمة سياسات lab_orders مع الإسناد الفعليّ ───
--
-- `lab_orders_specialist_read` و`_update` تعرفان `specialist_id` وحدها،
-- بينما يُسنِد التطبيقُ المواعيدَ عبر `assigned_specialist_id` (كلّ صفوف
-- `appointments` اليوم فارغة `specialist_id`). فالمحلّل المُسنَد يستطيع
-- بعد هذا الترحيل حفظ النتائج، ثمّ يفشل صامتاً تحديثُ حالة الطلب إلى
-- `results_ready` — فلا يرى المريض أنّ نتائجه جاهزة. تُوسَّع السياستان
-- إلى الذراع الثانية دون أيّ شرطٍ جديد.
DROP POLICY IF EXISTS lab_orders_specialist_read ON public.lab_orders;
CREATE POLICY lab_orders_specialist_read ON public.lab_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_orders.id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS lab_orders_specialist_update ON public.lab_orders;
CREATE POLICY lab_orders_specialist_update ON public.lab_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_orders.id
         AND (a.specialist_id = (SELECT auth.uid()) OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
  );

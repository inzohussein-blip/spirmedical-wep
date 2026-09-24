-- ════════════════════════════════════════════════════════════════════════
-- 0039: بقيّةُ الصفوف التي يتشاركها طرفان — استشارةٌ وطلبُ مختبر
-- ════════════════════════════════════════════════════════════════════════
--
-- بعد `chats` (0038) مسحتُ الجدولَ كلَّه بحثاً عن الشكل نفسه، ووجدتُ أنّ
-- أكثر ما ظننتُه ثغراتٍ ليس كذلك: سياسةُ تعديلٍ بلا `WITH CHECK` **تستعمل
-- `USING` مكانه**، فإن كان `USING` هو `user_id = auth.uid()` فالصفُّ الجديد
-- محكومٌ به أيضاً، ولا يستطيع أحدٌ إهداء صفٍّ لغيره. قِسْتُه لا ظننتُه:
--
--     حقنُ وصفةٍ في سجلّ ضحيّة .......... مرفوض 42501
--     خطفُ اشتراك إشعارات الضحيّة ....... مرفوض 42501
--
-- فالخلل محصورٌ في شكلين اثنين:
--
-- ① **`USING` أذرعٌ بـ`OR`** — يكفي المهاجمَ أن يُبقي ذراعَه صحيحةً ويُبدّل
--    عمودَ الطرف الآخر. هذه حالُ `consultations` كحال `chats`.
-- ② **`USING` لا يذكر عمودَ الملكيّة أصلاً** — كحال `lab_orders`: الشرطُ
--    ربطٌ بموعدٍ أنا مختصُّه، و`user_id` خارجَه تماماً.
--
-- ─── المُثبَت في معاملاتٍ مُلغاة ───
--
--     مريضٌ يُسلّم استشارته لغريب ........ نجح، صفوف=١
--     مختصٌّ ينقل طلب مختبرٍ لحسابٍ آخر .. نجح، صفوف=١ (صاحبه: الغريب)
--
-- الأثر: في الأولى يقرأ الغريبُ محتوى الاستشارة والبيانات الطبّية
-- المُشارَكة فيها؛ وفي الثانية تصل نتائجُ تحاليل مريضٍ إلى حسابٍ يملكه
-- المهاجم — وكلاهما `PATCH` واحدٌ من PostgREST.
--
-- ─── الإصلاح ───
--
-- `consultations`: مُشغِّلٌ يُجمِّد الطرفين، إذ لا يرى `WITH CHECK` الصفَّ
-- القديم فلا يستطيع منعَ التبديل وحده. والطرفان يُكتبان عند الإنشاء وحده
-- (`src/app/(dashboard)/services/doctors/[id]/actions.ts`)، وكلُّ تعديلٍ في
-- التطبيق حالةٌ ونصٌّ وبياناتٌ مُشارَكة.
--
-- `lab_orders`: لا حاجة إلى مُشغِّل. الموعدُ نفسه يحمل `user_id`، فيُربط
-- العمودان في الشرط. وهو صحيحٌ على بيانات الإنتاج كلّها (٢ من ٢ متطابقة).

-- ─── ① الاستشارات ───

CREATE OR REPLACE FUNCTION private.consultations_participants_immutable()
RETURNS trigger
LANGUAGE plpgsql
-- `pg_temp` أخيراً عمداً (على نهج 0014): لو تقدّم لأمكن حجبُ جداولنا بجداول
-- مؤقّتةٍ يُنشئها المهاجم. وسويبُ 0014 لم يبلغ هذه الدالّة لأنّه يمسح
-- `public` وحدها، ومخطَّط `private` أُنشئ بعده في 0024.
SET search_path = public, pg_temp
AS $$
BEGIN
  IF private.is_admin((SELECT auth.uid())) THEN
    RETURN NEW;
  END IF;

  IF NEW.patient_user_id IS DISTINCT FROM OLD.patient_user_id
     OR NEW.doctor_user_id IS DISTINCT FROM OLD.doctor_user_id THEN
    RAISE EXCEPTION 'طرفا الاستشارة لا يُبدَّلان بعد إنشائها'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consultations_participants_immutable ON public.consultations;
CREATE TRIGGER consultations_participants_immutable
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION private.consultations_participants_immutable();

-- ─── ② طلبات المختبر ───

DROP POLICY IF EXISTS lab_orders_specialist_update ON public.lab_orders;
CREATE POLICY lab_orders_specialist_update ON public.lab_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_orders.id
         AND a.user_id = lab_orders.user_id
         AND (a.specialist_id = (SELECT auth.uid())
           OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
       WHERE a.lab_order_id = lab_orders.id
         AND a.user_id = lab_orders.user_id
         AND (a.specialist_id = (SELECT auth.uid())
           OR a.assigned_specialist_id = (SELECT auth.uid()))
    )
  );

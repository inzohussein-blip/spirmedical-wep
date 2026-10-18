-- ═══════════════════════════════════════════════════════════════════
-- 0061 — تحاليلُ المختبر لحساب المختبر وحده (18 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- أبقى 0060 ذراعَ `lab_analyst` في سياسة الإدراج حتى يُدمج كودُ نافذة الخدمة (PR #64). دُمج، وصار
-- `saveLabTests` يشترط حسابَ مختبر، والمحلّلُ يسحب ولا يُحلّل. قِيس قبله: لا صفَّ في `specialist_lab_tests`
-- لأيّ مختصّ، فلا يضيع شيء.

ALTER POLICY specialist_lab_tests_insert ON public.specialist_lab_tests
  WITH CHECK (
    specialist_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND u.role = 'provider' AND u.provider_type = 'lab'
    )
  );

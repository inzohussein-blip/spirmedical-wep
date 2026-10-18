-- ═══════════════════════════════════════════════════════════════════
-- 0055 — تحاليلُ مختبر كلّ مختصّ، والمختبرُ الذي يختاره المريض (قرار المالك، 18 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- «المختصّ يختار الفحوص الموجودة في مختبره، وللمريض عند اختياره للفحوصات تظهر المختبرات التي تدعمها.»
--
-- كانت قائمةُ المختبرات في سحب الدم ثابتةً في الكود (labs-data.ts: «معتمد دولياً»، «ISO 15189» بلا وثيقة)
-- ولا صلةَ لها بالتحاليل ولا بمن يستلم الطلب. الآن المختبرُ = مختصٌّ (lab_analyst) معتمَد غيرُ موقوف،
-- واسمُه `users.clinic_name`، وتحاليلُه هنا (معرّفاتُ `BLOOD_TESTS` في lib/services/blood-tests-data.ts).
--
-- إضافيٌّ كلُّه: كودُ main لا يقرأ الجدول ولا العمود — يعمل كما هو.

CREATE TABLE IF NOT EXISTS public.specialist_lab_tests (
  specialist_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  test_id text NOT NULL CHECK (char_length(test_id) BETWEEN 1 AND 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (specialist_id, test_id)
);

CREATE INDEX IF NOT EXISTS specialist_lab_tests_test_idx ON public.specialist_lab_tests (test_id);

ALTER TABLE public.specialist_lab_tests ENABLE ROW LEVEL SECURITY;

-- القراءة: أيُّ مختبرٍ يُجري أيَّ تحليل ليست سرّاً (والمريضُ يُعرض عليه ذلك من الخادم)
CREATE POLICY specialist_lab_tests_select ON public.specialist_lab_tests
  FOR SELECT TO authenticated USING (true);

-- الكتابة: المختصُّ في قائمته وحدها، ومختصُّ تحاليل فقط
CREATE POLICY specialist_lab_tests_insert ON public.specialist_lab_tests
  FOR INSERT TO authenticated
  WITH CHECK (
    specialist_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid()) AND u.role = 'specialist' AND u.specialist_type = 'lab_analyst'
    )
  );

CREATE POLICY specialist_lab_tests_delete ON public.specialist_lab_tests
  FOR DELETE TO authenticated
  USING (specialist_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.specialist_lab_tests TO authenticated;
-- المنحُ الافتراضيّة تعطي UPDATE أيضاً؛ لا سياسةَ تحديث (الحفظُ حذفٌ وإدراج)، فلا منحةَ له
REVOKE UPDATE ON public.specialist_lab_tests FROM authenticated, anon;
GRANT ALL ON public.specialist_lab_tests TO service_role;

-- المختبرُ الذي اختاره المريض لطلب التحاليل (null = «لا يهم — اختاروا الأنسب»)
ALTER TABLE public.lab_orders
  ADD COLUMN IF NOT EXISTS lab_specialist_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════
-- 🔧 V30: إصلاح specialist_type للحسابات الموجودة
-- ═══════════════════════════════════════════════════════════════════
-- 
-- المشكلة:
--   المختصّون الذين سجّلوا قبل V30 يحملون specialist_type = NULL
--   لأنّ registerSpecialist لم يكن يحفظ القيمة في DB.
--   النتيجة: لا يرون أي طلبات في /specialist/orders
--
-- الحلّ:
--   1. أيّ مختصّ بـ specialist_type = NULL → يصبح 'doctor' (default آمن)
--   2. أيّ قيم قديمة لا تطابق الـ constraint → تُصلَّح
--   3. التأكّد من أنّ كل المختصّين الحاليّين يستطيعون رؤية الطلبات
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. إصلاح القيم القديمة (لو موجودة) ───
UPDATE public.users
SET specialist_type = CASE
  WHEN specialist_type = 'analyst'        THEN 'lab_analyst'
  WHEN specialist_type = 'lab_tech'       THEN 'lab_analyst'
  WHEN specialist_type = 'physiotherapist' THEN 'physio'
  WHEN specialist_type = 'dentist'        THEN 'doctor'
  WHEN specialist_type = 'radiologist'    THEN 'doctor'
  WHEN specialist_type = 'other'          THEN 'doctor'
  ELSE specialist_type
END
WHERE role = 'specialist'
  AND specialist_type IS NOT NULL
  AND specialist_type NOT IN (
    'lab_analyst', 'nurse', 'doctor', 'pharmacist',
    'physio', 'psychologist', 'nutritionist'
  );

-- ─── 2. تعبئة المختصّين الذين لا يحملون specialist_type ───
-- نضع 'doctor' كقيمة افتراضية (الأكثر شمولاً) — يمكن للأدمن تعديلها لاحقاً
UPDATE public.users
SET specialist_type = 'doctor'
WHERE role = 'specialist'
  AND specialist_type IS NULL;

-- ─── 3. التحقّق ───
-- بعد التشغيل، يجب أن يكون كل المختصّين لديهم specialist_type صالح
DO $$
DECLARE
  null_count INTEGER;
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.users
  WHERE role = 'specialist' AND specialist_type IS NULL;
  
  SELECT COUNT(*) INTO invalid_count
  FROM public.users
  WHERE role = 'specialist'
    AND specialist_type IS NOT NULL
    AND specialist_type NOT IN (
      'lab_analyst', 'nurse', 'doctor', 'pharmacist',
      'physio', 'psychologist', 'nutritionist'
    );
  
  IF null_count > 0 THEN
    RAISE WARNING 'Still % specialists with NULL specialist_type', null_count;
  END IF;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % specialists with invalid specialist_type', invalid_count;
  END IF;
  
  RAISE NOTICE 'Migration 46 OK: all specialists have valid specialist_type';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 46 Complete
-- 
-- بعد التشغيل، يستطيع المختصّون رؤية الطلبات حسب اختصاصهم.
-- الأدمن يمكنه لاحقاً تعديل specialist_type لكل مختصّ من /admin44/users
-- ═══════════════════════════════════════════════════════════════════

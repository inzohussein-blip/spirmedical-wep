-- ════════════════════════════════════════════════════════════════════════
-- 0021: عمود `appointments.confirmed_at` المفقود
-- ════════════════════════════════════════════════════════════════════════
--
-- `src/types/database.ts` المكتوب يدوياً يُعلن `appointments.confirmed_at`،
-- و`appointments/[id]/page.tsx` يقرأه ويُمرّره إلى `AppointmentTimeline`.
-- **والعمود غير موجود في القاعدة الحيّة.**
--
-- الأثر: خطوة «تأكيد المختص» في الخطّ الزمني موجودة وتُضيء حسب الحالة،
-- لكنّ وقتها `undefined` دائماً — فلا يظهر للمريض متى قُبل طلبه، لا في
-- المواعيد ولا في تفصيل سحب الدم. بصمت، لأنّ الأنواع اليدوية تَعِد
-- بالعمود ولا أحد يفحص وعدها.
--
-- كُشف عند مقابلة الكود بالمخطّط المولَّد (`TS2339`).
--
-- الشقيقتان `cancelled_at` و`completed_at` موجودتان وتُكتبان من التطبيق.
-- هنا نختار المُشغّل بدل الكتابة من التطبيق: للحالة كاتبان اليوم (قبول
-- المختصّ، وتعيين المشرف) وقد يزيدان، والدرس المتكرّر في هذا المشروع أنّ
-- افتراضات التطبيق تنحرف عن القاعدة بصمت.
--
-- ملاحظة أمنية: هذا مُشغّل BEFORE يُعدّل `NEW` فحسب — لا يُصدر جملة UPDATE
-- منفصلة، فلا يخضع لـRLS ولا يحتاج SECURITY DEFINER (بخلاف مشغّلات
-- إحصاءات التقييم في الترحيل 0019).

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_appointment_confirmed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- يُختم أوّل انتقالٍ إلى «مؤكَّد» فقط؛ ولا يُمحى الختم بعد ذلك
  IF NEW.status = 'confirmed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed')
     AND NEW.confirmed_at IS NULL
  THEN
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_confirmed_at ON public.appointments;
CREATE TRIGGER trg_appointment_confirmed_at
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_appointment_confirmed_at();

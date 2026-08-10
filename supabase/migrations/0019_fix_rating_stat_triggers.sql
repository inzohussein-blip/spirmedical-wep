-- ════════════════════════════════════════════════════════════════════════
-- 0019: إصلاح مشغّلات إحصاءات التقييم التسعة
-- ════════════════════════════════════════════════════════════════════════
--
-- ── العطل الأوّل: التقييمات لا تُحتسب إطلاقاً ──
--
-- المشغّلات التسعة تعمل بصلاحية المستدعي (INVOKER)، فتحديثها لصفّ مُقدّم
-- الخدمة يخضع لـRLS. وسياسة `doctors_admin_manage` (ونظيراتها) تسمح
-- بالتحديث للمشرف أو لصاحب الصفّ وحدهما — **والمريض ليس أيّاً منهما**.
-- فيُطابَق صفرُ صفوف ويمضي التحديث بصمت.
--
-- مقيسٌ على القاعدة الحيّة: مريضٌ أدخل تقييم ٥ نجوم فعلاً (الصفّ محفوظ)،
-- وبقي الطبيب على 0.00 من 0 تقييم. أي أنّ **معدّل التقييم المعروض للمرضى
-- لا يتحرّك أبداً** في كل الخدمات التسع.
--
-- الإصلاح: SECURITY DEFINER. وهو الخيار الضيّق هنا — البديل (سياسة RLS
-- تسمح للمريض بتحديث صفّ الطبيب) أوسع خطراً بما لا يُقاس. الدالّة لا تقبل
-- مُدخلاً من المستخدم: تُعيد حساب متوسّطٍ وعددٍ من جدول التقييمات نفسه
-- لمفتاح الصفّ المُشغِّل وحده، وsearch_path مثبَّت مسبقاً.
--
-- ── العطل الثاني: خاصٌّ بالأطباء ──
--
-- من بين التسعة، `update_doctor_rating_stats` وحدها تخالف النمط:
--
--   ١. بلا `COALESCE(AVG(...), 0)` — إخفاء آخر تقييمٍ منشور يجعل AVG تُحسب
--      على صفر صفوف فتُرجع NULL، فيُكتب `rating_avg = NULL` بينما واجهة
--      التطبيق تُعلنه `number`. (مُثبَت)
--
--   ٢. تقرأ `NEW.doctor_id` وحدها رغم عملها على DELETE، فتصبح `WHERE id = NULL`
--      ولا يُطابَق صفّ: الإحصاءات تبقى قديمة بصمت. مُثبَت: بعد حذف التقييم
--      الوحيد بقي الطبيب يعرض ٥٫٠٠ من تقييمٍ واحد.

-- ── ١. رفع المشغّلات التسعة إلى DEFINER (الأجسام كما هي) ──
ALTER FUNCTION public.update_cosmetic_rating_stats()     SECURITY DEFINER;
ALTER FUNCTION public.update_dental_rating_stats()       SECURITY DEFINER;
ALTER FUNCTION public.update_hospital_rating_stats()     SECURITY DEFINER;
ALTER FUNCTION public.update_mental_rating_stats()       SECURITY DEFINER;
ALTER FUNCTION public.update_nutritionist_rating_stats() SECURITY DEFINER;
ALTER FUNCTION public.update_optical_rating_stats()      SECURITY DEFINER;
ALTER FUNCTION public.update_pharmacy_rating_stats()     SECURITY DEFINER;
ALTER FUNCTION public.update_physio_rating_stats()       SECURITY DEFINER;

-- ── ٢. دالّة الأطباء: إصلاح العطلين + رفعها إلى DEFINER ──
CREATE OR REPLACE FUNCTION public.update_doctor_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  doc_id UUID;
BEGIN
  doc_id := COALESCE(NEW.doctor_id, OLD.doctor_id);

  UPDATE public.doctors
  SET
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.doctor_ratings
      WHERE doctor_id = doc_id AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.doctor_ratings
      WHERE doctor_id = doc_id AND is_public = true
    )
  WHERE id = doc_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── ٣. إصلاح ما خلّفه العطلان: إعادة حساب كل الإحصاءات ──
-- كل تقييمات المرضى السابقة لم تُحتسب قطّ؛ هذه أوّل مرّة تُحسب فيها.

UPDATE public.doctors d SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.doctor_ratings r
                         WHERE r.doctor_id = d.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.doctor_ratings r
                  WHERE r.doctor_id = d.id AND r.is_public);

UPDATE public.dental_clinics c SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.dental_ratings r
                         WHERE r.dental_clinic_id = c.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.dental_ratings r
                  WHERE r.dental_clinic_id = c.id AND r.is_public);

UPDATE public.hospitals h SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.hospital_ratings r
                         WHERE r.hospital_id = h.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.hospital_ratings r
                  WHERE r.hospital_id = h.id AND r.is_public);

UPDATE public.pharmacies p SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.pharmacy_ratings r
                         WHERE r.pharmacy_id = p.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.pharmacy_ratings r
                  WHERE r.pharmacy_id = p.id AND r.is_public);

UPDATE public.optical_stores o SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.optical_ratings r
                         WHERE r.optical_store_id = o.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.optical_ratings r
                  WHERE r.optical_store_id = o.id AND r.is_public);

UPDATE public.mental_health_specialists m SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.mental_health_ratings r
                         WHERE r.specialist_id = m.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.mental_health_ratings r
                  WHERE r.specialist_id = m.id AND r.is_public);

UPDATE public.nutritionists n SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.nutritionist_ratings r
                         WHERE r.nutritionist_id = n.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.nutritionist_ratings r
                  WHERE r.nutritionist_id = n.id AND r.is_public);

UPDATE public.physio_specialists s SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.physio_ratings r
                         WHERE r.specialist_id = s.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.physio_ratings r
                  WHERE r.specialist_id = s.id AND r.is_public);

UPDATE public.cosmetic_products cp SET
  rating_avg = COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.cosmetic_product_reviews r
                         WHERE r.product_id = cp.id AND r.is_public), 0),
  rating_count = (SELECT COUNT(*) FROM public.cosmetic_product_reviews r
                  WHERE r.product_id = cp.id AND r.is_public);

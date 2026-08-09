-- ════════════════════════════════════════════════════════════════════
-- 0013 — الأسعار اختيارية على مقدّم الخدمة
-- ════════════════════════════════════════════════════════════════════
--
-- المشكلة: أعمدة أسعار مقدّمي الخدمات تقبل NULL، لكنّها تحمل **قيماً
-- افتراضية** تُكتب تلقائياً حين لا يُدخل المزوّد سعراً:
--
--   dental_clinics.cleaning_price_min        DEFAULT 15000
--   optical_stores.exam_price                DEFAULT 10000
--   mental_health_specialists.clinic_session_price DEFAULT 75000
--   nutritionists.initial_consultation_price DEFAULT 30000
--   physio_specialists.home_visit_price      DEFAULT 30000
--   … وغيرها
--
-- فالمنصّة تخترع سعراً نيابةً عن المزوّد، ويراه المريض كأنّه سعره المعلَن.
-- وفي حالة الأطباء الافتراضي `0`، فيُعرض «مجّاني» — ادّعاءٌ أسوأ.
--
-- الإصلاح: إزالة القيم الافتراضية فقط. العمود يبقى NULL-able، فمن لم
-- يُدخل سعراً يبقى سعره فارغاً ولا تُعرض له كتلة سعر إطلاقاً.
--
-- ⚠️ لا تُمسّ البيانات القائمة: الأسعار المُدخَلة فعلاً (وهي متفاوتة بين
-- المزوّدين، أي مقصودة لا موروثة من الافتراضي) تبقى كما هي.
--
-- خارج النطاق عمداً — سجلّات معاملات لا أسعار مُعلَنة:
--   doctor_subscriptions.price · lab_orders.total_price ·
--   pharmacy_reservations.total_* · consultations.price
-- هذه تسجّل مبلغاً جرى فعلاً، فبقاؤها مطلوبة أمرٌ صحيح.
-- ════════════════════════════════════════════════════════════════════

-- ─── عيادات الأسنان ───
ALTER TABLE public.dental_clinics
  ALTER COLUMN cleaning_price_min   DROP DEFAULT,
  ALTER COLUMN cleaning_price_max   DROP DEFAULT,
  ALTER COLUMN filling_price_min    DROP DEFAULT,
  ALTER COLUMN filling_price_max    DROP DEFAULT,
  ALTER COLUMN extraction_price_min DROP DEFAULT,
  ALTER COLUMN extraction_price_max DROP DEFAULT,
  ALTER COLUMN implant_price_min    DROP DEFAULT,
  ALTER COLUMN implant_price_max    DROP DEFAULT;

-- ─── متاجر النظّارات ───
ALTER TABLE public.optical_stores
  ALTER COLUMN exam_price      DROP DEFAULT,
  ALTER COLUMN frame_price_min DROP DEFAULT,
  ALTER COLUMN frame_price_max DROP DEFAULT,
  ALTER COLUMN lens_price_min  DROP DEFAULT,
  ALTER COLUMN lens_price_max  DROP DEFAULT;

-- ─── أخصّائيو الصحة النفسية ───
ALTER TABLE public.mental_health_specialists
  ALTER COLUMN clinic_session_price DROP DEFAULT,
  ALTER COLUMN online_session_price DROP DEFAULT;

-- ─── أخصّائيو التغذية ───
ALTER TABLE public.nutritionists
  ALTER COLUMN initial_consultation_price DROP DEFAULT,
  ALTER COLUMN follow_up_price            DROP DEFAULT,
  ALTER COLUMN monthly_plan_price         DROP DEFAULT;

-- ─── العلاج الفيزيائي ───
ALTER TABLE public.physio_specialists
  ALTER COLUMN home_visit_price   DROP DEFAULT,
  ALTER COLUMN clinic_visit_price DROP DEFAULT;

-- ─── الأطباء (الافتراضي كان 0 = «مجّاني») ───
ALTER TABLE public.doctors
  ALTER COLUMN video_consult_price DROP DEFAULT,
  ALTER COLUMN home_visit_price    DROP DEFAULT;

-- ─── عيادات التطعيم ───
ALTER TABLE public.vaccine_clinics
  ALTER COLUMN home_visit_price DROP DEFAULT;

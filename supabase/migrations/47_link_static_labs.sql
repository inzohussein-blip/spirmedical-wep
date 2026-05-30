-- ═══════════════════════════════════════════════════════════════════
-- 🔗 V31: ربط المختبرات الـ static بقاعدة البيانات (slug)
-- ═══════════════════════════════════════════════════════════════════
--
-- المشكلة:
--   الـ UI يعرض مختبرات static (labs-data.ts) بـ IDs نصية: 'medcare', 'al-hayat'...
--   لكن جدول partner_labs يستخدم UUID + أسماء مختلفة.
--   النتيجة: partner_lab_id يُحفظ NULL دائماً → الطلب غير مربوط بمختبر حقيقي.
--
-- الحلّ:
--   1. إضافة عمود slug (نصّي ثابت) لـ partner_labs
--   2. زرع المختبرات الـ static بنفس الـ slugs المستخدمة في الكود
--   3. الكود سيبحث بالـ slug → partner_lab_id حقيقي
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. إضافة عمود slug ───
ALTER TABLE public.partner_labs
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- index فريد (يسمح بـ NULL متعدّد لكن slug فريد عند وجوده)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_labs_slug
  ON public.partner_labs(slug) WHERE slug IS NOT NULL;

-- ─── 2. زرع المختبرات الـ static (نفس IDs الكود) ───
-- نحذف أولاً أيّ صفوف بنفس الـ slug (idempotent) ثم نُدخل من جديد
DELETE FROM public.partner_labs
WHERE slug IN ('medcare', 'al-hayat', 'al-shifa', 'ibn-sina', 'al-amal');

INSERT INTO public.partner_labs (
  slug, name_ar, name_en, city, governorate, phone,
  is_active, is_featured, accepts_home_draw, rating_avg, rating_count, specialties
) VALUES
  ('medcare',  'مختبر ميد كير',     'MedCare Lab',      'بغداد', 'بغداد', '07700000011', true, true,  true, 4.9, 1240, ARRAY['general','cardiac','thyroid']),
  ('al-hayat', 'مختبرات الحياة',    'Al-Hayat Labs',    'بغداد', 'بغداد', '07700000012', true, true,  true, 4.8,  980, ARRAY['general','diabetes','hormones']),
  ('al-shifa', 'مختبر الشفاء',      'Al-Shifa Lab',     'البصرة','البصرة','07700000013', true, false, true, 4.7,  650, ARRAY['general','kidney','liver']),
  ('ibn-sina', 'مختبر ابن سينا',    'Ibn Sina Lab',     'أربيل', 'أربيل', '07700000014', true, true,  true, 4.9,  820, ARRAY['general','cardiac','genetic']),
  ('al-amal',  'مختبر الأمل',       'Al-Amal Lab',      'النجف', 'النجف', '07700000015', true, false, true, 4.6,  540, ARRAY['general','diabetes','thyroid']);

-- ─── 3. دالة helper: إيجاد lab بالـ slug ───
CREATE OR REPLACE FUNCTION public.get_lab_id_by_slug(p_slug TEXT)
RETURNS UUID AS $$
  SELECT id FROM public.partner_labs WHERE slug = p_slug LIMIT 1;
$$ LANGUAGE sql STABLE;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 47 Complete
--
-- بعد التشغيل:
--   • partner_labs فيها 5 مختبرات بـ slugs تطابق الكود
--   • createBloodDrawOrder يقدر يربط partner_lab_id الحقيقي بالـ slug
-- ═══════════════════════════════════════════════════════════════════

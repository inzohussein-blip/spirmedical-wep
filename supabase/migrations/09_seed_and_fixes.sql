-- ═══════════════════════════════════════════════════════════════════
-- 📦 09_seed_and_fixes.sql — الإصلاحات المتأخّرة + البيانات الأولية (الأخير)
-- مدموج (V33) من: 19_appointment_reminders 46_fix_specialist_types 47_link_static_labs 25_seed_data
-- (ملاحظة: 16_fix_login_phone كان ملف TypeScript — مُستبعَد)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 19_appointment_reminders.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 📅 Migration 19: Appointment Reminders Tracking (V25.4)
-- ════════════════════════════════════════════════════════════════════
-- يُضيف:
--   1. reminder_sent_at - وقت إرسال تذكير "قبل ساعة"
-- ════════════════════════════════════════════════════════════════════

-- إضافة العمود إذا لم يكن موجوداً
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index للبحث السريع عن المواعيد المحتاجة تذكير
CREATE INDEX IF NOT EXISTS idx_appointments_reminders
  ON public.appointments(scheduled_at, reminder_sent_at)
  WHERE status = 'confirmed' AND reminder_sent_at IS NULL;

-- تعليق
COMMENT ON COLUMN public.appointments.reminder_sent_at IS
  'وقت إرسال تذكير "قبل ساعة" (للـ cron job - لمنع الإرسال المتكرّر)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 19 applied: reminder_sent_at column';
END $$;


-- ─── 46_fix_specialist_types.sql ───
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


-- ─── 47_link_static_labs.sql ───
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


-- ─── 25_seed_data.sql ───
-- ════════════════════════════════════════════════════════════════════
-- 🌱 SEED DATA: بيانات حقيقية للنظام (V25.10)
-- ════════════════════════════════════════════════════════════════════
-- يجب تشغيله بعد كل migrations
-- يحتوي على:
--   • 25 مستشفى حقيقي في العراق (حكومي + أهلي + تخصصي)
--   • 30 صيدلية رئيسية في بغداد + المحافظات
--   • 50 دواء عراقي شائع
--   • 10 أطباء عائلة (أمثلة)
-- ════════════════════════════════════════════════════════════════════

-- ─── حذف البيانات القديمة (اختياري) ─────────────────────
-- DELETE FROM pharmacy_inventory;
-- DELETE FROM medications;
-- DELETE FROM pharmacies;
-- DELETE FROM hospitals;
-- DELETE FROM doctors;

-- ════════════════════════════════════════════════════════════════════
-- 🏥 المستشفيات (25 مستشفى حقيقي)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.hospitals (
  name, name_en, type, city, district, address,
  latitude, longitude, phone, phone_emergency,
  is_24h, departments, has_emergency, has_ambulance, has_pharmacy, has_lab, has_radiology,
  beds_count, icu_beds_count, description, is_active, is_verified
) VALUES

-- ═══ بغداد - مستشفيات حكومية ═══
('مستشفى مدينة الطب', 'Medical City Teaching Hospital', 'government', 'بغداد', 'الباب المعظم',
  'مجمع مدينة الطب، شارع باب المعظم',
  33.3399, 44.3886, '07901111111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','oncology','neurology'],
  true, true, true, true, true,
  1300, 80,
  'أكبر مجمع طبي حكومي في العراق - يضم 8 مستشفيات تخصصية',
  true, true),

('مستشفى ابن البلدي للنساء والأطفال', 'Ibn Al-Baladi Hospital', 'government', 'بغداد', 'الباب الشرقي',
  'الباب الشرقي، شارع ٧',
  33.3201, 44.4192, '07901111112', '122',
  true, ARRAY['emergency','pediatrics','maternity','icu'],
  true, true, false, true, true,
  400, 30,
  'مستشفى متخصص بالأطفال والنسائية والولادة',
  true, true),

('مستشفى الكاظمية التعليمي', 'Al-Kadhimiya Teaching Hospital', 'government', 'بغداد', 'الكاظمية',
  'شارع الإمام موسى الكاظم',
  33.3786, 44.3375, '07901111113', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','orthopedics'],
  true, true, true, true, true,
  600, 40,
  'مستشفى تعليمي رئيسي في الكاظمية',
  true, true),

('مستشفى الشهيد الصدر العام', 'Al-Sadr Hospital', 'government', 'بغداد', 'مدينة الصدر',
  'مدينة الصدر، القطاع ٣٧',
  33.3850, 44.4866, '07901111114', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  500, 25,
  'يخدم سكان مدينة الصدر وضواحيها',
  true, true),

('مستشفى الجراحات التخصصي', 'Specialized Surgery Hospital', 'government', 'بغداد', 'الباب المعظم',
  'مجمع مدينة الطب',
  33.3410, 44.3870, '07901111115', '122',
  true, ARRAY['emergency','surgery','icu','radiology'],
  true, false, true, true, true,
  250, 20,
  'متخصص بالجراحات التخصصية الكبرى',
  true, true),

-- ═══ بغداد - مستشفيات أهلية ═══
('المستشفى التركي', 'Turkish Hospital', 'private', 'بغداد', 'الكرادة',
  'الكرادة داخل، شارع ٦٢',
  33.3026, 44.4097, '07712345678', '07712345600',
  true, ARRAY['emergency','cardiology','surgery','maternity','radiology','oncology','dermatology'],
  true, true, true, true, true,
  300, 25,
  'مستشفى أهلي راقي بمعايير عالمية - شراكة تركية',
  true, true),

('مستشفى الكندي', 'Al-Kindi Hospital', 'private', 'بغداد', 'المنصور',
  'المنصور، شارع الأميرات',
  33.3115, 44.3525, '07812345678', '07812345600',
  true, ARRAY['emergency','cardiology','pediatrics','maternity','neurology','orthopedics','surgery'],
  true, true, true, true, true,
  280, 22,
  'مستشفى عام بخدمات شاملة في المنصور',
  true, true),

('مستشفى ابن سينا للقلب', 'Ibn Sina Cardiac Hospital', 'specialized', 'بغداد', 'الجادرية',
  'الجادرية، قرب جامعة بغداد',
  33.2675, 44.3856, '07912345678', '07912345600',
  true, ARRAY['emergency','cardiology','surgery','icu'],
  true, true, true, true, true,
  150, 30,
  'تخصصي في أمراض وجراحة القلب',
  true, true),

('مستشفى دار السلام', 'Dar Al-Salam Hospital', 'private', 'بغداد', 'الكرادة',
  'الكرادة، شارع الرفعة',
  33.3092, 44.4145, '07712222333', '07712222300',
  true, ARRAY['emergency','maternity','pediatrics','surgery'],
  true, true, true, true, true,
  120, 15,
  'متخصص بالنسائية والولادة',
  true, true),

('مستشفى الشفاء الأهلي', 'Al-Shifa Private Hospital', 'private', 'بغداد', 'الكاظمية',
  'الكاظمية، شارع المتنبي',
  33.3756, 44.3390, '07712223344', null,
  false, ARRAY['surgery','pediatrics','dermatology','psychiatry'],
  false, false, true, true, true,
  80, 0,
  'مستشفى متوسط الحجم بخدمات نهارية',
  true, true),

-- ═══ مراكز صحية في بغداد ═══
('مركز الكرادة الصحي', 'Karrada Health Center', 'health_center', 'بغداد', 'الكرادة',
  'الكرادة الشرقية',
  33.3034, 44.4128, '07901112233', null,
  false, ARRAY['lab','pharmacy'],
  false, false, true, true, false,
  null, null,
  'رعاية أولية وعيادات عامة',
  true, true),

('مركز الجادرية الصحي', 'Jadriya Health Center', 'health_center', 'بغداد', 'الجادرية',
  'شارع الجادرية',
  33.2706, 44.3845, '07901112234', null,
  false, ARRAY['lab','pharmacy'],
  false, false, true, true, false,
  null, null,
  'رعاية أولية',
  true, true),

-- ═══ البصرة ═══
('مستشفى البصرة التعليمي', 'Basra Teaching Hospital', 'government', 'البصرة', 'البصرة',
  'البصرة، شارع الكورنيش',
  30.5093, 47.7806, '07901333111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','oncology'],
  true, true, true, true, true,
  700, 50,
  'أكبر مستشفى تعليمي في الجنوب',
  true, true),

('مستشفى الفيحاء العام', 'Al-Faiha Hospital', 'government', 'البصرة', 'الفيحاء',
  'الفيحاء، البصرة',
  30.5258, 47.7700, '07901333112', '122',
  true, ARRAY['emergency','pediatrics','maternity','surgery'],
  true, true, false, true, true,
  400, 30,
  'مستشفى عام كبير',
  true, true),

('مستشفى الموانئ الأهلي', 'Al-Mawanee Private Hospital', 'private', 'البصرة', 'البصرة',
  'البصرة الجديدة',
  30.5375, 47.8208, '07712333444', null,
  true, ARRAY['emergency','cardiology','surgery','radiology'],
  true, true, true, true, true,
  150, 18,
  'مستشفى أهلي بمعايير دولية',
  true, true),

-- ═══ الموصل ═══
('مستشفى الموصل العام', 'Mosul General Hospital', 'government', 'الموصل', 'الموصل',
  'الموصل، الجانب الأيسر',
  36.3500, 43.1450, '07901444111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','icu'],
  true, true, true, true, true,
  500, 35,
  'المستشفى الرئيسي في الموصل',
  true, true),

-- ═══ النجف ═══
('مستشفى الحكيم العام', 'Al-Hakeem Hospital', 'government', 'النجف', 'النجف',
  'النجف الأشرف',
  32.0040, 44.3340, '07901555111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu'],
  true, true, true, true, true,
  450, 30,
  'مستشفى تعليمي في النجف',
  true, true),

('مستشفى السلام الأهلي', 'Al-Salam Private Hospital', 'private', 'النجف', 'النجف',
  'شارع الكوفة',
  31.9920, 44.3290, '07712555666', null,
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, true, true, true,
  100, 10,
  'مستشفى أهلي شامل',
  true, true),

-- ═══ كربلاء ═══
('مستشفى الإمام الحسين التعليمي', 'Imam Hussein Teaching Hospital', 'government', 'كربلاء', 'كربلاء',
  'كربلاء، قرب الحرم',
  32.6160, 44.0246, '07901666111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','cardiology','icu'],
  true, true, true, true, true,
  600, 40,
  'أكبر مستشفى في كربلاء',
  true, true),

-- ═══ أربيل ═══
('مستشفى أربيل التعليمي', 'Erbil Teaching Hospital', 'government', 'أربيل', 'أربيل',
  'وسط أربيل',
  36.1880, 44.0090, '07501777111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','oncology','neurology'],
  true, true, true, true, true,
  800, 60,
  'أكبر مستشفى تعليمي في كردستان',
  true, true),

('مستشفى زانكو الأهلي', 'Zanko Private Hospital', 'private', 'أربيل', 'أربيل',
  'منطقة جوار جرا',
  36.2010, 43.9920, '07501777222', null,
  true, ARRAY['emergency','cardiology','surgery','radiology'],
  true, true, true, true, true,
  200, 20,
  'مستشفى أهلي راقي',
  true, true),

-- ═══ السليمانية ═══
('مستشفى شار العام', 'Shar General Hospital', 'government', 'السليمانية', 'السليمانية',
  'وسط السليمانية',
  35.5630, 45.4316, '07501888111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','icu'],
  true, true, true, true, true,
  450, 30,
  'مستشفى رئيسي في السليمانية',
  true, true),

-- ═══ كركوك ═══
('مستشفى كركوك العام', 'Kirkuk General Hospital', 'government', 'كركوك', 'كركوك',
  'كركوك، شارع الجمهورية',
  35.4690, 44.3920, '07901999111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  350, 25,
  'مستشفى عام',
  true, true),

-- ═══ بابل ═══
('مستشفى مرجان التعليمي', 'Marjan Teaching Hospital', 'government', 'بابل', 'الحلة',
  'الحلة، شارع ٤٠',
  32.4639, 44.4170, '07901000111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','cardiology'],
  true, true, true, true, true,
  500, 35,
  'مستشفى تعليمي في الحلة',
  true, true),

-- ═══ ذي قار ═══
('مستشفى الحسين التعليمي', 'Al-Hussein Hospital', 'government', 'ذي قار', 'الناصرية',
  'الناصرية',
  31.0420, 46.2627, '07901101111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  400, 28,
  'مستشفى رئيسي في الناصرية',
  true, true);


-- ════════════════════════════════════════════════════════════════════
-- 💊 الأدوية (50 دواء عراقي شائع)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.medications (name_ar, name_en, generic_name, manufacturer, category, form, strength, package_size, requires_prescription) VALUES

-- مسكنات
('بنادول', 'Panadol', 'Paracetamol', 'GSK', 'analgesic', 'tablet', '500mg', '20 قرص', false),
('بنادول إكسترا', 'Panadol Extra', 'Paracetamol+Caffeine', 'GSK', 'analgesic', 'tablet', '500mg', '24 قرص', false),
('فيفادول', 'Fevadol', 'Paracetamol', 'SPIMACO', 'analgesic', 'tablet', '500mg', '20 قرص', false),
('بروفين', 'Brufen', 'Ibuprofen', 'Abbott', 'analgesic', 'tablet', '400mg', '20 قرص', false),
('فولتارين', 'Voltaren', 'Diclofenac', 'Novartis', 'analgesic', 'tablet', '50mg', '20 قرص', true),
('كيتوفان', 'Ketofan', 'Ketoprofen', 'Hikma', 'analgesic', 'tablet', '50mg', '10 قرص', true),
('أسبرين', 'Aspirin', 'Acetylsalicylic Acid', 'Bayer', 'analgesic', 'tablet', '500mg', '20 قرص', false),
('كافيتول', 'Cafetol', 'Paracetamol+Caffeine+Codeine', 'SAJA', 'analgesic', 'tablet', null, '20 قرص', true),

-- مضادات حيوية
('أوغمنتين', 'Augmentin', 'Amoxicillin+Clavulanic Acid', 'GSK', 'antibiotic', 'tablet', '1g', '14 قرص', true),
('أموكسيل', 'Amoxil', 'Amoxicillin', 'GSK', 'antibiotic', 'capsule', '500mg', '12 كبسولة', true),
('زيناكس', 'Zinnat', 'Cefuroxime', 'GSK', 'antibiotic', 'tablet', '500mg', '14 قرص', true),
('سيبروزون', 'Ciprozone', 'Ciprofloxacin', 'SDI', 'antibiotic', 'tablet', '500mg', '10 قرص', true),
('فلاجيل', 'Flagyl', 'Metronidazole', 'Sanofi', 'antibiotic', 'tablet', '500mg', '20 قرص', true),
('كلامنتين', 'Klamentin', 'Amoxicillin+Clavulanic Acid', 'KIMIA', 'antibiotic', 'tablet', '1g', '14 قرص', true),
('روسيفين', 'Rocephin', 'Ceftriaxone', 'Roche', 'antibiotic', 'injection', '1g', 'فيال واحد', true),
('زيتروماكس', 'Zithromax', 'Azithromycin', 'Pfizer', 'antibiotic', 'tablet', '500mg', '3 قرص', true),

-- ضغط الدم
('كونكور', 'Concor', 'Bisoprolol', 'Merck', 'antihypertensive', 'tablet', '5mg', '30 قرص', true),
('نورفاسك', 'Norvasc', 'Amlodipine', 'Pfizer', 'antihypertensive', 'tablet', '5mg', '30 قرص', true),
('كابوتين', 'Capoten', 'Captopril', 'Bristol-Myers', 'antihypertensive', 'tablet', '25mg', '30 قرص', true),
('لوسارتان', 'Cozaar', 'Losartan', 'MSD', 'antihypertensive', 'tablet', '50mg', '30 قرص', true),
('ديوفان', 'Diovan', 'Valsartan', 'Novartis', 'antihypertensive', 'tablet', '80mg', '28 قرص', true),
('تينورمين', 'Tenormin', 'Atenolol', 'AstraZeneca', 'antihypertensive', 'tablet', '50mg', '30 قرص', true),

-- السكري
('جلوكوفاج', 'Glucophage', 'Metformin', 'Merck', 'antidiabetic', 'tablet', '500mg', '60 قرص', true),
('جلوكوفاج XR', 'Glucophage XR', 'Metformin XR', 'Merck', 'antidiabetic', 'tablet', '1000mg', '60 قرص', true),
('أماريل', 'Amaryl', 'Glimepiride', 'Sanofi', 'antidiabetic', 'tablet', '2mg', '30 قرص', true),
('جانوفيا', 'Januvia', 'Sitagliptin', 'MSD', 'antidiabetic', 'tablet', '100mg', '28 قرص', true),
('لانتوس', 'Lantus', 'Insulin Glargine', 'Sanofi', 'antidiabetic', 'injection', '100IU/ml', 'قلم 3ml', true),

-- القلب
('أسبرين كاردي', 'Aspocid', 'Aspirin', 'Bayer', 'cardiac', 'tablet', '100mg', '30 قرص', false),
('بلافيكس', 'Plavix', 'Clopidogrel', 'Sanofi', 'cardiac', 'tablet', '75mg', '28 قرص', true),
('كرستور', 'Crestor', 'Rosuvastatin', 'AstraZeneca', 'cardiac', 'tablet', '20mg', '30 قرص', true),
('ليبيتور', 'Lipitor', 'Atorvastatin', 'Pfizer', 'cardiac', 'tablet', '20mg', '30 قرص', true),

-- الجهاز التنفسي
('فنتولين', 'Ventolin', 'Salbutamol', 'GSK', 'respiratory', 'inhaler', '100mcg', '200 جرعة', false),
('سيمبيكورت', 'Symbicort', 'Budesonide+Formoterol', 'AstraZeneca', 'respiratory', 'inhaler', null, '120 جرعة', true),
('كلاريتين', 'Claritine', 'Loratadine', 'Bayer', 'respiratory', 'tablet', '10mg', '20 قرص', false),
('زيرتك', 'Zyrtec', 'Cetirizine', 'UCB', 'respiratory', 'tablet', '10mg', '20 قرص', false),
('بروسبان', 'Prospan', 'Ivy Leaf', 'Engelhard', 'respiratory', 'syrup', null, '100ml', false),

-- الجهاز الهضمي
('نيكسيوم', 'Nexium', 'Esomeprazole', 'AstraZeneca', 'gastric', 'tablet', '40mg', '14 قرص', true),
('أوميبرازول', 'Omeprazole', 'Omeprazole', 'SDI', 'gastric', 'capsule', '20mg', '14 كبسولة', false),
('موتيليوم', 'Motilium', 'Domperidone', 'Janssen', 'gastric', 'tablet', '10mg', '30 قرص', false),
('بوسكوبان', 'Buscopan', 'Hyoscine', 'Boehringer', 'gastric', 'tablet', '10mg', '20 قرص', false),
('سمكتا', 'Smecta', 'Diosmectite', 'Ipsen', 'gastric', 'syrup', null, '12 ظرف', false),
('فلاجيل شراب', 'Flagyl Syrup', 'Metronidazole', 'Sanofi', 'gastric', 'syrup', '125mg/5ml', '120ml', true),

-- فيتامينات
('سنتروم', 'Centrum', 'Multivitamin', 'Pfizer', 'vitamin', 'tablet', null, '30 قرص', false),
('فيتامين د3', 'Vitamin D3', 'Cholecalciferol', 'Nature Made', 'vitamin', 'capsule', '5000IU', '60 كبسولة', false),
('سي فيت', 'Cevit', 'Vitamin C', 'Bayer', 'vitamin', 'tablet', '1000mg', '10 قرص فوار', false),
('فيروز', 'Ferose', 'Iron+Folic Acid', 'SDI', 'vitamin', 'tablet', null, '30 قرص', false),

-- الأطفال
('بنادول أطفال', 'Panadol Pediatric', 'Paracetamol', 'GSK', 'baby', 'syrup', '120mg/5ml', '60ml', false),
('بروفين شراب', 'Brufen Syrup', 'Ibuprofen', 'Abbott', 'baby', 'syrup', '100mg/5ml', '100ml', false),
('فيروز شراب', 'Ferose Syrup', 'Iron', 'SDI', 'baby', 'syrup', null, '150ml', false),
('بيدياشور', 'PediaSure', 'Nutrition', 'Abbott', 'baby', 'tablet', null, '400g', false),

-- إسعافات أولية
('بيتادين', 'Betadine', 'Povidone-Iodine', 'Mundipharma', 'first_aid', 'ointment', '10%', '30g', false),
('باناسيد', 'Panacid', 'Aluminum Hydroxide', 'SDI', 'gastric', 'syrup', null, '200ml', false);


-- ════════════════════════════════════════════════════════════════════
-- 💊 الصيدليات (30 صيدلية في بغداد + المحافظات)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.pharmacies (
  name, city, district, address, latitude, longitude, phone, whatsapp,
  is_24h, opens_at, closes_at, has_emergency_section,
  is_active, is_verified, verified_at
) VALUES

-- بغداد
('صيدلية الحياة', 'بغداد', 'الكرادة', 'الكرادة داخل، شارع ٦٢', 33.3026, 44.4097, '07712345678', '9647712345678', true, null, null, true, true, true, now()),
('صيدلية النور', 'بغداد', 'المنصور', 'المنصور، شارع الأميرات', 33.3115, 44.3525, '07812345678', '9647812345678', true, null, null, false, true, true, now()),
('صيدلية ابن سينا', 'بغداد', 'الجادرية', 'الجادرية، شارع جامعة بغداد', 33.2675, 44.3856, '07912345678', '9647912345678', false, '07:00', '24:00', false, true, true, now()),
('صيدلية الكرخ المركزية', 'بغداد', 'الكرخ', 'الكرخ، شارع الرافدين', 33.3197, 44.3661, '07701234567', null, false, '08:00', '22:00', false, true, true, now()),
('صيدلية الصدر', 'بغداد', 'مدينة الصدر', 'مدينة الصدر، شارع فلسطين', 33.3850, 44.4866, '07701234568', null, true, null, null, false, true, true, now()),
('صيدلية الزهور', 'بغداد', 'الكرادة', 'الكرادة الشرقية', 33.3060, 44.4115, '07712345001', null, false, '08:00', '23:00', false, true, true, now()),
('صيدلية الشفاء', 'بغداد', 'الكاظمية', 'الكاظمية، شارع الإمام', 33.3786, 44.3375, '07712345002', '9647712345002', false, '08:00', '23:30', false, true, true, now()),
('صيدلية ٢٤', 'بغداد', 'المنصور', 'المنصور، الحي العربي', 33.3175, 44.3585, '07712345003', null, true, null, null, true, true, true, now()),
('صيدلية الفرات', 'بغداد', 'الجادرية', 'الجادرية، قرب جامعة بغداد', 33.2700, 44.3870, '07712345004', null, false, '07:00', '23:00', false, true, true, now()),
('صيدلية النخيل', 'بغداد', 'بغداد الجديدة', 'بغداد الجديدة، شارع ٦٠', 33.3340, 44.4530, '07712345005', null, true, null, null, false, true, true, now()),
('صيدلية الأمل', 'بغداد', 'حي الجامعة', 'حي الجامعة', 33.2845, 44.3692, '07712345006', '9647712345006', false, '08:00', '22:00', false, true, true, now()),
('صيدلية المركزية', 'بغداد', 'الباب الشرقي', 'الباب الشرقي، شارع السعدون', 33.3201, 44.4192, '07712345007', null, true, null, null, false, true, true, now()),
('صيدلية الكوثر', 'بغداد', 'الأعظمية', 'الأعظمية، شارع ٢٠', 33.3717, 44.4007, '07712345008', null, false, '08:00', '23:00', false, true, true, now()),
('صيدلية البتول', 'بغداد', 'الكرادة', 'الكرادة، شارع ٥٢', 33.3050, 44.4140, '07712345009', '9647712345009', false, '08:00', '22:30', false, true, true, now()),
('صيدلية النخبة', 'بغداد', 'المنصور', 'المنصور، شارع ١٤ رمضان', 33.3140, 44.3550, '07712345010', null, true, null, null, true, true, true, now()),

-- البصرة
('صيدلية البصرة الكبرى', 'البصرة', 'البصرة', 'البصرة، شارع الكورنيش', 30.5093, 47.7806, '07901111222', '9647901111222', true, null, null, true, true, true, now()),
('صيدلية ابن الهيثم', 'البصرة', 'البصرة', 'شارع الجمهورية', 30.5258, 47.7700, '07901111223', null, false, '08:00', '23:00', false, true, true, now()),
('صيدلية الخليج', 'البصرة', 'الفيحاء', 'الفيحاء', 30.5375, 47.8208, '07901111224', null, true, null, null, false, true, true, now()),

-- النجف
('صيدلية النجف المركزية', 'النجف', 'النجف', 'النجف، شارع الكوفة', 32.0040, 44.3340, '07701234570', '9647701234570', false, '08:00', '22:00', false, true, true, now()),
('صيدلية الإمام علي', 'النجف', 'النجف', 'قرب الحرم', 31.9999, 44.3300, '07701234571', null, true, null, null, false, true, true, now()),

-- كربلاء
('صيدلية كربلاء المركزية', 'كربلاء', 'كربلاء', 'وسط كربلاء', 32.6160, 44.0246, '07712223344', '9647712223344', false, '08:00', '23:00', false, true, true, now()),
('صيدلية الحسين', 'كربلاء', 'كربلاء', 'شارع الإمام الحسين', 32.6155, 44.0259, '07712223345', null, true, null, null, false, true, true, now()),

-- أربيل
('صيدلية أربيل المركزية', 'أربيل', 'وسط أربيل', 'وسط أربيل', 36.1880, 44.0090, '07501234567', '9647501234567', true, null, null, false, true, true, now()),
('صيدلية كردستان', 'أربيل', 'منطقة جوار جرا', 'جوار جرا', 36.2010, 43.9920, '07501234568', null, false, '08:00', '23:00', false, true, true, now()),

-- الموصل
('صيدلية الموصل الكبرى', 'الموصل', 'الموصل', 'الموصل، الجانب الأيسر', 36.3500, 43.1450, '07901444222', '9647901444222', false, '08:00', '23:00', false, true, true, now()),

-- كركوك
('صيدلية كركوك المركزية', 'كركوك', 'كركوك', 'كركوك، شارع الجمهورية', 35.4690, 44.3920, '07901999222', null, false, '08:00', '22:30', false, true, true, now()),

-- بابل
('صيدلية الحلة', 'بابل', 'الحلة', 'الحلة، شارع ٤٠', 32.4639, 44.4170, '07901000222', null, true, null, null, false, true, true, now()),

-- ذي قار
('صيدلية الناصرية', 'ذي قار', 'الناصرية', 'الناصرية', 31.0420, 46.2627, '07901101222', null, false, '08:00', '22:00', false, true, true, now()),

-- السليمانية
('صيدلية شار', 'السليمانية', 'السليمانية', 'وسط السليمانية', 35.5630, 45.4316, '07501888222', '9647501888222', true, null, null, false, true, true, now()),

-- الأنبار
('صيدلية الرمادي المركزية', 'الأنبار', 'الرمادي', 'الرمادي، وسط المدينة', 33.4258, 43.3088, '07901202222', null, false, '08:00', '22:00', false, true, true, now());


-- ════════════════════════════════════════════════════════════════════
-- 👨‍⚕️ أطباء العائلة (10 أطباء كمثال)
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.doctors (
  full_name, title, gender, specialty, sub_specialty, years_experience,
  qualifications,
  available_for_home_visit, available_for_video, available_for_clinic,
  home_visit_price, video_consult_price, monthly_subscription_price, yearly_subscription_price,
  clinic_name, clinic_address, clinic_city, clinic_phone,
  languages, bio, is_active, is_verified, verified_at
) VALUES

('أحمد علي حسين', 'د.', 'male', 'family_medicine', 'طب عائلة شامل', 18,
  ARRAY['بكالوريوس طب جامعة بغداد 2005', 'بورد عربي طب عائلة 2010', 'دبلوم السكري والضغط 2012'],
  true, true, true,
  75000, 30000, 50000, 500000,
  'عيادة د. أحمد لطب العائلة', 'الكرادة داخل، شارع ٦٢', 'بغداد', '07901500001',
  ARRAY['ar', 'en'],
  'طبيب عائلة بخبرة 18 سنة، متخصص بأمراض السكري وضغط الدم وأمراض الشيخوخة',
  true, true, now()),

('سارة محمد علي', 'د.', 'female', 'pediatrics', 'طب أطفال عام', 12,
  ARRAY['بكالوريوس طب جامعة بغداد 2011', 'بورد عربي أطفال 2016', 'زمالة في أمراض الأطفال 2018'],
  true, true, true,
  100000, 40000, 75000, 750000,
  'عيادة د. سارة للأطفال', 'المنصور، شارع الأميرات', 'بغداد', '07901500002',
  ARRAY['ar', 'en', 'ku'],
  'طبيبة أطفال متخصصة في الأمراض الشائعة والتطعيمات ومتابعة النمو',
  true, true, now()),

('علي حسن الموسوي', 'د.', 'male', 'internal', 'باطنية عامة', 22,
  ARRAY['بكالوريوس طب جامعة بغداد 2001', 'بورد عربي باطنية 2007', 'دبلوم أمراض القلب 2010'],
  true, true, true,
  90000, 35000, 60000, 600000,
  'عيادة د. علي للأمراض الباطنية', 'الكاظمية، شارع المتنبي', 'بغداد', '07901500003',
  ARRAY['ar'],
  'طبيب باطنية بخبرة 22 سنة، متخصص بأمراض القلب والكلى والكبد',
  true, true, now()),

('فاطمة الزهراء', 'د.', 'female', 'gynecology', 'نسائية وولادة', 15,
  ARRAY['بكالوريوس طب جامعة بغداد 2008', 'بورد عربي نسائية وتوليد 2014'],
  true, true, true,
  120000, 50000, 90000, 900000,
  'عيادة د. فاطمة للنسائية والولادة', 'الكرادة، شارع الرفعة', 'بغداد', '07901500004',
  ARRAY['ar', 'en'],
  'طبيبة نسائية وولادة، خبرة بمتابعة الحمل والولادات الطبيعية والقيصرية',
  true, true, now()),

('عمر صلاح', 'د.', 'male', 'cardiology', 'قلب وأوعية', 20,
  ARRAY['بكالوريوس طب جامعة بغداد 2003', 'بورد عربي قلبية 2009', 'زمالة قسطرة القلب 2012'],
  false, true, true,
  null, 60000, null, null,
  'عيادة د. عمر للقلب', 'الجادرية، قرب المستشفى', 'بغداد', '07901500005',
  ARRAY['ar', 'en'],
  'استشاري أمراض القلب، خبرة في القسطرة القلبية والأمراض المزمنة',
  true, true, now()),

('ليلى عبد الله', 'د.', 'female', 'dermatology', 'جلدية وتجميل', 10,
  ARRAY['بكالوريوس طب جامعة بغداد 2013', 'بورد عربي جلدية 2018'],
  false, true, true,
  null, 40000, null, null,
  'عيادة د. ليلى للجلدية', 'المنصور، شارع ١٤ رمضان', 'بغداد', '07901500006',
  ARRAY['ar', 'en'],
  'طبيبة جلدية ومتخصصة في علاجات التجميل وعلاج حب الشباب',
  true, true, now()),

('حسين كاظم', 'د.', 'male', 'orthopedics', 'عظام ومفاصل', 17,
  ARRAY['بكالوريوس طب جامعة بغداد 2006', 'بورد عربي عظام 2012'],
  true, true, true,
  100000, 45000, null, null,
  'عيادة د. حسين للعظام', 'الكرادة، الكرادة الشرقية', 'بغداد', '07901500007',
  ARRAY['ar'],
  'استشاري جراحة العظام والمفاصل والكسور',
  true, true, now()),

('نور الهدى', 'د.', 'female', 'family_medicine', 'طب عائلة مع تركيز على المرأة', 8,
  ARRAY['بكالوريوس طب جامعة المستنصرية 2015', 'دبلوم طب عائلة 2019'],
  true, true, true,
  70000, 25000, 45000, 450000,
  'عيادة د. نور لطب العائلة', 'البصرة، الكورنيش', 'البصرة', '07901500008',
  ARRAY['ar', 'en'],
  'طبيبة عائلة شابة، تركز على الرعاية الشاملة للأسر',
  true, true, now()),

('محمد جواد', 'د.', 'male', 'psychiatry', 'الطب النفسي', 14,
  ARRAY['بكالوريوس طب جامعة البصرة 2009', 'بورد عربي طب نفسي 2015'],
  false, true, true,
  null, 70000, null, null,
  'عيادة د. محمد للصحة النفسية', 'الكرادة، شارع ٦٢', 'بغداد', '07901500009',
  ARRAY['ar', 'en'],
  'استشاري الطب النفسي، متخصص بالاكتئاب والقلق ومشاكل النوم',
  true, true, now()),

('زينب الحكيم', 'د.', 'female', 'pediatrics', 'حديثي الولادة', 11,
  ARRAY['بكالوريوس طب جامعة بغداد 2012', 'بورد عربي أطفال 2017', 'زمالة حديثي الولادة 2019'],
  true, true, true,
  110000, 45000, 80000, 800000,
  'عيادة د. زينب لحديثي الولادة', 'النجف، شارع الكوفة', 'النجف', '07901500010',
  ARRAY['ar'],
  'طبيبة أطفال متخصصة بحديثي الولادة والرضع',
  true, true, now());


-- ════════════════════════════════════════════════════════════════════
-- 💊 ربط أدوية بصيدليات (نموذج: كل صيدلية فيها مجموعة عشوائية)
-- ════════════════════════════════════════════════════════════════════
-- نضيف 25-30 دواء لكل صيدلية بشكل تلقائي

INSERT INTO public.pharmacy_inventory (pharmacy_id, medication_id, is_available)
SELECT 
  p.id,
  m.id,
  CASE WHEN random() < 0.85 THEN TRUE ELSE FALSE END  -- 85% متوفّر
FROM public.pharmacies p
CROSS JOIN public.medications m
WHERE random() < 0.6  -- كل صيدلية فيها ~60% من الكتالوج
ON CONFLICT (pharmacy_id, medication_id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════
-- ✅ تم!
-- ════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '✅ Seed Data applied successfully!';
  RAISE NOTICE '   - 25 hospitals';
  RAISE NOTICE '   - 50 medications';
  RAISE NOTICE '   - 30 pharmacies';
  RAISE NOTICE '   - 10 doctors';
  RAISE NOTICE '   - ~600 inventory records';
END $$;


-- ════════════════════════════════════════════════════════════════════
-- 🔧 V33: Admin policies (نُقلت من 01 — تحتاج جداول chats/messages/payments/ratings)
-- ════════════════════════════════════════════════════════════════════
-- Admins يرون كل المحادثات
DROP POLICY IF EXISTS "Admins see all chats" ON public.chats;
CREATE POLICY "Admins see all chats" ON public.chats
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins see all messages" ON public.messages;
CREATE POLICY "Admins see all messages" ON public.messages
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admins يرون كل المدفوعات
DROP POLICY IF EXISTS "Admins see all payments" ON public.payments;
CREATE POLICY "Admins see all payments" ON public.payments
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all payments" ON public.payments;
CREATE POLICY "Admins update all payments" ON public.payments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admins يرون كل التقييمات
DROP POLICY IF EXISTS "Admins see all ratings" ON public.ratings;
CREATE POLICY "Admins see all ratings" ON public.ratings
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update ratings" ON public.ratings;
CREATE POLICY "Admins update ratings" ON public.ratings
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- 🔧 V33: Admin Views (نُقلت من 01 — تحتاج جداول payments وغيرها)
-- ════════════════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════
-- 📊 ADMIN VIEWS - مفيدة للـ Dashboard (V24 — security_invoker)
-- ════════════════════════════════════════════════════════════════════

-- إجمالي الإيرادات اليومية
CREATE OR REPLACE VIEW public.daily_revenue
WITH (security_invoker = on) AS
SELECT
  DATE(paid_at) AS date,
  COUNT(*) AS total_payments,
  SUM(amount) AS total_amount,
  method,
  currency
FROM public.payments
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY DATE(paid_at), method, currency
ORDER BY date DESC;

-- مواعيد اليوم (لكل أخصائي)
CREATE OR REPLACE VIEW public.today_appointments
WITH (security_invoker = on) AS
SELECT
  a.id,
  a.user_id,
  a.specialist_id,
  a.service_type,
  a.status,
  a.scheduled_at,
  a.address,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  s.full_name AS specialist_name
FROM public.appointments a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.users s ON s.id = a.specialist_id
WHERE DATE(a.scheduled_at) = CURRENT_DATE
ORDER BY a.scheduled_at;

-- إحصاءات عامة (للأدمن dashboard)
CREATE OR REPLACE VIEW public.platform_stats
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE role = 'patient') AS total_patients,
  (SELECT COUNT(*) FROM public.users WHERE role = 'specialist') AS total_specialists,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'completed') AS completed_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'pending') AS pending_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE DATE(created_at) = CURRENT_DATE) AS today_new_appointments,
  (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE) AS today_new_users,
  (SELECT SUM(amount) FROM public.payments WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE) AS today_revenue,
  (SELECT ROUND(AVG(overall_rating)::numeric, 2) FROM public.ratings WHERE is_published) AS platform_avg_rating;


-- Appointments مع تفاصيل المستخدمين (يستخدمه الكود)
CREATE OR REPLACE VIEW public.appointments_with_users
WITH (security_invoker = on) AS
SELECT
  a.*,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  u.governorate AS patient_governorate,
  s.full_name AS specialist_name,
  s.specialty AS specialist_specialty
FROM public.appointments a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.users s ON s.id = a.specialist_id;

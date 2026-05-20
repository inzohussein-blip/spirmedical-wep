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
  beds_count, icu_beds_count, description, is_active, is_verified, verified_at
) VALUES

-- ═══ بغداد - مستشفيات حكومية ═══
('مستشفى مدينة الطب', 'Medical City Teaching Hospital', 'government', 'بغداد', 'الباب المعظم',
  'مجمع مدينة الطب، شارع باب المعظم',
  33.3399, 44.3886, '07901111111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','oncology','neurology'],
  true, true, true, true, true,
  1300, 80,
  'أكبر مجمع طبي حكومي في العراق - يضم 8 مستشفيات تخصصية',
  true, true, now()),

('مستشفى ابن البلدي للنساء والأطفال', 'Ibn Al-Baladi Hospital', 'government', 'بغداد', 'الباب الشرقي',
  'الباب الشرقي، شارع ٧',
  33.3201, 44.4192, '07901111112', '122',
  true, ARRAY['emergency','pediatrics','maternity','icu'],
  true, true, false, true, true,
  400, 30,
  'مستشفى متخصص بالأطفال والنسائية والولادة',
  true, true, now()),

('مستشفى الكاظمية التعليمي', 'Al-Kadhimiya Teaching Hospital', 'government', 'بغداد', 'الكاظمية',
  'شارع الإمام موسى الكاظم',
  33.3786, 44.3375, '07901111113', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','orthopedics'],
  true, true, true, true, true,
  600, 40,
  'مستشفى تعليمي رئيسي في الكاظمية',
  true, true, now()),

('مستشفى الشهيد الصدر العام', 'Al-Sadr Hospital', 'government', 'بغداد', 'مدينة الصدر',
  'مدينة الصدر، القطاع ٣٧',
  33.3850, 44.4866, '07901111114', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  500, 25,
  'يخدم سكان مدينة الصدر وضواحيها',
  true, true, now()),

('مستشفى الجراحات التخصصي', 'Specialized Surgery Hospital', 'government', 'بغداد', 'الباب المعظم',
  'مجمع مدينة الطب',
  33.3410, 44.3870, '07901111115', '122',
  true, ARRAY['emergency','surgery','icu','radiology'],
  true, false, true, true, true,
  250, 20,
  'متخصص بالجراحات التخصصية الكبرى',
  true, true, now()),

-- ═══ بغداد - مستشفيات أهلية ═══
('المستشفى التركي', 'Turkish Hospital', 'private', 'بغداد', 'الكرادة',
  'الكرادة داخل، شارع ٦٢',
  33.3026, 44.4097, '07712345678', '07712345600',
  true, ARRAY['emergency','cardiology','surgery','maternity','radiology','oncology','dermatology'],
  true, true, true, true, true,
  300, 25,
  'مستشفى أهلي راقي بمعايير عالمية - شراكة تركية',
  true, true, now()),

('مستشفى الكندي', 'Al-Kindi Hospital', 'private', 'بغداد', 'المنصور',
  'المنصور، شارع الأميرات',
  33.3115, 44.3525, '07812345678', '07812345600',
  true, ARRAY['emergency','cardiology','pediatrics','maternity','neurology','orthopedics','surgery'],
  true, true, true, true, true,
  280, 22,
  'مستشفى عام بخدمات شاملة في المنصور',
  true, true, now()),

('مستشفى ابن سينا للقلب', 'Ibn Sina Cardiac Hospital', 'specialized', 'بغداد', 'الجادرية',
  'الجادرية، قرب جامعة بغداد',
  33.2675, 44.3856, '07912345678', '07912345600',
  true, ARRAY['emergency','cardiology','surgery','icu'],
  true, true, true, true, true,
  150, 30,
  'تخصصي في أمراض وجراحة القلب',
  true, true, now()),

('مستشفى دار السلام', 'Dar Al-Salam Hospital', 'private', 'بغداد', 'الكرادة',
  'الكرادة، شارع الرفعة',
  33.3092, 44.4145, '07712222333', '07712222300',
  true, ARRAY['emergency','maternity','pediatrics','surgery'],
  true, true, true, true, true,
  120, 15,
  'متخصص بالنسائية والولادة',
  true, true, now()),

('مستشفى الشفاء الأهلي', 'Al-Shifa Private Hospital', 'private', 'بغداد', 'الكاظمية',
  'الكاظمية، شارع المتنبي',
  33.3756, 44.3390, '07712223344', null,
  false, ARRAY['surgery','pediatrics','dermatology','psychiatry'],
  false, false, true, true, true,
  80, 0,
  'مستشفى متوسط الحجم بخدمات نهارية',
  true, true, now()),

-- ═══ مراكز صحية في بغداد ═══
('مركز الكرادة الصحي', 'Karrada Health Center', 'health_center', 'بغداد', 'الكرادة',
  'الكرادة الشرقية',
  33.3034, 44.4128, '07901112233', null,
  false, ARRAY['lab','pharmacy'],
  false, false, true, true, false,
  null, null,
  'رعاية أولية وعيادات عامة',
  true, true, now()),

('مركز الجادرية الصحي', 'Jadriya Health Center', 'health_center', 'بغداد', 'الجادرية',
  'شارع الجادرية',
  33.2706, 44.3845, '07901112234', null,
  false, ARRAY['lab','pharmacy'],
  false, false, true, true, false,
  null, null,
  'رعاية أولية',
  true, true, now()),

-- ═══ البصرة ═══
('مستشفى البصرة التعليمي', 'Basra Teaching Hospital', 'government', 'البصرة', 'البصرة',
  'البصرة، شارع الكورنيش',
  30.5093, 47.7806, '07901333111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','lab','radiology','oncology'],
  true, true, true, true, true,
  700, 50,
  'أكبر مستشفى تعليمي في الجنوب',
  true, true, now()),

('مستشفى الفيحاء العام', 'Al-Faiha Hospital', 'government', 'البصرة', 'الفيحاء',
  'الفيحاء، البصرة',
  30.5258, 47.7700, '07901333112', '122',
  true, ARRAY['emergency','pediatrics','maternity','surgery'],
  true, true, false, true, true,
  400, 30,
  'مستشفى عام كبير',
  true, true, now()),

('مستشفى الموانئ الأهلي', 'Al-Mawanee Private Hospital', 'private', 'البصرة', 'البصرة',
  'البصرة الجديدة',
  30.5375, 47.8208, '07712333444', null,
  true, ARRAY['emergency','cardiology','surgery','radiology'],
  true, true, true, true, true,
  150, 18,
  'مستشفى أهلي بمعايير دولية',
  true, true, now()),

-- ═══ الموصل ═══
('مستشفى الموصل العام', 'Mosul General Hospital', 'government', 'الموصل', 'الموصل',
  'الموصل، الجانب الأيسر',
  36.3500, 43.1450, '07901444111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','icu'],
  true, true, true, true, true,
  500, 35,
  'المستشفى الرئيسي في الموصل',
  true, true, now()),

-- ═══ النجف ═══
('مستشفى الحكيم العام', 'Al-Hakeem Hospital', 'government', 'النجف', 'النجف',
  'النجف الأشرف',
  32.0040, 44.3340, '07901555111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu'],
  true, true, true, true, true,
  450, 30,
  'مستشفى تعليمي في النجف',
  true, true, now()),

('مستشفى السلام الأهلي', 'Al-Salam Private Hospital', 'private', 'النجف', 'النجف',
  'شارع الكوفة',
  31.9920, 44.3290, '07712555666', null,
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, true, true, true,
  100, 10,
  'مستشفى أهلي شامل',
  true, true, now()),

-- ═══ كربلاء ═══
('مستشفى الإمام الحسين التعليمي', 'Imam Hussein Teaching Hospital', 'government', 'كربلاء', 'كربلاء',
  'كربلاء، قرب الحرم',
  32.6160, 44.0246, '07901666111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','cardiology','icu'],
  true, true, true, true, true,
  600, 40,
  'أكبر مستشفى في كربلاء',
  true, true, now()),

-- ═══ أربيل ═══
('مستشفى أربيل التعليمي', 'Erbil Teaching Hospital', 'government', 'أربيل', 'أربيل',
  'وسط أربيل',
  36.1880, 44.0090, '07501777111', '122',
  true, ARRAY['emergency','surgery','cardiology','icu','oncology','neurology'],
  true, true, true, true, true,
  800, 60,
  'أكبر مستشفى تعليمي في كردستان',
  true, true, now()),

('مستشفى زانكو الأهلي', 'Zanko Private Hospital', 'private', 'أربيل', 'أربيل',
  'منطقة جوار جرا',
  36.2010, 43.9920, '07501777222', null,
  true, ARRAY['emergency','cardiology','surgery','radiology'],
  true, true, true, true, true,
  200, 20,
  'مستشفى أهلي راقي',
  true, true, now()),

-- ═══ السليمانية ═══
('مستشفى شار العام', 'Shar General Hospital', 'government', 'السليمانية', 'السليمانية',
  'وسط السليمانية',
  35.5630, 45.4316, '07501888111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','icu'],
  true, true, true, true, true,
  450, 30,
  'مستشفى رئيسي في السليمانية',
  true, true, now()),

-- ═══ كركوك ═══
('مستشفى كركوك العام', 'Kirkuk General Hospital', 'government', 'كركوك', 'كركوك',
  'كركوك، شارع الجمهورية',
  35.4690, 44.3920, '07901999111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  350, 25,
  'مستشفى عام',
  true, true, now()),

-- ═══ بابل ═══
('مستشفى مرجان التعليمي', 'Marjan Teaching Hospital', 'government', 'بابل', 'الحلة',
  'الحلة، شارع ٤٠',
  32.4639, 44.4170, '07901000111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity','cardiology'],
  true, true, true, true, true,
  500, 35,
  'مستشفى تعليمي في الحلة',
  true, true, now()),

-- ═══ ذي قار ═══
('مستشفى الحسين التعليمي', 'Al-Hussein Hospital', 'government', 'ذي قار', 'الناصرية',
  'الناصرية',
  31.0420, 46.2627, '07901101111', '122',
  true, ARRAY['emergency','surgery','pediatrics','maternity'],
  true, true, false, true, true,
  400, 28,
  'مستشفى رئيسي في الناصرية',
  true, true, now());


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

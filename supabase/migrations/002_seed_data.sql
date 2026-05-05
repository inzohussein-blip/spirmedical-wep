-- ============================================================================
-- Spir Medical - Seed Data للاختبار
-- شغّل هذا بعد 001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- صيدليات تجريبية في النجف
-- ============================================================================

-- ملاحظة: في الإنتاج، الصيدليات تُسجّل عبر التطبيق وتربط بـ profile
-- هذه بيانات اختبارية فقط (بدون owner_profile_id)

INSERT INTO pharmacies (id, name, license_number, phone, address, city, location, delivers, delivery_fee_iqd, rating_avg) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'صيدلية الشفاء',
    'PH-NJF-001',
    '+9647801234567',
    'شارع الكوفة، حي الأطباء، النجف',
    'النجف',
    ST_SetSRID(ST_MakePoint(44.3464, 32.0085), 4326)::geography,
    TRUE,
    3000,
    4.5
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'صيدلية النور',
    'PH-NJF-002',
    '+9647712345678',
    'شارع الإمام علي، النجف',
    'النجف',
    ST_SetSRID(ST_MakePoint(44.3500, 32.0100), 4326)::geography,
    TRUE,
    2500,
    4.7
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'صيدلية الحياة',
    'PH-NJF-003',
    '+9647901111111',
    'حي السلام، النجف',
    'النجف',
    ST_SetSRID(ST_MakePoint(44.3420, 32.0050), 4326)::geography,
    FALSE,
    0,
    4.2
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'صيدلية الرحمة',
    'PH-NJF-004',
    '+9647702222222',
    'شارع الميدان، النجف',
    'النجف',
    ST_SetSRID(ST_MakePoint(44.3550, 32.0150), 4326)::geography,
    TRUE,
    4000,
    4.8
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'صيدلية الزهراء',
    'PH-NJF-005',
    '+9647803333333',
    'حي الجمهورية، النجف',
    'النجف',
    ST_SetSRID(ST_MakePoint(44.3380, 32.0020), 4326)::geography,
    TRUE,
    3500,
    4.3
  );

-- ============================================================================
-- ربط الأدوية بالصيدليات (المخزون)
-- ============================================================================

-- صيدلية الشفاء - أدوية شاملة
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, in_stock, price_iqd)
SELECT '11111111-1111-1111-1111-111111111111', id, TRUE,
  CASE
    WHEN name_ar = 'بانادول' THEN 2500
    WHEN name_ar = 'فولتارين' THEN 4500
    WHEN name_ar = 'أوغمنتين' THEN 12000
    WHEN name_ar = 'ميتفورمين' THEN 6000
    WHEN name_ar = 'غلوكوفاج' THEN 8000
    WHEN name_ar = 'كونكور' THEN 9500
    WHEN name_ar = 'نورفاسك' THEN 7500
    WHEN name_ar = 'نيكسيوم' THEN 18000
    WHEN name_ar = 'زيرتيك' THEN 5500
    WHEN name_ar = 'بروفين' THEN 3500
    ELSE 5000
  END
FROM medications;

-- صيدلية النور - أدوية أكثر شمولاً + أسعار أرخص
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, in_stock, price_iqd)
SELECT '22222222-2222-2222-2222-222222222222', id, TRUE,
  CASE
    WHEN name_ar = 'بانادول' THEN 2300
    WHEN name_ar = 'فولتارين' THEN 4200
    WHEN name_ar = 'أوغمنتين' THEN 11500
    WHEN name_ar = 'ميتفورمين' THEN 5800
    WHEN name_ar = 'غلوكوفاج' THEN 7800
    WHEN name_ar = 'كونكور' THEN 9000
    WHEN name_ar = 'نورفاسك' THEN 7200
    WHEN name_ar = 'أنسولين لانتوس' THEN 45000
    WHEN name_ar = 'فينترولين' THEN 14000
    WHEN name_ar = 'نيكسيوم' THEN 17500
    ELSE 4800
  END
FROM medications;

-- صيدلية الحياة - مخزون محدود
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, in_stock, price_iqd)
SELECT '33333333-3333-3333-3333-333333333333', id, TRUE,
  CASE
    WHEN name_ar = 'بانادول' THEN 2700
    WHEN name_ar = 'فولتارين' THEN 4800
    WHEN name_ar = 'زيرتيك' THEN 5800
    WHEN name_ar = 'بروفين' THEN 3700
    ELSE 5200
  END
FROM medications WHERE name_ar IN ('بانادول', 'فولتارين', 'زيرتيك', 'بروفين', 'نيكسيوم');

-- صيدلية الرحمة - أسعار premium
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, in_stock, price_iqd)
SELECT '44444444-4444-4444-4444-444444444444', id, TRUE,
  CASE
    WHEN name_ar = 'بانادول' THEN 2800
    WHEN name_ar = 'فولتارين' THEN 5000
    WHEN name_ar = 'أوغمنتين' THEN 12500
    WHEN name_ar = 'ميتفورمين' THEN 6500
    WHEN name_ar = 'غلوكوفاج' THEN 8500
    WHEN name_ar = 'كونكور' THEN 10000
    WHEN name_ar = 'نورفاسك' THEN 8000
    WHEN name_ar = 'أنسولين لانتوس' THEN 48000
    WHEN name_ar = 'فينترولين' THEN 15000
    WHEN name_ar = 'نيكسيوم' THEN 19000
    WHEN name_ar = 'زيرتيك' THEN 6000
    WHEN name_ar = 'بروفين' THEN 3800
    ELSE 5500
  END
FROM medications;

-- صيدلية الزهراء - أساسيات فقط
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, in_stock, price_iqd)
SELECT '55555555-5555-5555-5555-555555555555', id, TRUE, 4500
FROM medications WHERE name_ar IN ('بانادول', 'فولتارين', 'بروفين', 'زيرتيك');

-- ============================================================================
-- ⚠️ ملاحظة عن الأطباء/الفنيين:
-- ============================================================================
-- لا يمكن إضافة أطباء عبر SQL لأن `profiles` يتطلب وجود `auth.users` أولاً
-- لإضافة أطباء تجريبيين:
-- 1. سجّل في التطبيق برقم هاتف (مثلاً +9647701111001) كمريض
-- 2. عبر SQL Editor، حدّث صلاحيتهم:
--    UPDATE profiles SET role = 'doctor' WHERE phone = '+9647701111001';
-- 3. أنشئ provider_profile لهم:
--    INSERT INTO provider_profiles (profile_id, license_number, specialty,
--      base_consultation_fee_iqd, is_available, current_location, rating_avg, rating_count)
--    VALUES ('USER_UUID', 'DR-001', 'طب عام', 15000, TRUE,
--      ST_SetSRID(ST_MakePoint(44.3464, 32.0085), 4326)::geography, 4.7, 23);

-- ============================================================================
-- إحصائيات للتحقق
-- ============================================================================
SELECT 'lab_tests' AS table_name, COUNT(*) FROM lab_tests
UNION ALL
SELECT 'medications', COUNT(*) FROM medications
UNION ALL
SELECT 'pharmacies', COUNT(*) FROM pharmacies
UNION ALL
SELECT 'pharmacy_inventory', COUNT(*) FROM pharmacy_inventory;

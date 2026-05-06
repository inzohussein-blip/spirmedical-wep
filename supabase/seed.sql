-- ============================================================
-- Seed data للاختبار المحلي
-- ============================================================
-- ⚠️ لا تشغّل هذا في الإنتاج!
-- ============================================================

-- لاختبار الحجوزات، يجب أولاً إنشاء مستخدم عبر Supabase Auth
-- ثم تشغيل هذا الملف لإضافة بيانات وهمية

-- مثال — استبدل user_id بـ UUID فعلي من جدول users:
/*
INSERT INTO public.appointments (user_id, service_type, scheduled_at, address, notes, status)
VALUES
  (
    'YOUR-USER-UUID-HERE',
    'سحب دم منزلي',
    NOW() + INTERVAL '2 days',
    'بغداد - حي الجامعة - شارع 14',
    'فحص شامل دوري',
    'pending'
  ),
  (
    'YOUR-USER-UUID-HERE',
    'استشارة طبية',
    NOW() + INTERVAL '5 days',
    'بغداد - الكرادة',
    NULL,
    'confirmed'
  ),
  (
    'YOUR-USER-UUID-HERE',
    'فحوصات مختبرية',
    NOW() - INTERVAL '7 days',
    'بغداد - المنصور',
    'فحص فيتامين د',
    'completed'
  );
*/

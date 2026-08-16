-- ════════════════════════════════════════════════════════════════════════
-- 0026: ترميم قوالب الإشعارات — كلّ إشعارٍ في التطبيق كان يفشل صامتاً
-- ════════════════════════════════════════════════════════════════════════
--
-- `enqueueNotification` في `src/lib/notifications.ts` تبدأ بجلب القالب من
-- `notification_templates`، وتفشل مُغلَقةً إن لم تجده:
--
--     if (tplError || !template) {
--       return { ok: false, error: `Template not found: ${key}` };
--     }
--
-- والجدول في القاعدة الحيّة **صفر صفوف**. فلا يدخل الطابورَ إشعارٌ واحد:
-- لا تأكيد حجز، ولا تعيين اختصاصيّ، ولا نتائج مختبر، ولا حجز صيدلية، ولا
-- قبول مختصّ ولا رفضه. الاستدعاء يُرجع `ok: false` والمُنادي يمضي، فلا
-- خطأ يظهر لأحد ولا في سجلّ.
--
-- والسبب أنّ **الترحيلات 0001–0010 ليست في سجلّ الترحيلات أصلاً**. أوّل ما
-- يسجّله السجلّ `grant_catalog_public_read_web_app`، ثمّ السلسلة من 0011.
-- الجداول التسعون موجودة — أُنشئت بطريقةٍ أخرى — لكنّ عبارات الإدراج في
-- 0002 و0003 و0004 و0005 لم تُنفَّذ قطّ.
--
-- ولا تُصلح ذلك إعادةُ تشغيل تلك الملفّات: فيها `CREATE TABLE` تفترض غياب
-- الجداول. فهذا الترحيل ينقل عبارات الإدراج **وحدها**، منسوخةً حرفياً من
-- مصادرها (وُلِّد الملفّ برمجياً من تلك الملفّات لا بالنسخ اليدويّ)، مع
-- `ON CONFLICT (key) DO NOTHING` فلا يدوس تعديلاً لاحقاً.
--
-- ملاحظةٌ على مراجعةٍ سابقة لهذا الملفّ: ظننتُ أوّلاً أنّ ثلاثة مفاتيح
-- (`order_cancelled` و`specialist_approved` و`specialist_rejected`) غير
-- معرَّفةٍ في أيّ ترحيل، وكتبتُ لها نصوصاً من عندي. كان الاستنتاج خاطئاً:
-- سببه نافذة `-A 40` في أمر الاستخراج، و`order_cancelled` يقع بعد ٤٥ سطراً
-- من بداية الإدراج في 0002. الثمانية كلّها معرَّفة هناك. فحُذفت نصوصي
-- الخمسة أدناه ليحلّ محلّها نصّ المشروع الأصليّ.

-- إبطال النسخة المُستبدَلة من هذا الترحيل (لا أثر لها على قاعدةٍ جديدة)
DELETE FROM public.notification_templates
WHERE key IN ('appointment_confirmed','order_assigned','order_cancelled',
              'specialist_approved','specialist_rejected')
  AND created_at > now() - interval '1 day';

-- ← 0002_communication.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar, variables) VALUES
('appointment_confirmed', 'تأكيد الحجز', 'whatsapp',
'مرحباً {{patient_name}} 👋

تم تأكيد حجزك في *سباير ميديكال*:

📋 الخدمة: {{service}}
📅 الموعد: {{date}}
📍 العنوان: {{address}}

سيتم التواصل معك قريباً.
بصحة وسلامة 🌿',
ARRAY['patient_name', 'service', 'date', 'address']),

('order_assigned', 'تعيين اختصاصي', 'whatsapp',
'مرحباً {{patient_name}} 👋

تم تعيين {{specialist_name}} لطلبك:
📋 {{service}}
📅 {{date}}

📞 رقم التواصل: {{specialist_phone}}

سباير ميديكال 🌿',
ARRAY['patient_name', 'specialist_name', 'service', 'date', 'specialist_phone']),

('order_in_progress', 'بدء الجلسة', 'whatsapp',
'مرحباً {{patient_name}} 👋

الاختصاصي بدأ جلستك الآن.
دمت بخير 🌿

سباير ميديكال',
ARRAY['patient_name']),

('order_completed', 'إكمال الجلسة', 'whatsapp',
'شكراً لاستخدامك سباير ميديكال 🌿

تم إنجاز جلسة *{{service}}* بنجاح.
نتمنى لك الصحة والعافية.

⭐ يسعدنا تقييمك للخدمة:
{{rating_link}}',
ARRAY['patient_name', 'service', 'rating_link']),

('order_cancelled', 'إلغاء الحجز', 'whatsapp',
'مرحباً {{patient_name}}،

نأسف لإبلاغك أن حجزك بتاريخ {{date}} تم إلغاؤه.

السبب: {{reason}}

للاستفسار، تواصل معنا.

سباير ميديكال 🌿',
ARRAY['patient_name', 'date', 'reason']),

('specialist_approved', 'الموافقة على الاختصاصي', 'whatsapp',
'تهانينا {{specialist_name}} 🎉

تم اعتماد حسابك في *سباير ميديكال* كـ {{specialist_type}}.

يمكنك الآن استقبال الطلبات.
ابدأ الآن: spirmedical.com/specialist

سباير ميديكال 🌿',
ARRAY['specialist_name', 'specialist_type']),

('specialist_rejected', 'رفض طلب الاختصاصي', 'whatsapp',
'عزيزي {{specialist_name}}،

نأسف لإبلاغك أن طلب تسجيلك في سباير ميديكال لم يُقبل في الوقت الحالي.

السبب: {{reason}}

يمكنك إعادة التقديم بعد معالجة الملاحظات.',
ARRAY['specialist_name', 'reason']),

('appointment_reminder', 'تذكير بالموعد', 'whatsapp',
'⏰ تذكير: لديك موعد غداً

📋 {{service}}
🕒 {{time}}
📍 {{address}}

اختصاصي: {{specialist_name}}

سباير ميديكال 🌿',
ARRAY['service', 'time', 'address', 'specialist_name'])

ON CONFLICT (key) DO NOTHING;

-- ← 0002_communication.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar, variables)
VALUES (
  'otp_authentication',
  'رمز التحقق',
  'whatsapp',
  '{{otp_code}} هو رمز التحقق الخاص بك. لأمانك، لا تُشارك هذا الرمز مع أحد.',
  ARRAY['otp_code']
)
ON CONFLICT (key) DO NOTHING;

-- ← 0003_health_records.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES (
  'lab_results_ready',
  'نتائج التحاليل جاهزة 🎉',
  'push',
  'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.'
) ON CONFLICT (key) DO NOTHING;

-- ← 0004_services_catalog.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  ('vaccine_reminder', 'تذكير: موعد لقاح قريب 💉', 'push', 'لديك جرعة لقاح مستحقّة قريباً'),
  ('vaccine_overdue', 'تنبيه: جرعة لقاح متأخّرة ⚠️', 'push', 'فاتك موعد جرعة - راجع جدول اللقاحات'),
  ('vaccine_appointment_booked', 'تأكيد موعد اللقاح ✓', 'push', 'تم حجز موعد اللقاح بنجاح')
ON CONFLICT (key) DO NOTHING;

-- ← 0005_specialists_ratings.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'nursing_request_accepted',
    'تمّ قبول طلب التمريض ✓',
    'push',
    'الممرض في الطريق إليك'
  ),
  (
    'nursing_visit_completed',
    'انتهت زيارة التمريض ✓',
    'push',
    'كيف كانت تجربتك مع الممرض؟ قيّمها الآن.'
  )
ON CONFLICT (key) DO NOTHING;

-- ← 0005_specialists_ratings.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'doctor_appointment_confirmed',
    'تمّ تأكيد موعد الطبيب ✓',
    'push',
    'موعدك مع الطبيب جاهز'
  ),
  (
    'consultation_new_message',
    'رسالة جديدة من الطبيب 💬',
    'push',
    'افتح المحادثة لقراءة الرد'
  ),
  (
    'video_session_starting',
    'استشارة الفيديو على وشك البدء 📹',
    'push',
    'انضم الآن'
  ),
  (
    'doctor_subscription_renewed',
    'تجديد اشتراك الطبيب ✓',
    'push',
    'تم تجديد اشتراكك بنجاح'
  )
ON CONFLICT (key) DO NOTHING;

-- ← 0005_specialists_ratings.sql
INSERT INTO public.notification_templates (key, name_ar, channel, body_ar)
VALUES 
  (
    'pharmacy_reservation_new',
    'حجز دواء جديد 💊',
    'push',
    'لديك حجز جديد من مريض - يرجى الرد'
  ),
  (
    'pharmacy_reservation_confirmed',
    'تأكيد الحجز ✓',
    'push',
    'الصيدلية أكّدت توفّر الأدوية'
  ),
  (
    'pharmacy_reservation_partial',
    'تأكيد جزئي ⚠️',
    'push',
    'بعض الأدوية فقط متوفّرة'
  ),
  (
    'pharmacy_reservation_rejected',
    'الأدوية غير متوفّرة',
    'push',
    'للأسف الأدوية غير متوفّرة حالياً'
  ),
  (
    'pharmacy_reservation_ready',
    'الدواء جاهز للاستلام 🎉',
    'push',
    'يمكنك المرور لاستلامه'
  ),
  (
    'medication_reminder',
    'تذكير بموعد الدواء ⏰',
    'push',
    'حان وقت تناول الدواء'
  )
ON CONFLICT (key) DO NOTHING;

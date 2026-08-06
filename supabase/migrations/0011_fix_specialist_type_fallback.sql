-- ════════════════════════════════════════════════════════════════════
-- 0011 — مواءمة الاشتقاق الاحتياطي لنوع المختصّ مع كتالوج الخدمات الحالي
-- ════════════════════════════════════════════════════════════════════
--
-- المشكلة:
-- `determine_specialist_type` (0005) تعرف معرّفات خدماتٍ لم تعد موجودة:
--   lab-test · injection · vaccination · consultation-general ·
--   consultation-specialist · consultation-video · pharmacy-consultation ·
--   drug-interaction · physiotherapy · psychology · nutrition
--
-- بينما كتالوج الخدمات الفعلي (`src/lib/services/services-data.ts`) هو:
--   blood-draw · home-nursing · iv-fluid · covid-test · video-consult ·
--   phone-consult · chat-consult · pharmacy-delivery · hospital-booking ·
--   family-doctor
--
-- التقاطع بينهما **خدمتان فقط** (blood-draw، home-nursing)؛ وكل ما عداهما
-- يسقط على `ELSE 'doctor'`. فالمشغّل `trg_auto_required_specialist` — وهو
-- شبكة الأمان حين لا يضبط التطبيق العمود — كان يوجّه:
--   • covid-test       → doctor   (والصواب lab_analyst)
--   • iv-fluid         → doctor   (والصواب nurse)
--   • pharmacy-delivery→ doctor   (والصواب pharmacist)
-- أي أنّ الطلب يظهر لمختصٍّ من نوعٍ خاطئ، ولا يصل مَن ينفّذه فعلاً.
--
-- ملاحظة: مسارات الإنشاء في التطبيق تضبط `required_specialist_type` صراحةً
-- من الكتالوج، والمشغّل لا يتدخّل إلا حين يكون العمود NULL. هذا الترحيل
-- يُصلح شبكة الأمان نفسها كي لا تُسكِت خطأً مستقبلياً بقيمةٍ خاطئة.
--
-- المعرّفات القديمة تبقى مدعومة (توافقاً مع صفوفٍ تاريخية) وتُضاف الحالية.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.determine_specialist_type(service_id text)
RETURNS text AS $$
BEGIN
  RETURN CASE
    -- ── تحاليل ومختبر ──
    WHEN service_id IN ('blood-draw', 'covid-test', 'lab-test') THEN 'lab_analyst'

    -- ── تمريض منزلي ──
    WHEN service_id IN ('home-nursing', 'iv-fluid', 'injection', 'vaccination') THEN 'nurse'

    -- ── استشارات طبية ──
    WHEN service_id IN (
      'video-consult', 'phone-consult', 'chat-consult', 'family-doctor',
      'doctor-appointment',
      'consultation-general', 'consultation-specialist', 'consultation-video'
    ) THEN 'doctor'

    -- ── صيدلة ──
    WHEN service_id IN (
      'pharmacy-delivery', 'pharmacy-consultation', 'drug-interaction'
    ) THEN 'pharmacist'

    -- ── تخصّصات أخرى ──
    WHEN service_id IN ('physiotherapy') THEN 'physio'
    WHEN service_id IN ('psychology') THEN 'psychologist'
    WHEN service_id IN ('nutrition') THEN 'nutritionist'

    -- ── خدمات المنشأة: ينسّقها الأدمن ولا يُرسَل لها مختصّ ──
    -- NULL مقصود هنا ومتّسق مع الكتالوج (لا `specialistType` لها).
    WHEN service_id IN ('hospital-booking') THEN NULL

    -- ── خدمة غير معروفة ──
    -- نُبقي 'doctor' عمداً بدل NULL: النوع الخاطئ يعني ظهور الطلب في طابورٍ
    -- غير مناسب — وهو وضعٌ مرئيّ يمكن للأدمن تصحيحه بإعادة الإسناد؛ أمّا NULL
    -- فيعني اختفاء الطلب عن **كل** المختصّين، وهو الخلل الأسوأ الذي نتفاداه.
    ELSE 'doctor'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- المشغّل نفسه لا يتغيّر: يملأ العمود فقط حين يكون NULL و`service_id` معروفاً.
-- (يبقى كما عُرِّف في 0005 — لا حاجة لإعادة إنشائه.)

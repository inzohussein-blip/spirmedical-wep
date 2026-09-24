-- ═══════════════════════════════════════════════════════════════════
-- 0045 — إخفاء أرقام المنشآت المُختلَقة
-- ═══════════════════════════════════════════════════════════════════
--
-- كلُّ أرقام المستشفيات والصيدليات والمختبرات والعيادات في الإنتاج كانت
-- مُختلَقة: كتلٌ متسلسلة (07700000001…، 07712345001…، 07901500001…)
-- مقرونةٌ بأسماء منشآتٍ حقيقية. زرُّ «اتصل» كان يطلب رقمَ غريب.
--
-- قرار المالك: يُحذف جزءٌ من الرقم ويبقى «0770 xxx xxxx» حتى يُدخَل الرقمُ
-- الموثَّق من لوحة الإدارة. والواجهة (PhoneLink / isDialable) لا تجعل رقماً
-- فيه «x» رابطَ اتصالٍ أبداً.
--
-- يُستثنى ما طولُه ٤ أرقامٍ فأقلّ: «122» رقمُ إسعافٍ حكوميّ حقيقيّ.
-- ومُعاد التشغيل بلا أثر: ما فيه «x» لا يُمسّ.
--
-- قِيس قبل التطبيق في BEGIN … ROLLBACK: 102 صفّاً متأثّراً عبر 8 أعمدة، و15
-- «122» باقية.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION pg_temp.mask_phone(v text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT CASE
    WHEN v IS NULL OR v ~ 'x' OR length(regexp_replace(v, '\D', '', 'g')) <= 4 THEN v
    WHEN v ~ '^\+?964' THEN
      (CASE WHEN v LIKE '+%' THEN '+' ELSE '' END) || '964 '
      || substr(regexp_replace(v, '\D', '', 'g'), 4, 3) || ' xxx xxxx'
    ELSE substr(regexp_replace(v, '\D', '', 'g'), 1, 4) || ' xxx xxxx'
  END
$$;

UPDATE public.hospitals      SET phone = pg_temp.mask_phone(phone)
  WHERE phone IS DISTINCT FROM pg_temp.mask_phone(phone);
UPDATE public.hospitals      SET phone_emergency = pg_temp.mask_phone(phone_emergency)
  WHERE phone_emergency IS DISTINCT FROM pg_temp.mask_phone(phone_emergency);
UPDATE public.pharmacies     SET phone = pg_temp.mask_phone(phone)
  WHERE phone IS DISTINCT FROM pg_temp.mask_phone(phone);
UPDATE public.pharmacies     SET whatsapp = pg_temp.mask_phone(whatsapp)
  WHERE whatsapp IS DISTINCT FROM pg_temp.mask_phone(whatsapp);
UPDATE public.partner_labs   SET phone = pg_temp.mask_phone(phone)
  WHERE phone IS DISTINCT FROM pg_temp.mask_phone(phone);
UPDATE public.doctors        SET clinic_phone = pg_temp.mask_phone(clinic_phone)
  WHERE clinic_phone IS DISTINCT FROM pg_temp.mask_phone(clinic_phone);
UPDATE public.optical_stores SET phone = pg_temp.mask_phone(phone)
  WHERE phone IS DISTINCT FROM pg_temp.mask_phone(phone);
UPDATE public.dental_clinics SET phone = pg_temp.mask_phone(phone)
  WHERE phone IS DISTINCT FROM pg_temp.mask_phone(phone);

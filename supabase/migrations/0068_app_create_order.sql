-- ════════════════════════════════════════════════════════════════════════
-- 0068: إنشاء الطلب في القاعدة — بلا أسعار
-- ════════════════════════════════════════════════════════════════════════
--
-- في الويب يُنشأ الطلب في Server Actions (`createBloodDrawOrder`،
-- `createNursingAppointment`). التطبيق لا يصلها، فالإنشاء هنا.
--
-- ─── لا أسعار ───
-- قرار المالك (17 تشرين الأول، وأكّده للتطبيق في تشرين الثاني): التحاليل وسحب
-- الدم بلا سعرٍ أبداً، والسعرُ يُتّفق عليه مع المختصّ (`lib/config/pricing.ts` في
-- الويب: `SHOW_PRICES = false`). فلا يحسب الخادم سعراً ولا يقبله من العميل:
-- `estimated_price` يبقى NULL، وحقول المبالغ في `lab_orders` صفر. المبلغ الفعليّ
-- يسجّله المختصّ عند استلام النقد (`record_cash_payment`، 0067).
--
-- `create_order(service, payload, idempotency_key)`:
--   • ضغطتان على «تأكيد» بنفس المفتاح → طلبٌ واحد (جدول `order_requests`).
--   • 10 طلبات/ساعة لكلّ مستخدم (`consume_rate_limit` من 0027).
--   • لا طلب بلا مختصٍّ معتمَد من النوع المطلوب (كـ `isSpecialistAvailable` في الويب).
--   • لا يُقبل إلّا تحليلٌ أو إجراءٌ معروف في `service_catalog`.
--   • طلب التحاليل + الموعد + الدفعة المعلّقة + الحدث + الإشعارات في معاملةٍ واحدة
--     (الويب يحذف `lab_orders` يدوياً إن فشل الموعد؛ هنا لا يلزم).
--
-- لا ملاحظات نصّيّة حرّة بعد: الويب يشفّرها بمفتاحٍ في الخادم (`notes_encrypted`)
-- ولا نضع نصّاً طبّياً غير مشفّر في القاعدة. تُضاف عبر Edge Function لاحقاً.
--
-- الكتالوج (التحاليل والإجراءات المقبولة) منسوخٌ من الويب (`blood-tests-data.ts`،
-- `NursingFlow.tsx`)؛ اختبار `home-services.test.ts` يطابقه بالكود.
-- ════════════════════════════════════════════════════════════════════════

-- ─── ١) كتالوج الخدمات (ما يُقبل في الطلب — بلا أسعار) ───
CREATE TABLE IF NOT EXISTS public.service_catalog (
  kind             text NOT NULL CHECK (kind IN ('blood_test', 'nursing')),
  item_id          text NOT NULL CHECK (length(item_id) BETWEEN 1 AND 64),
  label_ar         text NOT NULL CHECK (length(label_ar) BETWEEN 1 AND 120),
  fasting_hours    smallint NOT NULL DEFAULT 0 CHECK (fasting_hours BETWEEN 0 AND 24),
  duration_minutes smallint CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 5 AND 600),
  sort_order       smallint NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, item_id)
);

INSERT INTO public.service_catalog (kind, item_id, label_ar, fasting_hours, sort_order) VALUES
  ('blood_test', 'cbc', 'تعداد الدم الكامل (CBC)', 0, 0),
  ('blood_test', 'fbs', 'سكر الدم الصائم (FBS)', 8, 1),
  ('blood_test', 'hba1c', 'السكر التراكمي (HbA1c)', 0, 2),
  ('blood_test', 'lipid', 'الدهون الكاملة (Lipid Profile)', 12, 3),
  ('blood_test', 'tsh', 'هرمون الغدة الدرقية (TSH)', 0, 4),
  ('blood_test', 'lft', 'وظائف الكبد (LFT)', 0, 5),
  ('blood_test', 'rft', 'وظائف الكلى (RFT)', 0, 6),
  ('blood_test', 'vit-d', 'فيتامين د (Vitamin D)', 0, 7),
  ('blood_test', 'vit-b12', 'فيتامين ب12 (Vitamin B12)', 0, 8),
  ('blood_test', 'crp', 'الكشف عن الالتهابات (CRP)', 0, 9),
  ('blood_test', 'insulin-resistance', 'مقاومة الأنسولين (HOMA-IR)', 12, 10),
  ('blood_test', 'ferritin', 'الفيريتين (مخزون الحديد) (Ferritin)', 0, 11),
  ('blood_test', 'thyroid-full', 'الغدة الدرقية الكاملة (T3/T4/TSH)', 0, 12),
  ('blood_test', 'pregnancy-bhcg', 'فحص الحمل بالدم (B-hCG)', 0, 13)
ON CONFLICT (kind, item_id) DO NOTHING;

INSERT INTO public.service_catalog (kind, item_id, label_ar, duration_minutes, sort_order) VALUES
  ('nursing', 'injection', 'زرق إبر', 30, 0),
  ('nursing', 'iv', 'تركيب مغذٍ وريدي', 60, 1),
  ('nursing', 'cannula', 'تركيب كانيولا', 30, 2),
  ('nursing', 'wound_care', 'تضميد جروح', 45, 3),
  ('nursing', 'diabetic_foot', 'القدم السكري', 60, 4),
  ('nursing', 'catheter', 'قسطرة بولية', 45, 5),
  ('nursing', 'vaccination', 'تطعيمات', 20, 6)
ON CONFLICT (kind, item_id) DO NOTHING;

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_catalog_public_read ON public.service_catalog;
CREATE POLICY service_catalog_public_read ON public.service_catalog FOR SELECT USING (true);
REVOKE ALL ON public.service_catalog FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.service_catalog TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO service_role;

-- ─── ٢) مفاتيح منع التكرار ───
CREATE TABLE IF NOT EXISTS public.order_requests (
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  idem_key       text NOT NULL CHECK (length(idem_key) BETWEEN 8 AND 80),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  result         jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idem_key)
);
CREATE INDEX IF NOT EXISTS order_requests_appointment_idx ON public.order_requests (appointment_id);
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_requests TO service_role;

-- ─── ٣) إتاحة الخدمة (للضيف أيضاً — «أعلِمني حين تتوفّر») ───
CREATE OR REPLACE FUNCTION public.get_service_availability(p_service text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type text := CASE p_service WHEN 'blood-draw' THEN 'lab_analyst' WHEN 'home-nursing' THEN 'nurse' END;
BEGIN
  IF v_type IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unknown_service', 'error', 'خدمةٌ غير معروفة');
  END IF;
  RETURN jsonb_build_object('ok', true, 'available', EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.role = 'specialist' AND u.specialist_type = v_type
       AND u.approval_status = 'approved' AND NOT coalesce(u.is_suspended, false)));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_service_availability(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_service_availability(text) TO anon, authenticated, service_role;

-- ─── ٤) إنشاء الطلب ───
CREATE OR REPLACE FUNCTION public.create_order(
  p_service         text,
  p_payload         jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_prev      jsonb;
  v_rl        record;
  v_type      text;
  v_when      timestamptz;
  v_address   text := btrim(coalesce(p_payload->>'address', ''));
  v_lat       double precision;
  v_lng       double precision;
  v_acc       real;
  v_family    uuid;
  v_method    text := coalesce(nullif(p_payload->>'payment_method', ''), 'cash');
  v_tests     text[];
  v_bad       text[];
  v_fasting   integer := 0;
  v_duration  integer;
  v_label     text;
  v_proc      public.service_catalog%ROWTYPE;
  v_gender    text := coalesce(nullif(p_payload->>'nurse_gender_preference', ''), 'any');
  v_allergy   jsonb;
  v_age       integer;
  v_pgender   text := nullif(p_payload->>'patient_gender', '');
  v_condition text := left(nullif(btrim(p_payload->>'patient_condition'), ''), 200);
  v_lab_order uuid;
  v_appt      uuid;
  v_result    jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthenticated', 'error', 'سجّل الدخول أوّلاً');
  END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) NOT BETWEEN 8 AND 80 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_key', 'error', 'طلبٌ غير صالح');
  END IF;
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_payload', 'error', 'طلبٌ غير صالح');
  END IF;

  -- إعادة الإرسال نفسه → النتيجة نفسها
  SELECT result INTO v_prev FROM public.order_requests WHERE user_id = v_uid AND idem_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_prev || jsonb_build_object('replayed', true);
  END IF;

  v_type := CASE p_service WHEN 'blood-draw' THEN 'lab_analyst' WHEN 'home-nursing' THEN 'nurse' END;
  IF v_type IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unknown_service', 'error', 'خدمةٌ غير معروفة');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_uid AND role = 'patient' AND NOT coalesce(is_suspended, false)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'الطلب من حساب مراجع فقط');
  END IF;

  SELECT * INTO v_rl FROM public.consume_rate_limit('order:create:' || v_uid, 10, 3600);
  IF NOT v_rl.allowed THEN
    RETURN jsonb_build_object('ok', false, 'code', 'rate_limited',
      'error', format('طلبات كثيرة. حاول بعد %s دقيقة', ceil(v_rl.retry_after_seconds / 60.0)));
  END IF;

  -- ── الحقول المشتركة
  BEGIN
    v_when := (p_payload->>'scheduled_at')::timestamptz;
  EXCEPTION WHEN others THEN
    v_when := NULL;
  END;
  IF v_when IS NULL OR v_when < now() - interval '10 minutes' OR v_when > now() + interval '60 days' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_time', 'field', 'scheduled_at', 'error', 'اختر موعداً صحيحاً');
  END IF;

  IF length(v_address) < 10 OR length(v_address) > 500 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_address', 'field', 'address',
      'error', 'أدخل عنواناً مفصّلاً (محافظة + منطقة + شارع)');
  END IF;

  IF p_payload ? 'location' AND jsonb_typeof(p_payload->'location') = 'object' THEN
    BEGIN
      v_lat := (p_payload->'location'->>'lat')::double precision;
      v_lng := (p_payload->'location'->>'lng')::double precision;
      v_acc := (p_payload->'location'->>'accuracy_m')::real;
    EXCEPTION WHEN others THEN
      v_lat := NULL; v_lng := NULL;
    END;
    IF v_lat IS NULL OR v_lng IS NULL OR v_lat NOT BETWEEN -90 AND 90 OR v_lng NOT BETWEEN -180 AND 180 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'invalid_location', 'field', 'location', 'error', 'موقعٌ غير صالح');
    END IF;
  END IF;

  IF nullif(p_payload->>'family_member_id', '') IS NOT NULL THEN
    BEGIN
      v_family := (p_payload->>'family_member_id')::uuid;
    EXCEPTION WHEN others THEN
      v_family := NULL;
    END;
    IF v_family IS NULL OR NOT EXISTS (SELECT 1 FROM public.family_members
                                         WHERE id = v_family AND owner_user_id = v_uid AND is_active) THEN
      RETURN jsonb_build_object('ok', false, 'code', 'invalid_family_member', 'field', 'family_member_id',
        'error', 'فرد العائلة غير موجود');
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE id = v_method AND is_enabled) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'method_disabled', 'field', 'payment_method',
      'error', 'طريقة الدفع غير متاحة بعد — اختر الدفع نقداً');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users u
                  WHERE u.role = 'specialist' AND u.specialist_type = v_type
                    AND u.approval_status = 'approved' AND NOT coalesce(u.is_suspended, false)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'no_specialist',
      'error', 'لا يتوفّر مختصٌّ لهذه الخدمة الآن — فعّل «أعلِمني حين تتوفّر»');
  END IF;

  -- ── سحب الدم: تحاليل معروفة فقط
  IF p_service = 'blood-draw' THEN
    IF jsonb_typeof(p_payload->'test_ids') IS DISTINCT FROM 'array' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'no_tests', 'field', 'test_ids', 'error', 'اختر تحليلاً واحداً على الأقل');
    END IF;
    SELECT array_agg(DISTINCT t) INTO v_tests
      FROM jsonb_array_elements_text(p_payload->'test_ids') AS t;
    IF v_tests IS NULL OR cardinality(v_tests) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'no_tests', 'field', 'test_ids', 'error', 'اختر تحليلاً واحداً على الأقل');
    END IF;
    IF cardinality(v_tests) > 20 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'too_many_tests', 'field', 'test_ids', 'error', 'عشرون تحليلاً كحدٍّ أقصى في الطلب');
    END IF;
    SELECT array_agg(t) INTO v_bad FROM unnest(v_tests) t
     WHERE NOT EXISTS (SELECT 1 FROM public.service_catalog c WHERE c.kind = 'blood_test' AND c.item_id = t AND c.is_active);
    IF v_bad IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 'unknown_tests', 'field', 'test_ids',
        'error', 'بعض التحاليل غير متاحة الآن', 'items', to_jsonb(v_bad));
    END IF;

    -- بيانات المريض الاختياريّة (كنموذج الويب): العمر · الجنس · الحالة المرضيّة
    IF nullif(p_payload->>'patient_age', '') IS NOT NULL THEN
      BEGIN
        v_age := (p_payload->>'patient_age')::integer;
      EXCEPTION WHEN others THEN
        v_age := -1;
      END;
      IF v_age NOT BETWEEN 0 AND 120 THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid_age', 'field', 'patient_age', 'error', 'العمر غير صحيح');
      END IF;
    END IF;
    IF v_pgender IS NOT NULL AND v_pgender NOT IN ('male', 'female') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'invalid_gender', 'field', 'patient_gender', 'error', 'اختيارٌ غير صالح');
    END IF;

    SELECT coalesce(max(fasting_hours), 0) INTO v_fasting
      FROM public.service_catalog WHERE kind = 'blood_test' AND item_id = ANY (v_tests);
    v_duration := 30;
    v_label := 'سحب دم + تحاليل';

    INSERT INTO public.lab_orders (user_id, family_member_id, test_ids, lab_name_snapshot, needs_fasting,
                                   fasting_hours, patient_age, patient_gender, patient_condition,
                                   draw_fee, tests_total, discount, total_price, status)
    VALUES (v_uid, v_family, v_tests, 'لا يهم — اختاروا الأنسب', v_fasting > 0, v_fasting,
            v_age, v_pgender, v_condition,
            0, 0, 0, 0, 'pending')  -- بلا أسعار: المبلغ يُتّفق عليه مع المختصّ
    RETURNING id INTO v_lab_order;

  -- ── التمريض
  ELSE
    SELECT * INTO v_proc FROM public.service_catalog
     WHERE kind = 'nursing' AND item_id = p_payload->>'procedure_id' AND is_active;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'unknown_procedure', 'field', 'procedure_id', 'error', 'اختر الإجراء المطلوب');
    END IF;
    IF v_gender NOT IN ('male', 'female', 'any') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'invalid_gender', 'field', 'nurse_gender_preference', 'error', 'اختيارٌ غير صالح');
    END IF;
    -- الحساسيّة: المفاتيح المعروفة فقط، ونصّ «أخرى» محدود
    v_allergy := jsonb_strip_nulls(jsonb_build_object(
      'penicillin', nullif((p_payload->'allergy_form'->'penicillin') = 'true'::jsonb, false),
      'sulfa',      nullif((p_payload->'allergy_form'->'sulfa') = 'true'::jsonb, false),
      'aspirin',    nullif((p_payload->'allergy_form'->'aspirin') = 'true'::jsonb, false),
      'iodine',     nullif((p_payload->'allergy_form'->'iodine') = 'true'::jsonb, false),
      'latex',      nullif((p_payload->'allergy_form'->'latex') = 'true'::jsonb, false),
      'other',      left(nullif(btrim(p_payload->'allergy_form'->>'other'), ''), 200),
      'filled_at',  now()));
    v_duration := v_proc.duration_minutes;
    v_label    := v_proc.label_ar;
  END IF;

  INSERT INTO public.appointments (user_id, service_type, service_id, scheduled_at, address, status,
                                   required_specialist_type, lab_order_id, estimated_price, duration_minutes,
                                   family_member_id, location_lat, location_lng, location_accuracy_m,
                                   location_captured_at, nurse_gender_preference, allergy_form, prescription_required)
  VALUES (v_uid, v_label, p_service, v_when, v_address, 'pending',
          v_type, v_lab_order, NULL, v_duration,
          v_family, v_lat, v_lng, v_acc,
          CASE WHEN v_lat IS NULL THEN NULL ELSE now() END,
          CASE WHEN p_service = 'home-nursing' THEN v_gender END, v_allergy, false)
  RETURNING id INTO v_appt;

  IF v_lab_order IS NOT NULL THEN
    UPDATE public.lab_orders SET appointment_id = v_appt WHERE id = v_lab_order;
  END IF;

  -- طريقة الدفع المختارة تُحفظ الآن؛ المبلغ صفرٌ حتى يسجّله المختصّ عند الاستلام
  INSERT INTO public.payments (appointment_id, user_id, method, amount, currency, status, metadata)
  VALUES (v_appt, v_uid, v_method, 0, 'IQD', 'pending', jsonb_build_object('amount_agreed_with_specialist', true));

  INSERT INTO public.order_events (appointment_id, actor_id, from_status, to_status, lat, lng)
  VALUES (v_appt, v_uid, 'created', 'pending', v_lat, v_lng);

  INSERT INTO public.notifications (user_id, title, body, type, link, metadata)
  VALUES (v_uid, 'استلمنا طلبك', 'نبحث لك الآن عن أقرب مختص. سنُعلمك فور القبول.', 'order_status',
          '/appointments/' || v_appt, jsonb_build_object('appointment_id', v_appt, 'to', 'pending'));

  -- المختصّون المؤهَّلون (أوّل 200) — كـ notifyEligibleSpecialistsOfNewOrder في الويب
  INSERT INTO public.notifications (user_id, title, body, type, link, metadata)
  SELECT u.id, 'طلب جديد: ' || v_label, 'طلبٌ جديد في طابورك. اقبله قبل غيرك.', 'new_order',
         '/specialist/orders/' || v_appt, jsonb_build_object('appointment_id', v_appt)
    FROM public.users u
   WHERE u.role = 'specialist' AND u.specialist_type = v_type
     AND u.approval_status = 'approved' AND NOT coalesce(u.is_suspended, false)
   LIMIT 200;

  v_result := jsonb_build_object(
    'ok', true, 'appointment_id', v_appt, 'lab_order_id', v_lab_order, 'payment_method', v_method);

  INSERT INTO public.order_requests (user_id, idem_key, appointment_id, result)
  VALUES (v_uid, p_idempotency_key, v_appt, v_result);

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(text, jsonb, text) TO authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════════
-- 0071: سحبُ الدم في «سباير برو» — «تمّ السحب» ← «سلّمتُ العيّنة» ← إدخالُ النتائج
-- ════════════════════════════════════════════════════════════════════════
--
-- كان التطبيق يُكمل موعدَ سحب الدم بخطوات الطلب العامّة (0065) فقط: لا تُسجَّل العيّنة،
-- ولا تصل النتائجُ إلى المريض. هنا الخطواتُ نفسُها التي ينفّذها المحلّلُ في الويب
-- (`specialist/orders/[id]/actions.ts`: markSampleCollected · deliverSampleToLab · saveLabResults)
-- بقواعدها، في SQL — العميلُ لا يُصدَّق:
--
--   • `get_pro_lab_panel(order)`   — المختبرُ الذي اختاره المريض (أو قائمةُ المؤهَّلة حين «لا يهم»)
--                                    والنتائجُ المحفوظة إن وُجدت.
--   • `pro_lab_step(order, step, lab)` — collected: pending → sample_collected
--                                        delivered: pending|sample_collected → sent_to_lab
--     المختبرُ: اختيارُ المريض يغلب؛ وإلّا ما يختاره المحلّل من الشبكة المؤهَّلة.
--   • `pro_save_lab_results(order, results)` — تنقيةٌ كـ`sanitizeLabResults`، واستبدالُ النتائج،
--     و`results_ready`، ويكتمل الموعد، ويُخطَر المريض. في معاملةٍ واحدة.
--
-- مَن يُدخل النتائج؟ المحلّلُ — كما في الويب اليوم (انظر «🧭» في CLAUDE.md الويب). وإن صار المختبرُ
-- يرفعها بنفسه، يبقى هذا المسارُ للحالة التي لا مختبرَ مسجَّلاً فيها.
--
-- الشبكةُ = حساباتُ خدمةٍ من نوع مختبر، معتمَدة، غيرُ موقوفة، لها تحليلٌ معروفٌ واحدٌ على الأقلّ
-- (`getLabNetwork` في الويب). المختبرُ لا يرى المريضَ ولا يُخطَر.
-- إضافيٌّ: دوالُّ جديدة فقط؛ لا يمسّ جدولاً ولا سياسة.
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION private.lab_network()
RETURNS TABLE (id uuid, name text, city text, tests text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id,
         coalesce(nullif(btrim(u.clinic_name), ''), nullif(btrim(u.full_name), ''), 'مختبر'),
         coalesce(nullif(btrim(u.clinic_city), ''), nullif(btrim(u.governorate), '')),
         array_agg(t.test_id ORDER BY t.test_id)
    FROM public.users u
    JOIN public.specialist_lab_tests t ON t.specialist_id = u.id
    JOIN public.service_catalog c ON c.kind = 'blood_test' AND c.item_id = t.test_id
   WHERE u.role = 'provider' AND u.provider_type = 'lab'
     AND u.approval_status = 'approved' AND NOT coalesce(u.is_suspended, false)
   GROUP BY u.id
$$;
REVOKE EXECUTE ON FUNCTION private.lab_network() FROM PUBLIC, anon, authenticated;

-- المحلّلُ المُسنَد لهذا الموعد (أو null) — حارسٌ واحد للدوالّ الثلاث
CREATE OR REPLACE FUNCTION private.my_lab_appointment(p_order_id uuid)
RETURNS public.appointments
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_o public.appointments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR coalesce(private.current_field_type(), '') <> 'lab_analyst' THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_o FROM public.appointments WHERE id = p_order_id;
  IF NOT FOUND OR v_o.lab_order_id IS NULL
     OR NOT coalesce(auth.uid() IN (v_o.assigned_specialist_id, v_o.specialist_id), false) THEN
    RETURN NULL;
  END IF;
  RETURN v_o;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.my_lab_appointment(uuid) FROM PUBLIC, anon, authenticated;

-- ─── اللوحة: المختبرُ والنتائج ───
CREATE OR REPLACE FUNCTION public.get_pro_lab_panel(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_o  public.appointments;
  v_lo public.lab_orders%ROWTYPE;
BEGIN
  v_o := private.my_lab_appointment(p_order_id);
  IF v_o.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب ليس مُسنَداً إليك');
  END IF;
  SELECT * INTO v_lo FROM public.lab_orders WHERE id = v_o.lab_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'lab_status', v_lo.status,
    'test_ids', to_jsonb(v_lo.test_ids),
    'chosen', CASE WHEN v_lo.lab_specialist_id IS NULL THEN NULL
                   ELSE jsonb_build_object('id', v_lo.lab_specialist_id, 'name', v_lo.lab_name_snapshot) END,
    -- «لا يهم»: المؤهَّلةُ التي تُجري تحليلاً واحداً على الأقلّ من الطلب، الأكملُ أوّلاً
    'labs', CASE WHEN v_lo.lab_specialist_id IS NOT NULL THEN '[]'::jsonb ELSE coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', n.id, 'name', n.name, 'city', n.city,
                                          'covers', cardinality(ARRAY(SELECT unnest(n.tests) INTERSECT SELECT unnest(v_lo.test_ids))),
                                          'of', cardinality(v_lo.test_ids))
                       ORDER BY cardinality(ARRAY(SELECT unnest(n.tests) INTERSECT SELECT unnest(v_lo.test_ids))) DESC, n.name)
        FROM private.lab_network() n
       WHERE n.tests && v_lo.test_ids), '[]'::jsonb) END,
    'results', coalesce((
      SELECT jsonb_agg(jsonb_build_object('test_id', r.test_id, 'test_name', r.test_name,
                                          'result_value', r.result_value, 'unit', r.unit,
                                          'normal_range_text', r.normal_range_text, 'status', r.status,
                                          'notes', r.notes) ORDER BY r.created_at, r.test_name)
        FROM public.lab_results r WHERE r.lab_order_id = v_lo.id), '[]'::jsonb)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_pro_lab_panel(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pro_lab_panel(uuid) TO authenticated, service_role;

-- ─── «تمّ السحب» و«سلّمتُ العيّنة» ───
CREATE OR REPLACE FUNCTION public.pro_lab_step(p_order_id uuid, p_step text, p_lab_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_o   public.appointments;
  v_lo  public.lab_orders%ROWTYPE;
  v_lab record;
BEGIN
  -- التفويضُ في my_lab_appointment (المحلّلُ المُسنَد)؛ وهذا صريحٌ هنا أيضاً (tests/rpc-authorization في الويب)
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'سجّل الدخول أوّلاً');
  END IF;
  v_o := private.my_lab_appointment(p_order_id);
  IF v_o.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب ليس مُسنَداً إليك');
  END IF;
  -- العيّنةُ بعد بدء الخدمة عند المريض، لا قبلها
  IF v_o.status::text <> 'in_progress' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_state', 'error', 'ابدأ الخدمة عند المراجع أوّلاً');
  END IF;
  SELECT * INTO v_lo FROM public.lab_orders WHERE id = v_o.lab_order_id FOR UPDATE;

  IF p_step = 'collected' THEN
    IF v_lo.status <> 'pending' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'bad_state', 'error', 'حالةُ الطلب تغيّرت — حدّث الصفحة');
    END IF;
    UPDATE public.lab_orders SET status = 'sample_collected', updated_at = now() WHERE id = v_lo.id;
    RETURN jsonb_build_object('ok', true, 'lab_status', 'sample_collected');

  ELSIF p_step = 'delivered' THEN
    IF v_lo.status NOT IN ('pending', 'sample_collected') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'bad_state', 'error', 'العيّنةُ سُلّمت من قبل');
    END IF;
    -- اختيارُ المريض يغلب ما يرسله التطبيق؛ والمختبرُ من الشبكة المؤهَّلة وحدها، واسمُه من القاعدة
    SELECT n.id, n.name INTO v_lab FROM private.lab_network() n WHERE n.id = coalesce(v_lo.lab_specialist_id, p_lab_id);
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'no_lab',
        'error', CASE WHEN v_lo.lab_specialist_id IS NOT NULL
                      THEN 'المختبرُ الذي اختاره المريض لم يعد متاحاً — تواصل مع الإدارة'
                      ELSE 'اختر المختبرَ الذي ستسلّمه العيّنة' END);
    END IF;
    UPDATE public.lab_orders
       SET status = 'sent_to_lab', lab_specialist_id = v_lab.id, lab_name_snapshot = v_lab.name, updated_at = now()
     WHERE id = v_lo.id;
    INSERT INTO public.notifications (user_id, title, body, type, link, metadata)
    VALUES (v_lo.user_id, 'وصلت عيّنتُك إلى المختبر', v_lab.name || ' يُجري تحاليلك، وتصلك النتائج في التطبيق.',
            'lab_sample', '/account/lab-history/' || v_lo.id, jsonb_build_object('appointment_id', v_o.id, 'lab_order_id', v_lo.id));
    RETURN jsonb_build_object('ok', true, 'lab_status', 'sent_to_lab', 'lab_name', v_lab.name);
  END IF;

  RETURN jsonb_build_object('ok', false, 'code', 'bad_step', 'error', 'خطوةٌ غير معروفة');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.pro_lab_step(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pro_lab_step(uuid, text, uuid) TO authenticated, service_role;

-- ─── إدخالُ النتائج (كـ sanitizeLabResults + saveLabResults) ───
CREATE OR REPLACE FUNCTION public.pro_save_lab_results(p_order_id uuid, p_results jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_o    public.appointments;
  v_lo   public.lab_orders%ROWTYPE;
  v_r    jsonb;
  v_rows jsonb := '[]'::jsonb;
  v_name text;
  v_val  text;
  v_st   text;
  v_now  timestamptz := now();
BEGIN
  v_o := private.my_lab_appointment(p_order_id);
  IF v_o.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب ليس مُسنَداً إليك');
  END IF;
  IF v_o.status::text NOT IN ('in_progress', 'completed') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_state', 'error', 'ابدأ الخدمة عند المراجع أوّلاً');
  END IF;
  SELECT * INTO v_lo FROM public.lab_orders WHERE id = v_o.lab_order_id FOR UPDATE;
  IF v_lo.status IN ('pending', 'cancelled') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_state', 'error', 'سجّل سحبَ العيّنة أوّلاً');
  END IF;

  IF jsonb_typeof(p_results) IS DISTINCT FROM 'array' OR jsonb_array_length(p_results) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'error', 'أدخل نتيجةً واحدة على الأقل');
  END IF;
  IF jsonb_array_length(p_results) > 60 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'error', 'لا أكثر من 60 نتيجة في الطلب');
  END IF;

  FOR v_r IN SELECT value FROM jsonb_array_elements(p_results) LOOP
    v_name := CASE WHEN jsonb_typeof(v_r->'test_name') = 'string' THEN nullif(left(btrim(v_r->>'test_name'), 120), '') END;
    v_val  := CASE WHEN jsonb_typeof(v_r->'result_value') = 'string' THEN nullif(left(btrim(v_r->>'result_value'), 120), '') END;
    IF v_name IS NULL OR v_val IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'error', 'بعض النتائج ناقصة (الاسم أو القيمة)');
    END IF;
    v_st := v_r->>'status';
    IF v_st IS NULL OR v_st NOT IN ('normal', 'low', 'high', 'critical', 'inconclusive') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'error', 'حالةُ نتيجةٍ غيرُ معروفة');
    END IF;
    v_rows := v_rows || jsonb_build_object(
      'test_id', coalesce(CASE WHEN jsonb_typeof(v_r->'test_id') = 'string' THEN nullif(left(btrim(v_r->>'test_id'), 60), '') END, 'custom'),
      'test_name', v_name,
      'result_value', v_val,
      'result_numeric', CASE WHEN jsonb_typeof(v_r->'result_numeric') = 'number' THEN v_r->'result_numeric' END,
      'unit', CASE WHEN jsonb_typeof(v_r->'unit') = 'string' THEN nullif(left(btrim(v_r->>'unit'), 30), '') END,
      'normal_range_min', CASE WHEN jsonb_typeof(v_r->'normal_range_min') = 'number' THEN v_r->'normal_range_min' END,
      'normal_range_max', CASE WHEN jsonb_typeof(v_r->'normal_range_max') = 'number' THEN v_r->'normal_range_max' END,
      'normal_range_text', CASE WHEN jsonb_typeof(v_r->'normal_range_text') = 'string' THEN nullif(left(btrim(v_r->>'normal_range_text'), 80), '') END,
      'status', v_st,
      'flag', CASE WHEN jsonb_typeof(v_r->'flag') = 'string' THEN nullif(left(btrim(v_r->>'flag'), 30), '') END,
      'notes', CASE WHEN jsonb_typeof(v_r->'notes') = 'string' THEN nullif(left(btrim(v_r->>'notes'), 500), '') END);
  END LOOP;

  -- استبدال: المعاملةُ واحدة، فلا نتائجَ مكرّرة ولا نصفُ حفظ
  DELETE FROM public.lab_results WHERE lab_order_id = v_lo.id;
  INSERT INTO public.lab_results (lab_order_id, user_id, test_id, test_name, result_value, result_numeric, unit,
                                  normal_range_min, normal_range_max, normal_range_text, status, flag, notes,
                                  pdf_url, tested_at, entered_by)
  SELECT v_lo.id, v_lo.user_id,  -- المريضُ من الطلب، لا من المدخل
         x->>'test_id', x->>'test_name', x->>'result_value', (x->>'result_numeric')::numeric, x->>'unit',
         (x->>'normal_range_min')::numeric, (x->>'normal_range_max')::numeric, x->>'normal_range_text',
         x->>'status', x->>'flag', x->>'notes', NULL, v_now, auth.uid()
    FROM jsonb_array_elements(v_rows) x;

  UPDATE public.lab_orders SET status = 'results_ready', updated_at = v_now WHERE id = v_lo.id;
  IF v_o.status::text <> 'completed' THEN
    UPDATE public.appointments SET status = 'completed', completed_at = v_now WHERE id = v_o.id;
    INSERT INTO public.order_events (appointment_id, actor_id, from_status, to_status, note)
    VALUES (v_o.id, auth.uid(), v_o.status::text, 'completed', 'أُدخلت نتائجُ التحاليل');
  END IF;
  INSERT INTO public.notifications (user_id, title, body, type, link, metadata)
  VALUES (v_lo.user_id, 'نتائجُ تحاليلك جاهزة', 'أدخلها المختصّ — اضغط للعرض.', 'lab_results',
          '/account/lab-history/' || v_lo.id, jsonb_build_object('appointment_id', v_o.id, 'lab_order_id', v_lo.id));

  RETURN jsonb_build_object('ok', true, 'count', jsonb_array_length(v_rows));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.pro_save_lab_results(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pro_save_lab_results(uuid, jsonb) TO authenticated, service_role;

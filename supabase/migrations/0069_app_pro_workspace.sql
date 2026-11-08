-- ════════════════════════════════════════════════════════════════════════
-- 0069: قراءات تطبيق «برو» — طابور الموظف الميدانيّ وتفاصيل طلبه، ومنزل المزوّد
-- ════════════════════════════════════════════════════════════════════════
--
-- الويب يقرأ هذه في الخادم (Server Components) بعميل الخدمة أحياناً، فيجمع
-- اسم المريض وتحاليله وصفحة المختبر. التطبيق لا يملك عميل الخدمة، فالقراءات
-- هنا في دوالّ تحرس نفسها، وتُعيد **الحدّ الأدنى**:
--
--   • الطابور المفتوح (طلبات لم تُسنَد بعد): الخدمة والموعد والمنطقة — بلا
--     رقم هاتف ولا موقعٍ دقيق ولا اسم المريض الكامل (الاسم الأوّل فقط).
--   • طلبي (مُسنَدٌ إليّ): الاسم والرقم والإحداثيّات والتحاليل والحساسيّة.
--   • المزوّد: نوعه واسمه وعدد تحاليله (للمختبر). **لا عيّنات ولا طلبات**: قرار المالك
--     (22 تشرين الأول، CLAUDE.md في الويب «🧭 مَن يتلقّى ماذا») — المختبرُ ومقدّمُ الخدمة يفتح
--     خدمتَه فقط ولا يتلقّى شيئاً من المريض؛ المختصُّ يُدخل النتائج بنفسه.
--
-- قراءةٌ فقط — لا تغيّر شيئاً، والانتقالات تبقى في `transition_order` (0065).
-- ════════════════════════════════════════════════════════════════════════

-- ─── من أنا؟ (مختصٌّ ميدانيٌّ معتمَد) ───
CREATE OR REPLACE FUNCTION private.current_field_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.specialist_type FROM public.users u
   WHERE u.id = auth.uid() AND u.role = 'specialist'
     AND u.approval_status = 'approved' AND NOT coalesce(u.is_suspended, false)
$$;
REVOKE EXECUTE ON FUNCTION private.current_field_type() FROM PUBLIC, anon, authenticated;

-- ─── قائمة الطلبات ───
-- p_filter: all | new (الطابور المفتوح) | active (طلباتي الجارية) | done (طلباتي المنتهية)
CREATE OR REPLACE FUNCTION public.list_pro_orders(p_filter text DEFAULT 'all')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_type text := private.current_field_type();
BEGIN
  IF v_uid IS NULL OR v_type IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'للموظفين الميدانيّين المعتمَدين فقط');
  END IF;
  IF coalesce(p_filter, 'all') NOT IN ('all', 'new', 'active', 'done') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_filter', 'error', 'مرشّحٌ غير معروف');
  END IF;

  RETURN jsonb_build_object('ok', true, 'orders', coalesce((
    SELECT jsonb_agg(row ORDER BY (row->>'mine')::boolean, row->>'scheduled_at')
      FROM (
        SELECT jsonb_build_object(
                 'id', a.id,
                 'status', a.status,
                 'service_id', a.service_id,
                 'service_type', a.service_type,
                 'scheduled_at', a.scheduled_at,
                 'created_at', a.created_at,
                 'address', a.address,
                 'mine', mine,
                 -- الطابور المفتوح: الاسم الأوّل فقط
                 'patient_name', CASE WHEN mine THEN coalesce(fm.full_name, u.full_name)
                                      ELSE split_part(coalesce(fm.full_name, u.full_name, 'مراجع'), ' ', 1) END,
                 'tests_count', coalesce(cardinality(lo.test_ids), 0)) AS row
          FROM public.appointments a
          CROSS JOIN LATERAL (SELECT v_uid IN (a.assigned_specialist_id, a.specialist_id) IS TRUE AS mine) m
          LEFT JOIN public.users u ON u.id = a.user_id
          LEFT JOIN public.family_members fm ON fm.id = a.family_member_id
          LEFT JOIN public.lab_orders lo ON lo.id = a.lab_order_id
         WHERE (
                 (a.status = 'pending' AND a.assigned_specialist_id IS NULL AND a.required_specialist_type = v_type)
                 OR mine
               )
           AND CASE coalesce(p_filter, 'all')
                 WHEN 'new' THEN a.status = 'pending' AND NOT mine
                 WHEN 'active' THEN mine AND a.status::text IN ('confirmed', 'on_the_way', 'arrived', 'in_progress')
                 WHEN 'done' THEN mine AND a.status::text IN ('completed', 'cancelled')
                 ELSE a.status::text <> 'cancelled' OR mine
               END
         ORDER BY a.scheduled_at
         LIMIT 100
      ) q
  ), '[]'::jsonb));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_pro_orders(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_pro_orders(text) TO authenticated, service_role;

-- ─── تفاصيل طلب ───
CREATE OR REPLACE FUNCTION public.get_pro_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_type text := private.current_field_type();
  v_o    public.appointments%ROWTYPE;
  v_mine boolean;
  v_p    record;
  v_lo   public.lab_orders%ROWTYPE;
  v_pay  public.payments%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR v_type IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'للموظفين الميدانيّين المعتمَدين فقط');
  END IF;
  SELECT * INTO v_o FROM public.appointments WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;
  v_mine := coalesce(v_uid IN (v_o.assigned_specialist_id, v_o.specialist_id), false);
  IF NOT (v_mine OR (v_o.status = 'pending' AND v_o.assigned_specialist_id IS NULL AND v_o.required_specialist_type = v_type)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;

  SELECT coalesce(fm.full_name, u.full_name) AS name, u.phone, fm.id IS NOT NULL AS for_family,
         u.full_name AS owner_name
    INTO v_p
    FROM public.users u LEFT JOIN public.family_members fm ON fm.id = v_o.family_member_id
   WHERE u.id = v_o.user_id;
  IF v_o.lab_order_id IS NOT NULL THEN
    SELECT * INTO v_lo FROM public.lab_orders WHERE id = v_o.lab_order_id;
  END IF;
  IF v_mine THEN
    SELECT * INTO v_pay FROM public.payments WHERE appointment_id = v_o.id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'mine', v_mine,
    'order', jsonb_build_object(
      'id', v_o.id, 'status', v_o.status, 'service_id', v_o.service_id, 'service_type', v_o.service_type,
      'scheduled_at', v_o.scheduled_at, 'created_at', v_o.created_at, 'address', v_o.address,
      'nurse_gender_preference', v_o.nurse_gender_preference,
      'allergy_form', CASE WHEN v_mine THEN v_o.allergy_form END,
      'location', CASE WHEN v_mine AND v_o.location_lat IS NOT NULL
                       THEN jsonb_build_object('lat', v_o.location_lat, 'lng', v_o.location_lng) END),
    'patient', jsonb_build_object(
      'name', CASE WHEN v_mine THEN v_p.name ELSE split_part(coalesce(v_p.name, 'مراجع'), ' ', 1) END,
      'phone', CASE WHEN v_mine THEN v_p.phone END,
      'for_family', v_p.for_family,
      'owner_name', CASE WHEN v_mine AND v_p.for_family THEN v_p.owner_name END),
    'lab', CASE WHEN v_lo.id IS NULL THEN NULL ELSE jsonb_build_object(
      'status', v_lo.status, 'test_ids', to_jsonb(v_lo.test_ids),
      'needs_fasting', v_lo.needs_fasting, 'fasting_hours', v_lo.fasting_hours,
      'patient_age', CASE WHEN v_mine THEN v_lo.patient_age END,
      'patient_gender', CASE WHEN v_mine THEN v_lo.patient_gender END,
      'patient_condition', CASE WHEN v_mine THEN v_lo.patient_condition END,
      'lab_name', v_lo.lab_name_snapshot) END,
    'payment', CASE WHEN v_pay.id IS NULL THEN NULL ELSE jsonb_build_object(
      'method', v_pay.method, 'status', v_pay.status,
      'amount', CASE WHEN v_pay.status = 'paid' THEN v_pay.amount END) END
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_pro_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pro_order(uuid) TO authenticated, service_role;

-- ─── إحصائيات اليوم (كبطاقات `/specialist` في الويب) ───
CREATE OR REPLACE FUNCTION public.get_pro_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_type text := private.current_field_type();
  v_today timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Baghdad') AT TIME ZONE 'Asia/Baghdad';
BEGIN
  IF v_uid IS NULL OR v_type IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'للموظفين الميدانيّين المعتمَدين فقط');
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'type', v_type,
    'new', (SELECT count(*) FROM public.appointments
             WHERE status = 'pending' AND assigned_specialist_id IS NULL AND required_specialist_type = v_type),
    'active', (SELECT count(*) FROM public.appointments
                WHERE v_uid IN (assigned_specialist_id, specialist_id)
                  AND status::text IN ('confirmed', 'on_the_way', 'arrived', 'in_progress')),
    'completed_today', (SELECT count(*) FROM public.appointments
                         WHERE v_uid IN (assigned_specialist_id, specialist_id)
                           AND status = 'completed' AND completed_at >= v_today),
    'online', coalesce((SELECT is_online FROM public.specialist_presence WHERE user_id = v_uid), false)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_pro_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pro_stats() TO authenticated, service_role;

-- ─── منزل مزوّد الخدمة (كـ `/provider` في الويب) ───
CREATE OR REPLACE FUNCTION public.get_provider_home()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_u   public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_u FROM public.users WHERE id = v_uid;
  IF v_uid IS NULL OR NOT FOUND OR v_u.role <> 'provider' OR v_u.approval_status <> 'approved'
     OR coalesce(v_u.is_suspended, false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'لمزوّدي الخدمة المعتمَدين فقط');
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'provider_type', v_u.provider_type,
    'name', coalesce(v_u.clinic_name, v_u.full_name),
    'city', v_u.clinic_city,
    'address', v_u.clinic_address,
    'tests_count', CASE WHEN v_u.provider_type = 'lab'
                        THEN (SELECT count(*) FROM public.specialist_lab_tests WHERE specialist_id = v_uid) END
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_provider_home() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_home() TO authenticated, service_role;

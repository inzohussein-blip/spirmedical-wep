-- ════════════════════════════════════════════════════════════════════════
-- 0070: لوحةُ الإرسال الحيّة — الإدارةُ ترى الطلبات المفتوحة والمختصّين وتُسند
-- ════════════════════════════════════════════════════════════════════════
--
-- المرحلة 4 (PLAN.md في spirmedical-apk). كان الطلبُ ينتظر حتى يفتح مختصٌّ
-- طابوره، ولا ترى الإدارةُ إلّا قائمةً بلا عُمرٍ ولا مختصّين. الآن:
--
--   • `get_dispatch_board()` — صورةٌ واحدة: الطلباتُ المفتوحة بعمرها بالدقائق،
--     والجارية بمختصّها، والمختصّون المعتمَدون بحضورهم (متاح/آخر موقع) وحِملهم.
--   • `admin_assign_order(order, specialist)` — إسنادٌ (أو إعادةُ إسناد) من الإدارة:
--     المختصّ معتمَدٌ غيرُ موقوف ومن النوع المطلوب، والطلبُ لم يصل المراجعَ بعد.
--     يُكتب الحدث في `order_events` ويُخطَر المراجعُ والمختصّ (والسابقُ إن تبدّل).
--
-- مهلةُ «تأخّر القبول» (SLA) من `app_settings.dispatch_sla_minutes`؛ غيابُها = 15.
-- (هنا عرضٌ وتنبيه فقط — لا يُلغى شيءٌ بها، بخلاف الرفض التلقائيّ في 0042.)
--
-- يعتمد على 0063–0069 (order_events، specialist_presence، حالتا on_the_way/arrived).
-- إضافيٌّ: لا يمسّ جدولاً ولا سياسةً قائمة.
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_dispatch_board()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sla integer;
BEGIN
  IF v_uid IS NULL OR NOT coalesce(private.is_admin(v_uid), false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'للإدارة فقط');
  END IF;

  -- رقمٌ صالحٌ وحده يُقرأ؛ نصٌّ أو قيمةٌ غريبة ← 15 (عرضٌ فقط، فلا ضرر)
  SELECT CASE WHEN jsonb_typeof(value) = 'number' AND (value::text)::numeric BETWEEN 1 AND 1440
              THEN (value::text)::numeric::integer END
    INTO v_sla FROM public.app_settings WHERE key = 'dispatch_sla_minutes';
  v_sla := coalesce(v_sla, 15);

  RETURN jsonb_build_object(
    'ok', true,
    'sla_minutes', v_sla,
    'open', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'id', a.id, 'service_type', a.service_type, 'service_id', a.service_id,
               'required_type', a.required_specialist_type, 'address', a.address,
               'scheduled_at', a.scheduled_at, 'created_at', a.created_at,
               'age_minutes', floor(extract(epoch FROM now() - a.created_at) / 60)::int,
               'location', CASE WHEN a.location_lat IS NULL THEN NULL
                                ELSE jsonb_build_object('lat', a.location_lat, 'lng', a.location_lng) END)
             ORDER BY a.created_at)
        FROM public.appointments a
       WHERE a.status = 'pending' AND a.assigned_specialist_id IS NULL
         AND a.required_specialist_type IS NOT NULL), '[]'::jsonb),
    'active', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'id', a.id, 'status', a.status, 'service_type', a.service_type,
               'required_type', a.required_specialist_type, 'address', a.address,
               'scheduled_at', a.scheduled_at,
               'specialist_id', a.assigned_specialist_id, 'specialist_name', s.full_name)
             ORDER BY a.scheduled_at)
        FROM public.appointments a
        LEFT JOIN public.users s ON s.id = a.assigned_specialist_id
       WHERE a.status::text IN ('confirmed', 'on_the_way', 'arrived', 'in_progress')), '[]'::jsonb),
    'specialists', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'id', u.id, 'name', u.full_name, 'type', u.specialist_type, 'phone', u.phone,
               'online', coalesce(p.is_online, false),
               'last_seen', p.updated_at,
               'location', CASE WHEN p.lat IS NULL THEN NULL ELSE jsonb_build_object('lat', p.lat, 'lng', p.lng) END,
               'active_orders', (SELECT count(*) FROM public.appointments x
                                  WHERE u.id IN (x.assigned_specialist_id, x.specialist_id)
                                    AND x.status::text IN ('confirmed', 'on_the_way', 'arrived', 'in_progress')))
             ORDER BY coalesce(p.is_online, false) DESC, u.full_name)
        FROM public.users u
        LEFT JOIN public.specialist_presence p ON p.user_id = u.id
       WHERE u.role = 'specialist' AND u.approval_status = 'approved'
         AND NOT coalesce(u.is_suspended, false)
         AND u.specialist_type IN ('lab_analyst', 'nurse')), '[]'::jsonb)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dispatch_board() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dispatch_board() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_assign_order(p_order_id uuid, p_specialist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_o    public.appointments%ROWTYPE;
  v_s    public.users%ROWTYPE;
  v_prev uuid;
BEGIN
  -- coalesce في كلّ حارس: NULL لا يُنفّذ `IF NOT` (درسُ 0065)
  IF v_uid IS NULL OR NOT coalesce(private.is_admin(v_uid), false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'للإدارة فقط');
  END IF;

  SELECT * INTO v_o FROM public.appointments WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;
  -- بعد الوصول لا يُبدَّل المختصّ من اللوحة (يُلغى ويُعاد الطلب إن لزم)
  IF v_o.status::text NOT IN ('pending', 'confirmed', 'on_the_way') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'too_late', 'error', 'لا يُعاد الإسناد بعد وصول المختص أو انتهاء الطلب');
  END IF;

  SELECT * INTO v_s FROM public.users WHERE id = p_specialist_id;
  IF NOT FOUND
     OR NOT coalesce(v_s.role = 'specialist' AND v_s.approval_status = 'approved'
                     AND NOT coalesce(v_s.is_suspended, false)
                     AND v_s.specialist_type = v_o.required_specialist_type, false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ineligible',
      'error', 'المختص غير معتمَد أو من غير النوع المطلوب لهذا الطلب');
  END IF;

  v_prev := v_o.assigned_specialist_id;
  IF v_prev = p_specialist_id THEN
    RETURN jsonb_build_object('ok', true, 'unchanged', true);
  END IF;

  UPDATE public.appointments
     SET assigned_specialist_id = p_specialist_id,
         specialist_id          = p_specialist_id,
         -- إعادةُ الإسناد في الطريق تعيده «مؤكّداً»: المختصّ الجديد لم ينطلق بعد
         status                 = 'confirmed'
   WHERE id = p_order_id;

  INSERT INTO public.order_events (appointment_id, actor_id, from_status, to_status, note)
  VALUES (p_order_id, v_uid, v_o.status::text, 'confirmed',
          CASE WHEN v_prev IS NULL THEN 'إسنادٌ من الإدارة' ELSE 'إعادةُ إسنادٍ من الإدارة' END);

  INSERT INTO public.notifications (user_id, title, body, type, link, metadata) VALUES
    (v_o.user_id, 'تم تعيين مختص لطلبك', coalesce(v_s.full_name, 'المختص') || ' سيتولّى طلبك.', 'order_status',
     '/appointments/' || p_order_id, jsonb_build_object('appointment_id', p_order_id, 'to', 'confirmed')),
    (p_specialist_id, 'أُسند إليك طلبٌ جديد', v_o.service_type || ' — افتحه وانطلق في موعده.', 'new_order',
     '/specialist/orders/' || p_order_id, jsonb_build_object('appointment_id', p_order_id));
  IF v_prev IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link, metadata)
    VALUES (v_prev, 'أُعيد إسنادُ طلب', 'أُسند الطلبُ إلى زميلٍ آخر — لا حاجة للذهاب.', 'order_status',
            '/specialist/orders', jsonb_build_object('appointment_id', p_order_id));
  END IF;

  RETURN jsonb_build_object('ok', true, 'previous', v_prev);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_assign_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_order(uuid, uuid) TO authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════════
-- 0066: حضور المختصّ الميدانيّ وموقعه — «متاح/غير متاح» والتتبّع الحيّ
-- ════════════════════════════════════════════════════════════════════════
--
-- صفٌّ واحد لكلّ مختصّ (آخر حالة وآخر موقع)، لا سجلّ نقاط: الكتابة كلّ بضع
-- ثوانٍ تُحدّث الصفّ نفسه. والمسار التفصيليّ إن لزم يمرّ عبر Realtime Broadcast.
--
-- الخصوصيّة:
--   • الجدول لا يقرؤه إلّا صاحبه والمدير.
--   • المراجع يرى موقع المختصّ عبر `get_order_tracking` فقط، ولطلبه فقط،
--     وفقط والطلب «في الطريق» أو «وصل» — لا قبل الانطلاق ولا بعد الوصول للخدمة.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.specialist_presence (
  user_id     uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  is_online   boolean NOT NULL DEFAULT false,
  lat         double precision CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng         double precision CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  accuracy_m  real CHECK (accuracy_m IS NULL OR accuracy_m >= 0),
  heading     real CHECK (heading IS NULL OR heading BETWEEN 0 AND 360),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT specialist_presence_location_pair CHECK ((lat IS NULL) = (lng IS NULL))
);

CREATE INDEX IF NOT EXISTS specialist_presence_online_idx
  ON public.specialist_presence (updated_at) WHERE is_online;

ALTER TABLE public.specialist_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS specialist_presence_read ON public.specialist_presence;
CREATE POLICY specialist_presence_read ON public.specialist_presence
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.is_admin((SELECT auth.uid())));

REVOKE ALL ON public.specialist_presence FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.specialist_presence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialist_presence TO service_role;

-- ─── تحديث الحضور (المختصّ المعتمَد وحده) ───
CREATE OR REPLACE FUNCTION public.set_presence(
  p_online     boolean,
  p_lat        double precision DEFAULT NULL,
  p_lng        double precision DEFAULT NULL,
  p_accuracy_m real DEFAULT NULL,
  p_heading    real DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthenticated', 'error', 'سجّل الدخول أوّلاً');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users u
                  WHERE u.id = v_uid AND u.role = 'specialist'
                    AND u.approval_status = 'approved'
                    AND NOT coalesce(u.is_suspended, false)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'error', 'للمختصّين المعتمَدين فقط');
  END IF;
  IF (p_lat IS NULL) <> (p_lng IS NULL)
     OR (p_lat IS NOT NULL AND (p_lat NOT BETWEEN -90 AND 90 OR p_lng NOT BETWEEN -180 AND 180)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_location', 'error', 'موقعٌ غير صالح');
  END IF;

  INSERT INTO public.specialist_presence AS p (user_id, is_online, lat, lng, accuracy_m, heading, updated_at)
  VALUES (v_uid, p_online, p_lat, p_lng, p_accuracy_m, p_heading, now())
  ON CONFLICT (user_id) DO UPDATE
    SET is_online  = EXCLUDED.is_online,
        -- «غير متاح» بلا موقع لا يمحو آخر موقعٍ معروف
        lat        = coalesce(EXCLUDED.lat, p.lat),
        lng        = coalesce(EXCLUDED.lng, p.lng),
        accuracy_m = coalesce(EXCLUDED.accuracy_m, p.accuracy_m),
        heading    = coalesce(EXCLUDED.heading, p.heading),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'online', p_online);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_presence(boolean, double precision, double precision, real, real) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_presence(boolean, double precision, double precision, real, real) TO authenticated, service_role;

-- ─── تتبّع الطلب للمراجع ───
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_o   public.appointments%ROWTYPE;
  v_sp  record;
  v_pr  public.specialist_presence%ROWTYPE;
  v_live boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthenticated', 'error', 'سجّل الدخول أوّلاً');
  END IF;

  SELECT * INTO v_o FROM public.appointments WHERE id = p_order_id;
  IF NOT FOUND OR NOT coalesce(v_o.user_id = v_uid OR private.is_admin(v_uid), false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;

  v_live := v_o.status::text IN ('on_the_way', 'arrived');

  IF v_o.assigned_specialist_id IS NOT NULL THEN
    SELECT u.id, u.full_name, u.specialist_type, u.phone
      INTO v_sp FROM public.users u WHERE u.id = v_o.assigned_specialist_id;
    IF v_live THEN
      SELECT * INTO v_pr FROM public.specialist_presence WHERE user_id = v_o.assigned_specialist_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', v_o.status,
    'destination', CASE WHEN v_o.location_lat IS NULL THEN NULL
                        ELSE jsonb_build_object('lat', v_o.location_lat, 'lng', v_o.location_lng) END,
    'specialist', CASE WHEN v_sp.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', v_sp.id,
        'name', v_sp.full_name,
        'type', v_sp.specialist_type,
        -- الرقم للاتّصال يظهر بعد الانطلاق فقط
        'phone', CASE WHEN v_live THEN v_sp.phone ELSE NULL END) END,
    'location', CASE WHEN v_live AND v_pr.lat IS NOT NULL THEN jsonb_build_object(
        'lat', v_pr.lat, 'lng', v_pr.lng, 'heading', v_pr.heading, 'updated_at', v_pr.updated_at) ELSE NULL END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_tracking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_tracking(uuid) TO authenticated, service_role;

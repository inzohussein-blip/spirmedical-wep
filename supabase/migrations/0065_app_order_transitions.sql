-- ════════════════════════════════════════════════════════════════════════
-- 0065: آلةُ حالات الطلب في القاعدة + سجلّ أحداثه
-- ════════════════════════════════════════════════════════════════════════
--
-- في الويب تنتقل الحالة بتعديلٍ مباشرٍ على `appointments` من Server Actions
-- (acceptOrder · startOrder · completeOrder). التطبيق الأصليّ لا يصل إلى تلك
-- الإجراءات، وتكرارُ قواعدها في تطبيقين ثمّ في الويب يفرّقها. فالقواعد هنا،
-- في دالّةٍ واحدة يستدعيها الجميع:
--
--   من          إلى          من يحقّ له
--   ──────────  ───────────  ─────────────────────────────────────────────
--   pending     confirmed    مختصٌّ معتمَد من النوع المطلوب، والطلب حرّ (قبول)
--   confirmed   pending      المختصّ المُسنَد (تخلٍّ — يعود الطلب للطابور)
--   confirmed   on_the_way   المُسنَد · المدير
--   on_the_way  pending      المُسنَد (تخلٍّ)
--   on_the_way  arrived      المُسنَد · المدير
--   confirmed / on_the_way / arrived → in_progress     المُسنَد · المدير
--   in_progress completed    المُسنَد · المدير
--   pending / confirmed / on_the_way → cancelled       صاحب الطلب · المدير
--   arrived / in_progress → cancelled                  المدير وحده
--
-- كلّ انتقالٍ ناجح: يُكتب في `order_events` (من، إلى، متى، أين)، ويُخطَر
-- الطرفُ الآخر في صندوق الإشعارات (`notifications` — يعرضه الويب والتطبيق).
--
-- القبول ذرّيّ: `UPDATE … WHERE assigned_specialist_id IS NULL` تحت قفل الصفّ،
-- فمختصّان يضغطان «قبول» معاً ينجح أحدهما فقط.
--
-- إضافيٌّ: سياسات RLS الحاليّة على `appointments` لم تُمسّ، فإجراءات الويب
-- تعمل كما هي. نقلُ الويب إلى هذه الدالّة خطوةٌ لاحقة.
-- ════════════════════════════════════════════════════════════════════════

-- ─── ١) سجلّ الأحداث ───
CREATE TABLE IF NOT EXISTS public.order_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  actor_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  from_status    text NOT NULL,
  to_status      text NOT NULL,
  lat            double precision CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng            double precision CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  note           text CHECK (note IS NULL OR length(note) <= 500),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_events_location_pair CHECK ((lat IS NULL) = (lng IS NULL))
);

CREATE INDEX IF NOT EXISTS order_events_appointment_idx ON public.order_events (appointment_id, created_at);
CREATE INDEX IF NOT EXISTS order_events_actor_idx ON public.order_events (actor_id);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- يرى الحدثَ من يرى الطلب: الاستعلام الفرعيّ يخضع لسياسة قراءة `appointments`
-- نفسها (صاحب الطلب، المختصّ المُسنَد، المدير…)، فلا تُكرَّر القواعد هنا.
DROP POLICY IF EXISTS order_events_read ON public.order_events;
CREATE POLICY order_events_read ON public.order_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = order_events.appointment_id));

REVOKE ALL ON public.order_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.order_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_events TO service_role;

-- التتبّع الحيّ في التطبيق يشترك في أحداث الطلب (Realtime يحترم RLS)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
  END IF;
END $$;

-- ─── ٢) عناوين الإشعارات ───
CREATE OR REPLACE FUNCTION private.order_status_notice(p_status text)
RETURNS TABLE (title text, body text)
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT t.title, t.body FROM (VALUES
    ('confirmed',   'تم قبول طلبك',            'المختص في طريقه إليك قريباً.'),
    ('on_the_way',  'المختص في الطريق إليك',    'تابع موقعه من صفحة الطلب.'),
    ('arrived',     'وصل المختص',               'المختص عند عنوانك الآن.'),
    ('in_progress', 'بدأت الخدمة',              'الخدمة جارية الآن.'),
    ('completed',   'اكتمل طلبك',               'شكراً لثقتك. قيّم تجربتك من صفحة الطلب.'),
    ('cancelled',   'أُلغي الطلب',              'أُلغي الطلب. يمكنك طلبه من جديد في أيّ وقت.'),
    ('pending',     'نبحث لك عن مختص آخر',      'اعتذر المختص، وطلبك عاد إلى الانتظار.')
  ) AS t(status, title, body)
  WHERE t.status = p_status
$$;

-- ─── ٣) الانتقال ───
CREATE OR REPLACE FUNCTION public.transition_order(
  p_order_id uuid,
  p_to       text,
  p_lat      double precision DEFAULT NULL,
  p_lng      double precision DEFAULT NULL,
  p_note     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_me        public.users%ROWTYPE;
  v_o         public.appointments%ROWTYPE;
  v_from      text;
  v_admin     boolean;
  v_owner     boolean;
  v_assignee  boolean;
  v_eligible  boolean;
  v_allowed   boolean := false;
  v_title     text;
  v_body      text;
  v_notify    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthenticated', 'error', 'سجّل الدخول أوّلاً');
  END IF;
  IF p_to IS NULL OR p_to NOT IN ('pending', 'confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_status', 'error', 'حالةٌ غير معروفة');
  END IF;
  IF (p_lat IS NULL) <> (p_lng IS NULL)
     OR (p_lat IS NOT NULL AND (p_lat NOT BETWEEN -90 AND 90 OR p_lng NOT BETWEEN -180 AND 180)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_location', 'error', 'موقعٌ غير صالح');
  END IF;
  IF p_note IS NOT NULL AND length(p_note) > 500 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'note_too_long', 'error', 'الملاحظة طويلة جداً');
  END IF;

  SELECT * INTO v_me FROM public.users WHERE id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthenticated', 'error', 'سجّل الدخول أوّلاً');
  END IF;

  SELECT * INTO v_o FROM public.appointments WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;

  -- ⚠️ كلّ شرطٍ هنا مُغلَّفٌ بـ coalesce(…, false): `v_uid IN (NULL, NULL)` تُعطي NULL
  -- لا false، و`IF NOT NULL` لا يُنفَّذ — فيتخطّى الطلبُ الحارسَ صامتاً. اختبارُ
  -- 10_order_flow كشفها: محلّلٌ وصل إلى «نقلٍ ممنوع» بدل «غير موجود».
  v_from     := v_o.status::text;
  v_admin    := coalesce(private.is_admin(v_uid), false) AND NOT coalesce(v_me.is_suspended, false);
  v_owner    := coalesce(v_o.user_id = v_uid, false);
  v_assignee := coalesce(v_uid IN (v_o.assigned_specialist_id, v_o.specialist_id), false)
                AND NOT coalesce(v_me.is_suspended, false);
  v_eligible := coalesce(v_me.role = 'specialist'
                         AND v_me.approval_status = 'approved'
                         AND v_me.specialist_type = v_o.required_specialist_type, false)
                AND NOT coalesce(v_me.is_suspended, false);

  -- لا يرى غيرُ المعنيّين أنّ الطلب موجود أصلاً. والمختصّ المؤهَّل يحاول «القبول»
  -- لطلبٍ رآه في الطابور، فيُقال له «أُخذ» إن سبقه زميل.
  IF NOT (v_admin OR v_owner OR v_assignee
          OR (v_eligible AND (v_o.assigned_specialist_id IS NULL OR p_to = 'confirmed'))) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;

  IF v_from IN ('completed', 'cancelled') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'final', 'error', 'الطلب منتهٍ ولا يتغيّر');
  END IF;
  -- إعادةُ الإرسال نفسه (شبكةٌ متقطّعة) لا تفشل — لكن لأطراف الطلب وحدهم،
  -- وإلّا قيل لمختصٍّ آخر «تمّ» عن طلبٍ أخذه زميله.
  IF v_from = p_to AND (v_assignee OR v_owner OR v_admin) THEN
    RETURN jsonb_build_object('ok', true, 'status', v_from, 'unchanged', true);
  END IF;

  v_allowed := coalesce(CASE
    WHEN v_from = 'pending' AND p_to = 'confirmed'
      THEN v_eligible AND v_o.assigned_specialist_id IS NULL
    WHEN v_from IN ('confirmed', 'on_the_way') AND p_to = 'pending'
      THEN v_assignee
    WHEN v_from = 'confirmed' AND p_to = 'on_the_way'
      THEN v_assignee OR v_admin
    WHEN v_from = 'on_the_way' AND p_to = 'arrived'
      THEN v_assignee OR v_admin
    WHEN v_from IN ('confirmed', 'on_the_way', 'arrived') AND p_to = 'in_progress'
      THEN v_assignee OR v_admin
    WHEN v_from = 'in_progress' AND p_to = 'completed'
      THEN v_assignee OR v_admin
    WHEN v_from IN ('pending', 'confirmed', 'on_the_way') AND p_to = 'cancelled'
      THEN v_owner OR v_admin
    WHEN v_from IN ('arrived', 'in_progress') AND p_to = 'cancelled'
      THEN v_admin
    ELSE false
  END, false);

  IF NOT v_allowed THEN
    IF p_to = 'confirmed' AND v_o.assigned_specialist_id IS NOT NULL AND NOT v_assignee THEN
      RETURN jsonb_build_object('ok', false, 'code', 'taken', 'error', 'الطلب لم يَعُد متاحاً (أخذه مختصٌّ آخر)');
    END IF;
    IF v_owner AND p_to = 'cancelled' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'too_late', 'error', 'لا يمكن الإلغاء بعد وصول المختص — تواصل مع الدعم');
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden',
      'error', format('لا يمكن نقل الطلب من «%s» إلى «%s»', v_from, p_to));
  END IF;

  UPDATE public.appointments
     SET status                 = p_to::public.appointment_status,
         assigned_specialist_id = CASE
                                    WHEN p_to = 'confirmed' AND v_from = 'pending' THEN v_uid
                                    WHEN p_to = 'pending' THEN NULL
                                    ELSE assigned_specialist_id
                                  END,
         specialist_id          = CASE
                                    WHEN p_to = 'confirmed' AND v_from = 'pending' THEN v_uid
                                    WHEN p_to = 'pending' THEN NULL
                                    ELSE specialist_id
                                  END,
         confirmed_at           = CASE WHEN p_to = 'pending' THEN NULL ELSE confirmed_at END,
         completed_at           = CASE WHEN p_to = 'completed' THEN now() ELSE completed_at END,
         cancelled_at           = CASE WHEN p_to = 'cancelled' THEN now() ELSE cancelled_at END,
         cancelled_reason       = CASE WHEN p_to = 'cancelled' THEN p_note ELSE cancelled_reason END
   WHERE id = p_order_id;

  INSERT INTO public.order_events (appointment_id, actor_id, from_status, to_status, lat, lng, note)
  VALUES (p_order_id, v_uid, v_from, p_to, p_lat, p_lng, p_note);

  -- الإخطار: المراجعُ يُخطَر بكلّ ما لم يفعله بنفسه؛ والمختصّ يُخطَر بإلغاء المراجع
  IF NOT v_owner THEN
    v_notify := v_o.user_id;
  ELSIF p_to = 'cancelled' AND v_o.assigned_specialist_id IS NOT NULL THEN
    v_notify := v_o.assigned_specialist_id;
  END IF;

  IF v_notify IS NOT NULL THEN
    IF v_notify = v_o.user_id THEN
      SELECT n.title, n.body INTO v_title, v_body FROM private.order_status_notice(p_to) n;
    ELSE
      v_title := 'ألغى المراجع الطلب';
      v_body  := 'لا حاجة للذهاب — أُلغي الطلب من صاحبه.';
    END IF;
    INSERT INTO public.notifications (user_id, title, body, type, link, metadata)
    VALUES (v_notify, v_title, v_body, 'order_status',
            '/appointments/' || p_order_id,
            jsonb_build_object('appointment_id', p_order_id, 'from', v_from, 'to', p_to));
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', p_to);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transition_order(uuid, text, double precision, double precision, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_order(uuid, text, double precision, double precision, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.order_status_notice(text) FROM PUBLIC, anon, authenticated;

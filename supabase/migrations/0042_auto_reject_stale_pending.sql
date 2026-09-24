-- ════════════════════════════════════════════════════════════════════════
-- 0042: طلبٌ معلَّقٌ إلى الأبد — رفضٌ تلقائيّ بمدّةٍ يضبطها المشرف
-- ════════════════════════════════════════════════════════════════════════
--
-- طلبٌ يبقى `pending` بلا إسنادٍ لا يُغلق نفسه أبداً: لا مختصَّ التقطه،
-- ولا أحدَ أخبر المريض. فيبقى ينتظر، والطلبُ في اللوحة إلى ما لا نهاية.
--
-- ─── ما يحسمه هذا الترحيل ───
--
-- • **المُنفِّذ**: `pg_cron` غير مثبَّتٍ في المشروع (قِسْتُه: `pg_extension`
--   فيه plpgsql وpg_stat_statements وuuid-ossp وpgcrypto وsupabase_vault
--   وpg_trgm لا غير). فالمنفِّذ مسارُ API يستدعيه مُجدوِلٌ خارجيّ، والدالّة
--   هنا هي كلُّ المنطق كي لا يتغيّر شيءٌ إن أُضيف `pg_cron` لاحقاً.
--
-- • **المدّة قابلةٌ للضبط**، في `app_settings` يحرّرها المشرف. ولا قيمةَ
--   احتياطيّةً مسمَّرةً في الدالّة: إن غاب الإعداد أو كان صفراً فالرفض
--   **يتوقّف** — لأنّ الصمت أسلمُ من إلغاءٍ لا يقصده أحد. والرقمُ ٤٨
--   الوحيد في المستودع هو بذرةُ الصفّ أدناه، يحرسه
--   `tests/auto-reject-stale.test.ts`.
--
-- • **الإشعار لازم**: الرفض الصامت أسوأ من الانتظار. القالب
--   `order_cancelled` معرَّفٌ أصلاً، ويُدرَج الإشعارُ في المعاملة نفسها —
--   فإمّا أن يُرفض الطلبُ ويُخطَر المريض معاً، أو لا شيء.
--
-- • **لا يُرفض ما هو قيد التنفيذ**: الشرطُ على `pending` وحدها ومعها
--   `assigned_specialist_id IS NULL`. أمّا `confirmed` و`in_progress`
--   فخارج المدى تماماً.
--
-- • **الطوارئ مستثناة**: موعدٌ عليه سجلٌّ في `nurse_emergency_logs` لا
--   يُغلقه مؤقّت.

-- ─── ① جدول الإعدادات ───

CREATE TABLE IF NOT EXISTS public.app_settings (
  key            text PRIMARY KEY,
  value          jsonb NOT NULL,
  description_ar text NOT NULL,
  updated_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT app_settings_key_not_blank CHECK (btrim(key) <> '')
);

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- المشرف وحده. وهذه إعداداتُ تشغيلٍ لا تعني المستخدم، بخلاف
-- `service_switches` التي يقرؤها الزائر ليرى شارة «قريباً».
DROP POLICY IF EXISTS app_settings_admin_manage ON public.app_settings;
CREATE POLICY app_settings_admin_manage ON public.app_settings
  FOR ALL
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO service_role;

-- `updated_by` مفتاحٌ أجنبيّ، فيحتاج فهرساً يغطّيه (على نهج 0033): بلا
-- فهرسٍ يمسح حذفُ مستخدمٍ الجدولَ كلَّه للتحقّق من التبعيّة.
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_by
  ON public.app_settings (updated_by)
  WHERE updated_by IS NOT NULL;

INSERT INTO public.app_settings (key, value, description_ar) VALUES
  ('pending_auto_reject_hours', '48'::jsonb,
   'مدّة انتظار الطلب المعلَّق غير المُسنَد قبل رفضه تلقائياً، بالساعات. صفرٌ أو أقلّ يوقف الرفض التلقائيّ.')
ON CONFLICT (key) DO NOTHING;

-- ─── ② الدالّة ───

CREATE OR REPLACE FUNCTION private.auto_reject_stale_pending()
RETURNS TABLE (rejected integer, notified integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hours  integer;
  v_reason constant text := 'لم يستلم الطلبَ أيُّ مختصٍّ خلال المدّة المحدّدة';
BEGIN
  -- لا قيمةَ احتياطيّة: غيابُ الإعداد يعني «لا ترفض»، لا «ارفض بعد ٤٨».
  SELECT (s.value #>> '{}')::integer INTO v_hours
    FROM public.app_settings s
   WHERE s.key = 'pending_auto_reject_hours';

  IF v_hours IS NULL OR v_hours <= 0 THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  RETURN QUERY
  WITH stale AS (
    UPDATE public.appointments a
       SET status           = 'cancelled',
           cancelled_reason = v_reason,
           cancelled_at     = now(),
           updated_at       = now()
     WHERE a.status = 'pending'
       AND a.assigned_specialist_id IS NULL
       AND a.created_at < now() - make_interval(hours => v_hours)
       -- الطوارئ لا يُغلقها مؤقّت
       AND NOT EXISTS (
         SELECT 1 FROM public.nurse_emergency_logs e
          WHERE e.appointment_id = a.id
       )
    RETURNING a.id, a.user_id, a.scheduled_at
  ),
  queued AS (
    INSERT INTO public.notification_queue (
      recipient_user_id, recipient_phone, channel, template_key,
      body, scheduled_for, related_type, related_id
    )
    SELECT s.id_user, u.phone, 'whatsapp', 'order_cancelled',
           replace(
             replace(
               replace(
                 COALESCE(
                   (SELECT t.body_ar FROM public.notification_templates t
                     WHERE t.key = 'order_cancelled' AND t.is_active),
                   'مرحباً {{patient_name}}، نأسف لإبلاغك أن حجزك بتاريخ {{date}} تم إلغاؤه. السبب: {{reason}}'),
                 '{{patient_name}}', COALESCE(u.full_name, 'عزيزنا')),
               '{{date}}', to_char(s.scheduled_at, 'YYYY-MM-DD')),
             '{{reason}}', v_reason),
           now(), 'appointment', s.id_appt
      FROM (SELECT id AS id_appt, user_id AS id_user, scheduled_at FROM stale) s
      JOIN public.users u ON u.id = s.id_user
     WHERE u.phone IS NOT NULL AND u.phone <> ''
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM stale)::integer,
         (SELECT count(*) FROM queued)::integer;
END;
$$;

-- الدالّة للخادم وحده (على غرار 0015 و0024): يستدعيها مسارُ API بمفتاح
-- الخدمة، ولا يبلغها المتصفّح.
REVOKE ALL ON FUNCTION private.auto_reject_stale_pending() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auto_reject_stale_pending() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION private.auto_reject_stale_pending() TO service_role;

-- غلافٌ في `public` كي يبلغه PostgREST بـ`rpc/`؛ المنطقُ كلُّه في `private`.
CREATE OR REPLACE FUNCTION public.run_auto_reject_stale_pending()
RETURNS TABLE (rejected integer, notified integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM private.auto_reject_stale_pending();
$$;

REVOKE ALL ON FUNCTION public.run_auto_reject_stale_pending() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_auto_reject_stale_pending() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_auto_reject_stale_pending() TO service_role;

-- فهرسٌ للمُرشِّح: المعلَّقُ غير المُسنَد قليلٌ، فالفهرسُ الجزئيّ يكفي
CREATE INDEX IF NOT EXISTS idx_appointments_stale_pending
  ON public.appointments (created_at)
  WHERE status = 'pending' AND assigned_specialist_id IS NULL;

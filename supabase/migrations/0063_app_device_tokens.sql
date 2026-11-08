-- ════════════════════════════════════════════════════════════════════════
-- 0063: رموز أجهزة التطبيق (FCM) — إشعاراتٌ تصل والتطبيق مغلق
-- ════════════════════════════════════════════════════════════════════════
--
-- رمزٌ لكلّ جهاز، لا لكلّ مستخدم: المستخدم قد يملك هاتفين، والهاتف قد يتبدّل
-- عليه حسابان (موظّفٌ يسلّم الجهاز لزميله). لذلك `token` فريد، والتسجيل يُعيد
-- إسناد الرمز إلى صاحب الجلسة الحاليّة.
--
-- الكتابة عبر RPC وحدها (`register_device_token`)؛ القراءة والحذف لصاحب الرمز.
-- إضافيٌّ بالكامل: لا يمسّ جدولاً قائماً، فكودُ الويب في main يعمل معه كما هو.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE CHECK (length(token) BETWEEN 20 AND 4096),
  platform     text NOT NULL CHECK (platform IN ('android', 'ios')),
  app          text NOT NULL CHECK (app IN ('patient', 'pro')),
  app_version  text CHECK (app_version IS NULL OR length(app_version) <= 32),
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_idx ON public.device_tokens (user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_tokens_owner_read ON public.device_tokens;
CREATE POLICY device_tokens_owner_read ON public.device_tokens
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS device_tokens_owner_delete ON public.device_tokens;
CREATE POLICY device_tokens_owner_delete ON public.device_tokens
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.device_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.device_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO service_role;

CREATE OR REPLACE FUNCTION public.register_device_token(
  p_token       text,
  p_platform    text,
  p_app         text,
  p_app_version text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'سجّل الدخول أوّلاً' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.device_tokens AS d (user_id, token, platform, app, app_version)
  VALUES (v_uid, p_token, p_platform, p_app, p_app_version)
  ON CONFLICT (token) DO UPDATE
    SET user_id      = EXCLUDED.user_id,
        platform     = EXCLUDED.platform,
        app          = EXCLUDED.app,
        app_version  = EXCLUDED.app_version,
        last_seen_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_device_token(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_device_token(text, text, text, text) TO authenticated, service_role;

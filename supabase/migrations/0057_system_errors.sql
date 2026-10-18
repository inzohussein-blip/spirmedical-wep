-- ═══════════════════════════════════════════════════════════════════
-- 0057 — رصدُ الأخطاء في لوحة الإدارة (طلبُ المالك، 18 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- «يرصد أخطاءَ النظام والسجلّ وفشلَ النظام أو فشلاً عند عميل، وفشلَ البناء وفشلَ فحصٍ في GitHub.»
--
-- كانت الأخطاءُ تذهب إلى Sentry (لا DSN في الإنتاج) وإلى سجلّ Vercel (لا يقرؤه أحد)، وفشلُ البناء
-- يبقى في Vercel/GitHub حتى يُلاحَظ بالصدفة (#11 و#30 أوقفا النشرَ أيّاماً). الآن صفٌّ واحد لكلّ خطأٍ
-- متكرّر (بصمة)، يُعدّ تكرارُه، ويُعاد فتحُه إن عاد بعد الحلّ.
--
-- المصادر:
--   server — خطأٌ في مكوّن خادمٍ أو إجراء (onRequestError)
--   log    — logger.error على الخادم
--   client — خطأٌ في متصفّح مستخدم (error.tsx، window.onerror، وعودٌ مرفوضة)
--   cron   — كرونٌ أعاد 5xx أو انهار
--   build  — فشلُ نشرٍ على Vercel (deployment_status من GitHub)
--   ci     — فشلُ سيرِ عملٍ في GitHub Actions
--
-- لا سياسات: الكتابةُ والقراءةُ بعميل الخدمة وحده (بعد التحقّق من دور المدير في الصفحة).
-- إضافيٌّ كلُّه: كودُ main لا يعرف الجدول — يعمل كما هو.

CREATE TABLE IF NOT EXISTS public.system_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('server', 'log', 'client', 'cron', 'build', 'ci')),
  level text NOT NULL DEFAULT 'error' CHECK (level IN ('warning', 'error', 'fatal')),
  fingerprint text NOT NULL UNIQUE CHECK (char_length(fingerprint) BETWEEN 1 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  path text CHECK (path IS NULL OR char_length(path) <= 500),
  occurrences integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS system_errors_last_seen_idx ON public.system_errors (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS system_errors_resolved_by_idx ON public.system_errors (resolved_by);

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.system_errors FROM anon, authenticated;
GRANT ALL ON public.system_errors TO service_role;

-- تسجيلُ خطأ: بصمةٌ جديدة ← صفّ؛ قائمةٌ ← تكرارٌ +1، ويُعاد فتحُها إن كانت محلولة.
-- سقفُ البصمات الجديدة 300 في الساعة: أخطاءُ المتصفّح يرسلها أيُّ زائر، فلا يملأ أحدٌ الجدولَ ببصماتٍ مختلَقة.
CREATE OR REPLACE FUNCTION public.record_system_error(
  p_source text,
  p_level text,
  p_fingerprint text,
  p_message text,
  p_detail jsonb DEFAULT '{}'::jsonb,
  p_path text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.system_errors
     SET occurrences = occurrences + 1,
         last_seen_at = now(),
         level = p_level,
         message = left(p_message, 1000),
         detail = coalesce(p_detail, '{}'::jsonb),
         path = left(p_path, 500),
         resolved_at = NULL,
         resolved_by = NULL
   WHERE fingerprint = p_fingerprint;
  IF FOUND THEN
    RETURN true;
  END IF;

  IF (SELECT count(*) FROM public.system_errors WHERE first_seen_at > now() - interval '1 hour') >= 300 THEN
    RETURN false;
  END IF;

  INSERT INTO public.system_errors (source, level, fingerprint, message, detail, path)
  VALUES (p_source, p_level, p_fingerprint, left(p_message, 1000), coalesce(p_detail, '{}'::jsonb), left(p_path, 500))
  ON CONFLICT (fingerprint) DO UPDATE
    SET occurrences = public.system_errors.occurrences + 1, last_seen_at = now(), resolved_at = NULL, resolved_by = NULL;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_system_error(text, text, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_system_error(text, text, text, text, jsonb, text) TO service_role;

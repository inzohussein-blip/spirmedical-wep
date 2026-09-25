-- ═══════════════════════════════════════════════════════════════════
-- 0048 — قائمة «أعلِمني حين تتوفّر الخدمة»
-- ═══════════════════════════════════════════════════════════════════
--
-- في المنصّة صفرُ مختصّين، فكان كلُّ طلبٍ يُرفع يبقى معلّقاً حتى يُلغيه الرفضُ
-- التلقائيّ بعد ٤٨ ساعة (أُلغيت الطلبات الثلاثة كلُّها هكذا في 25 أيلول).
-- الآن يُمنع رفعُ طلبٍ لخدمةٍ لا مختصَّ معتمداً لها، ويُعرض على المريض أن
-- يُعلَم حين تتوفّر؛ وهذا الجدول يحفظ ذلك.
--
-- لا يُعلَم مرّتين: `notified_at` يُضبط عند اعتماد أوّل مختصٍّ من النوع
-- المطلوب، ويبقى الصفّ سجلّاً. وفريدٌ لكلّ (مستخدم، نوع مختصّ).
--
-- إضافيٌّ خالص: لا يمسّ جدولاً قائماً، فيعمل كودُ `main` الحاليّ معه كما هو.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.service_waitlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_type text NOT NULL,
  service_id      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  notified_at     timestamptz,
  UNIQUE (user_id, specialist_type)
);

-- إخطارُ المنتظرين يبحث بالنوع لمن لم يُعلَم بعد
CREATE INDEX IF NOT EXISTS service_waitlist_pending_idx
  ON public.service_waitlist (specialist_type) WHERE notified_at IS NULL;

ALTER TABLE public.service_waitlist ENABLE ROW LEVEL SECURITY;

-- سياسةٌ واحدة لكلّ أمر (عُرف 0046). المريض يرى ويُضيف ويحذف صفوفه وحده؛
-- والإخطارُ يجري بعميل الخدمة (service_role يتخطّى RLS).
CREATE POLICY service_waitlist_select_merged ON public.service_waitlist
  FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY service_waitlist_insert_merged ON public.service_waitlist
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) AND notified_at IS NULL);
CREATE POLICY service_waitlist_delete_merged ON public.service_waitlist
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- المنحُ الافتراضية في Supabase تعطي anon وauthenticated كلَّ شيءٍ على الجداول
-- الجديدة (قِيس: authenticated نال UPDATE دون أن يُمنح). RLS كان سيردّه، لكنّ
-- البوّابتين مستقلّتان — فتُضيَّق المنحةُ إلى ما يلزم فعلاً.
REVOKE ALL ON public.service_waitlist FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.service_waitlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_waitlist TO service_role;

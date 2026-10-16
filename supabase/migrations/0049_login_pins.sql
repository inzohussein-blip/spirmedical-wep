-- ═══════════════════════════════════════════════════════════════════
-- 0049 — رمزُ الدخول (PIN) للحسابات الهاتفيّة: «تسجيلٌ بلا رمز تحقّق» آمناً
-- ═══════════════════════════════════════════════════════════════════
--
-- قِيس في 16 تشرين الأول على الإنتاج (NEXT_PUBLIC_OTP_MODE=optional):
--   • `/login/phone` يُدخل أيَّ حسابٍ هاتفيّ برقمه وحده — كلمةُ سرّه مشتقّةٌ من
--     الرقم وسرّ الخادم، فمعرفةُ الرقم تكفي لفتح سجلّ المريض الطبّيّ.
--   • تسجيلُ المختصّ يطلب «رمز دخول (PIN)» من 6 أرقام **ويُهمله** الخادم.
--
-- المالك أراد التسجيلَ والدخول بلا رمز واتساب (توكن Meta معطّل). فالعاملُ الثاني
-- هو PIN يختاره صاحبُ الحساب ويُتحقَّق منه هنا.
--
-- ─── لماذا جدولٌ منفصل لا عمودٌ في `users` ───
-- صفوفُ `users` يقرؤها غيرُ صاحبها (المشرف، والمختصّ لمرضاه). وتجزئةُ PIN من ستّة
-- أرقام تُكسر خارجيّاً بمليون محاولة مهما بطؤت bcrypt. فلا يقرأ هذا الجدولَ إلّا
-- الخادمُ بعميل الخدمة: RLS مفعَّل بلا سياسة، والمنحُ لـservice_role وحده.
--
-- ─── القفل ───
-- `failed_attempts` و`locked_until`: خمسُ محاولاتٍ خاطئة تقفل الحساب ربع ساعة —
-- مليونُ احتمال لا يُجرَّب عبر الشبكة.
--
-- إضافيٌّ خالص: كودُ `main` الحاليّ لا يعرف الجدول، فيعمل كما هو.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.auth_login_pins (
  user_id         uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  pin_hash        text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_login_pins ENABLE ROW LEVEL SECURITY;
-- لا سياسة عمداً: لا يبلغه anon ولا authenticated حتى لو مُنحا.

REVOKE ALL ON public.auth_login_pins FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_login_pins TO service_role;

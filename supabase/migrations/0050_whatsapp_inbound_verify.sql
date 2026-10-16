-- ═══════════════════════════════════════════════════════════════════
-- 0050 — التحقّق العكسيّ عبر واتساب: العميلُ يرسل الرمزَ إلى رقمنا
-- ═══════════════════════════════════════════════════════════════════
--
-- توكن Meta للإرسال مرفوض منذ 25 أيلول، فـ«نسيت الرمز» والتسجيلُ الذاتيّ للمختصّ
-- مسدودان. الفكرة (قرار المالك، 16 تشرين الأول): لا نرسل شيئاً — العميلُ يفتح
-- `wa.me/<رقمنا>?text=<الرمز>` ويضغط «إرسال»، وبوّابةٌ تستقبل الرسالةَ وتطابق:
--   رمزٌ معلَّق غير منتهٍ  +  رقمُ المرسِل = الرقمُ الذي طُلب له الرمز.
-- الرمزُ وحده لا يكفي (يُنسخ ويُرسل من رقمٍ آخر)؛ مطابقةُ المرسِل هي الإثبات.
--
-- البوّابة: Baileys على Railway، أو Webhook من Meta لاحقاً — المنطقُ واحدٌ في
-- الموقع (`lib/whatsapp/inbound-verify.ts`)، والبوّابةُ ناقلٌ موقَّعٌ بلا مفتاح قاعدة.
--
-- ─── phone_verifications ───
-- رمزٌ من ستّة أرقام، عشرُ دقائق، يُستعمل مرّةً (pending → verified → consumed).
-- الرمزُ فريدٌ بين المعلَّقة وحدها (فهرسٌ جزئيّ) كي يُعرف صفُّه من الرسالة.
-- `attempts`: رسائلُ بالرمز من رقمٍ غير صاحبه — خمسٌ تُبطله.
--
-- ─── wa_gateway_status ───
-- نبضةُ البوّابة كلَّ دقيقة. إن غابت دقيقتين يختفي الزرّ من الموقع (لا يعلق أحد)
-- وتُظهرها بطاقاتُ صحّة التشغيل.
--
-- كلاهما للخادم وحده: RLS بلا سياسة، والمنحُ لـservice_role (نمط 0049).
-- إضافيٌّ خالص: كودُ `main` الحاليّ لا يعرف الجدولين، فيعمل كما هو.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone            text NOT NULL CHECK (phone ~ '^\+964[0-9]{10}$'),
  code             text NOT NULL CHECK (code ~ '^[0-9]{6}$'),
  purpose          text NOT NULL CHECK (purpose IN ('reset_pin', 'verify_phone', 'register_specialist')),
  user_id          uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'verified', 'consumed', 'expired')),
  attempts         integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider         text CHECK (provider IN ('baileys', 'meta')),
  created_ip       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  verified_at      timestamptz,
  consumed_at      timestamptz
);

-- الرمزُ يدلّ على صفّه ما دام معلَّقاً
CREATE UNIQUE INDEX IF NOT EXISTS phone_verifications_pending_code_key
  ON public.phone_verifications (code) WHERE status = 'pending';

-- حدُّ الطلبات لكلّ رقم
CREATE INDEX IF NOT EXISTS phone_verifications_phone_created_idx
  ON public.phone_verifications (phone, created_at DESC);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.phone_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_verifications TO service_role;

CREATE TABLE IF NOT EXISTS public.wa_gateway_status (
  provider      text PRIMARY KEY CHECK (provider IN ('baileys', 'meta')),
  connected     boolean NOT NULL DEFAULT false,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.wa_gateway_status ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wa_gateway_status FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_gateway_status TO service_role;

COMMENT ON TABLE public.phone_verifications IS
  'التحقّق العكسيّ عبر واتساب (0050): العميلُ يرسل الرمز، والمطابقةُ برقم المرسِل. للخادم وحده.';
COMMENT ON TABLE public.wa_gateway_status IS
  'نبضةُ بوّابة واتساب الواردة (0050). غيابُها دقيقتين يُخفي زرَّ التحقّق.';

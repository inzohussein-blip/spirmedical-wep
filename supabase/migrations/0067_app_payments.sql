-- ════════════════════════════════════════════════════════════════════════
-- 0067: المدفوعات — نقداً اليوم، وجاهزةٌ لبوّابات الدفع غداً
-- ════════════════════════════════════════════════════════════════════════
--
-- قرار المالك (تشرين الثاني 2026): الدفع نقداً عند الخدمة حالياً، مع واجهةٍ
-- تستوعب البوّابات لاحقاً (ZainCash · Qi Card · FIB · FastPay · المحفظة).
--
-- جدول `payments` موجودٌ منذ 0007 ولا يستعمله كودُ الويب (لا `from('payments')`
-- في src/). نبني عليه بدل جدولٍ ثانٍ، ونُصلح فيه ثغرة:
--
-- ─── الثغرة ───
-- سياستا 0007/0046 تسمحان للمستخدم بـ INSERT وUPDATE على دفعاته:
--     "Users create own payments"   WITH CHECK (auth.uid() = user_id)
--     payments_update_unified        USING (… OR auth.uid() = user_id)
-- أي أنّ المريض يستطيع `PATCH /payments {"status":"paid"}` لطلبه. لا ضرر اليوم
-- لأنّ لا شيء يقرأ الجدول، لكنّه يصير ثغرةً حقيقيّة لحظةَ نعتمد عليه. الكتابة
-- من الآن عبر RPC وحدها؛ للمستخدم القراءة فقط.
--
-- ─── الطرق ───
-- `payment_methods`: صفٌّ لكلّ طريقة ومفتاح `is_enabled`. تفعيلُ بوّابةٍ لاحقاً
-- = Edge Function لها + قلبُ مفتاحها، بلا ترحيل. الأسماء القديمة في قيد 0007
-- (`zain_cash`, `asia_hawala`, `visa`, `mastercard`) تبقى مقبولة.
-- ════════════════════════════════════════════════════════════════════════

-- ─── ١) الطرق ومفاتيحها ───
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id          text PRIMARY KEY,
  is_enabled  boolean NOT NULL DEFAULT false,
  sort_order  smallint NOT NULL DEFAULT 0,
  note_ar     text CHECK (note_ar IS NULL OR length(note_ar) <= 120),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payment_methods (id, is_enabled, sort_order) VALUES
  ('cash', true, 0), ('zain_cash', false, 1), ('qi_card', false, 2), ('fib', false, 3),
  ('fastpay', false, 4), ('wallet', false, 5),
  ('asia_hawala', false, 90), ('visa', false, 91), ('mastercard', false, 92)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_methods_public_read ON public.payment_methods;
CREATE POLICY payment_methods_public_read ON public.payment_methods
  FOR SELECT USING (true);

REVOKE ALL ON public.payment_methods FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payment_methods TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO service_role;

-- ─── ٢) توسيع `payments` ───
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collected_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata jsonb;
CREATE INDEX IF NOT EXISTS payments_collected_by_idx ON public.payments (collected_by);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id);

-- الطريقة: من جدول الطرق (يشمل القيم القديمة) بدل قائمةٍ ثابتة
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
DO $$ BEGIN
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_method_fkey FOREIGN KEY (method) REFERENCES public.payment_methods(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_amount_range
    CHECK (amount >= 0 AND amount <= 100000000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── ٣) إغلاق الكتابة المباشرة ───
DROP POLICY IF EXISTS "Users create own payments" ON public.payments;
DROP POLICY IF EXISTS "Users update own payments" ON public.payments;
DROP POLICY IF EXISTS payments_update_unified ON public.payments;

-- القراءة: صاحب الدفعة، المختصّ المُسنَد (بأيّ العمودين)، المدير
DROP POLICY IF EXISTS payments_select_unified ON public.payments;
CREATE POLICY payments_select_unified ON public.payments
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.is_admin((SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.appointments a
                WHERE a.id = payments.appointment_id
                  AND (SELECT auth.uid()) IN (a.assigned_specialist_id, a.specialist_id))
  );

REVOKE ALL ON public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO service_role;

-- ─── ٤) المختصّ يسجّل استلام النقد ───
CREATE OR REPLACE FUNCTION public.record_cash_payment(p_order_id uuid, p_amount_iqd integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_o   public.appointments%ROWTYPE;
  v_p   public.payments%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthenticated', 'error', 'سجّل الدخول أوّلاً');
  END IF;
  IF p_amount_iqd IS NULL OR p_amount_iqd < 0 OR p_amount_iqd > 100000000 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_amount', 'error', 'مبلغٌ غير صالح');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE id = 'cash' AND is_enabled) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'method_disabled', 'error', 'الدفع النقديّ متوقّفٌ حالياً');
  END IF;

  SELECT * INTO v_o FROM public.appointments WHERE id = p_order_id FOR UPDATE;
  -- coalesce: `v_uid IN (NULL, NULL)` تُعطي NULL، و`NOT NULL` يتخطّى الحارس (انظر 0065)
  IF NOT FOUND
     OR NOT coalesce(v_uid IN (v_o.assigned_specialist_id, v_o.specialist_id) OR private.is_admin(v_uid), false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', 'الطلب غير موجود');
  END IF;
  IF v_o.status::text NOT IN ('arrived', 'in_progress', 'completed') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'too_early', 'error', 'يُسجَّل الاستلام بعد الوصول إلى المراجع');
  END IF;

  SELECT * INTO v_p FROM public.payments WHERE appointment_id = p_order_id FOR UPDATE;
  IF FOUND THEN
    IF v_p.status = 'paid' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'already_paid', 'error', 'سُجّل الدفع لهذا الطلب من قبل');
    END IF;
    IF v_p.status = 'pending' AND v_p.method <> 'cash' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'other_method', 'error', 'هذا الطلب مدفوعٌ بطريقةٍ أخرى');
    END IF;
    -- معلّقةٌ نقداً، أو فاشلة/ملغاة سابقاً ثمّ دُفع نقداً عند الباب
    UPDATE public.payments
       SET method = 'cash', status = 'paid', amount = p_amount_iqd, collected_by = v_uid,
           paid_at = now(), updated_at = now()
     WHERE id = v_p.id;
    RETURN jsonb_build_object('ok', true, 'payment_id', v_p.id);
  END IF;

  INSERT INTO public.payments (appointment_id, user_id, method, status, amount, currency, collected_by, paid_at)
  VALUES (p_order_id, v_o.user_id, 'cash', 'paid', p_amount_iqd, 'IQD', v_uid, now())
  RETURNING * INTO v_p;

  RETURN jsonb_build_object('ok', true, 'payment_id', v_p.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_cash_payment(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_cash_payment(uuid, integer) TO authenticated, service_role;

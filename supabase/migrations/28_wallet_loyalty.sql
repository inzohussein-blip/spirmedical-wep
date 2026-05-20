-- ════════════════════════════════════════════════════════════════════
-- 💰 Migration 28: Wallet & Loyalty Points System (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- نظام محفظة + نقاط ولاء:
--   - رصيد كاش (للاستردادات)
--   - نقاط ولاء (مكافآت)
--   - معاملات (تاريخ كامل)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. ميزان المستخدم (cache) ───────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'silver' CHECK (loyalty_tier IN ('silver', 'gold', 'platinum', 'diamond'));

-- ─── 2. جدول المعاملات ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- النوع
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'credit',           -- إيداع
    'debit',            -- سحب/دفع
    'refund',           -- استرداد
    'reward',           -- مكافأة نقاط
    'points_redeem'     -- استبدال نقاط
  )),

  -- المبلغ
  amount NUMERIC NOT NULL DEFAULT 0,
  points INTEGER DEFAULT 0,

  -- الرصيد بعد المعاملة (للسجل)
  balance_after NUMERIC,
  points_after INTEGER,

  -- التفاصيل
  description TEXT NOT NULL,
  reference_type TEXT,                -- 'appointment', 'consultation', 'referral', 'manual'
  reference_id UUID,                  -- ID المرجع

  -- الحالة
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),

  -- audit
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user
  ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى معاملاته
DROP POLICY IF EXISTS "wallet_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_select_own"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins يقدرون يضيفون معاملات
DROP POLICY IF EXISTS "wallet_admin_all" ON public.wallet_transactions;
CREATE POLICY "wallet_admin_all"
  ON public.wallet_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 3. Function: إضافة معاملة + تحديث الرصيد ────────────
CREATE OR REPLACE FUNCTION public.add_wallet_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC DEFAULT 0,
  p_points INTEGER DEFAULT 0,
  p_description TEXT DEFAULT '',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance NUMERIC;
  v_new_points INTEGER;
  v_new_tier TEXT;
BEGIN
  -- حدّث الرصيد
  IF p_type IN ('credit', 'refund') THEN
    UPDATE public.users
    SET wallet_balance = wallet_balance + p_amount,
        loyalty_points = loyalty_points + p_points
    WHERE id = p_user_id
    RETURNING wallet_balance, loyalty_points INTO v_new_balance, v_new_points;
  ELSIF p_type IN ('debit', 'points_redeem') THEN
    UPDATE public.users
    SET wallet_balance = wallet_balance - p_amount,
        loyalty_points = loyalty_points - p_points
    WHERE id = p_user_id
    RETURNING wallet_balance, loyalty_points INTO v_new_balance, v_new_points;
  ELSIF p_type = 'reward' THEN
    UPDATE public.users
    SET loyalty_points = loyalty_points + p_points
    WHERE id = p_user_id
    RETURNING wallet_balance, loyalty_points INTO v_new_balance, v_new_points;
  END IF;

  -- حدّث المستوى (loyalty_tier) حسب النقاط
  v_new_tier := CASE
    WHEN v_new_points >= 1000 THEN 'diamond'
    WHEN v_new_points >= 500 THEN 'platinum'
    WHEN v_new_points >= 100 THEN 'gold'
    ELSE 'silver'
  END;

  UPDATE public.users
  SET loyalty_tier = v_new_tier
  WHERE id = p_user_id;

  -- سجّل المعاملة
  INSERT INTO public.wallet_transactions (
    user_id, transaction_type, amount, points,
    balance_after, points_after,
    description, reference_type, reference_id
  ) VALUES (
    p_user_id, p_type, p_amount, p_points,
    v_new_balance, v_new_points,
    p_description, p_reference_type, p_reference_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

COMMENT ON TABLE public.wallet_transactions IS 'سجل معاملات المحفظة والنقاط';
COMMENT ON FUNCTION public.add_wallet_transaction IS 'إضافة معاملة + تحديث الرصيد بعمل atomic';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 28 applied: Wallet & Loyalty';
END $$;

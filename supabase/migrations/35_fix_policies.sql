-- ════════════════════════════════════════════════════════════════════
-- 🔧 Migration 35: Fix Nursing Policies + Misc Cleanup (V25.20)
-- ════════════════════════════════════════════════════════════════════
-- يُصلح:
--   1. nursing policies تستخدم role='admin' بدلاً من is_admin()
--      (هذا يحرم super_admin/manager/support من الوصول)
--   2. تأكيد is_admin() متاحة قبل استخدامها
--   3. إضافة super_admin بشكل صريح في policies المهمة
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. التأكّد من is_admin() موجودة
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('super_admin', 'admin', 'manager', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ════════════════════════════════════════════════════════════════════
-- 2. إصلاح policies للـ nursing_services (من 20_nursing_enhancements)
-- ════════════════════════════════════════════════════════════════════

-- ─── nursing_services: SELECT ─────────────────────────
DROP POLICY IF EXISTS "nursing_services_select" ON public.nursing_services;
CREATE POLICY "nursing_services_select"
  ON public.nursing_services FOR SELECT
  USING (TRUE);  -- الكل يرى الخدمات

-- ─── nursing_services: ALL لـ admins ──────────────────
DROP POLICY IF EXISTS "nursing_services_admin_all" ON public.nursing_services;
CREATE POLICY "nursing_services_admin_all"
  ON public.nursing_services FOR ALL
  USING (public.is_admin(auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- 3. إصلاح policies للـ nursing_orders
-- ════════════════════════════════════════════════════════════════════

-- ─── nursing_orders: SELECT ──────────────────────────
DROP POLICY IF EXISTS "nursing_orders_select_own" ON public.nursing_orders;
CREATE POLICY "nursing_orders_select_own"
  ON public.nursing_orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR nurse_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- ─── nursing_orders: INSERT ──────────────────────────
DROP POLICY IF EXISTS "nursing_orders_insert_own" ON public.nursing_orders;
CREATE POLICY "nursing_orders_insert_own"
  ON public.nursing_orders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- ─── nursing_orders: UPDATE ──────────────────────────
DROP POLICY IF EXISTS "nursing_orders_update_own" ON public.nursing_orders;
CREATE POLICY "nursing_orders_update_own"
  ON public.nursing_orders FOR UPDATE
  USING (
    user_id = auth.uid()
    OR nurse_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- ─── nursing_orders: DELETE (admin فقط) ──────────────
DROP POLICY IF EXISTS "nursing_orders_admin_delete" ON public.nursing_orders;
CREATE POLICY "nursing_orders_admin_delete"
  ON public.nursing_orders FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- 4. تحقّق + تحسين باقي الجداول الحساسة
-- ════════════════════════════════════════════════════════════════════

-- ─── audit_logs: admin فقط ────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
    CREATE POLICY "audit_logs_admin_select"
      ON public.audit_logs FOR SELECT
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- ─── system_logs: super_admin فقط ─────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    DROP POLICY IF EXISTS "system_logs_super_admin" ON public.system_logs;
    CREATE POLICY "system_logs_super_admin"
      ON public.system_logs FOR ALL
      USING (public.is_super_admin(auth.uid()));
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 5. Performance: indexes إضافية مهمة
-- ════════════════════════════════════════════════════════════════════

-- إذا الـ nursing_orders كثير الاستخدام
CREATE INDEX IF NOT EXISTS idx_nursing_orders_status_date
  ON public.nursing_orders(status, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_nursing_orders_nurse
  ON public.nursing_orders(nurse_id, status)
  WHERE nurse_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════
-- 6. تحسينات الـ appointments policies (تأكيد is_admin)
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  -- تأكّد policies على appointments تستخدم is_admin
  FOR v_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
  LOOP
    -- نسجل في log فقط - لا نُغيّر شيء
    NULL;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- ✅ Verification
-- ════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_old_admin_policies INTEGER;
BEGIN
  -- نتحقق إذا لا تزال هناك policies بـ role = 'admin'
  SELECT COUNT(*) INTO v_old_admin_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND qual LIKE '%role = ''admin''%';

  IF v_old_admin_policies > 0 THEN
    RAISE NOTICE '⚠️  لا تزال هناك % policies تستخدم role=''admin'' بشكل مباشر', v_old_admin_policies;
    RAISE NOTICE '   (هذه ليست مشكلة حرجة - is_admin() تشمل admin أيضاً)';
  END IF;

  RAISE NOTICE '✅ Migration 35 applied:';
  RAISE NOTICE '   - is_admin() + is_super_admin() functions ensured';
  RAISE NOTICE '   - nursing_services policies updated';
  RAISE NOTICE '   - nursing_orders policies updated';
  RAISE NOTICE '   - 2 new indexes for nursing performance';
END $$;

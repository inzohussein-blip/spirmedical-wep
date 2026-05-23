-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 39: Lab Results Notifications + Helpers (V25.43)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Notification template للنتائج الجاهزة ───
INSERT INTO public.notification_templates (key, title_ar, body_ar, icon, type)
VALUES (
  'lab_results_ready',
  'نتائج التحاليل جاهزة 🎉',
  'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.',
  '🩸',
  'success'
) ON CONFLICT (key) DO NOTHING;

-- ─── 2. Trigger: عند تغيير lab_orders.status إلى 'results_ready' ───
-- نُرسل إشعار تلقائي للمريض

CREATE OR REPLACE FUNCTION notify_lab_results_ready()
RETURNS TRIGGER AS $$
BEGIN
  -- فقط لو الـ status تغيّر إلى 'results_ready' أو 'delivered'
  IF (OLD.status != 'results_ready' AND NEW.status = 'results_ready') OR
     (OLD.status != 'delivered' AND NEW.status = 'delivered') THEN
    
    -- أضِف إلى notification_queue
    INSERT INTO public.notification_queue (
      user_id,
      template_key,
      title,
      body,
      icon,
      data,
      created_at,
      scheduled_at
    ) VALUES (
      NEW.user_id,
      'lab_results_ready',
      'نتائج التحاليل جاهزة 🎉',
      'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.',
      '🩸',
      jsonb_build_object('lab_order_id', NEW.id, 'url', '/account/lab-history/' || NEW.id),
      NOW(),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab_results_notify ON public.lab_orders;
CREATE TRIGGER trigger_lab_results_notify
  AFTER UPDATE ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_lab_results_ready();

-- ─── 3. Function: تحديث partner_labs statistics ───
CREATE OR REPLACE FUNCTION update_partner_lab_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_lab_id IS NOT NULL THEN
    UPDATE public.partner_labs
    SET total_orders = (
      SELECT COUNT(*) FROM public.lab_orders 
      WHERE partner_lab_id = NEW.partner_lab_id
    )
    WHERE id = NEW.partner_lab_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partner_lab_stats ON public.lab_orders;
CREATE TRIGGER trigger_partner_lab_stats
  AFTER INSERT ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_lab_stats();

-- ─── 4. Index للأداء ───
CREATE INDEX IF NOT EXISTS idx_lab_results_user_recent 
  ON public.lab_results(user_id, results_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_user_recent 
  ON public.lab_orders(user_id, created_at DESC);

-- ─── 5. View للـ admin: lab orders summary ───
CREATE OR REPLACE VIEW public.admin_lab_orders_summary AS
SELECT 
  lo.id,
  lo.user_id,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  lo.test_ids,
  array_length(lo.test_ids, 1) AS test_count,
  lo.bundle_id,
  lo.partner_lab_id,
  pl.name_ar AS lab_name,
  lo.total_price,
  lo.status,
  lo.created_at,
  lo.updated_at,
  (
    SELECT COUNT(*) FROM public.lab_results lr 
    WHERE lr.lab_order_id = lo.id
  ) AS results_count
FROM public.lab_orders lo
LEFT JOIN public.users u ON u.id = lo.user_id
LEFT JOIN public.partner_labs pl ON pl.id = lo.partner_lab_id
ORDER BY lo.created_at DESC;

-- منح صلاحية القراءة للـ admin
GRANT SELECT ON public.admin_lab_orders_summary TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 39
-- ═══════════════════════════════════════════════════════════════════════════

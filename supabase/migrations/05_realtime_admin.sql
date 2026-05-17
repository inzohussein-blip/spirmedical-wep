-- ════════════════════════════════════════════════════════════════════
-- 🔴 Migration 05: REALTIME + ADMIN SUPPORT (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- Enable Realtime + Admin views for CRM project
-- 🔧 V24: حذف is_admin (سيُعرّف في 10 بشكل شامل)
-- 🔧 V24: Views بـ security_invoker لاحترام RLS
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 🔴 ENABLE REALTIME
-- ════════════════════════════════════════════════════════════════════

-- إضافة الجداول لـ realtime publication
DO $$
BEGIN
  -- Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- Chats
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  END IF;

  -- Appointments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication setup: %', SQLERRM;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- 👑 ADMIN ROLE HELPER — مؤقت
-- ════════════════════════════════════════════════════════════════════
-- 🔧 V24: تعريف مبدئي بسيط هنا، سيُستبدل بنسخة شاملة في 10_admin_system
-- نحتاجه هنا لأن policies الـ admin تستخدمه في هذا الملف.
-- في 10، سيتم CREATE OR REPLACE له بنسخة تدعم super_admin/manager/support.

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('admin', 'super_admin', 'manager', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ════════════════════════════════════════════════════════════════════
-- 👑 ADMIN POLICIES - يرى كل شيء
-- ════════════════════════════════════════════════════════════════════

-- Admins يرون كل الـ users
DROP POLICY IF EXISTS "Admins see all users" ON public.users;
CREATE POLICY "Admins see all users" ON public.users
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all users" ON public.users;
CREATE POLICY "Admins update all users" ON public.users
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admins يرون كل المواعيد
DROP POLICY IF EXISTS "Admins see all appointments" ON public.appointments;
CREATE POLICY "Admins see all appointments" ON public.appointments
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all appointments" ON public.appointments;
CREATE POLICY "Admins update all appointments" ON public.appointments
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete appointments" ON public.appointments;
CREATE POLICY "Admins delete appointments" ON public.appointments
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Admins يرون كل الـ audit logs
DROP POLICY IF EXISTS "Admins see all audit logs" ON public.audit_logs;
CREATE POLICY "Admins see all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admins يرون كل المحادثات
DROP POLICY IF EXISTS "Admins see all chats" ON public.chats;
CREATE POLICY "Admins see all chats" ON public.chats
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins see all messages" ON public.messages;
CREATE POLICY "Admins see all messages" ON public.messages
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admins يرون كل المدفوعات
DROP POLICY IF EXISTS "Admins see all payments" ON public.payments;
CREATE POLICY "Admins see all payments" ON public.payments
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update all payments" ON public.payments;
CREATE POLICY "Admins update all payments" ON public.payments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Admins يرون كل التقييمات
DROP POLICY IF EXISTS "Admins see all ratings" ON public.ratings;
CREATE POLICY "Admins see all ratings" ON public.ratings
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update ratings" ON public.ratings;
CREATE POLICY "Admins update ratings" ON public.ratings
  FOR UPDATE USING (public.is_admin(auth.uid()));


-- ════════════════════════════════════════════════════════════════════
-- 📊 ADMIN VIEWS - مفيدة للـ Dashboard (V24 — security_invoker)
-- ════════════════════════════════════════════════════════════════════

-- إجمالي الإيرادات اليومية
CREATE OR REPLACE VIEW public.daily_revenue
WITH (security_invoker = on) AS
SELECT
  DATE(paid_at) AS date,
  COUNT(*) AS total_payments,
  SUM(amount) AS total_amount,
  method,
  currency
FROM public.payments
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY DATE(paid_at), method, currency
ORDER BY date DESC;

-- مواعيد اليوم (لكل أخصائي)
CREATE OR REPLACE VIEW public.today_appointments
WITH (security_invoker = on) AS
SELECT
  a.id,
  a.user_id,
  a.specialist_id,
  a.service_type,
  a.status,
  a.scheduled_at,
  a.address,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  s.full_name AS specialist_name
FROM public.appointments a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.users s ON s.id = a.specialist_id
WHERE DATE(a.scheduled_at) = CURRENT_DATE
ORDER BY a.scheduled_at;

-- إحصاءات عامة (للأدمن dashboard)
CREATE OR REPLACE VIEW public.platform_stats
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE role = 'patient') AS total_patients,
  (SELECT COUNT(*) FROM public.users WHERE role = 'specialist') AS total_specialists,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'completed') AS completed_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'pending') AS pending_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE DATE(created_at) = CURRENT_DATE) AS today_new_appointments,
  (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE) AS today_new_users,
  (SELECT SUM(amount) FROM public.payments WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE) AS today_revenue,
  (SELECT ROUND(AVG(overall_rating)::numeric, 2) FROM public.ratings WHERE is_published) AS platform_avg_rating;


-- Appointments مع تفاصيل المستخدمين (يستخدمه الكود)
CREATE OR REPLACE VIEW public.appointments_with_users
WITH (security_invoker = on) AS
SELECT
  a.*,
  u.full_name AS patient_name,
  u.phone AS patient_phone,
  u.governorate AS patient_governorate,
  s.full_name AS specialist_name,
  s.specialty AS specialist_specialty
FROM public.appointments a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.users s ON s.id = a.specialist_id;


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 05 Complete - الـ DB جاهزة للويب والـ CRM
-- ════════════════════════════════════════════════════════════════════

-- ملاحظة: لإنشاء أول admin user:
-- 1. سجّل عادياً من /register (سيُنشأ كـ patient)
-- 2. في SQL Editor، شغّل:
--    UPDATE public.users SET role = 'super_admin' WHERE phone = '+9647XX...';

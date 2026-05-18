-- ════════════════════════════════════════════════════════════════════
-- 📅 Migration 19: Appointment Reminders Tracking (V25.4)
-- ════════════════════════════════════════════════════════════════════
-- يُضيف:
--   1. reminder_sent_at - وقت إرسال تذكير "قبل ساعة"
-- ════════════════════════════════════════════════════════════════════

-- إضافة العمود إذا لم يكن موجوداً
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index للبحث السريع عن المواعيد المحتاجة تذكير
CREATE INDEX IF NOT EXISTS idx_appointments_reminders
  ON public.appointments(scheduled_at, reminder_sent_at)
  WHERE status = 'confirmed' AND reminder_sent_at IS NULL;

-- تعليق
COMMENT ON COLUMN public.appointments.reminder_sent_at IS
  'وقت إرسال تذكير "قبل ساعة" (للـ cron job - لمنع الإرسال المتكرّر)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 19 applied: reminder_sent_at column';
END $$;

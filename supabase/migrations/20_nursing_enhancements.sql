-- ════════════════════════════════════════════════════════════════════
-- 💉 Migration 20: Nursing Service Enhancements (V25.5)
-- ════════════════════════════════════════════════════════════════════
-- بناءً على وثيقة المواصفات الفنية لأيقونة "التمريض المنزلي والتداوي"
--
-- يُضيف:
--   1. nursing_supplies_request - طلب المستلزمات للممرض
--   2. nurse_gender_preference - تفضيل جنس الممرض
--   3. recurring_schedule - الجدولة الزرقية (كل 8/12 ساعة)
--   4. allergy_form_filled - استمارة التحسس الدوائي
--   5. prescription_image_url - صورة الوصفة الطبية الإلزامية
--   6. infectious_disease_alert - تنبيه أمراض معدية
--   7. visit_history - سجل الزيارات التمريضية
--   8. nurse_emergency_logs - سجل تفعيل زر الطوارئ للممرض
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. أعمدة جديدة في appointments ─────────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS nurse_gender_preference TEXT
    CHECK (nurse_gender_preference IN ('male', 'female', 'any')),
  ADD COLUMN IF NOT EXISTS recurring_schedule JSONB,
    -- مثال: {"enabled": true, "interval_hours": 8, "end_date": "2026-06-01", "auto_confirm": true}
  ADD COLUMN IF NOT EXISTS allergy_form JSONB,
    -- مثال: {"penicillin": false, "sulfa": true, "other": "حساسية لاكتوز", "filled_at": "..."}
  ADD COLUMN IF NOT EXISTS prescription_image_url TEXT,
  ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS infectious_disease_alert JSONB,
    -- مثال: {"hepatitis_b": true, "covid": false, "tb": false, "notes": "..."}
  ADD COLUMN IF NOT EXISTS supplies_request JSONB,
    -- مثال: [{"item": "كانيولا 22G", "qty": 2, "added_to_invoice": true, "price": 5000}]
  ADD COLUMN IF NOT EXISTS supplies_total NUMERIC DEFAULT 0;

-- ─── 2. سجل زيارات التمريض (History) ──────────────────────
CREATE TABLE IF NOT EXISTS public.nursing_visit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- تفاصيل الزيارة
  procedure_type TEXT NOT NULL,
    -- 'injection', 'iv', 'wound_care', 'cannula', 'catheter', 'diabetic_foot'
  procedure_details JSONB,
    -- مثال: {"injection_type": "IM", "site": "deltoid", "medication": "Augmentin"}
  
  -- العلامات الحيوية
  vital_signs JSONB,
    -- مثال: {"bp": "120/80", "pulse": 72, "temp": 37.0, "spo2": 98}
  
  -- ملاحظات
  notes TEXT,
  complications TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- timestamps
  performed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nursing_history_user
  ON public.nursing_visit_history(user_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_nursing_history_specialist
  ON public.nursing_visit_history(specialist_id, performed_at DESC);

ALTER TABLE public.nursing_visit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nursing_history_select_own" ON public.nursing_visit_history;
CREATE POLICY "nursing_history_select_own"
  ON public.nursing_visit_history FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "nursing_history_insert_specialist" ON public.nursing_visit_history;
CREATE POLICY "nursing_history_insert_specialist"
  ON public.nursing_visit_history FOR INSERT
  WITH CHECK (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 3. سجل تفعيل زر الطوارئ للممرض ────────────────────────
CREATE TABLE IF NOT EXISTS public.nurse_emergency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  -- بيانات الطوارئ
  trigger_reason TEXT,
    -- 'attack', 'threat', 'harassment', 'medical', 'other'
  description TEXT,
  
  -- GPS وقت التفعيل
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy_m NUMERIC,
  
  -- معالجة الطوارئ
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'responding', 'resolved', 'false_alarm')),
  contacted_911 BOOLEAN DEFAULT FALSE,
  call_center_notified BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurse_emergency_open
  ON public.nurse_emergency_logs(status, created_at DESC)
  WHERE status IN ('open', 'responding');

ALTER TABLE public.nurse_emergency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nurse_emergency_specialist_insert" ON public.nurse_emergency_logs;
CREATE POLICY "nurse_emergency_specialist_insert"
  ON public.nurse_emergency_logs FOR INSERT
  WITH CHECK (auth.uid() = specialist_id);

DROP POLICY IF EXISTS "nurse_emergency_admin_select" ON public.nurse_emergency_logs;
CREATE POLICY "nurse_emergency_admin_select"
  ON public.nurse_emergency_logs FOR SELECT
  USING (
    auth.uid() = specialist_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 4. تقييم جودة الخدمة التمريضية ──────────────────────
ALTER TABLE public.order_reviews
  ADD COLUMN IF NOT EXISTS hygiene_rating INTEGER 
    CHECK (hygiene_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS expertise_rating INTEGER 
    CHECK (expertise_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER 
    CHECK (punctuality_rating BETWEEN 1 AND 5);

-- ─── 5. تعليقات ──────────────────────────────────────────
COMMENT ON COLUMN public.appointments.nurse_gender_preference IS
  'تفضيل جنس الممرض لتلبية الرغبة الشخصية والشرعية';

COMMENT ON COLUMN public.appointments.recurring_schedule IS
  'الجدولة الزرقية: تنفيذ كورسات العلاج كل 8/12 ساعة';

COMMENT ON COLUMN public.appointments.prescription_image_url IS
  'صورة الوصفة الطبية الإلزامية (الراشيتة) - حماية قانونية';

COMMENT ON COLUMN public.appointments.allergy_form IS
  'استمارة التحسس الدوائي - يجب ملؤها قبل أي علاج';

COMMENT ON TABLE public.nursing_visit_history IS
  'سجل الزيارات التمريضية - History لكل مريض';

COMMENT ON TABLE public.nurse_emergency_logs IS
  'سجل تفعيل زر الطوارئ الأمني للممرض داخل منزل المريض';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20 applied: Nursing service enhancements (10 features)';
END $$;

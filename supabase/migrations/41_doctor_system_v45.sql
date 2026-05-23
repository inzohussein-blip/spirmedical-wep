-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 41: Doctor System Enhancements (V25.45)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. doctor_ratings (تقييمات الأطباء)
--   2. doctor_appointment_type (column في appointments)
--   3. video_sessions (للاستشارات بالفيديو)
--   4. Notifications للأطباء
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. DOCTOR RATINGS ───
CREATE TABLE IF NOT EXISTS public.doctor_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  consultation_id   UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  
  -- تقييم عام (1-5)
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  expertise_rating  INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  empathy_rating    INTEGER CHECK (empathy_rating >= 1 AND empathy_rating <= 5),
  
  -- ملاحظات
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  
  -- نوع التفاعل
  interaction_type TEXT CHECK (interaction_type IN ('home_visit', 'clinic_visit', 'video', 'chat', 'subscription')),
  
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, appointment_id),
  UNIQUE (user_id, consultation_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_ratings_doctor ON public.doctor_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_user ON public.doctor_ratings(user_id);

ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_ratings_user_own" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_user_own"
  ON public.doctor_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_ratings_user_insert" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_user_insert"
  ON public.doctor_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_ratings_public_read" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_public_read"
  ON public.doctor_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "doctor_ratings_admin_all" ON public.doctor_ratings;
CREATE POLICY "doctor_ratings_admin_all"
  ON public.doctor_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. أعمدة جديدة على appointments للأطباء ───
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_appointment_type TEXT 
    CHECK (doctor_appointment_type IN ('home_visit', 'clinic_visit', 'video', 'follow_up')),
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT[];

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id) WHERE doctor_id IS NOT NULL;

-- ─── 3. VIDEO SESSIONS ───
CREATE TABLE IF NOT EXISTS public.video_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  patient_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Jitsi room name (random uuid)
  room_name         TEXT NOT NULL UNIQUE,
  
  -- توقيتات
  scheduled_at      TIMESTAMPTZ NOT NULL,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER,
  
  -- الحالة
  status            TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- recording (اختياري)
  recording_url     TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (consultation_id IS NOT NULL OR appointment_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_video_sessions_patient ON public.video_sessions(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_doctor ON public.video_sessions(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_room ON public.video_sessions(room_name);

ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_sessions_participants" ON public.video_sessions;
CREATE POLICY "video_sessions_participants"
  ON public.video_sessions FOR SELECT
  USING (patient_user_id = auth.uid() OR doctor_user_id = auth.uid());

DROP POLICY IF EXISTS "video_sessions_admin" ON public.video_sessions;
CREATE POLICY "video_sessions_admin"
  ON public.video_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 4. Notification templates ───
INSERT INTO public.notification_templates (key, title_ar, body_ar, icon, type)
VALUES 
  ('doctor_appointment_confirmed', 'تمّ تأكيد موعد الطبيب ✓', 'موعدك مع الطبيب جاهز', '👨‍⚕️', 'info'),
  ('consultation_new_message', 'رسالة جديدة من الطبيب 💬', 'افتح المحادثة لقراءة الرد', '💬', 'info'),
  ('video_session_starting', 'استشارة الفيديو على وشك البدء 📹', 'انضم الآن', '📹', 'info'),
  ('doctor_subscription_renewed', 'تجديد اشتراك الطبيب ✓', 'تم تجديد اشتراكك بنجاح', '✓', 'success')
ON CONFLICT (key) DO NOTHING;

-- ─── 5. Trigger: تحديث rating_avg للطبيب ───
CREATE OR REPLACE FUNCTION update_doctor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.doctors
  SET 
    rating_avg = (
      SELECT AVG(rating)::numeric(3,2) FROM public.doctor_ratings 
      WHERE doctor_id = NEW.doctor_id AND is_public = true
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.doctor_ratings 
      WHERE doctor_id = NEW.doctor_id AND is_public = true
    )
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_doctor_rating_stats ON public.doctor_ratings;
CREATE TRIGGER trigger_doctor_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_rating_stats();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 41
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- Spir Medical - Migration 004: New Features
-- ============================================================================
-- Created: 2026-04-30
-- Purpose: Add Reviews UI, Lab Results Archive, Prescriptions, Chat, Settings
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. LAB RESULTS ARCHIVE (سجل التحاليل)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Test info
  test_name TEXT NOT NULL,
  test_type TEXT CHECK (test_type IN ('blood', 'urine', 'xray', 'mri', 'ct', 'ultrasound', 'other')),
  test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- PDF storage
  pdf_url TEXT NOT NULL, -- Supabase Storage URL
  pdf_filename TEXT NOT NULL,
  pdf_size_bytes INTEGER,
  
  -- Metadata
  lab_name TEXT,
  doctor_notes TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_results_user ON lab_results(user_id, test_date DESC);
CREATE INDEX idx_lab_results_order ON lab_results(order_id);

COMMENT ON TABLE lab_results IS 'Archive of medical lab test results (PDFs)';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. PRESCRIPTIONS (الوصفات الطبية الإلكترونية)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Prescription details
  diagnosis TEXT,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"name": "Panadol 500mg", "dosage": "1 tablet", "frequency": "3x daily", "duration": "5 days"}]
  
  instructions TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'filled', 'expired')),
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  filled_pharmacy_id UUID REFERENCES pharmacies(id),
  
  -- PDF version (optional)
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, created_at DESC);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_order ON prescriptions(order_id);

COMMENT ON TABLE prescriptions IS 'Electronic prescriptions from doctors';

-- Trigger: Auto-set issued_at when status changes to 'issued'
CREATE OR REPLACE FUNCTION set_prescription_issued_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'issued' AND OLD.status != 'issued' THEN
    NEW.issued_at = NOW();
    NEW.expires_at = NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prescription_issued_trigger
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  WHEN (NEW.status = 'issued')
  EXECUTE FUNCTION set_prescription_issued_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. MESSAGES (محادثة مباشرة)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Sender/Receiver
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Message content
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
  
  -- Attachments (for image/file)
  attachment_url TEXT,
  attachment_filename TEXT,
  
  -- Read status
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_order ON messages(order_id, created_at ASC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);

COMMENT ON TABLE messages IS 'Real-time chat messages between patient and provider';

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. USER SETTINGS (إعدادات المستخدم)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Language
  language TEXT NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en', 'ku')),
  
  -- Notifications
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
  push_chat_messages BOOLEAN NOT NULL DEFAULT TRUE,
  push_promotions BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  sms_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Privacy
  share_data_for_improvement BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Theme (future)
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS 'User preferences for language, notifications, privacy';

-- Auto-create settings for new users
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_settings_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ENHANCE REVIEWS TABLE (تحسين جدول التقييمات)
-- ────────────────────────────────────────────────────────────────────────────

-- Add missing columns if needed
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;

COMMENT ON COLUMN reviews.would_recommend IS 'Would the user recommend this service?';
COMMENT ON COLUMN reviews.response_text IS 'Provider response to review';
COMMENT ON COLUMN reviews.response_at IS 'When provider responded';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES
-- ────────────────────────────────────────────────────────────────────────────

-- Lab Results
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lab results"
  ON lab_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient lab results"
  ON lab_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = lab_results.order_id
      AND o.provider_id = auth.uid()
    )
  );

CREATE POLICY "System can insert lab results"
  ON lab_results FOR INSERT
  WITH CHECK (true); -- Backend uploads after order completion

-- Prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can manage own prescriptions"
  ON prescriptions FOR ALL
  USING (auth.uid() = doctor_id);

CREATE POLICY "Pharmacies can view filled prescriptions"
  ON prescriptions FOR SELECT
  USING (
    status = 'filled' 
    AND filled_pharmacy_id IN (
      SELECT id FROM pharmacies WHERE owner_id = auth.uid()
    )
  );

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their orders"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages in their orders"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = messages.order_id
      AND (o.user_id = auth.uid() OR o.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark own messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- User Settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. FUNCTIONS & TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

-- Function: Mark message as read
CREATE OR REPLACE FUNCTION mark_message_read(message_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = message_id 
  AND receiver_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(for_order_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages
    WHERE order_id = for_order_id
    AND receiver_id = auth.uid()
    AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create prescription from order
CREATE OR REPLACE FUNCTION create_prescription_from_order(
  p_order_id UUID,
  p_diagnosis TEXT,
  p_medications JSONB,
  p_instructions TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_prescription_id UUID;
  v_doctor_id UUID;
  v_patient_id UUID;
BEGIN
  -- Get order details
  SELECT provider_id, user_id INTO v_doctor_id, v_patient_id
  FROM orders WHERE id = p_order_id;
  
  -- Create prescription
  INSERT INTO prescriptions (
    order_id, doctor_id, patient_id,
    diagnosis, medications, instructions,
    status
  ) VALUES (
    p_order_id, v_doctor_id, v_patient_id,
    p_diagnosis, p_medications, p_instructions,
    'issued'
  ) RETURNING id INTO v_prescription_id;
  
  RETURN v_prescription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. SAMPLE DATA (Optional)
-- ────────────────────────────────────────────────────────────────────────────

-- Example prescription medications format
/*
INSERT INTO prescriptions (order_id, doctor_id, patient_id, diagnosis, medications, status)
VALUES (
  'some-order-uuid',
  'doctor-uuid',
  'patient-uuid',
  'التهاب الحلق الحاد',
  '[
    {
      "name": "أموكسيسيلين 500 ملغ",
      "dosage": "كبسولة واحدة",
      "frequency": "3 مرات يومياً",
      "duration": "7 أيام",
      "notes": "بعد الأكل"
    },
    {
      "name": "بانادول 500 ملغ",
      "dosage": "قرص واحد",
      "frequency": "عند الحاجة",
      "duration": "5 أيام",
      "notes": "للألم فقط"
    }
  ]'::jsonb,
  'issued'
);
*/

-- ============================================================================
-- END OF MIGRATION 004
-- ============================================================================

COMMENT ON SCHEMA public IS 'Spir Medical v2.1 - Migration 004 complete';

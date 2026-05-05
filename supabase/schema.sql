-- ============================================================
-- Spir Medical · سباير ميديكال
-- Database Schema for Supabase (PostgreSQL 15+)
-- ============================================================
-- 
-- ⚠️  WARNING / تنبيه:
-- This is a PROPOSED schema for the future application.
-- It has NOT been tested in production. Before using:
-- 1. Review with a backend engineer
-- 2. Adjust to actual app requirements
-- 3. Test thoroughly with sample data
-- 4. Configure Row-Level Security policies
-- 5. Run security audit before launch
-- 
-- Version: 0.1.0 (Draft)
-- Last updated: 2026-05-06
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_type AS ENUM ('patient', 'specialist', 'admin', 'staff');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'prefer_not_to_say');
CREATE TYPE specialist_status AS ENUM ('pending_approval', 'active', 'suspended', 'rejected');
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'zaincash', 'asiacash', 'visa', 'mastercard', 'wallet');
CREATE TYPE service_category AS ENUM ('lab', 'pharmacy', 'consultation', 'nursing', 'cosmetic', 'hospital', 'clinic', 'emergency', 'other');
CREATE TYPE consultation_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE ticket_status AS ENUM ('new', 'in_progress', 'pending_user', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE notification_type AS ENUM ('order', 'consultation', 'medication', 'system', 'promotion');
CREATE TYPE language_code AS ENUM ('ar', 'en', 'ku');

-- ============================================================
-- TABLES
-- ============================================================

-- ─────────────── Users (Patients) ───────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  gender gender_type,
  date_of_birth DATE,
  national_id VARCHAR(50) UNIQUE,
  
  -- Address
  governorate VARCHAR(50),
  district VARCHAR(100),
  full_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- Preferences
  preferred_language language_code DEFAULT 'ar',
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  
  -- Wallet
  wallet_balance DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  loyalty_points INTEGER DEFAULT 0 NOT NULL,
  
  -- Status
  status user_status DEFAULT 'pending',
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'deleted';

-- ─────────────── Specialists (Doctors) ───────────────
CREATE TABLE specialists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Professional Info
  full_name_ar VARCHAR(200) NOT NULL,
  full_name_en VARCHAR(200),
  title VARCHAR(50), -- Dr., Prof., etc.
  specialty VARCHAR(100) NOT NULL,
  sub_specialty VARCHAR(100),
  years_of_experience INTEGER,
  
  -- Credentials
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_issuer VARCHAR(200),
  license_expiry DATE,
  
  -- Workplace
  primary_workplace VARCHAR(255),
  workplace_address TEXT,
  
  -- Pricing
  consultation_price DECIMAL(10, 2) NOT NULL,
  follow_up_price DECIMAL(10, 2),
  platform_commission_percent DECIMAL(5, 2) DEFAULT 15.00,
  
  -- Profile
  bio_ar TEXT,
  bio_en TEXT,
  profile_image_url TEXT,
  
  -- Languages spoken
  languages language_code[] DEFAULT ARRAY['ar']::language_code[],
  
  -- Stats (denormalized for performance)
  total_consultations INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  
  -- Status & Approval
  status specialist_status DEFAULT 'pending_approval',
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  unavailable_until TIMESTAMPTZ,
  auto_reply_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_specialists_user ON specialists(user_id);
CREATE INDEX idx_specialists_specialty ON specialists(specialty);
CREATE INDEX idx_specialists_status ON specialists(status);
CREATE INDEX idx_specialists_rating ON specialists(average_rating DESC);

-- ─────────────── Specialist Documents ───────────────
CREATE TABLE specialist_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'license', 'degree', 'id', 'photo'
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID
);

CREATE INDEX idx_documents_specialist ON specialist_documents(specialist_id);

-- ─────────────── Family Relationships ───────────────
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  member_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- For minors who don't have own accounts
  is_minor BOOLEAN DEFAULT false,
  full_name VARCHAR(200),
  date_of_birth DATE,
  gender gender_type,
  national_id VARCHAR(50),
  
  -- Relationship
  relationship VARCHAR(50) NOT NULL, -- 'spouse', 'child', 'parent', 'sibling', 'other'
  can_book_for BOOLEAN DEFAULT true,
  can_view_records BOOLEAN DEFAULT true,
  can_receive_notifications BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT family_member_or_minor CHECK (
    (member_user_id IS NOT NULL) OR (is_minor = true AND full_name IS NOT NULL)
  )
);

CREATE INDEX idx_family_primary ON family_members(primary_user_id);
CREATE INDEX idx_family_member ON family_members(member_user_id);

-- ─────────────── Services (the 14 services) ───────────────
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Multilingual names
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  name_ku VARCHAR(200),
  
  -- Description
  description_ar TEXT,
  description_en TEXT,
  description_ku TEXT,
  
  -- Classification
  category service_category NOT NULL,
  icon VARCHAR(50),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  has_dynamic_pricing BOOLEAN DEFAULT false,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_governorates VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR(50)[],
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_services_category ON services(category) WHERE is_active = true;
CREATE INDEX idx_services_slug ON services(slug);

-- ─────────────── Lab Tests ───────────────
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) NOT NULL,
  
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  
  category VARCHAR(100), -- 'CBC', 'Hormones', 'Vitamins', etc.
  description_ar TEXT,
  preparation_required TEXT, -- 'Fasting 8 hours', etc.
  
  base_price DECIMAL(10, 2) NOT NULL,
  result_time_hours INTEGER, -- Expected time to deliver results
  
  is_home_collection BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_lab_tests_category ON lab_tests(category);
CREATE INDEX idx_lab_tests_code ON lab_tests(code);

-- ─────────────── Orders ───────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'SP-2026-001234'
  
  user_id UUID REFERENCES users(id) NOT NULL,
  for_family_member_id UUID REFERENCES family_members(id),
  service_id UUID REFERENCES services(id) NOT NULL,
  specialist_id UUID REFERENCES specialists(id), -- if applicable
  
  -- Status
  status order_status DEFAULT 'pending' NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_complete_at TIMESTAMPTZ,
  
  -- Location (for home services)
  service_address TEXT,
  service_lat DECIMAL(10, 8),
  service_lng DECIMAL(11, 8),
  
  -- Pricing
  base_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Notes
  user_notes TEXT,
  internal_notes TEXT,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_specialist ON orders(specialist_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_for);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ─────────────── Order Items (for lab tests, prescriptions) ───────────────
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  lab_test_id UUID REFERENCES lab_tests(id),
  item_name VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─────────────── Consultations ───────────────
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  specialist_id UUID REFERENCES specialists(id) NOT NULL,
  
  status consultation_status DEFAULT 'scheduled',
  
  -- Timing
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Content
  chief_complaint TEXT,
  diagnosis TEXT, -- Filled by specialist
  treatment_plan TEXT,
  
  -- Private notes (specialist only)
  private_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_consultations_user ON consultations(user_id);
CREATE INDEX idx_consultations_specialist ON consultations(specialist_id);
CREATE INDEX idx_consultations_status ON consultations(status);

-- ─────────────── Messages (Chat) ───────────────
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES users(id) NOT NULL,
  
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'voice'
  content TEXT,
  attachment_url TEXT,
  attachment_size_bytes INTEGER,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_messages_consultation ON messages(consultation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);

-- ─────────────── Quick Reply Templates ───────────────
CREATE TABLE quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(50),
  text_content TEXT NOT NULL,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_templates_specialist ON quick_reply_templates(specialist_id);

-- ─────────────── Medical Records ───────────────
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_member_id UUID REFERENCES family_members(id),
  
  record_type VARCHAR(50) NOT NULL, -- 'lab_result', 'prescription', 'diagnosis', 'allergy', 'condition'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  related_order_id UUID REFERENCES orders(id),
  related_consultation_id UUID REFERENCES consultations(id),
  
  file_url TEXT,
  
  -- For allergies/conditions
  severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
  is_chronic BOOLEAN DEFAULT false,
  
  recorded_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_records_user ON medical_records(user_id);
CREATE INDEX idx_records_type ON medical_records(record_type);

-- ─────────────── Prescriptions ───────────────
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  specialist_id UUID REFERENCES specialists(id) NOT NULL,
  
  prescription_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Medications stored as JSONB for flexibility
  medications JSONB NOT NULL, -- [{ name, dosage, frequency, duration, notes }]
  
  general_notes TEXT,
  
  is_chronic BOOLEAN DEFAULT false,
  valid_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_prescriptions_user ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_specialist ON prescriptions(specialist_id);

-- ─────────────── Medications (Reminder Tracker) ───────────────
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_member_id UUID REFERENCES family_members(id),
  prescription_id UUID REFERENCES prescriptions(id),
  
  name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  
  -- Schedule
  times_per_day INTEGER NOT NULL,
  scheduled_times TIME[] NOT NULL,
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Notes
  with_food BOOLEAN,
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_medications_user ON medications(user_id) WHERE is_active = true;

-- ─────────────── Medication Doses (Tracking adherence) ───────────────
CREATE TABLE medication_doses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'taken', 'skipped', 'missed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_doses_medication ON medication_doses(medication_id, scheduled_at);
CREATE INDEX idx_doses_pending ON medication_doses(status, scheduled_at) WHERE status = 'pending';

-- ─────────────── Vitals Tracking ───────────────
CREATE TABLE vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  family_member_id UUID REFERENCES family_members(id),
  
  vital_type VARCHAR(30) NOT NULL, -- 'blood_pressure', 'blood_sugar', 'weight', 'heart_rate', 'temperature', 'oxygen'
  
  -- Flexible storage for different vital types
  value_numeric DECIMAL(10, 2),
  value_systolic INTEGER, -- For BP
  value_diastolic INTEGER, -- For BP
  value_unit VARCHAR(20),
  
  measured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_vitals_user_type ON vitals(user_id, vital_type, measured_at DESC);

-- ─────────────── Wallet Transactions ───────────────
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  transaction_type VARCHAR(30) NOT NULL, -- 'topup', 'payment', 'refund', 'withdrawal', 'reward'
  amount DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  
  related_order_id UUID REFERENCES orders(id),
  payment_method payment_method,
  
  reference_number VARCHAR(100),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id, created_at DESC);

-- ─────────────── Specialist Earnings & Withdrawals ───────────────
CREATE TABLE specialist_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID REFERENCES specialists(id) NOT NULL,
  consultation_id UUID REFERENCES consultations(id),
  order_id UUID REFERENCES orders(id),
  
  gross_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  
  is_withdrawn BOOLEAN DEFAULT false,
  withdrawal_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_earnings_specialist ON specialist_earnings(specialist_id, is_withdrawn);

CREATE TABLE specialist_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID REFERENCES specialists(id) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  
  withdrawal_method VARCHAR(50) NOT NULL, -- 'bank', 'zaincash', 'asiacash'
  account_details JSONB, -- Encrypted bank/wallet info
  
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  
  reference_number VARCHAR(100),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_withdrawals_specialist ON specialist_withdrawals(specialist_id, created_at DESC);

-- ─────────────── Ratings & Reviews ───────────────
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  specialist_id UUID REFERENCES specialists(id),
  service_id UUID REFERENCES services(id),
  order_id UUID REFERENCES orders(id) UNIQUE,
  consultation_id UUID REFERENCES consultations(id) UNIQUE,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  tags VARCHAR(50)[], -- 'fast', 'professional', 'clear_explanation', etc.
  
  is_published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ratings_specialist ON ratings(specialist_id);
CREATE INDEX idx_ratings_service ON ratings(service_id);

-- ─────────────── Promotions ───────────────
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  description_ar TEXT,
  
  -- Discount
  discount_type VARCHAR(20) NOT NULL, -- 'percent', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Targeting
  applicable_service_ids UUID[],
  target_governorates VARCHAR(50)[],
  target_age_min INTEGER,
  target_age_max INTEGER,
  target_gender gender_type,
  
  -- Schedule
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Limits
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Display
  banner_image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID
);

CREATE INDEX idx_promotions_active ON promotions(is_active, starts_at, ends_at);

-- ─────────────── Notifications ───────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  action_url TEXT,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  sent_email BOOLEAN DEFAULT false,
  sent_sms BOOLEAN DEFAULT false,
  sent_push BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- ─────────────── Support Tickets ───────────────
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- 'TK-2026-001234'
  
  user_id UUID REFERENCES users(id) NOT NULL,
  related_order_id UUID REFERENCES orders(id),
  
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  status ticket_status DEFAULT 'new',
  priority ticket_priority DEFAULT 'normal',
  category VARCHAR(50),
  
  assigned_to UUID, -- staff user_id
  
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status, priority) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to) WHERE status NOT IN ('resolved', 'closed');

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ticket_messages ON ticket_messages(ticket_id, created_at);

-- ─────────────── Audit Log ───────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL, -- 'view_record', 'edit_user', 'cancel_order', etc.
  entity_type VARCHAR(50), -- 'user', 'order', 'medical_record'
  entity_id UUID,
  
  changes JSONB, -- Before/After values
  metadata JSONB, -- IP, user-agent, etc.
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ─────────────── Translations (for admin-editable strings) ───────────────
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(200) NOT NULL,
  value_ar TEXT,
  value_en TEXT,
  value_ku TEXT,
  context VARCHAR(50), -- 'app', 'web', 'email'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(key, context)
);

CREATE INDEX idx_translations_key ON translations(key);

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================
-- ⚠️ CRITICAL: These policies must be reviewed and tested
-- before going to production. The examples below are starting points.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can only see their own orders
CREATE POLICY "Users see own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Specialists can see orders assigned to them
CREATE POLICY "Specialists see assigned orders"
  ON orders FOR SELECT
  USING (
    specialist_id IN (
      SELECT id FROM specialists WHERE user_id = auth.uid()
    )
  );

-- Medical records: only owner can access
CREATE POLICY "Users see own medical records"
  ON medical_records FOR SELECT
  USING (auth.uid() = user_id);

-- Messages: only consultation participants can see
CREATE POLICY "Consultation participants see messages"
  ON messages FOR SELECT
  USING (
    consultation_id IN (
      SELECT id FROM consultations
      WHERE user_id = auth.uid()
      OR specialist_id IN (
        SELECT id FROM specialists WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on rows
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialists_updated_at BEFORE UPDATE ON specialists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'SP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Insert the 14 services
INSERT INTO services (slug, name_ar, name_en, category, base_price, sort_order, is_active) VALUES
  ('home-blood-draw', 'سحب دم منزلي', 'Home Blood Draw', 'lab', 25000, 1, true),
  ('lab-tests', 'فحوصات مختبرية', 'Laboratory Tests', 'lab', 0, 2, true),
  ('hospitals', 'حجز مستشفيات', 'Hospital Booking', 'hospital', 0, 3, true),
  ('home-nursing', 'تمريض منزلي', 'Home Nursing', 'nursing', 50000, 4, true),
  ('cosmetic-care', 'تجميل وعناية', 'Cosmetic Care', 'cosmetic', 0, 5, true),
  ('pharmacies', 'صيدليات', 'Pharmacies', 'pharmacy', 0, 6, true),
  ('consultations', 'استشارات طبية', 'Medical Consultations', 'consultation', 30000, 7, true),
  ('emergency-sos', 'طوارئ SOS', 'Emergency SOS', 'emergency', 0, 8, true),
  ('medical-records', 'السجل الطبي', 'Medical Records', 'other', 0, 9, true),
  ('family-management', 'إدارة العائلة', 'Family Management', 'other', 0, 10, true),
  ('prescription-ocr', 'قراءة الوصفات', 'Prescription OCR', 'other', 0, 11, true),
  ('vitals-tracking', 'المؤشرات الحيوية', 'Vitals Tracking', 'other', 0, 12, true),
  ('clinics', 'عيادات متخصصة', 'Specialty Clinics', 'clinic', 0, 13, true),
  ('medication-reminder', 'تذكير الأدوية', 'Medication Reminder', 'other', 0, 14, true);

-- ============================================================
-- VIEWS (Helpful for the app)
-- ============================================================

-- Public specialist profiles (for browsing)
CREATE VIEW public_specialists AS
SELECT 
  s.id,
  s.full_name_ar,
  s.full_name_en,
  s.title,
  s.specialty,
  s.years_of_experience,
  s.bio_ar,
  s.profile_image_url,
  s.consultation_price,
  s.average_rating,
  s.total_ratings,
  s.is_available,
  s.languages
FROM specialists s
WHERE s.status = 'active';

-- ============================================================
-- END OF SCHEMA
-- ============================================================

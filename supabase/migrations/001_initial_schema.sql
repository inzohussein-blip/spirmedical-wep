-- ============================================================================
-- Spir Medical - Database Schema
-- Supabase / PostgreSQL with PostGIS
-- Version: 1.0.0
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'nurse', 'lab_tech', 'pharmacy', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE order_status AS ENUM (
  'pending',      -- In bevolen, awaiting provider acceptance
  'searching',    -- Finding a provider
  'accepted',     -- Provider accepted
  'on_the_way',   -- Provider en route
  'arrived',      -- Provider arrived
  'in_progress',  -- Service started (OTP verified)
  'completed',    -- Service finished (end OTP verified)
  'cancelled',    -- Cancelled by patient or provider
  'failed'        -- Service failure
);
CREATE TYPE service_type AS ENUM (
  'blood_test',
  'consultation_video',
  'consultation_audio',
  'consultation_chat',
  'pharmacy_search',
  'pharmacy_delivery'
);
CREATE TYPE payment_method AS ENUM ('cash_on_delivery', 'zain_cash', 'fast_pay', 'card', 'usdt');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE consultation_kind AS ENUM ('video', 'audio', 'chat');

-- ============================================================================
-- PROFILES (extends auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'patient',
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(150),
  gender gender_type,
  date_of_birth DATE,
  avatar_url TEXT,
  city VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_city ON profiles(city);

-- ============================================================================
-- PROVIDER PROFILES (Doctors, Nurses, Lab Technicians)
-- ============================================================================

CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  syndicate_id VARCHAR(50),
  specialty VARCHAR(100),
  years_experience INT DEFAULT 0,
  bio TEXT,
  base_consultation_fee_iqd INT DEFAULT 0,
  current_location GEOGRAPHY(POINT, 4326),
  is_available BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3, 2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_specialty ON provider_profiles(specialty);
CREATE INDEX idx_provider_location ON provider_profiles USING GIST(current_location);
CREATE INDEX idx_provider_available ON provider_profiles(is_available) WHERE is_available = TRUE;

-- ============================================================================
-- PHARMACIES
-- ============================================================================

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  open_hours JSONB DEFAULT '{}'::jsonb,
  delivers BOOLEAN DEFAULT FALSE,
  delivery_fee_iqd INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  rating_avg DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_location ON pharmacies USING GIST(location);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);

-- ============================================================================
-- MEDICATIONS CATALOG
-- ============================================================================

CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  generic_name VARCHAR(200),
  manufacturer VARCHAR(150),
  dosage_form VARCHAR(50),  -- tablet, syrup, injection, etc
  strength VARCHAR(50),     -- 500mg, 10ml, etc
  category VARCHAR(80),
  requires_prescription BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medications_name_ar_trgm ON medications USING GIN(name_ar gin_trgm_ops);
CREATE INDEX idx_medications_name_en_trgm ON medications USING GIN(name_en gin_trgm_ops);

-- ============================================================================
-- PHARMACY INVENTORY (which pharmacies have which medications)
-- ============================================================================

CREATE TABLE pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  in_stock BOOLEAN DEFAULT TRUE,
  price_iqd INT,
  last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, medication_id)
);

CREATE INDEX idx_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX idx_inventory_medication ON pharmacy_inventory(medication_id);
CREATE INDEX idx_inventory_in_stock ON pharmacy_inventory(in_stock) WHERE in_stock = TRUE;

-- ============================================================================
-- LAB TESTS CATALOG
-- ============================================================================

CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(150) NOT NULL,
  name_en VARCHAR(150),
  category VARCHAR(80),       -- CBC, Hormones, Diabetes, etc
  description_ar TEXT,
  base_price_iqd INT NOT NULL,
  fasting_required BOOLEAN DEFAULT FALSE,
  preparation_notes_ar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

CREATE INDEX idx_lab_tests_category ON lab_tests(category);
CREATE INDEX idx_lab_tests_active ON lab_tests(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ADDRESSES (Patient saved addresses)
-- ============================================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label VARCHAR(50),                -- المنزل، العمل
  full_address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(80),
  building_details TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_profile ON addresses(profile_id);
CREATE INDEX idx_addresses_location ON addresses USING GIST(location);

-- ============================================================================
-- ORDERS (Master orders table)
-- ============================================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,  -- SPR-2026-001234
  patient_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID REFERENCES profiles(id),
  service_type service_type NOT NULL,
  status order_status DEFAULT 'pending',

  -- Location
  address_id UUID REFERENCES addresses(id),
  service_location GEOGRAPHY(POINT, 4326),

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- OTP system (THE KEY DIFFERENTIATOR)
  start_otp VARCHAR(6),
  end_otp VARCHAR(6),
  start_otp_verified_at TIMESTAMPTZ,
  end_otp_verified_at TIMESTAMPTZ,

  -- Pricing
  subtotal_iqd INT NOT NULL DEFAULT 0,
  service_fee_iqd INT DEFAULT 0,
  delivery_fee_iqd INT DEFAULT 0,
  discount_iqd INT DEFAULT 0,
  total_iqd INT NOT NULL DEFAULT 0,

  -- Payment
  payment_method payment_method DEFAULT 'cash_on_delivery',
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,

  -- Provider preferences
  preferred_gender gender_type,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_orders_provider ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_service_type ON orders(service_type);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ============================================================================
-- ORDER ITEMS (line items: lab tests selected, etc)
-- ============================================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type VARCHAR(40) NOT NULL,  -- lab_test, medication, consultation
  item_id UUID,
  item_name_snapshot VARCHAR(200),
  quantity INT DEFAULT 1,
  unit_price_iqd INT NOT NULL,
  subtotal_iqd INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================================
-- CONSULTATIONS (specific consultation data)
-- ============================================================================

CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  kind consultation_kind NOT NULL,
  duration_minutes INT,
  symptoms_complaint TEXT,
  diagnosis TEXT,
  prescription TEXT,
  follow_up_advice TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  room_id VARCHAR(100),  -- Video/audio call room ID
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);

-- ============================================================================
-- LAB RESULTS
-- ============================================================================

CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id),
  lab_test_id UUID REFERENCES lab_tests(id),
  result_pdf_url TEXT,
  result_data JSONB,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_lab_results_order ON lab_results(order_id);

-- ============================================================================
-- REVIEWS
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID REFERENCES profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_provider ON reviews(provider_id);

-- ============================================================================
-- LIVE TRACKING (provider location updates during active orders)
-- ============================================================================

CREATE TABLE provider_location_updates (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_updates_order ON provider_location_updates(order_id, recorded_at DESC);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  body TEXT,
  type VARCHAR(40),
  related_order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile ON notifications(profile_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(profile_id) WHERE is_read = FALSE;

-- ============================================================================
-- TRIGGERS - Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGERS - Auto-generate order number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  NEW.order_number := 'SPR-' || year_part || '-' || seq_part;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE TRIGGER trg_orders_generate_number BEFORE INSERT ON orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- ============================================================================
-- TRIGGERS - Auto-generate OTP codes
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_otp_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_otp IS NULL THEN
    NEW.start_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  IF NEW.end_otp IS NULL THEN
    NEW.end_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_generate_otps BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_otp_codes();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_location_updates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile + public provider profiles
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT
  USING (auth.uid() = id OR role IN ('doctor', 'nurse', 'lab_tech'));

CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Addresses: only owner
CREATE POLICY "addresses_owner_only" ON addresses FOR ALL
  USING (auth.uid() = profile_id);

-- Orders: patient sees their own + provider sees assigned
CREATE POLICY "orders_patient_read" ON orders FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = provider_id);

CREATE POLICY "orders_patient_create" ON orders FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "orders_participants_update" ON orders FOR UPDATE
  USING (auth.uid() = patient_id OR auth.uid() = provider_id);

-- Order items: through order ownership
CREATE POLICY "order_items_through_order" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.patient_id = auth.uid() OR orders.provider_id = auth.uid())
  ));

CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.patient_id = auth.uid()
  ));

-- Consultations: only participants
CREATE POLICY "consultations_participants" ON consultations FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Lab results: patient + provider who uploaded
CREATE POLICY "lab_results_patient" ON lab_results FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = uploaded_by);

-- Notifications: only owner
CREATE POLICY "notifications_owner" ON notifications FOR ALL
  USING (auth.uid() = profile_id);

-- Provider location: patient of the order can see
CREATE POLICY "provider_location_for_patient" ON provider_location_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = provider_location_updates.order_id
    AND orders.patient_id = auth.uid()
  ));

CREATE POLICY "provider_location_insert" ON provider_location_updates FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Reviews: anyone can read, only patient who ordered can create
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "reviews_patient_create" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Find nearby pharmacies that have a specific medication
CREATE OR REPLACE FUNCTION find_pharmacies_with_medication(
  p_medication_id UUID,
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_max_distance_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  pharmacy_id UUID,
  pharmacy_name VARCHAR,
  pharmacy_phone VARCHAR,
  pharmacy_address TEXT,
  distance_km DOUBLE PRECISION,
  price_iqd INT,
  in_stock BOOLEAN,
  delivers BOOLEAN,
  delivery_fee_iqd INT,
  last_confirmed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.phone,
    p.address,
    ST_Distance(p.location, ST_MakePoint(p_user_lng, p_user_lat)::geography) / 1000.0 AS distance_km,
    pi.price_iqd,
    pi.in_stock,
    p.delivers,
    p.delivery_fee_iqd,
    pi.last_confirmed_at
  FROM pharmacies p
  INNER JOIN pharmacy_inventory pi ON pi.pharmacy_id = p.id
  WHERE pi.medication_id = p_medication_id
    AND pi.in_stock = TRUE
    AND p.is_active = TRUE
    AND ST_DWithin(
      p.location,
      ST_MakePoint(p_user_lng, p_user_lat)::geography,
      p_max_distance_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Find nearby available providers
CREATE OR REPLACE FUNCTION find_available_providers(
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_role user_role,
  p_preferred_gender gender_type DEFAULT NULL,
  p_max_distance_km DOUBLE PRECISION DEFAULT 15
)
RETURNS TABLE (
  provider_id UUID,
  full_name VARCHAR,
  avatar_url TEXT,
  specialty VARCHAR,
  rating_avg DECIMAL,
  rating_count INT,
  distance_km DOUBLE PRECISION,
  base_fee_iqd INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.profile_id,
    pr.full_name,
    pr.avatar_url,
    pp.specialty,
    pp.rating_avg,
    pp.rating_count,
    ST_Distance(pp.current_location, ST_MakePoint(p_user_lng, p_user_lat)::geography) / 1000.0 AS distance_km,
    pp.base_consultation_fee_iqd
  FROM provider_profiles pp
  INNER JOIN profiles pr ON pr.id = pp.profile_id
  WHERE pr.role = p_role
    AND pp.is_available = TRUE
    AND pr.is_active = TRUE
    AND (p_preferred_gender IS NULL OR pr.gender = p_preferred_gender)
    AND ST_DWithin(
      pp.current_location,
      ST_MakePoint(p_user_lng, p_user_lat)::geography,
      p_max_distance_km * 1000
    )
  ORDER BY distance_km ASC, rating_avg DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verify start OTP
CREATE OR REPLACE FUNCTION verify_start_otp(p_order_id UUID, p_otp VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_order.start_otp = p_otp AND v_order.start_otp_verified_at IS NULL THEN
    UPDATE orders
      SET start_otp_verified_at = NOW(),
          status = 'in_progress',
          started_at = NOW()
      WHERE id = p_order_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify end OTP
CREATE OR REPLACE FUNCTION verify_end_otp(p_order_id UUID, p_otp VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_order.end_otp = p_otp AND v_order.end_otp_verified_at IS NULL THEN
    UPDATE orders
      SET end_otp_verified_at = NOW(),
          status = 'completed',
          completed_at = NOW()
      WHERE id = p_order_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Lab Tests
-- ============================================================================

INSERT INTO lab_tests (name_ar, name_en, category, base_price_iqd, fasting_required, preparation_notes_ar, sort_order) VALUES
  ('فحص الدم الشامل (CBC)', 'Complete Blood Count', 'دم', 12000, FALSE, 'لا يحتاج صيام', 1),
  ('سكر الدم الصائم (FBS)', 'Fasting Blood Sugar', 'سكري', 8000, TRUE, 'صيام 8-10 ساعات', 2),
  ('السكر التراكمي (HbA1c)', 'Glycated Hemoglobin', 'سكري', 18000, FALSE, 'لا يحتاج صيام', 3),
  ('وظائف الكبد', 'Liver Function Test', 'كبد', 22000, FALSE, 'لا يحتاج صيام', 4),
  ('وظائف الكلى', 'Kidney Function Test', 'كلى', 20000, FALSE, 'لا يحتاج صيام', 5),
  ('الدهون الكاملة (Lipid Panel)', 'Lipid Profile', 'دهون', 25000, TRUE, 'صيام 12 ساعة', 6),
  ('الغدة الدرقية (TSH)', 'Thyroid Stimulating Hormone', 'هرمونات', 18000, FALSE, 'لا يحتاج صيام', 7),
  ('فيتامين D', 'Vitamin D', 'فيتامينات', 28000, FALSE, 'لا يحتاج صيام', 8),
  ('فيتامين B12', 'Vitamin B12', 'فيتامينات', 22000, FALSE, 'لا يحتاج صيام', 9),
  ('فحص الحمل', 'Pregnancy Test (Beta hCG)', 'نسائية', 15000, FALSE, 'لا يحتاج صيام', 10),
  ('تحليل البول الشامل', 'Urine Analysis', 'بول', 7000, FALSE, 'عينة صباحية', 11),
  ('فحص الحديد', 'Iron Studies', 'دم', 24000, FALSE, 'لا يحتاج صيام', 12);

-- ============================================================================
-- SEED DATA: Common Medications (Arabic names)
-- ============================================================================

INSERT INTO medications (name_ar, name_en, generic_name, dosage_form, strength, category, requires_prescription) VALUES
  ('بانادول', 'Panadol', 'Paracetamol', 'حبة', '500mg', 'مسكن وخافض حرارة', FALSE),
  ('فولتارين', 'Voltaren', 'Diclofenac', 'حبة', '50mg', 'مسكن', FALSE),
  ('أوغمنتين', 'Augmentin', 'Amoxicillin/Clavulanate', 'حبة', '625mg', 'مضاد حيوي', TRUE),
  ('ميتفورمين', 'Metformin', 'Metformin', 'حبة', '500mg', 'سكري', TRUE),
  ('غلوكوفاج', 'Glucophage', 'Metformin', 'حبة', '850mg', 'سكري', TRUE),
  ('كونكور', 'Concor', 'Bisoprolol', 'حبة', '5mg', 'ضغط', TRUE),
  ('نورفاسك', 'Norvasc', 'Amlodipine', 'حبة', '5mg', 'ضغط', TRUE),
  ('أنسولين لانتوس', 'Lantus Insulin', 'Insulin Glargine', 'حقنة', '100U/ml', 'سكري', TRUE),
  ('فينترولين', 'Ventolin', 'Salbutamol', 'بخاخ', '100mcg', 'تنفسية', TRUE),
  ('نيكسيوم', 'Nexium', 'Esomeprazole', 'حبة', '40mg', 'معدة', TRUE),
  ('زيرتيك', 'Zyrtec', 'Cetirizine', 'حبة', '10mg', 'حساسية', FALSE),
  ('بروفين', 'Brufen', 'Ibuprofen', 'حبة', '400mg', 'مسكن', FALSE);

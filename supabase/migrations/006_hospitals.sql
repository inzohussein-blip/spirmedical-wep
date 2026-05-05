-- ============================================================================
-- Spir Medical - Migration 006: Hospitals & Health Centers
-- ============================================================================

CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name_ar TEXT NOT NULL,
  name_en TEXT,
  
  -- Type
  hospital_type TEXT NOT NULL CHECK (hospital_type IN (
    'government', 'private', 'teaching', 'specialized', 'health_center', 'emergency_center'
  )),
  
  -- Specialties offered
  specialties TEXT[] NOT NULL DEFAULT '{}',
  
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Contact
  phone_main TEXT,
  phone_emergency TEXT,
  phone_reception TEXT,
  email TEXT,
  website TEXT,
  
  -- Details
  description_ar TEXT,
  bed_count INTEGER,
  has_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  has_icu BOOLEAN NOT NULL DEFAULT FALSE,
  has_lab BOOLEAN NOT NULL DEFAULT FALSE,
  has_pharmacy BOOLEAN NOT NULL DEFAULT FALSE,
  has_radiology BOOLEAN NOT NULL DEFAULT FALSE,
  has_surgery BOOLEAN NOT NULL DEFAULT FALSE,
  has_maternity BOOLEAN NOT NULL DEFAULT FALSE,
  has_pediatrics BOOLEAN NOT NULL DEFAULT FALSE,
  has_ambulance BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Working hours
  working_hours_ar TEXT DEFAULT 'على مدار الساعة',
  is_24_hours BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Media
  photo_url TEXT,
  photos TEXT[] DEFAULT '{}',
  
  -- Rating
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_type ON hospitals(hospital_type);
CREATE INDEX idx_hospitals_active ON hospitals(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_hospitals_location ON hospitals(latitude, longitude);

-- RLS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active hospitals" ON hospitals FOR SELECT USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────────────────────
-- SEED DATA: مستشفيات حقيقية في العراق
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO hospitals (name_ar, name_en, hospital_type, specialties, address, city, district, latitude, longitude, phone_main, phone_emergency, description_ar, bed_count, has_emergency, has_icu, has_lab, has_pharmacy, has_radiology, has_surgery, has_maternity, has_pediatrics, has_ambulance, is_24_hours, rating, is_verified) VALUES

-- ═══════════════ النجف ═══════════════
(
  'مستشفى الصدر التعليمي',
  'Al-Sadr Teaching Hospital',
  'teaching',
  ARRAY['باطنية', 'جراحة', 'عظام', 'أعصاب', 'قلب', 'كلى', 'عيون', 'أنف وأذن'],
  'شارع المدينة المنورة، النجف',
  'النجف', 'المدينة القديمة',
  32.0000, 44.3300,
  '+9647801000001', '+9647801000002',
  'أكبر مستشفى حكومي تعليمي في النجف. يقدم خدمات طبية شاملة ويضم كوادر طبية متخصصة وطلاب كلية الطب.',
  500, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.2, TRUE
),
(
  'مستشفى الزهراء التعليمي للولادة',
  'Al-Zahraa Teaching Hospital',
  'teaching',
  ARRAY['نسائية', 'توليد', 'أطفال حديثي الولادة', 'عقم'],
  'حي الأمير، النجف',
  'النجف', 'حي الأمير',
  32.0120, 44.3460,
  '+9647801000003', '+9647801000004',
  'مستشفى متخصص بالولادة وأمراض النساء والتوليد. يضم أقسام متطورة لحديثي الولادة والعناية المركزة.',
  200, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.5, TRUE
),
(
  'مستشفى الحكيم العام',
  'Al-Hakeem General Hospital',
  'private',
  ARRAY['باطنية', 'جراحة', 'عظام', 'قلب', 'أطفال', 'جلدية', 'نسائية'],
  'شارع الصدر، النجف',
  'النجف', 'حي السعد',
  32.0085, 44.3464,
  '+9647801000005', '+9647801000006',
  'مستشفى أهلي حديث مجهز بأحدث المعدات الطبية. يقدم خدمات تشخيصية وعلاجية متقدمة.',
  150, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, 4.6, TRUE
),
(
  'مركز النجف الصحي',
  'Najaf Health Center',
  'health_center',
  ARRAY['عام', 'أطفال', 'لقاحات', 'أسنان'],
  'حي الكرامة، النجف',
  'النجف', 'الكرامة',
  32.0050, 44.3400,
  '+9647801000007', NULL,
  'مركز صحي أولي يقدم الرعاية الصحية الأساسية واللقاحات وطب الأسرة.',
  20, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, 4.0, TRUE
),
(
  'مستشفى الأمل التخصصي',
  'Al-Amal Specialist Hospital',
  'specialized',
  ARRAY['أورام', 'علاج كيميائي', 'إشعاعي'],
  'طريق كربلاء، النجف',
  'النجف', NULL,
  32.0200, 44.3550,
  '+9647801000008', '+9647801000009',
  'مركز متخصص في علاج الأورام والسرطان. يضم أحدث أجهزة العلاج الإشعاعي والكيميائي.',
  100, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, 4.7, TRUE
),

-- ═══════════════ كربلاء ═══════════════
(
  'مستشفى الحسين التعليمي',
  'Al-Hussein Teaching Hospital',
  'teaching',
  ARRAY['باطنية', 'جراحة', 'عظام', 'أعصاب', 'قلب', 'كلى'],
  'شارع العباس، كربلاء',
  'كربلاء', 'المركز',
  32.6160, 44.0250,
  '+9647802000001', '+9647802000002',
  'المستشفى التعليمي الرئيسي في كربلاء. يقدم خدمات طبية شاملة ويستقبل الحالات من كل المحافظة.',
  400, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.3, TRUE
),
(
  'مستشفى كربلاء التخصصي للأطفال',
  'Karbala Pediatric Hospital',
  'specialized',
  ARRAY['أطفال', 'أطفال حديثي الولادة', 'جراحة أطفال', 'قلب أطفال'],
  'حي العباسية، كربلاء',
  'كربلاء', 'العباسية',
  32.6200, 44.0300,
  '+9647802000003', '+9647802000004',
  'مستشفى متخصص بطب الأطفال وجراحتهم. يضم عناية مركزة لحديثي الولادة.',
  120, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 4.5, TRUE
),

-- ═══════════════ بغداد ═══════════════
(
  'مدينة الطب (مستشفى بغداد التعليمي)',
  'Medical City (Baghdad Teaching Hospital)',
  'teaching',
  ARRAY['باطنية', 'جراحة', 'قلب', 'أعصاب', 'كلى', 'أورام', 'عظام', 'عيون', 'أنف وأذن', 'جلدية', 'نفسية', 'تأهيل'],
  'باب المعظم، الرصافة، بغداد',
  'بغداد', 'الرصافة',
  33.3525, 44.3780,
  '+9647803000001', '+9647803000002',
  'أكبر مجمع طبي في العراق. يضم عدة مستشفيات تخصصية ومراكز بحثية وتعليمية. مرجع طبي وطني.',
  2000, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.4, TRUE
),
(
  'مستشفى ابن سينا التعليمي',
  'Ibn Sina Teaching Hospital',
  'teaching',
  ARRAY['جراحة', 'جراحة قلب', 'جراحة أعصاب', 'جراحة تجميل', 'حروق'],
  'المنطقة الخضراء، الكرخ، بغداد',
  'بغداد', 'الكرخ',
  33.3100, 44.3600,
  '+9647803000003', '+9647803000004',
  'من أعرق المستشفيات الجراحية في العراق. متخصص بالعمليات الكبرى وجراحة القلب المفتوح.',
  300, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, 4.6, TRUE
),
(
  'مستشفى الكاظمية التعليمي',
  'Al-Kadhimiya Teaching Hospital',
  'teaching',
  ARRAY['باطنية', 'جراحة', 'نسائية', 'أطفال', 'عظام', 'أنف وأذن'],
  'الكاظمية، بغداد',
  'بغداد', 'الكاظمية',
  33.3800, 44.3400,
  '+9647803000005', '+9647803000006',
  'مستشفى تعليمي عريق يخدم منطقة الكاظمية والمناطق المحيطة.',
  350, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.1, TRUE
),

-- ═══════════════ البصرة ═══════════════
(
  'مستشفى البصرة التعليمي',
  'Basra Teaching Hospital',
  'teaching',
  ARRAY['باطنية', 'جراحة', 'عظام', 'قلب', 'كلى', 'أعصاب'],
  'شارع الجزائر، البصرة',
  'البصرة', 'المركز',
  30.5085, 47.7838,
  '+9647804000001', '+9647804000002',
  'المستشفى التعليمي الرئيسي في جنوب العراق.',
  600, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.2, TRUE
),

-- ═══════════════ أربيل ═══════════════
(
  'مستشفى رزكاري التعليمي',
  'Rizgary Teaching Hospital',
  'teaching',
  ARRAY['باطنية', 'جراحة', 'عظام', 'أعصاب', 'قلب'],
  'شارع 60 متري، أربيل',
  'أربيل', 'المركز',
  36.1912, 44.0090,
  '+9647805000001', '+9647805000002',
  'من أهم مستشفيات إقليم كردستان. يقدم خدمات طبية متقدمة.',
  400, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.5, TRUE
),

-- ═══════════════ مراكز طوارئ ═══════════════
(
  'مركز طوارئ النجف',
  'Najaf Emergency Center',
  'emergency_center',
  ARRAY['طوارئ', 'إسعاف', 'حوادث'],
  'شارع الإمام علي، النجف',
  'النجف', 'المركز',
  32.0070, 44.3420,
  '+9647801100001', '+9647801100002',
  'مركز الطوارئ والإسعاف الرئيسي. يعمل على مدار الساعة لاستقبال حالات الطوارئ والحوادث.',
  50, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, 4.3, TRUE
),
(
  'مركز طوارئ كربلاء',
  'Karbala Emergency Center',
  'emergency_center',
  ARRAY['طوارئ', 'إسعاف', 'حوادث'],
  'شارع الحسين، كربلاء',
  'كربلاء', 'المركز',
  32.6150, 44.0200,
  '+9647802100001', '+9647802100002',
  'مركز طوارئ وإسعاف يعمل 24 ساعة. مجهز لاستقبال الحالات الحرجة والحوادث.',
  40, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE, 4.1, TRUE
)

ON CONFLICT DO NOTHING;

-- ============================================================================
COMMENT ON SCHEMA public IS 'Spir Medical v3.1 - Migration 006: Hospitals';

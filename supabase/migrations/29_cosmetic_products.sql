-- ════════════════════════════════════════════════════════════════════
-- ✨ Migration 29: Cosmetic & Beauty Products (V25.11)
-- ════════════════════════════════════════════════════════════════════
-- منتجات التجميل والعناية المُتوفّرة في الصيدليات
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- المعلومات الأساسية
  name TEXT NOT NULL,
  name_en TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'skincare',     -- العناية بالبشرة
    'haircare',     -- الشعر
    'makeup',       -- مكياج
    'fragrance',    -- عطور
    'supplements',  -- مكملات غذائية
    'bodycare',     -- العناية بالجسم
    'baby_care',    -- منتجات أطفال
    'mens_care'     -- منتجات رجالية
  )),

  -- السعر
  price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,

  -- التفاصيل
  description TEXT,
  ingredients TEXT,
  usage_instructions TEXT,

  -- الصورة
  image_url TEXT,
  image_emoji TEXT DEFAULT '🧴',

  -- المتاجر التي تبيعه
  available_at_pharmacies UUID[] DEFAULT ARRAY[]::UUID[],

  -- التقييم
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- المخزون
  is_in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,

  -- منشأ + توصيات
  country_of_origin TEXT,
  is_recommended BOOLEAN DEFAULT FALSE,    -- اختيار الموظفين
  recommendation_note TEXT,

  -- الحالة
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_category ON public.cosmetic_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetic_active ON public.cosmetic_products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cosmetic_recommended ON public.cosmetic_products(is_recommended) WHERE is_recommended = TRUE;

ALTER TABLE public.cosmetic_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cosmetic_read_all" ON public.cosmetic_products;
CREATE POLICY "cosmetic_read_all"
  ON public.cosmetic_products FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "cosmetic_admin_manage" ON public.cosmetic_products;
CREATE POLICY "cosmetic_admin_manage"
  ON public.cosmetic_products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── Seed data ───
INSERT INTO public.cosmetic_products (name, name_en, brand, category, price, image_emoji, country_of_origin, is_recommended) VALUES
('كريم ترطيب للوجه', 'Moisturizing Face Cream', 'Eucerin', 'skincare', 25000, '🧴', 'Germany', true),
('سيروم فيتامين C', 'Vitamin C Serum', 'CeraVe', 'skincare', 35000, '💧', 'USA', true),
('شامبو ضد القشرة', 'Anti-Dandruff Shampoo', 'Head & Shoulders', 'haircare', 12000, '🧴', 'USA', false),
('غسول للوجه', 'Foaming Face Wash', 'Cetaphil', 'skincare', 18000, '🧼', 'France', true),
('واقي شمس', 'Sun Protection SPF50', 'La Roche-Posay', 'skincare', 32000, '☀️', 'France', true),
('كريم الأطفال', 'Baby Cream', 'Bepanthen', 'baby_care', 15000, '👶', 'Germany', true),
('فيتامين د3 1000', 'Vitamin D3 1000IU', 'Nature Made', 'supplements', 22000, '💊', 'USA', false),
('عطر رجالي', 'Cool Water Cologne', 'Davidoff', 'fragrance', 85000, '🌸', 'Germany', false),
('شامبو للشعر الدهني', 'Oily Hair Shampoo', 'Vichy', 'haircare', 28000, '🧴', 'France', false),
('كريم ليلي مضاد للتجاعيد', 'Anti-Aging Night Cream', 'Olay', 'skincare', 45000, '🌙', 'USA', true),
('روج أحمر', 'Matte Red Lipstick', 'MAC', 'makeup', 38000, '💄', 'USA', false),
('بلسم للشفاه', 'Lip Balm', 'Vaseline', 'skincare', 5000, '👄', 'USA', true),
('زيت للشعر', 'Hair Oil', 'L''Oreal', 'haircare', 18000, '✨', 'France', false),
('غسول مهبلي', 'Intimate Wash', 'Lactacyd', 'bodycare', 14000, '🌸', 'Belgium', false),
('كريم اليدين', 'Hand Cream', 'Neutrogena', 'skincare', 12000, '🤲', 'USA', true),
('كولاجين شراب', 'Collagen Drink', 'Skinade', 'supplements', 95000, '🥤', 'UK', false),
('شعر اصطناعي', 'Hair Mask', 'Garnier', 'haircare', 16000, '💆', 'France', false),
('عطر نسائي', 'Eau de Parfum', 'Chanel', 'fragrance', 320000, '🌺', 'France', true),
('مزيل عرق', 'Antiperspirant', 'Dove', 'bodycare', 8000, '🧴', 'UK', false),
('مكواة شعر', 'Hair Straightener', 'Babyliss', 'haircare', 75000, '✨', 'France', false);

COMMENT ON TABLE public.cosmetic_products IS 'منتجات التجميل والعناية المتوفرة في الصيدليات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 29 applied: Cosmetic Products + 20 seed';
END $$;

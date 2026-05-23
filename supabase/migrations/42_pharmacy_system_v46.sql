-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 42: Pharmacy System Enhancements (V25.46)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- يُضيف:
--   1. pharmacy_reservations (حجز دواء قبل الزيارة)
--   2. pharmacy_ratings (تقييم الصيدليات)
--   3. pharmacy_favorites (الصيدليات المفضّلة)
--   4. user_medications (أدوية المريض المعتادة)
--   5. Triggers + Notification templates
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PHARMACY RESERVATIONS ───
-- المريض يحجز دواء في صيدلية قبل ما يروح يطلبه
CREATE TABLE IF NOT EXISTS public.pharmacy_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  -- ربط بـ prescription (اختياري)
  prescription_id   UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  
  -- لمن (عائلة)
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  -- الأدوية المطلوبة (structured JSONB)
  items             JSONB NOT NULL,
    -- [
    --   {
    --     "medication_id": "uuid",      -- إن وُجد في DB
    --     "name": "بنادول 500mg",        -- اسم نصي (لو ما في medication_id)
    --     "quantity": 1,                 -- العدد
    --     "notes": "علبة كبيرة"          -- ملاحظات
    --   }
    -- ]
  
  -- صورة الوصفة (اختياري)
  prescription_image_url TEXT,
  
  -- ملاحظات للصيدلية
  customer_notes    TEXT,
  pharmacy_notes    TEXT,
  
  -- التسعير (الصيدلية ترد بالسعر)
  total_estimated_price NUMERIC,
  total_final_price NUMERIC,
  
  -- التوقّع - متى المستخدم سيأتي
  expected_pickup_at TIMESTAMPTZ,
  
  -- الحالة
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',           -- بانتظار رد الصيدلية
      'confirmed',         -- الصيدلية أكّدت التوفّر
      'partially_available', -- بعض الأدوية فقط متوفّرة
      'ready_for_pickup',  -- جاهز للاستلام
      'picked_up',         -- المريض استلمه
      'cancelled',         -- ألغي
      'expired'            -- انتهت صلاحية الحجز
    )),
  
  -- expiry (12 ساعة بعد التأكيد)
  expires_at        TIMESTAMPTZ,
  confirmed_at      TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT items_required CHECK (jsonb_array_length(items) > 0)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_user ON public.pharmacy_reservations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_pharmacy ON public.pharmacy_reservations(pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reservations_status ON public.pharmacy_reservations(status);

-- RLS
ALTER TABLE public.pharmacy_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_reservations_user_own" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_own"
  ON public.pharmacy_reservations FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_user_insert" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_insert"
  ON public.pharmacy_reservations FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_user_update" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_user_update"
  ON public.pharmacy_reservations FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_reservations_pharmacy_owner" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_pharmacy_owner"
  ON public.pharmacy_reservations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pharmacies p
      WHERE p.id = pharmacy_reservations.pharmacy_id 
        AND p.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pharmacy_reservations_admin_all" ON public.pharmacy_reservations;
CREATE POLICY "pharmacy_reservations_admin_all"
  ON public.pharmacy_reservations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 2. PHARMACY RATINGS ───
CREATE TABLE IF NOT EXISTS public.pharmacy_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  reservation_id    UUID REFERENCES public.pharmacy_reservations(id) ON DELETE SET NULL,
  
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تقييمات تفصيلية
  availability_rating INTEGER CHECK (availability_rating >= 1 AND availability_rating <= 5),
  price_rating      INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating    INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  
  comment           TEXT,
  would_recommend   BOOLEAN DEFAULT TRUE,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_ratings_pharmacy ON public.pharmacy_ratings(pharmacy_id);

ALTER TABLE public.pharmacy_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_ratings_user_own" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_user_own"
  ON public.pharmacy_ratings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_ratings_user_insert" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_user_insert"
  ON public.pharmacy_ratings FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pharmacy_ratings_public_read" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_public_read"
  ON public.pharmacy_ratings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "pharmacy_ratings_admin_all" ON public.pharmacy_ratings;
CREATE POLICY "pharmacy_ratings_admin_all"
  ON public.pharmacy_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ─── 3. PHARMACY FAVORITES ───
CREATE TABLE IF NOT EXISTS public.pharmacy_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pharmacy_id       UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, pharmacy_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_favorites_user ON public.pharmacy_favorites(user_id);

ALTER TABLE public.pharmacy_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_favorites_user_all" ON public.pharmacy_favorites;
CREATE POLICY "pharmacy_favorites_user_all"
  ON public.pharmacy_favorites FOR ALL USING (user_id = auth.uid());

-- ─── 4. USER MEDICATIONS - أدوية المريض المعتادة ───
CREATE TABLE IF NOT EXISTS public.user_medications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- الدواء (إما من DB أو نصّي)
  medication_id     UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  custom_name       TEXT,  -- اسم نصي لو ما في medication_id
  
  -- التفاصيل
  dosage            TEXT,  -- "1 قرص"
  frequency         TEXT,  -- "3 مرات يومياً"
  timing            TEXT[],  -- ['morning', 'noon', 'evening', 'before_sleep']
  notes             TEXT,
  
  -- المدة
  start_date        DATE,
  end_date          DATE,
  is_chronic        BOOLEAN DEFAULT FALSE,  -- مزمن (مدى الحياة)
  
  -- التذكير
  enable_reminders  BOOLEAN DEFAULT FALSE,
  
  -- ربط بـ prescription
  prescription_id   UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  
  -- لمن
  family_member_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  
  is_active         BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_medications_name_required CHECK (
    medication_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_user_medications_user ON public.user_medications(user_id, is_active);

ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_medications_user_all" ON public.user_medications;
CREATE POLICY "user_medications_user_all"
  ON public.user_medications FOR ALL USING (user_id = auth.uid());

-- ─── 5. Notification templates ───
INSERT INTO public.notification_templates (key, title_ar, body_ar, icon, type)
VALUES 
  ('pharmacy_reservation_new', 'حجز دواء جديد 💊', 'لديك حجز جديد من مريض - يرجى الرد', '💊', 'info'),
  ('pharmacy_reservation_confirmed', 'تأكيد الحجز ✓', 'الصيدلية أكّدت توفّر الأدوية', '✅', 'success'),
  ('pharmacy_reservation_partial', 'تأكيد جزئي ⚠️', 'بعض الأدوية فقط متوفّرة', '⚠️', 'warning'),
  ('pharmacy_reservation_rejected', 'الأدوية غير متوفّرة', 'للأسف الأدوية غير متوفّرة حالياً', '❌', 'warning'),
  ('pharmacy_reservation_ready', 'الدواء جاهز للاستلام 🎉', 'يمكنك المرور لاستلامه', '🎉', 'success'),
  ('medication_reminder', 'تذكير بموعد الدواء ⏰', 'حان وقت تناول الدواء', '⏰', 'info')
ON CONFLICT (key) DO NOTHING;

-- ─── 6. Trigger: تحديث pharmacy rating stats ───
CREATE OR REPLACE FUNCTION update_pharmacy_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  pharmacy_uuid UUID;
BEGIN
  pharmacy_uuid := COALESCE(NEW.pharmacy_id, OLD.pharmacy_id);
  
  UPDATE public.pharmacies
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM public.pharmacy_ratings 
      WHERE pharmacy_id = pharmacy_uuid AND is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.pharmacy_ratings 
      WHERE pharmacy_id = pharmacy_uuid AND is_public = true
    )
  WHERE id = pharmacy_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_rating_stats ON public.pharmacy_ratings;
CREATE TRIGGER trigger_pharmacy_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_rating_stats();

-- ─── 7. Trigger: notify pharmacy on new reservation ───
CREATE OR REPLACE FUNCTION notify_pharmacy_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  pharmacy_owner UUID;
BEGIN
  -- جلب owner_user_id للصيدلية
  SELECT owner_user_id INTO pharmacy_owner
  FROM public.pharmacies
  WHERE id = NEW.pharmacy_id;
  
  IF pharmacy_owner IS NOT NULL THEN
    INSERT INTO public.notification_queue (
      user_id, template_key, title, body, icon, data, created_at, scheduled_at
    ) VALUES (
      pharmacy_owner,
      'pharmacy_reservation_new',
      'حجز دواء جديد 💊',
      'لديك حجز جديد من مريض - يرجى الرد',
      '💊',
      jsonb_build_object('reservation_id', NEW.id, 'url', '/pharmacy-orders/' || NEW.id),
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_new_reservation ON public.pharmacy_reservations;
CREATE TRIGGER trigger_pharmacy_new_reservation
  AFTER INSERT ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_pharmacy_new_reservation();

-- ─── 8. Trigger: notify user on reservation status change ───
CREATE OR REPLACE FUNCTION notify_user_reservation_status()
RETURNS TRIGGER AS $$
DECLARE
  template_key_val TEXT;
  title_val TEXT;
  body_val TEXT;
  icon_val TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  CASE NEW.status
    WHEN 'confirmed' THEN
      template_key_val := 'pharmacy_reservation_confirmed';
      title_val := 'تأكيد الحجز ✓';
      body_val := 'الصيدلية أكّدت توفّر الأدوية';
      icon_val := '✅';
    WHEN 'partially_available' THEN
      template_key_val := 'pharmacy_reservation_partial';
      title_val := 'تأكيد جزئي ⚠️';
      body_val := 'بعض الأدوية فقط متوفّرة - يُرجى المراجعة';
      icon_val := '⚠️';
    WHEN 'ready_for_pickup' THEN
      template_key_val := 'pharmacy_reservation_ready';
      title_val := 'الدواء جاهز للاستلام 🎉';
      body_val := 'يمكنك المرور لاستلامه';
      icon_val := '🎉';
    WHEN 'cancelled' THEN
      template_key_val := 'pharmacy_reservation_rejected';
      title_val := 'الأدوية غير متوفّرة';
      body_val := COALESCE(NEW.cancellation_reason, 'للأسف الأدوية غير متوفّرة حالياً');
      icon_val := '❌';
    ELSE
      RETURN NEW;
  END CASE;
  
  INSERT INTO public.notification_queue (
    user_id, template_key, title, body, icon, data, created_at, scheduled_at
  ) VALUES (
    NEW.user_id,
    template_key_val,
    title_val,
    body_val,
    icon_val,
    jsonb_build_object('reservation_id', NEW.id, 'url', '/account/pharmacy-reservations/' || NEW.id),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_reservation_status ON public.pharmacy_reservations;
CREATE TRIGGER trigger_user_reservation_status
  AFTER UPDATE ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_reservation_status();

-- ─── 9. updated_at triggers ───
CREATE OR REPLACE FUNCTION update_pharmacy_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pharmacy_reservation_updated_at ON public.pharmacy_reservations;
CREATE TRIGGER trigger_pharmacy_reservation_updated_at
  BEFORE UPDATE ON public.pharmacy_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_reservation_updated_at();

DROP TRIGGER IF EXISTS trigger_user_medications_updated_at ON public.user_medications;
CREATE TRIGGER trigger_user_medications_updated_at
  BEFORE UPDATE ON public.user_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_reservation_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎉 انتهى Migration 42
-- ═══════════════════════════════════════════════════════════════════════════

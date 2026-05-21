-- ════════════════════════════════════════════════════════════════════
-- 🔐 Migration 34: Storage Buckets & Policies (V25.20)
-- ════════════════════════════════════════════════════════════════════
-- يُنشئ buckets ويضبط policies للوصول الآمن:
--   1. consultation-images   - صور الاستشارات (خاص)
--   2. avatars               - صور الملفات الشخصية (عام)
--   3. medical-records       - وثائق طبية (خاص جداً)
--   4. nurse-credentials     - شهادات الممرضين (للأدمن)
--   5. prescription-photos   - صور الوصفات الطبية (خاص)
--
-- مهم: يجب تنفيذ هذه الـ migration قبل استخدام
-- consultation-images في الكود
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. إنشاء الـ Buckets
-- ════════════════════════════════════════════════════════════════════

-- ─── consultation-images: صور الاستشارات ──────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-images',
  'consultation-images',
  false,  -- خاص (يحتاج auth)
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── avatars: صور الملف الشخصي ───────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- عام (تُعرض بدون auth)
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── medical-records: وثائق طبية ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-records',
  'medical-records',
  false,  -- خاص جداً
  20971520,  -- 20 MB (PDFs قد تكون كبيرة)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── nurse-credentials: شهادات الممرضين ──────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nurse-credentials',
  'nurse-credentials',
  false,  -- خاص (للأدمن)
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── prescription-photos: صور الوصفات ────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescription-photos',
  'prescription-photos',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ════════════════════════════════════════════════════════════════════
-- 2. Policies للـ consultation-images
-- ════════════════════════════════════════════════════════════════════
-- Pattern المسار: {user_id}/{filename}
-- مثال: 550e8400-e29b-41d4-a716-446655440000/image-123.jpg

-- ─── المستخدم يرى صوره فقط ──────────────────────────
DROP POLICY IF EXISTS "consultation_images_owner_select" ON storage.objects;
CREATE POLICY "consultation_images_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consultation-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

-- ─── المستخدم يُحمّل لمجلده فقط ─────────────────────
DROP POLICY IF EXISTS "consultation_images_owner_insert" ON storage.objects;
CREATE POLICY "consultation_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'consultation-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── المستخدم يحذف صوره فقط ─────────────────────────
DROP POLICY IF EXISTS "consultation_images_owner_delete" ON storage.objects;
CREATE POLICY "consultation_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'consultation-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

-- ─── الطبيب يرى صور المرضى الذين يتعامل معهم ────────
DROP POLICY IF EXISTS "consultation_images_doctor_select" ON storage.objects;
CREATE POLICY "consultation_images_doctor_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consultation-images'
    AND EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.patient_id::text = (storage.foldername(name))[1]
      AND c.doctor_id IN (
        SELECT id FROM public.doctors WHERE user_id = auth.uid()
      )
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- 3. Policies للـ avatars (عام)
-- ════════════════════════════════════════════════════════════════════
-- Pattern: {user_id}/avatar.jpg
-- الجميع يرى (لأن public=true)

-- ─── المستخدم يُحمّل avatar الخاص به ─────────────────
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── المستخدم يحدّث avatar الخاص به ──────────────────
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── المستخدم يحذف avatar الخاص به ───────────────────
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- (SELECT تلقائي لأن bucket public=true)

-- ════════════════════════════════════════════════════════════════════
-- 4. Policies للـ medical-records (خاص جداً)
-- ════════════════════════════════════════════════════════════════════
-- Pattern: {user_id}/{record-name}

DROP POLICY IF EXISTS "medical_records_owner_select" ON storage.objects;
CREATE POLICY "medical_records_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-records'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "medical_records_owner_insert" ON storage.objects;
CREATE POLICY "medical_records_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-records'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "medical_records_owner_delete" ON storage.objects;
CREATE POLICY "medical_records_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-records'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═── الطبيب المعتمد يرى السجلات الطبية للمرضى ────────
DROP POLICY IF EXISTS "medical_records_doctor_select" ON storage.objects;
CREATE POLICY "medical_records_doctor_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-records'
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.user_id::text = (storage.foldername(name))[1]
      AND a.specialist_id = auth.uid()
      AND a.status IN ('confirmed', 'in_progress', 'completed')
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- 5. Policies للـ nurse-credentials (للأدمن)
-- ════════════════════════════════════════════════════════════════════
-- Pattern: {nurse_user_id}/{credential-file}

DROP POLICY IF EXISTS "nurse_credentials_nurse_insert" ON storage.objects;
CREATE POLICY "nurse_credentials_nurse_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nurse-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "nurse_credentials_nurse_select" ON storage.objects;
CREATE POLICY "nurse_credentials_nurse_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'nurse-credentials'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "nurse_credentials_admin_delete" ON storage.objects;
CREATE POLICY "nurse_credentials_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'nurse-credentials'
    AND public.is_admin(auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════
-- 6. Policies للـ prescription-photos
-- ════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "prescriptions_owner_select" ON storage.objects;
CREATE POLICY "prescriptions_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescription-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "prescriptions_owner_insert" ON storage.objects;
CREATE POLICY "prescriptions_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescription-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "prescriptions_owner_delete" ON storage.objects;
CREATE POLICY "prescriptions_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'prescription-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── الصيدلي يرى الوصفات للمعالجة ─────────────────────
DROP POLICY IF EXISTS "prescriptions_pharmacist_select" ON storage.objects;
CREATE POLICY "prescriptions_pharmacist_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescription-photos'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'specialist'
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- ✅ Verification
-- ════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_bucket_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bucket_count
  FROM storage.buckets
  WHERE id IN ('consultation-images', 'avatars', 'medical-records', 'nurse-credentials', 'prescription-photos');

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE ANY(ARRAY['consultation_images_%', 'avatars_%', 'medical_records_%', 'nurse_credentials_%', 'prescriptions_%']);

  RAISE NOTICE '✅ Migration 34 applied:';
  RAISE NOTICE '   - % storage buckets created', v_bucket_count;
  RAISE NOTICE '   - % storage policies installed', v_policy_count;
  RAISE NOTICE '   - consultation-images (10MB, private)';
  RAISE NOTICE '   - avatars (2MB, public)';
  RAISE NOTICE '   - medical-records (20MB, very private)';
  RAISE NOTICE '   - nurse-credentials (10MB, admin only)';
  RAISE NOTICE '   - prescription-photos (10MB, private)';
END $$;

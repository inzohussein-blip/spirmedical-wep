-- ═══════════════════════════════════════════════════════════════════
-- 0062 — الدفعة 3: حسابُ الخدمة يملك منشأتَه في الدليل (قرار المالك، 19 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- «ربطٌ بمنشأةٍ موجودة أو إضافةُ جديدة، والإدارةُ تعتمد الربط»: الصيدليةُ ← `pharmacies.owner_user_id`،
-- والعيادةُ ← `doctors.user_id`، والمستشفى ← `hospitals.owner_user_id` (جديد هنا). فتصل حجوزاتُ المنشأة
-- (`pharmacy_reservations`، `appointments.doctor_id/hospital_id`) إلى نافذة الخدمة.
--
-- قِيس قبله (19 تشرين الأول): لا مالكَ لأيّ منشأة، ولا حجوزات — لا بياناتٍ تُنقل.
--
-- وما كُشف في الطريق (ثغراتٌ قائمة يُغلقها هذا الترحيل):
--   • `doctors_insert_merged` يقبل `user_id = auth.uid()` — أيُّ مستخدمٍ يُدرج طبيباً «موثَّقاً» نشطاً يظهر في الدليل.
--   • `doctors_update_merged` و`pharmacies_update_owner` تتركان للمالك كلَّ الأعمدة: التوثيقَ والملكيّةَ نفسَها.
--   • أذرعُ مالك الصيدلية في إدراج/تحديث/حذف `pharmacy_reservations` تتركه يكتب أيَّ عمود في حجز المريض.
-- كودُ main لا يكتب هذه الجداول إلّا من الإدارة (قِيس: `app/admin/{doctors,pharmacies,hospitals}/actions.ts`)،
-- والمريضُ يُدرج حجزَه ويلغيه بذراعه هو — فالترحيلُ آمنٌ قبل الدمج. الكتابةُ للمالك من الخادم بعد التحقّق.

-- ─── المستشفى: عمودُ مالك ───
ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS hospitals_owner_user_id_idx ON public.hospitals (owner_user_id) WHERE owner_user_id IS NOT NULL;

-- ─── طلباتُ الربط: لعميل الخدمة وحده (الخادمُ يتحقّق ثمّ يكتب) ───
CREATE TABLE IF NOT EXISTS public.provider_listing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_kind text NOT NULL CHECK (listing_kind IN ('pharmacy', 'doctor', 'hospital')),
  -- NULL = منشأةٌ جديدة تُنشأ من `proposed` عند الاعتماد
  listing_id uuid,
  proposed jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  decided_at timestamptz,
  decided_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- طلبٌ واحدٌ حيّ لكلّ حساب، ومنشأةٌ لا يُعتمد لها مالكان
CREATE UNIQUE INDEX IF NOT EXISTS provider_listing_claims_one_live
  ON public.provider_listing_claims (provider_id) WHERE status IN ('pending', 'approved');
CREATE UNIQUE INDEX IF NOT EXISTS provider_listing_claims_listing_owner
  ON public.provider_listing_claims (listing_kind, listing_id) WHERE status = 'approved' AND listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS provider_listing_claims_pending
  ON public.provider_listing_claims (created_at) WHERE status = 'pending';
-- كلُّ مفتاحٍ أجنبيّ بفهرس (حارس schema-conformance)
CREATE INDEX IF NOT EXISTS provider_listing_claims_decided_by
  ON public.provider_listing_claims (decided_by) WHERE decided_by IS NOT NULL;

ALTER TABLE public.provider_listing_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_listing_claims FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_listing_claims TO service_role;

-- ─── الأطباء: الكتابةُ للإدارة وحدها ───
ALTER POLICY doctors_insert_merged ON public.doctors
  WITH CHECK (EXISTS (SELECT 1 FROM public.users
                       WHERE users.id = (SELECT auth.uid()) AND users.role IN ('admin', 'super_admin')));
ALTER POLICY doctors_update_merged ON public.doctors
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE users.id = (SELECT auth.uid()) AND users.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users
                       WHERE users.id = (SELECT auth.uid()) AND users.role IN ('admin', 'super_admin')));
ALTER POLICY doctors_delete_merged ON public.doctors
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE users.id = (SELECT auth.uid()) AND users.role IN ('admin', 'super_admin')));

-- ─── الصيدليات: التحديثُ للإدارة وحدها (المالكُ من الخادم) ───
ALTER POLICY pharmacies_update_owner ON public.pharmacies
  USING (EXISTS (SELECT 1 FROM public.users
                  WHERE users.id = (SELECT auth.uid()) AND users.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users
                       WHERE users.id = (SELECT auth.uid()) AND users.role IN ('admin', 'super_admin')));

-- ─── حجوزاتُ الصيدلية: المالكُ يقرأ، ولا يكتب من المتصفّح ───
ALTER POLICY pharmacy_reservations_insert_merged ON public.pharmacy_reservations
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin')
    OR user_id = (SELECT auth.uid())
  );
ALTER POLICY pharmacy_reservations_update_merged ON public.pharmacy_reservations
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin')
    OR user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin')
    OR user_id = (SELECT auth.uid())
  );
ALTER POLICY pharmacy_reservations_delete_merged ON public.pharmacy_reservations
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'));

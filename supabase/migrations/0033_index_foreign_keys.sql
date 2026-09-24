-- ════════════════════════════════════════════════════════════════════════
-- 0033: ٥٦ مفتاحاً أجنبياً بلا فهرسٍ يغطّيه
-- ════════════════════════════════════════════════════════════════════════
--
-- Postgres يُنشئ فهرساً تلقائياً للمفتاح **الأساسيّ** لا للأجنبيّ. فبقيت
-- ٥٦ علاقةً على ٤٣ جدولاً بلا فهرس، وأثر ذلك في موضعين:
--
--   • **الوصلات**: `appointments ⋈ dental_ratings` تمسح الجدول كلّه بدل
--     أن تقفز إلى الصفوف المعنيّة.
--   • **الحذف المتتالي**: حذفُ صفٍّ من الجدول الأب يُلزم Postgres بالتحقّق
--     من كلّ جدولٍ ابنٍ يشير إليه — بلا فهرسٍ يعني مسحاً كاملاً لكلّ واحد.
--     وحذفُ مستخدمٍ هنا يمسّ عشرات الجداول.
--
-- الفهارس **جزئيّة** (`WHERE col IS NOT NULL`) حيثما كان العمود يقبل
-- الفراغ: أكثرُ هذه المفاتيح اختياريّ (`reviewed_by`, `family_member_id`,
-- `appointment_id`)، وفهرسةُ صفوفٍ قيمتُها NULL تكبّر الفهرس بلا فائدة —
-- فلا أحد يبحث عن `WHERE reviewed_by = NULL`. وهو عرفٌ قائمٌ في المستودع
-- (انظر `notif_queue_created_by_idx` في 0002).
--
-- والقائمة مُولَّدةٌ من `pg_constraint` لا مكتوبةً يدوياً؛ والاستعلام الذي
-- ولّدها يوافق مدقّق Supabase عدداً: ٥٦ في الاثنين.

CREATE INDEX IF NOT EXISTS admin_requests_reviewed_by_idx ON public.admin_requests (reviewed_by)
  WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS app_theme_settings_updated_by_idx ON public.app_theme_settings (updated_by)
  WHERE updated_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_vaccine_clinic_id_idx ON public.appointments (vaccine_clinic_id)
  WHERE vaccine_clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS beta_codes_created_by_idx ON public.beta_codes (created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON public.bug_reports (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS changelog_entries_created_by_idx ON public.changelog_entries (created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS consultation_messages_sender_id_idx ON public.consultation_messages (sender_id);
CREATE INDEX IF NOT EXISTS consultations_doctor_id_idx ON public.consultations (doctor_id)
  WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS consultations_family_member_id_idx ON public.consultations (family_member_id)
  WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS consultations_subscription_id_idx ON public.consultations (subscription_id)
  WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cosmetic_wishlist_product_id_idx ON public.cosmetic_wishlist (product_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_appointment_id_idx ON public.coupon_redemptions (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS dental_ratings_appointment_id_idx ON public.dental_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS doctor_ratings_appointment_id_idx ON public.doctor_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS doctor_ratings_consultation_id_idx ON public.doctor_ratings (consultation_id)
  WHERE consultation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS doctor_subscriptions_family_member_id_idx ON public.doctor_subscriptions (family_member_id)
  WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS doctors_user_id_idx ON public.doctors (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hospital_ratings_appointment_id_idx ON public.hospital_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lab_orders_family_member_id_idx ON public.lab_orders (family_member_id)
  WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lab_orders_partner_lab_id_idx ON public.lab_orders (partner_lab_id)
  WHERE partner_lab_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lab_results_entered_by_idx ON public.lab_results (entered_by)
  WHERE entered_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS lab_results_reviewed_by_idx ON public.lab_results (reviewed_by)
  WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS launch_checklist_completed_by_idx ON public.launch_checklist (completed_by)
  WHERE completed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS medication_searches_medication_id_idx ON public.medication_searches (medication_id)
  WHERE medication_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS medication_searches_user_id_idx ON public.medication_searches (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS mental_health_ratings_appointment_id_idx ON public.mental_health_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS mental_health_specialists_user_id_idx ON public.mental_health_specialists (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nurse_emergency_logs_appointment_id_idx ON public.nurse_emergency_logs (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nurse_emergency_logs_specialist_id_idx ON public.nurse_emergency_logs (specialist_id);
CREATE INDEX IF NOT EXISTS nurse_ratings_appointment_id_idx ON public.nurse_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nurse_ratings_visit_id_idx ON public.nurse_ratings (visit_id)
  WHERE visit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nursing_visit_history_appointment_id_idx ON public.nursing_visit_history (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nutritionist_ratings_appointment_id_idx ON public.nutritionist_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nutritionists_user_id_idx ON public.nutritionists (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS optical_ratings_appointment_id_idx ON public.optical_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pharmacies_verified_by_idx ON public.pharmacies (verified_by)
  WHERE verified_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS pharmacy_favorites_pharmacy_id_idx ON public.pharmacy_favorites (pharmacy_id);
CREATE INDEX IF NOT EXISTS pharmacy_ratings_reservation_id_idx ON public.pharmacy_ratings (reservation_id)
  WHERE reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pharmacy_reservations_family_member_id_idx ON public.pharmacy_reservations (family_member_id)
  WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pharmacy_reservations_prescription_id_idx ON public.pharmacy_reservations (prescription_id)
  WHERE prescription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS physio_ratings_appointment_id_idx ON public.physio_ratings (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS physio_specialists_user_id_idx ON public.physio_specialists (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON public.ratings (user_id);
CREATE INDEX IF NOT EXISTS service_switches_updated_by_idx ON public.service_switches (updated_by)
  WHERE updated_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS specialist_applications_approved_by_idx ON public.specialist_applications (approved_by)
  WHERE approved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS specialist_credentials_log_reviewed_by_idx ON public.specialist_credentials_log (reviewed_by)
  WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS stories_created_by_idx ON public.stories (created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_medications_family_member_id_idx ON public.user_medications (family_member_id)
  WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_medications_medication_id_idx ON public.user_medications (medication_id)
  WHERE medication_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_medications_prescription_id_idx ON public.user_medications (prescription_id)
  WHERE prescription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_credentials_verified_by_idx ON public.users (credentials_verified_by)
  WHERE credentials_verified_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS vaccination_records_clinic_id_idx ON public.vaccination_records (clinic_id)
  WHERE clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vaccination_records_family_member_id_idx ON public.vaccination_records (family_member_id)
  WHERE family_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS video_sessions_appointment_id_idx ON public.video_sessions (appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS video_sessions_consultation_id_idx ON public.video_sessions (consultation_id)
  WHERE consultation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_transactions_created_by_idx ON public.wallet_transactions (created_by)
  WHERE created_by IS NOT NULL;

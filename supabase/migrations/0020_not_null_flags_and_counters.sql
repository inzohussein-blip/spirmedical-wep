-- ════════════════════════════════════════════════════════════════════════
-- 0020: تثبيت الأعلام والعدّادات على NOT NULL
-- ════════════════════════════════════════════════════════════════════════
--
-- ١٩٨ عموداً في القاعدة تحمل جميعها الشكل نفسه: نوعٌ منطقيّ أو عدديّ،
-- وقيمةٌ افتراضية ثابتة (0 · 1 · true · false)، ومع ذلك **يقبل NULL**.
--
-- هذا هو السبب الجذريّ لأغلب أخطاء ترحيل الأنواع الـ٧٧: الواجهات في
-- التطبيق تُعلن `boolean` و`number` — وهي **النمذجة الصحيحة للمجال**،
-- إذ لا معنى لعدّادٍ «مجهول» ولا لعلَمٍ «غير معروف» — بينما المخطّط
-- يقول `| null`. الخطأ في القاعدة لا في التطبيق.
--
-- المحاولة السابقة (الموثّقة في docs/TYPES-MIGRATION.md) عالجت الأمر
-- بالاتجاه المعاكس: توسيع حقول التطبيق إلى `T | null`، فدفعت الفراغ إلى
-- كل مستهلك وارتفعت الأخطاء من ٧٩ إلى ١٨٦. هذا الترحيل يعالجه من المنبع.
--
-- التحقّق قبل التطبيق:
--   • ١٩٨ عموداً مطابقاً للقاعدة، **صفر قيمة NULL** في أيٍّ منها.
--   • لا موضع في `src/` يكتب `null` صراحةً إلى أيٍّ منها.
--   • `undefined` في supabase-js يسقط من الحمولة، فتُطبَّق القيمة
--     الافتراضية — لا يتغيّر شيء في مسار الإدراج.
--
-- ملاحظة: الترحيل 0019 يسبق هذا عمداً. مشغّل تقييم الأطباء كان يكتب
-- NULL في `doctors.rating_avg` عند إخفاء آخر تقييم؛ لو طُبّق هذا القيد
-- قبل إصلاحه لتحوّل العطل الصامت إلى خطأٍ يُسقط المعاملة.

ALTER TABLE public.appointments ALTER COLUMN prescription_required SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN supplies_total SET NOT NULL;
ALTER TABLE public.beta_codes ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.beta_codes ALTER COLUMN max_uses SET NOT NULL;
ALTER TABLE public.beta_codes ALTER COLUMN used_count SET NOT NULL;
ALTER TABLE public.campaigns ALTER COLUMN recipients_count SET NOT NULL;
ALTER TABLE public.campaigns ALTER COLUMN success_count SET NOT NULL;
ALTER TABLE public.changelog_entries ALTER COLUMN is_published SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN is_archived SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN is_pinned SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN patient_unread_count SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN specialist_unread_count SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN total_messages SET NOT NULL;
ALTER TABLE public.consultation_messages ALTER COLUMN is_read SET NOT NULL;
ALTER TABLE public.consultations ALTER COLUMN expected_response_hours SET NOT NULL;
ALTER TABLE public.consultations ALTER COLUMN is_free SET NOT NULL;
ALTER TABLE public.consultations ALTER COLUMN price SET NOT NULL;
ALTER TABLE public.cosmetic_product_reviews ALTER COLUMN helpful_count SET NOT NULL;
ALTER TABLE public.cosmetic_product_reviews ALTER COLUMN is_verified_purchase SET NOT NULL;
ALTER TABLE public.cosmetic_product_reviews ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.cosmetic_products ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.cosmetic_products ALTER COLUMN is_in_stock SET NOT NULL;
ALTER TABLE public.cosmetic_products ALTER COLUMN is_recommended SET NOT NULL;
ALTER TABLE public.cosmetic_products ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.cosmetic_products ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN first_order_only SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN min_order_amount SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN per_user_limit SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN used_count SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN accepts_insurance SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN doctor_count SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN is_featured SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN is_open_24h SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_cleaning SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_cosmetic SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_emergency SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_extraction SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_fillings SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_implants SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_orthodontics SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_pediatric SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN offers_whitening SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.dental_clinics ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.dental_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.doctor_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.doctor_subscriptions ALTER COLUMN consultations_used SET NOT NULL;
ALTER TABLE public.doctor_subscriptions ALTER COLUMN visits_used SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN available_for_clinic SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN available_for_home_visit SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN available_for_video SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.doctors ALTER COLUMN years_experience SET NOT NULL;
ALTER TABLE public.family_members ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.geocoding_cache ALTER COLUMN hit_count SET NOT NULL;
ALTER TABLE public.hospital_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN has_ambulance SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN has_emergency SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN has_lab SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN has_pharmacy SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN has_radiology SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN is_24h SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.lab_orders ALTER COLUMN fasting_hours SET NOT NULL;
ALTER TABLE public.launch_checklist ALTER COLUMN is_completed SET NOT NULL;
ALTER TABLE public.launch_checklist ALTER COLUMN order_index SET NOT NULL;
ALTER TABLE public.loyalty_milestones ALTER COLUMN discount_percent SET NOT NULL;
ALTER TABLE public.loyalty_milestones ALTER COLUMN free_consultations_per_month SET NOT NULL;
ALTER TABLE public.loyalty_milestones ALTER COLUMN free_delivery SET NOT NULL;
ALTER TABLE public.loyalty_milestones ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.loyalty_milestones ALTER COLUMN priority_support SET NOT NULL;
ALTER TABLE public.medication_searches ALTER COLUMN found_any_available SET NOT NULL;
ALTER TABLE public.medication_searches ALTER COLUMN results_count SET NOT NULL;
ALTER TABLE public.medications ALTER COLUMN is_controlled SET NOT NULL;
ALTER TABLE public.medications ALTER COLUMN requires_prescription SET NOT NULL;
ALTER TABLE public.mental_health_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN accepts_emergency SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN available_in_clinic SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN available_online SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN session_duration_minutes SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN total_sessions SET NOT NULL;
ALTER TABLE public.mental_health_specialists ALTER COLUMN years_experience SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN is_deleted SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN is_edited SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN is_read SET NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN appointment_reminders SET NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN messages SET NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN promotions SET NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN quiet_hours_enabled SET NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN system_updates SET NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN test_results SET NOT NULL;
ALTER TABLE public.notification_queue ALTER COLUMN attempts SET NOT NULL;
ALTER TABLE public.notification_queue ALTER COLUMN max_attempts SET NOT NULL;
ALTER TABLE public.notification_templates ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.nurse_emergency_logs ALTER COLUMN call_center_notified SET NOT NULL;
ALTER TABLE public.nurse_emergency_logs ALTER COLUMN contacted_911 SET NOT NULL;
ALTER TABLE public.nurse_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.nursing_visit_history ALTER COLUMN follow_up_required SET NOT NULL;
ALTER TABLE public.nutritionist_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN available_in_clinic SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN available_online SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN success_rate SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN total_clients SET NOT NULL;
ALTER TABLE public.nutritionists ALTER COLUMN years_experience SET NOT NULL;
ALTER TABLE public.optical_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN is_featured SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN offers_contact_lenses SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN offers_eye_exam SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN offers_eye_surgery_referral SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN offers_prescription_lenses SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN offers_sunglasses SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.optical_stores ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.partner_labs ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.patient_notes ALTER COLUMN is_pinned SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN accepts_insurance SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN has_delivery SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN has_emergency_section SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN is_24h SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.pharmacies ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.pharmacy_inventory ALTER COLUMN is_available SET NOT NULL;
ALTER TABLE public.pharmacy_inventory ALTER COLUMN searched_count SET NOT NULL;
ALTER TABLE public.pharmacy_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.physio_ratings ALTER COLUMN would_recommend SET NOT NULL;
ALTER TABLE public.physio_service_types ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.physio_service_types ALTER COLUMN order_index SET NOT NULL;
ALTER TABLE public.physio_service_types ALTER COLUMN recommended_sessions SET NOT NULL;
ALTER TABLE public.physio_service_types ALTER COLUMN session_duration_minutes SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN available_for_clinic SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN available_for_home SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN package_discount_pct SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN total_sessions SET NOT NULL;
ALTER TABLE public.physio_specialists ALTER COLUMN years_experience SET NOT NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.quick_replies ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.quick_replies ALTER COLUMN use_count SET NOT NULL;
ALTER TABLE public.ratings ALTER COLUMN is_anonymous SET NOT NULL;
ALTER TABLE public.ratings ALTER COLUMN is_published SET NOT NULL;
ALTER TABLE public.referral_codes ALTER COLUMN successful_referrals SET NOT NULL;
ALTER TABLE public.referral_codes ALTER COLUMN total_earned SET NOT NULL;
ALTER TABLE public.referral_codes ALTER COLUMN total_referrals SET NOT NULL;
ALTER TABLE public.referrals ALTER COLUMN referred_bonus SET NOT NULL;
ALTER TABLE public.referrals ALTER COLUMN referrer_reward SET NOT NULL;
ALTER TABLE public.specialist_schedules ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.user_medications ALTER COLUMN enable_reminders SET NOT NULL;
ALTER TABLE public.user_medications ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.user_medications ALTER COLUMN is_chronic SET NOT NULL;
ALTER TABLE public.user_saved_locations ALTER COLUMN is_pinned SET NOT NULL;
ALTER TABLE public.user_saved_locations ALTER COLUMN use_count SET NOT NULL;
ALTER TABLE public.user_telegram_links ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN emergency_kit_confirmed SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN health_ministry_verified SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN loyalty_points SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN nursing_union_verified SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN profile_completed SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN wa_otp_enabled SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN wa_verified SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN wallet_balance SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN offers_adult SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN offers_covid SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN offers_home_visit SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN offers_pediatric SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN offers_travel SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN rating_count SET NOT NULL;
ALTER TABLE public.vaccine_clinics ALTER COLUMN works_friday SET NOT NULL;
ALTER TABLE public.vaccines ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE public.vaccines ALTER COLUMN is_free SET NOT NULL;
ALTER TABLE public.vaccines ALTER COLUMN is_mandatory SET NOT NULL;
ALTER TABLE public.wallet_transactions ALTER COLUMN points SET NOT NULL;
ALTER TABLE public.whatsapp_otp ALTER COLUMN verify_attempts SET NOT NULL;

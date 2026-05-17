-- ═══════════════════════════════════════════════════════════════════
-- 08_medical_record.sql — السجل الطبي + إعدادات المستخدم (V24)
-- ═══════════════════════════════════════════════════════════════════
-- يضيف:
--   1. medical_info  jsonb — معلومات طبية (فصيلة الدم، أمراض، حساسية)
--   2. user_settings jsonb — إعدادات (إشعارات، لغة، إلخ)
-- ═══════════════════════════════════════════════════════════════════

-- إضافة الأعمدة لجدول users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS medical_info jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS user_settings jsonb DEFAULT '{}'::jsonb;

-- مؤشرات على الـ JSONB للبحث السريع (لو احتجناها مستقبلاً)
CREATE INDEX IF NOT EXISTS users_medical_info_gin ON public.users USING gin (medical_info);
CREATE INDEX IF NOT EXISTS users_settings_gin ON public.users USING gin (user_settings);


-- ═══════════════════════════════════════════════════════════════════
-- 📋 توثيق البنية المتوقعة (للمطوّر فقط - لا يُنفّذ)
-- ═══════════════════════════════════════════════════════════════════

-- مثال على هيكل medical_info:
-- {
--   "blood_type": "O+",
--   "height_cm": 175,
--   "weight_kg": 72,
--   "birth_date": "1995-03-15",
--   "chronic_conditions": [
--     { "name": "السكري النوع 2", "since": "2020", "severity": "moderate" }
--   ],
--   "allergies": [
--     { "name": "البنسلين", "reaction": "طفح جلدي" }
--   ],
--   "past_surgeries": [],
--   "family_history": []
-- }

-- مثال على هيكل user_settings:
-- {
--   "language": "ar",
--   "biometric": false,
--   "auto_lock": true,
--   "analytics": true,
--   "notifications": {
--     "appointments": true,
--     "meds": true,
--     "results": true,
--     "messages": true,
--     "news": false
--   }
-- }


-- ═══════════════════════════════════════════════════════════════════
-- ✅ Migration 08 Complete
-- ═══════════════════════════════════════════════════════════════════
COMMENT ON COLUMN public.users.medical_info IS 'JSONB: blood_type, height_cm, weight_kg, birth_date, chronic_conditions[], allergies[], past_surgeries[], family_history[]';
COMMENT ON COLUMN public.users.user_settings IS 'JSONB: language, biometric, auto_lock, analytics, notifications{}';

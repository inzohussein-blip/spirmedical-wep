-- ════════════════════════════════════════════════════════════════════
-- 0016 — فتح البوّابة الأولى: صلاحيات الجداول لأدوار العملاء
-- ════════════════════════════════════════════════════════════════════
--
-- 🚨 الخلل (يُعطّل التطبيق كلّه):
-- في Postgres بوّابتان مستقلّتان أمام أي صفّ:
--   1. `GRANT` على الجدول  ← هل يملك الدور حقّ العملية أصلاً؟
--   2. سياسة `RLS`         ← أيّ الصفوف يراها؟
--
-- المشروع بنى البوّابة الثانية بعناية (٩١ جدولاً، ٢٤٦ سياسة) وترك الأولى
-- مغلقة: تاريخ الترحيلات كلّه لا يمنح **أيّ** جدول لـ`anon` أو
-- `authenticated`. والتطبيق يعمل بمفتاح anon (ودور `authenticated` بعد
-- تسجيل الدخول)، فكل استعلام يُردّ بـ:
--
--     42501: permission denied for table appointments
--
-- أي أنّ السياسات الـ٢٤٦ لم تُقيَّم قطّ — لأنّ الاستعلام يسقط قبلها.
-- وهذا يفسّر خلوّ القاعدة من أي مستخدم أو موعد: البيانات المبذورة أُدخلت
-- بمفتاح `service_role` الذي يتجاوز البوّابتين.
--
-- (المفارقة أنّ الشيئين الوحيدين الممنوحين في تاريخ الترحيلات كانا
--  المنظورين اللذين سرّبا بيانات المرضى — أُصلحا في 0012.)
--
-- ✅ التوزيع المعتمَد — أضيق من افتراضي Supabase:
--   • `authenticated`: SELECT/INSERT/UPDATE/DELETE — وRLS تحصر الصفوف.
--   • `anon`: SELECT فقط — الزائر يتصفّح الكتالوجات ولا يكتب شيئاً.
--
-- مسارات التسجيل و OTP وإنشاء الحساب تستعمل `service_role`
-- (`createAdminClient`) فلا يمسّها تقييد `anon`.
--
-- ⚠️ الأمان يبقى على RLS: هذا المنح يفتح «حقّ العملية» لا «رؤية الصفوف».
-- كل جدول هنا عليه RLS مُفعّلة (يحرسها `tests/rls-coverage.test.ts`).
-- ════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- الجداول القائمة
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- التسلسلات (لأعمدة الترقيم التلقائي)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- الجداول التي تُنشأ لاحقاً — كي لا يتكرّر الخلل مع كل ترحيل جديد
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

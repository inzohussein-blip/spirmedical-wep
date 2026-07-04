# Migrations — Spir Medical

تاريخ ترحيل مرتّب وغير مُدمِّر. يُطبَّق بالترتيب الرقمي.

| الملف | المحتوى |
|---|---|
| `0001_baseline_schema.sql` | خط الأساس الكامل: الامتدادات، الأنواع (ENUMs)، 88 جدولاً، RLS policies، الدوال، الـ triggers. كله `IF NOT EXISTS` / `CREATE OR REPLACE` / `DROP POLICY IF EXISTS` → **غير مُدمِّر و idempotent**. |
| `0002_email_auth.sql` | يعمل **بعد** 0001: يضيف أعمدة البريد إلى `users` + جدولا `email_verification_tokens` و`specialist_applications` + سياساتهما ودوالهما. |

## نقاط مهمة

- **الإنتاج غير متأثّر.** قاعدة الإنتاج مبنيّة أصلاً من هذا المخطط، وهذه الملفات
  مرجع/خط أساس للبيئات الجديدة (local/staging) وأساس للترحيلات المستقبلية. تطبيقها
  على قاعدة قائمة = no-op (كل شيء `IF NOT EXISTS`).

- **إصلاح ترتيب حرج:** سابقاً كان `001_email_auth.sql` يسبق `ALL_MIGRATIONS_COMBINED.sql`
  أبجدياً، فكان الملف المدمج يُسقط جداول email-auth بالـ DROP ولا يعيد بناءها. الآن
  email-auth يعمل بعد خط الأساس، فيبقى سليماً.

- **إعادة بناء بيئة من الصفر:** شغّل `supabase/reset/drop_all_public.sql` (خارج
  `migrations/` عمداً كي لا يُطبَّق تلقائياً) لمسح schema `public` بالكامل، ثم طبّق
  الترحيلات بالترتيب. 🚫 لا تشغّل ملف الـ reset على الإنتاج إطلاقاً.

## التحقّق

تُحقَّق البنية بالفحص (توازن كتل `DO $$…END $$`، اكتمال العبارات، الترتيب). قبل
الاعتماد عليها في بيئة جديدة، يُنصح بتطبيقها على فرع Supabase (Preview branch) أو
Postgres محلّي متوافق مع Supabase (سكيمات `auth`/`storage`، أدوار `anon`/`authenticated`/
`service_role`، دالة `auth.uid()`) للتأكد من صفر أخطاء.

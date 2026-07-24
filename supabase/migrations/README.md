# Migrations — Spir Medical

تاريخ ترحيل مرتّب وغير مُدمِّر. يُطبَّق بالترتيب الرقمي.

خط الأساس مقسّم إلى وحدات منطقية متوازنة (0001→0009)، ثم إضافات email-auth (0010).
كلها `IF NOT EXISTS` / `CREATE OR REPLACE` / `DROP POLICY IF EXISTS` → **غير مُدمِّرة و idempotent**.

| الملف | المحتوى |
|---|---|
| `0001_core_foundation.sql` | الامتدادات + الأنواع + الجداول الأساسية (users، appointments، audit، أدوار CRM، العائلة، الثيم، Realtime) |
| `0002_communication.sql` | المحادثات، الرسائل، الإشعارات (WhatsApp/SMS/Push)، OTP واتساب |
| `0003_health_records.sql` | الصحة الشخصية + السجل الطبي + إعدادات المستخدم |
| `0004_services_catalog.sql` | كتالوج الخدمات والفئات الطبية |
| `0005_specialists_ratings.sql` | نظام الاختصاصيين الموحّد + التقييمات |
| `0006_locations.sql` | المواقع والإحداثيات الجغرافية |
| `0007_engagement.sql` | الإدارة/CRM، الحملات، الكوبونات، الولاء، الإحالات |
| `0008_storage_policies.sql` | سياسات تخزين `storage.*` |
| `0009_seed_and_fixes.sql` | بيانات أولية وإصلاحات ختامية |
| `0010_email_auth.sql` | يعمل **بعد** الأساس: أعمدة البريد في `users` + `email_verification_tokens` + `specialist_applications` |

> التقسيم **لا يفقد ولا يعيد ترتيب أي عبارة**: تم التحقق أن دمج 0001→0009 يطابق الملف
> المدمج الأصلي **بايت-ببايت**، فترتيب البناء (FK/dependencies) محفوظ بالكامل.

## التطبيق التلقائي (بلا رفع يدوي) — Supabase CLI + GitHub Actions

بعد إضافة `supabase/config.toml` وworkflow `.github/workflows/supabase-migrations.yml`،
تُطبَّق أي ترحيلات جديدة على الإنتاج **تلقائياً عند الدفع إلى `main`** (لا لصق يدوي في
SQL Editor).

**التهيئة لمرّة واحدة (المالك):**
1. أضِف GitHub Secrets:
   - `SUPABASE_ACCESS_TOKEN` — من https://supabase.com/dashboard/account/tokens
   - `SUPABASE_DB_PASSWORD` — كلمة مرور قاعدة المشروع (Project Settings → Database)
2. سجّل خط الأساس كمُطبَّق (لأنّ الإنتاج بُني يدوياً) حتى لا يُعاد تطبيقه:
   ```bash
   npm run db:link        # supabase link --project-ref ioulxemokusfeykjcaxg
   supabase migration repair --status applied 0001 0002 0003 0004 0005 \
     0006 0007 0008 0009 0010
   ```
   (كل الترحيلات idempotent، فإعادة التطبيق آمنة أصلاً — لكن `repair` أنظف.)

**بعدها:** كل ترحيل جديد (`0011_*.sql` …) يُدمج إلى `main` → الـworkflow يشغّل
`supabase db push` فيُطبَّق فقط الجديد، **ثم يُعيد توليد `src/types/database.ts`
من المخطّط الحيّ ويلتزمه تلقائياً** (`[skip ci]`) — فلا كتابة أنواع يدوية بعد الآن.
للتطبيق اليدوي محلياً: `npm run db:push` · توليد الأنواع: `npm run db:types` ·
توليد ترحيل من تغييرات محلية: `npm run db:diff`.

**بديل/إضافة — تكامل اللوحة:** يمكن أيضاً تفعيل تكامل Supabase↔GitHub من
Dashboard → Integrations → GitHub (يقرأ `supabase/migrations` + `config.toml`)،
فيُطبّق الترحيلات دون أي workflow. الاثنان متوافقان مع نفس الملفات.

> السكربتات (`db:link`/`db:push`/`db:diff`/`db:pull`) تتطلّب Supabase CLI على PATH محلياً
> (`brew install supabase/tap/supabase` أو scoop)؛ أمّا CI فيستخدم `supabase/setup-cli`.

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

## جداول معرّفة لكنها غير مستعملة في الكود (توثيق — لا تُحذف الآن)

كشف تدقيق البيانات 14 جدولاً موجوداً في الترحيلات لكنه غير مُشار إليه من كود
التطبيق حالياً. تُترك كما هي (لا حذف DDL) لأنها إمّا مقصودة لميزات مستقبلية أو
يعتمد عليها منطق مستقبلي. توثَّق هنا لتفادي الالتباس:

- `rate_limit_buckets` — التحديد الحالي في الذاكرة/Upstash بدل جدول DB.
- `otp_attempts` — تتبّع المحاولات يتم داخل `whatsapp_otp` مباشرةً.
- `user_telegram_links` — قناة Telegram غير مربوطة بعد.
- `chat_notes`، `notification_logs` — غير مستعملة (الطابور يحمل الحالة).
- `vaccine_clinics`، `video_sessions` — ميزات غير موصولة بعد.
- `payments`، `coupon_redemptions` — تتبّع الدفع/الكوبونات غير موصول بعد.
- `doctor_ratings`، `mental_health_ratings`، `nutritionist_ratings`،
  `physio_ratings`، `specialist_credentials_log` — التقييمات تُكتب في جدول
  `ratings` العام؛ الجداول المتخصّصة غير مكتوبة (انظر إصلاح لوحة الممرضين).

> قرار الإبقاء/الحذف مؤجَّل: أي حذف يتطلب ترحيلاً مُطبَّقاً على الإنتاج بتنسيق المالك.

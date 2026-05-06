# Changelog

كل التغييرات الجديرة بالملاحظة في مشروع `spirmedical-wep`.

التنسيق يتبع [Keep a Changelog](https://keepachangelog.com/),
والمشروع يلتزم بـ [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-05-06

### Added (مُضاف)
- 🔐 جدول `audit_logs` immutable مع triggers لمنع التعديل/الحذف
- 🔒 تشفير AES-256-GCM للملاحظات الطبية الحساسة (`encryption.ts`)
- ⏱️ Rate limiting in-memory (قابل للترقية لـ Upstash)
- 📝 Structured logger مع تنظيف بيانات حساسة تلقائياً
- 🛡️ ESLint security plugin
- 🪝 Husky pre-commit hooks مع lint-staged
- 🐳 Dockerfile مع HEALTHCHECK
- ⚙️ CI workflow محسّن (caching, security audit, bundle analysis)
- 📋 Zod parsing لـ `searchParams` (حماية من XSS عبر URL)
- 🌐 ٤٠+ اختبار وحدة جديدة
- 🚦 `error.tsx`, `loading.tsx`, `not-found.tsx`, `global-error.tsx`
- 📚 `CHANGELOG.md`, `CONTRIBUTING.md`

### Changed (مُحسَّن)
- ⬆️ `tsconfig.json` بـ `noUncheckedIndexedAccess` و `noImplicitOverride`
- ⬆️ `next.config.js` نُظِّف من `experimental` (Server Actions مفعّلة افتراضياً)
- ⬆️ Server Actions تستخدم `redirect` مع query params للأخطاء (يعمل فعلاً)
- ⬆️ VIEWs على Supabase تستخدم `security_invoker = true` (RLS صحيح)
- ⬆️ Node.js engine: `>=20.0.0` بدلاً من `>=18.17.0`
- ⬆️ تسجيل دخول/خروج يُسجَّل في `audit_logs`
- ⬆️ إنشاء حجز يُسجَّل في `audit_logs` ويُشفّر الملاحظات

### Security
- 🔒 منع تعديل/حذف audit logs (immutability في DB)
- 🔒 Rate limit على `/login` (5 محاولات/15 دقيقة) و `/otp` (3 محاولات/10 دقائق)
- 🔒 Rate limit على إنشاء الحجوزات (10 حجوزات/ساعة لكل مستخدم)
- 🔒 إخفاء (`[REDACTED]`) للحقول الحساسة في الـ logs

### Fixed
- 🐛 BUG-3: `searchParams.error` لم يُمرَّر فعلياً → الآن عبر redirect
- 🐛 BUG-4: VIEWs لم تطبّق RLS → الآن مع `security_invoker`
- 🐛 BUG-5: `experimental.serverActions` كان قديماً
- 🐛 typo في `jest.config.js`

## [0.1.0] - 2026-05-06

### Added
- 🎉 Initial MVP scaffold
- 📱 Next.js 14 + TypeScript + Tailwind CSS
- 🔐 Supabase Auth (Phone OTP)
- 📋 CRUD حجوزات (Appointments)
- 👨‍💼 Admin role + لوحة الإدارة
- 🌐 i18n (ar, en)
- 🐳 Docker support
- 📚 توثيق شامل

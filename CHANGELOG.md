# Changelog

## [0.4.0] - 2026-05-09

### Added
- AppShell موحّد بعرض هاتف ثابت (480px)
- Dark Mode كامل مع toggle و localStorage
- Favicons احترافية (٧ أحجام)
- A11y compliance (skip link, ARIA, keyboard nav)

### Changed
- توحيد layouts بين guest و dashboard
- استبدال نظام تسجيل الدخول بـ OTP فقط

### Removed
- مجلد `(admin)/` - منقول لمشروع CRM منفصل
- `BottomNav.tsx` القديم - مدمج في AppShell
- جميع حسابات الاختبار من `actions.ts`
- نظام `loginWithCredentials` (رقم/رمز)
- `TEST_MODE` و `TEST_ACCOUNTS`

## [0.3.0] - 2026-04
- Patient Appointments V2
- Supabase setup

## [0.2.0]
- Security hardening
- Audit logs

## [0.1.0]
- Initial release

# Changelog

## [0.4.2] - 2026-07-05

مراجعة أمان وتصحيح واسعة (لا تُغيّر بيانات الإنتاج).

### Security
- **التشفير:** `ENCRYPTION_KEY` صار مطلوباً دائماً؛ أُزيل المفتاح الاحتياطي المعروف
  (`sha256('dev-key-only-not-secure')`) الذي كان يشفّر PHI خارج الإنتاج.
- **باب OTP خلفي:** حُذف قبول الرمز `123456` (في `otp-channels.ts` و`verifyOtpAction`)؛
  تدفّق الحجز يستخدم الآن خدمة OTP الحقيقية (bcrypt + DB).
- **الدخول بدون رمز:** يُقفَل في وضع `NEXT_PUBLIC_OTP_MODE=required` (الافتراضي الحالي
  `optional` مؤقتاً لإبقاء الدخول شغّالاً حتى تفعيل قناة OTP).
- **فصل الأسرار:** كلمة سر حسابات الهاتف تُشتَقّ من `AUTH_PASSWORD_SECRET` منفصل عن
  `ENCRYPTION_KEY` (توافق رجعي + تدوير تلقائي عند أول دخول).
- **الأدمن:** إغلاق تصعيد الصلاحيات عبر النموذج (rate limit + مفتاح قوي/جلسة super_admin +
  سقف الدور + allowlist)، وحماية `/admin` على مستوى middleware بفحص الدور.
- **Rate limiting:** أُضيف لـ otp/send، admin-login/register، nurse/emergency،
  analytics/track؛ وأُصلح fail-open في فحص حدّ OTP.
- **السجلّات:** حجب `phone`/`email` (PHI) ووقف تسجيل قيم OTP.
- **التحقّق:** مخططات Zod على `nurse/emergency` و`analytics/track`.

### Fixed
- **الخرائط:** كانت مكسورة لأن CSS الخاص بـ Leaflet/MarkerCluster يُحمَّل من unpkg بينما
  CSP يحجبه؛ يُجمَّع الآن محلياً من node_modules.
- **روابط مكسورة (404):** تصحيح 31 موضعاً كان يشير لـ `/auth/login|register|forgot`.
- **ترتيب migrations:** كان email-auth يُمحى بالـ DROP قبل إعادة بنائه؛ صار يعمل بعد الأساس.
- تأكيد البريد يُرسَل فعلاً عبر Resend (مع بوابة مشروطة بتوفّره)، وزر Google OAuth حقيقي،
  وإحصائيات الأخصائي حقيقية بدل أرقام ملفّقة.

### Changed
- إعادة تسمية لوحة الأدمن `admin44` → `admin` (خلف حماية middleware) مع تحويلات دائمة.
- توحيد مساعدات auth المكرّرة في `src/lib/auth/` (بيانات الاعتماد، getIp، isNextRedirect).
- تقسيم مخطط قاعدة البيانات إلى 10 وحدات ترحيل مرتّبة وغير مُدمِّرة (تحقّق byte-identical)،
  وعزل سكربت المسح في `supabase/reset/`.
- منع مزوّد WhatsApp الوهمي في الإنتاج؛ إخفاء قناة Telegram المعطّلة خلف علم.

### CI
- بوّابة الجودة (type-check + lint + test + build) تعمل الآن على دفع أي فرع.

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

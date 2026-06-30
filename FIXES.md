# تقرير الإصلاحات — Spir Medical

تاريخ التحليل: 2026-06-30
الفرع: `project-analysis`

هذا المستند يوثّق جميع الأخطاء التي تم اكتشافها أثناء التحليل الشامل للموقع،
والإصلاحات التي طُبّقت عليها.

---

## ملخص الحالة قبل الإصلاح

| الفحص | النتيجة |
|---|---|
| TypeScript (`tsc --noEmit`) | نظيف — 0 أخطاء |
| ESLint (`next lint`) | نظيف — لا تحذيرات |
| تجميع البناء (`next build`) | ينجح بالتجميع |
| الصفحات الفارغة | لا توجد — كل الصفحات الصغيرة wrappers سليمة |

الكود سليم تقنياً. المشاكل الحقيقية كانت محصورة في **إعداد Sentry وتدفّق OTP**،
وليست أخطاء برمجية في منطق الصفحات.

---

## 1) إصلاح تدفّق OTP عبر WhatsApp

### المشكلة
- منطق الإرسال (`meta-client.ts`) والتحقق (`otp-service.ts`) كان سليماً ومطابقاً
  لتوثيق Meta الحالي (authentication template: body + button بنفس الرمز، `sub_type: 'url'`).
- لكن في الواجهة:
  - زر **"إعادة الإرسال"** كان مجرد رابط إلى `/login/phone` ولا يُعيد الإرسال فعلاً،
    رغم وجود server action جاهز اسمه `resendOtp` غير مربوط.
  - لا يوجد **عدّاد تنازلي** يمنع الإرسال المتكرر.
  - نص صفحة الهاتف يقول "رسالة نصية" رغم أن القناة الأساسية هي WhatsApp.

### الإصلاح
| الملف | التغيير |
|---|---|
| `src/app/(auth)/otp/OtpForm.tsx` | **ملف جديد** — مكوّن client يربط `resendOtp` بزر إعادة إرسال حقيقي مع عدّاد تنازلي 60 ثانية، ويحافظ على القناة (`channel`). |
| `src/app/(auth)/otp/page.tsx` | استبدال النموذج المضمّن والرابط المعطّل باستخدام `<OtpForm />`. |
| `src/app/(auth)/login/phone/page.tsx` | تصحيح النص: "رمز التحقق برسالة نصية" ← "رمز التحقق عبر WhatsApp". |
| `src/app/styles/shared.css` | إضافة أنماط `.auth-resend-btn` و`.auth-resend-count`. |

### ما يتبقّى (إعداد لا كود)
- ضبط `NEXT_PUBLIC_OTP_MODE` إلى `optional` أو `required` (القيمة `disabled` تتجاوز OTP).
- إضافة متغيّرات Meta: `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_APP_SECRET`،
  واعتماد قالب `spir_otp` في Meta Business.

---

## 2) إصلاح إعداد Sentry (المشكلة الرئيسية)

### المشكلة
تكامل Sentry أضاف متغيّرات البيئة بسابقة `spirmedical_`، بينما الكود كان يقرأ
الأسماء القياسية بدون سابقة. النتيجة: قيم `undefined` وتعطّل رفع source maps وتتبّع الأخطاء.

| ما يقرأه الكود (قديم) | الاسم المتاح فعلاً |
|---|---|
| `SENTRY_ORG` | `spirmedical_SENTRY_ORG` |
| `SENTRY_PROJECT` (fallback ثابت `sentry-teal-pillar`) | `spirmedical_SENTRY_PROJECT` |
| `SENTRY_AUTH_TOKEN` | `spirmedical_SENTRY_AUTH_TOKEN` |
| `NEXT_PUBLIC_SENTRY_DSN` | `NEXT_PUBLIC_spirmedical_SENTRY_DSN` |

كما كان ناقصاً `onRouterTransitionStart` المطلوب في Sentry v10+ لتتبّع تنقّلات الراوتر.

### الإصلاح
| الملف | التغيير |
|---|---|
| `next.config.js` | قراءة `spirmedical_SENTRY_ORG / _PROJECT / _AUTH_TOKEN` مع fallback للأسماء القياسية، وإزالة اسم المشروع الثابت الخاطئ. |
| `sentry.client.config.ts` | قراءة DSN من `NEXT_PUBLIC_spirmedical_SENTRY_DSN` مع fallback. |
| `sentry.server.config.ts` | نفس إصلاح DSN. |
| `sentry.edge.config.ts` | نفس إصلاح DSN. |
| `src/instrumentation-client.ts` | إضافة `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;`. |
| `src/lib/error-tracking.ts` | تعريف ثابت `SENTRY_DSN` موحّد (يدعم الاسم المُسبَّق) واستخدامه في كل المواضع الأربعة. |

### ملاحظة
بنية instrumentation كانت صحيحة أصلاً: `src/instrumentation.ts` (server/edge) و
`src/instrumentation-client.ts` موجودان ويعملان مع Turbopack — لم تكن هناك حاجة لنقل ملفات.

---

## 3) ملاحظات لا تتطلّب إصلاح كود

- **تحذيرات `next.config.js`** عن مفاتيح مثل `devIndicators` و`transitionIndicator`
  أتت من cache بناء قديم؛ المفاتيح غير موجودة في الملف الحالي.
- **فشل `next build` محلياً** عند `Collecting page data` بسبب التحقق الصارم من
  متغيّرات البيئة في `src/lib/env.ts` (Supabase / ENCRYPTION_KEY). على Vercel
  تكون هذه المتغيّرات مضبوطة فيعمل البناء. سلوك مقصود وليس خطأ كود.
- **نصوص "قريباً"** (وضع الزائر، اللغة الكردية، تطبيقات المتجر) مقصودة وليست نواقص.

---

## التحقق بعد الإصلاح

| الفحص | النتيجة |
|---|---|
| TypeScript (`tsc --noEmit`) | نظيف — 0 أخطاء |

## قائمة الملفات المعدّلة

```
next.config.js
sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts
src/instrumentation-client.ts
src/lib/error-tracking.ts
src/app/(auth)/otp/OtpForm.tsx          (جديد)
src/app/(auth)/otp/page.tsx
src/app/(auth)/login/phone/page.tsx
src/app/styles/shared.css
```

# 🌿 Spir Medical — سباير ميديكال

> **دليل الفرات الأوسط الطبي** — منصة طبية رقمية متكاملة للعراق  
> النجف · كربلاء · بابل · الديوانية

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.45-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com)
[![Sentry](https://img.shields.io/badge/Sentry-10.56-purple)](https://sentry.io)

---

## 🔗 الروابط المهمّة

| الخدمة | الرابط |
|---|---|
| 🌐 الموقع الحيّ | [spir-medical.com](https://spir-medical.com) |
| 🔧 لوحة الأدمن | [spir-medical.com/admin44](https://spir-medical.com/admin44) |
| 📊 Vercel Dashboard | [vercel.com/inzohussein-blip/spirmedical-wep](https://vercel.com/inzohussein-blip/spirmedical-wep) |
| 🗄️ Supabase | [supabase.com/dashboard/project/ioulxemokusfeykjcaxg](https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg) |
| 🐛 Sentry | [inzohussein-blip-ip.sentry.io](https://inzohussein-blip-ip.sentry.io/issues/?project=4511479851843664) |
| 📱 Meta WhatsApp | [developers.facebook.com/apps/978497158399226](https://developers.facebook.com/apps/978497158399226) |
| 💻 GitHub (Web) | [github.com/inzohussein-blip/spirmedical-wep](https://github.com/inzohussein-blip/spirmedical-wep) |
| 🎛️ GitHub (CRM) | [github.com/inzohussein-blip/spirmedical-control](https://github.com/inzohussein-blip/spirmedical-control) |

---

## 🏗️ Stack التقني

| التقنية | الإصدار | الغرض |
|---|---|---|
| **Next.js** | 14.2.35 | Framework الأساسي |
| **TypeScript** | 5.5 | لغة البرمجة |
| **Supabase** | 2.45.4 | قاعدة البيانات + Auth + Realtime |
| **Tailwind CSS** | 3.4 | التصميم |
| **Sentry** | 10.56 | مراقبة الأخطاء |
| **Upstash Redis** | 1.38 | Rate Limiting |
| **Resend** | — | إرسال الإيميلات |
| **Meta WhatsApp API** | v21.0 | OTP + إشعارات |
| **Vercel** | — | Hosting + CDN |

---

## 📁 خريطة المشروع

```
spirmedical-wep/
├── src/
│   ├── app/
│   │   ├── (auth)/          # صفحات المصادقة
│   │   ├── (dashboard)/     # لوحة المستخدم
│   │   ├── (marketing)/     # الصفحات التسويقية
│   │   ├── (specialist)/    # بوابة الأخصائيين
│   │   ├── (app-utility)/   # أدوات التطبيق
│   │   ├── admin44/         # لوحة الإدارة
│   │   ├── admin-login/     # تسجيل دخول الأدمن
│   │   ├── api/             # API Routes
│   │   ├── guest/           # صفحات الزائر
│   │   └── onboarding/      # إعداد الحساب
│   ├── components/          # المكوّنات المشتركة
│   ├── lib/                 # المكتبات والأدوات
│   │   ├── supabase/        # Supabase clients
│   │   ├── whatsapp/        # WhatsApp OTP + Meta
│   │   ├── email/           # Resend email
│   │   ├── validations/     # Zod schemas
│   │   └── services/        # خدمات خارجية
│   └── types/               # TypeScript types
├── supabase/
│   └── migrations/          # 88 جدول
├── sentry.client.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
└── next.config.js
```

---

## 🗺️ صفحات التطبيق

### 🔐 المصادقة (auth)
| الصفحة | المسار | الحالة |
|---|---|---|
| تسجيل الدخول | `/login` | ✅ |
| OTP واتساب | `/otp` | ✅ |
| تسجيل مريض | `/register/patient` | ✅ |
| تسجيل أخصائي | `/register/specialist` | ✅ |
| نسيت كلمة المرور | `/forgot` | ✅ |
| بوابة الدخول | `/gate` | ✅ |

### 📱 لوحة المستخدم (dashboard)
| الصفحة | المسار | الحالة |
|---|---|---|
| الرئيسية | `/dashboard` | ✅ |
| المواعيد | `/appointments` | ✅ |
| الاستشارات | `/consultations` | ✅ |
| الخدمات | `/services` | ✅ |
| المفضّلة | `/favorites` | ✅ |
| الرسائل | `/messages` | ✅ |
| الإسعاف | `/sos` | ✅ |
| الأدوات | `/tools` | ✅ |
| الحساب | `/account` | ✅ |

### 🏥 الخدمات الطبية
| الخدمة | المسار | الحالة |
|---|---|---|
| سحب دم منزلي | `/services/booking` | ✅ |
| الأطباء | `/services/doctors` | ✅ |
| الصيدليات | `/services/pharmacies` | ✅ |
| عيادات الأسنان | `/services/dental` | ✅ |
| طب العيون | `/services/optical` | ✅ |
| الصحة النفسية | `/services/mental-health` | ✅ |
| التغذية | `/services/nutrition` | ✅ |
| العلاج الطبيعي | `/services/physio` | ✅ |
| التجميل | `/services/cosmetic` | ✅ |
| اللقاحات | `/services/vaccines` | ✅ |
| المستشفيات | `/services/hospitals` | ✅ |
| العيادات | `/services/clinics` | ✅ |
| تحاليل مخبرية | `/services/labs` | ⬜ قريباً |
| استشارات عبر الإنترنت | `/services/consultation` | ⬜ قريباً |

### 👨‍⚕️ بوابة الأخصائيين (specialist)
| الصفحة | المسار | الحالة |
|---|---|---|
| لوحة التحكّم | `/specialist` | ✅ |
| الحساب | `/specialist/account` | ✅ |
| البريد الوارد | `/specialist/inbox` | ✅ |
| الطلبات | `/specialist/orders` | ✅ |
| الجدول | `/specialist/schedule` | ✅ |
| الصيدلية | `/specialist/pharmacy` | ✅ |
| الإحصاءات | `/specialist/stats` | ✅ |

### 🎛️ لوحة الإدارة (admin44) — 34 صفحة
| القسم | الحالة |
|---|---|
| المرضى + الأطباء + المختصّون | ✅ |
| المختبرات + الصيدليات + المستشفيات | ✅ |
| المواعيد + الطلبات | ✅ |
| الإشعارات + الحملات + بيتا | ✅ |
| التقارير + التحليلات + سجلّ التدقيق | ✅ |
| إعدادات + بيانات أوّلية | ✅ |

### 🌐 الصفحات التسويقية
| الصفحة | المسار | الحالة |
|---|---|---|
| الرئيسية | `/` | ✅ |
| من نحن | `/about` | ✅ |
| تواصل معنا | `/contact` | ✅ |
| الأسئلة الشائعة | `/faq` | ✅ |
| المدوّنة | `/blog` | ✅ |
| الشروط والأحكام | `/legal/terms` | ✅ |
| سياسة الخصوصية | `/legal/privacy` | ✅ |
| حذف البيانات | `/data-deletion` | ✅ |

---

## 🔌 API Routes

| المسار | الغرض | الحالة |
|---|---|---|
| `/api/health` | فحص صحّة الخادم | ✅ |
| `/api/whatsapp/webhook` | Webhook Meta WhatsApp | ✅ |
| `/api/appointments` | إدارة المواعيد | ✅ |
| `/api/consultations/my-records` | سجلّات الاستشارات | ✅ |
| `/api/family/get` + `/list` | بيانات العائلة | ✅ |
| `/api/notifications/process` | معالجة الإشعارات | ✅ |
| `/api/push/*` | إشعارات PWA | ✅ |
| `/api/analytics/track` | تتبّع الأحداث | ✅ |
| `/api/cron/appointment-reminders` | تذكيرات المواعيد | ✅ |
| `/api/cron/nursing-recurring` | مواعيد التمريض المتكرّرة | ✅ |
| `/api/admin/seed` | بيانات أوّلية | ✅ |
| `/monitoring-tunnel` | Sentry tunnel | ✅ |

---

## 🗄️ قاعدة البيانات

- **Supabase Project ID:** `ioulxemokusfeykjcaxg`
- **عدد الجداول:** 88 جدول
- **ميزات:** Auth · RLS · Realtime · Storage
- **Migration:** `supabase/migrations/ALL_MIGRATIONS_COMBINED.sql`

### جداول مهمّة
| الجدول | الغرض |
|---|---|
| `users` | المستخدمون (مريض/أخصائي/أدمن) |
| `appointments` | المواعيد |
| `whatsapp_otp` | رموز التحقّق عبر واتساب |
| `family_members` | أفراد العائلة |
| `consultations` | الاستشارات |
| `notifications` | الإشعارات |
| `audit_log` | سجلّ التدقيق |
| `app_theme_settings` | إعدادات الواجهة |

---

## ⚙️ متغيّرات البيئة في Vercel

> ⚠️ **لا تضع القيم هنا أبداً** — فقط أسماء المتغيّرات

### 🔴 أساسية (مطلوبة للعمل)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
```

### 📱 WhatsApp Meta API
```
META_PHONE_NUMBER_ID       # من: API Setup في Meta
META_ACCESS_TOKEN          # التوكن الدائم (System User)
META_APP_SECRET            # من: Settings → Basic
META_WEBHOOK_VERIFY_TOKEN  # رمز التحقّق (تختاره)
META_API_VERSION           # v21.0
WHATSAPP_PROVIDER          # meta
```

### 🔐 المصادقة والأمان
```
ADMIN_CREATE_KEY           # مفتاح إنشاء حساب الأدمن
OTP_PEPPER                 # ملح تشفير OTP
NEXT_PUBLIC_OTP_MODE       # disabled | optional | required
```

### 📧 الإيميل (Resend)
```
RESEND_API_KEY
RESEND_FROM_EMAIL          # noreply@spir-medical.com
```

### 🐛 Sentry
```
NEXT_PUBLIC_SENTRY_DSN     # من: Sentry → Project → Client Keys
SENTRY_ORG                 # inzohussein-blip-ip
SENTRY_PROJECT             # sentry-teal-pillar
SENTRY_AUTH_TOKEN          # من: Sentry → Auth Tokens
```

### 🚦 Rate Limiting (Upstash)
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### 📲 إشعارات PWA
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

### 🔄 Cron Jobs
```
CRON_SECRET                # مفتاح حماية الـ cron routes
```

### 📊 Analytics (اختياري)
```
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

---

## ✅ حالة المشروع

### مكتمل ✅
- [x] نظام المصادقة (Login/Register/OTP)
- [x] لوحة المستخدم (Dashboard)
- [x] 12 خدمة طبية
- [x] بوابة الأخصائيين (14 صفحة)
- [x] لوحة الإدارة (34 صفحة)
- [x] WhatsApp Webhook (متحقّق)
- [x] نظام OTP عبر واتساب (تشخيص الأخطاء)
- [x] Sentry (مراقبة الأخطاء)
- [x] سياسة حذف البيانات (Meta-compliant)
- [x] PWA (Progressive Web App)
- [x] Cron Jobs (تذكيرات المواعيد)
- [x] Rate Limiting (Upstash Redis)
- [x] سجلّ التدقيق (Audit Log)
- [x] نظام الإشعارات (Push + WhatsApp)
- [x] SEO (النجف · الفرات الأوسط)
- [x] 88 جدول في قاعدة البيانات
- [x] 15 ملف اختبار (Jest)

### قيد التطوير 🔄
- [ ] OTP واتساب — إكمال الإرسال الفعلي (مشكلة dynamic import)
- [ ] Sentry — DSN + ربط مشروع sentry-teal-pillar
- [ ] Message Template `spir_otp` (يحتاج توثيق النشاط التجاري في Meta)

### قريباً ⬜
- [ ] خدمة التحاليل المخبرية (`/services/labs`)
- [ ] استشارات عبر الإنترنت (`/services/consultation`)
- [ ] OTP Mode: `required` (بعد اعتماد Template)
- [ ] توكن Meta دائم (System User)
- [ ] ترقية Next.js 14 → 15

---

## 🌍 الخدمات الخارجية

| الخدمة | الغرض | الحالة |
|---|---|---|
| [Supabase](https://supabase.com) | DB + Auth + Realtime | ✅ |
| [Vercel](https://vercel.com) | Hosting | ✅ |
| [Meta WhatsApp API](https://developers.facebook.com) | OTP + إشعارات | 🔄 |
| [Sentry](https://sentry.io) | مراقبة الأخطاء | 🔄 |
| [Resend](https://resend.com) | إيميلات | ✅ |
| [Upstash Redis](https://upstash.com) | Rate Limiting | ✅ |
| [OpenStreetMap/Nominatim](https://nominatim.org) | الخرائط والعناوين | ✅ |

---

## 🧪 الاختبارات

```bash
npx jest              # تشغيل كل الاختبارات
npx jest --silent     # بلا تفاصيل
npx tsc --noEmit      # فحص TypeScript
npm run lint          # ESLint
npm run build         # بناء الإنتاج
```

- **ملفات الاختبار:** 15 ملف
- **النتيجة المتوقّعة:** 162 اختبار ✅

---

## 🚀 النشر

### Vercel (تلقائي)
```
1. ادفع لـ GitHub branch: main
2. Vercel يبني تلقائياً
3. يُنشر على spir-medical.com
```

### متغيّرات البناء المطلوبة في Vercel
```
كل المتغيّرات في قسم "متغيّرات البيئة" أعلاه
يجب اختيار: Production + Preview + Development
```

### Redeploy يدوي
```
Vercel → Deployments → آخر نشر → ⋯ → Redeploy
```

---

## 📊 Supabase SQL Editor — أوامر مفيدة

```sql
-- فحص صحّة قاعدة البيانات
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- آخر محاولات OTP
SELECT phone, status, created_at
FROM public.whatsapp_otp
ORDER BY created_at DESC LIMIT 10;

-- تنظيف OTP المنتهية
DELETE FROM public.whatsapp_otp
WHERE expires_at < NOW();

-- فحص صلاحيات جدول
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'whatsapp_otp';
```

---

## 📞 معلومات التواصل

- **المالك:** حسين
- **إيميل الشركة:** inzohussein@gmail.com
- **الهاتف/واتساب:** 07803993585
- **الموقع:** النجف، العراق
- **الدومين:** spir-medical.com

---

## 📝 سجلّ التغييرات

### v1.0.0 (يونيو 2026)
- إطلاق المنصة الأولي
- 12 خدمة طبية
- نظام OTP عبر واتساب
- لوحة إدارة كاملة (34 صفحة)
- بوابة الأخصائيين (14 صفحة)
- تكامل Sentry
- سياسة حذف البيانات (Meta-compliant)
- SEO مُحسَّن للفرات الأوسط

---

> 🌿 **سباير ميديكال** — بُني بعناية في النجف 🇮🇶

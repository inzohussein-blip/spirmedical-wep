# Spir Medical · سباير ميديكال

> **منصّة طبية رقمية متكاملة في العراق** · Web App بشكل تطبيق هاتف ثابت
>
> [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() [![TypeScript](https://img.shields.io/badge/TypeScript-0_errors-blue)]() [![Tests](https://img.shields.io/badge/tests-59%2F59_passing-brightgreen)]() [![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)]()

---

## 📖 جدول المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [البنية المعمارية](#-البنية-المعمارية)
- [التقنيات المستخدمة](#-التقنيات-المستخدمة)
- [التصميم البصري](#-التصميم-البصري)
- [الصفحات والمسارات](#-الصفحات-والمسارات)
- [التشغيل المحلي](#-التشغيل-المحلي)
- [النشر على Vercel](#-النشر-على-vercel)
- [قاعدة البيانات](#-قاعدة-البيانات)
- [الأمان](#-الأمان)
- [الاختبارات](#-الاختبارات)
- [البنية الكاملة](#-البنية-الكاملة)

---

## 🎯 نظرة عامة

**سباير ميديكال** منصّة رقمية تربط المرضى بمزوّدي الخدمات الطبية في العراق:
- 🩸 سحب دم منزلي + تحاليل مختبرية
- 💉 تمريض منزلي + تركيب مغذي
- 💬 استشارات طبية (مرئية، هاتفية، كتابية)
- 💊 توصيل أدوية من صيدليات معتمدة
- 🏥 حجز مواعيد المستشفيات
- 🚨 طوارئ SOS (مساعدة - ليس بديلاً عن 122)

### المستخدمون

| الدور | الوصف | الواجهة |
|------|------|---------|
| **زائر** (Guest) | تصفّح بدون تسجيل | `/guest/*` |
| **مراجع** (Patient) | حجز خدمات + متابعة | `/dashboard`, `/appointments`, إلخ |
| **مختص** (Specialist) | استقبال طلبات + تقديم خدمات | `/specialist/*` |

> ⚠️ **لوحة الإدارة (CRM)** ليست جزءاً من هذا المشروع — مشروع منفصل تماماً.

---

## 🏗️ البنية المعمارية

التطبيق يحتوي على **4 طبقات منفصلة**:

### 1) الموقع التسويقي (`/`)
- صفحة Landing بعرض ويب كامل (1280px max-width)
- شرح للمنصة + مميزات + خطوات + CTA
- روابط لتطبيق الجوال

### 2) صفحات Auth (`(auth)/*`)
- بشكل **بطاقة هاتف 480px في وسط الشاشة** مع ظل
- على الموبايل: ملء الشاشة بدون ظل
- المسارات: `/gate`, `/login`, `/login/phone`, `/register`, `/register/patient`, `/register/specialist`, `/otp`, `/forgot`

### 3) التطبيق الأساسي (3 نوافذ)
كلها بشكل **AppShell موحّد** (Header + Bottom Nav + 480px):

#### نافذة الزائر (`/guest/*`)
- 11 صفحة (الرئيسية، الطلبات، المفضلة، الحساب)
- خدمات (مستشفيات، صيدليات)
- أدوات ذكية (الإسعافات، حاسبة المخاطر، مدقق الأعراض)
- طوارئ SOS

#### نافذة المراجع (`(dashboard)/*`)
- `/dashboard` - الرئيسية + إحصاءات + حجوزات قادمة
- `/appointments` - قائمة الطلبات مع فلترة
- `/appointments/new` - معالج حجز متعدد الخطوات
- `/appointments/[id]` - تفاصيل الحجز
- `/account` - الحساب + إعدادات + تسجيل خروج
- `/account/{settings,family,subscription,medical-record}` - أقسام الحساب
- `/favorites` - المفضلة

#### نافذة المختص (`(specialist)/*`)
- `/specialist` - الرئيسية + إحصاءات اليوم
- `/specialist/orders` - الطلبات المُكلَّف بها
- `/specialist/chats` - المحادثات (قريباً)
- `/specialist/account` - الحساب المهني

### 4) صفحات قانونية (`/legal/*`)
- `/legal/terms` - الشروط والأحكام
- `/legal/privacy` - سياسة الخصوصية (مع GDPR)
- `/legal/cookies` - سياسة الكوكيز
- `/legal/disclaimer` - إخلاء المسؤولية الطبية

---

## 🛠️ التقنيات المستخدمة

| الفئة | التقنية |
|-------|---------|
| **Framework** | Next.js 14.2.35 (App Router) |
| **Language** | TypeScript 5.5.4 |
| **Styling** | Plain CSS + CSS Custom Properties + Tailwind 3.4.7 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (OTP عبر SMS) |
| **Validation** | Zod |
| **Testing** | Jest + Testing Library |
| **Fonts** | @fontsource (Tajawal, Fraunces, JetBrains Mono) |
| **Hosting** | Vercel |
| **Analytics** | Vercel Analytics + Speed Insights |

### تبعيات أساسية
```json
{
  "@supabase/ssr": "0.5.2",
  "@supabase/supabase-js": "2.45.4",
  "next": "14.2.35",
  "react": "^18.3.1",
  "zod": "^3.23.8"
}
```

---

## 🎨 التصميم البصري

### نظام الألوان (Light Mode فقط)

| الفئة | الاسم | اللون |
|------|------|------|
| **Brand** | emerald | `#0E5C4D` |
| | emerald-deep | `#073B30` |
| | emerald-soft | `#D9E5DF` |
| | amber | `#B8540C` |
| | amber-soft | `#F0DBC2` |
| | rose | `#A82E3D` |
| | rose-soft | `#F0D7D8` |
| **Surfaces** | paper | `#F4EFE2` (أساس) |
| | paper-2 | `#EDE6D3` |
| | paper-3 | `#FAF6EB` |
| | white | `#FFFFFF` |
| **Text** | ink | `#0F1A1C` |
| | ink-2 | `#1F2A2C` |
| | ink-3 | `#6E7878` |
| | ink-4 | `#A4ACAA` |

> **ملاحظة:** Dark Mode **محذوف نهائياً** من المشروع — Light Mode فقط.

### الخطوط

| العائلة | الاستخدام |
|---------|----------|
| **Tajawal** | الخط الافتراضي (عربي) |
| **Fraunces Italic** | عناوين فنية مائلة |
| **JetBrains Mono** | الأرقام والأسعار وOTP |
| **Inter** | اسم العلامة التجارية |

### الأبعاد الأساسية

| العنصر | القيمة |
|--------|--------|
| App Shell width | `480px` (max-width) |
| Landing wrap | `1280px` (max-width) |
| Hero h1 | `72px` (40px على الموبايل) |
| Section h2 | `44px` (30px على الموبايل) |
| Border radius (pills) | `100px` |
| Border radius (cards) | `14-18px` |

---

## 🔍 الصفحات والمسارات

**38 صفحة + 3 API routes**

### المسارات الكاملة

```
/                           # Landing
/gate                       # بوابة الدخول
/login                      # تسجيل دخول
/login/phone                # دخول عبر الهاتف
/register                   # اختيار نوع الحساب
/register/patient           # تسجيل مراجع
/register/specialist        # تسجيل مختص
/otp                        # رمز التحقق
/forgot                     # استعادة الحساب

/guest                      # رئيسية الضيف
/guest/account              # حساب الضيف
/guest/favorites            # مفضلة الضيف
/guest/orders               # طلبات الضيف
/guest/services/hospitals   # دليل المستشفيات
/guest/services/pharmacies  # دليل الصيدليات
/guest/sos                  # طوارئ
/guest/tools/first-aid      # الإسعافات الأولية
/guest/tools/risk-calculator # حاسبة المخاطر
/guest/tools/symptom-checker # مدقق الأعراض

/dashboard                  # رئيسية المراجع
/appointments               # طلبات المراجع
/appointments/new           # حجز جديد
/appointments/[id]          # تفاصيل حجز
/account                    # حساب المراجع
/account/settings           # الإعدادات
/account/family             # العائلة
/account/subscription       # العضوية
/account/medical-record     # السجل الطبي
/favorites                  # مفضلة المراجع

/specialist                 # رئيسية المختص
/specialist/orders          # طلبات المختص
/specialist/chats           # محادثات المختص
/specialist/account         # حساب المختص

/legal/terms                # الشروط
/legal/privacy              # الخصوصية
/legal/cookies              # الكوكيز
/legal/disclaimer           # إخلاء المسؤولية الطبية

/api/health                 # GET فحص الصحة
/api/appointments           # GET, POST
/api/appointments/[id]      # GET, PATCH, DELETE
```

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js **24.x**
- npm 10+

### التثبيت
```bash
# 1. Clone
git clone https://github.com/inzohussein-blip/spirmedical-wep.git
cd spirmedical-wep

# 2. تثبيت
npm install

# 3. متغيرات البيئة
cp .env.example .env.local
# عدّل القيم في .env.local

# 4. تشغيل
npm run dev      # على http://localhost:3000

# 5. أوامر إضافية
npm run build    # بناء الإنتاج
npm run lint     # ESLint
npm test         # Jest
npm run type-check  # tsc --noEmit
```

### المتغيرات البيئية المطلوبة

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# تشفير البيانات الحساسة (notes_encrypted)
ENCRYPTION_KEY=95ab29a877a0f42df526014ecdff459fe07f3d1a0428a73b9d588d4f4ff8776b

# الموقع
NEXT_PUBLIC_SITE_URL=https://spirmedical-wep.vercel.app
```

---

## 🌐 النشر على Vercel

المشروع منشور على Vercel:
- **Production**: https://spirmedical-wep.vercel.app
- **Region**: `fra1` (Frankfurt)
- **Build Command**: `next build`
- **Node Version**: 24.x

### vercel.json
```json
{
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

---

## 🗄️ قاعدة البيانات

### الجداول الأساسية (Supabase)

| الجدول | الوصف |
|-------|------|
| `users` | المستخدمون (أدوار: patient, specialist) |
| `appointments` | الحجوزات (مع تشفير notes) |
| `audit_logs` | سجل الأحداث |

### Schema
انظر `supabase/schema.sql` للتفاصيل الكاملة.

### Migrations
الأعمدة الجديدة (`service_id`, `estimated_price`, `duration_minutes`, `otp_channel`) تُدار عبر migrations منفصلة.

---

## 🔐 الأمان

- **HTTPS** فقط (Vercel default)
- **CSP** + **HSTS** عبر `next.config.js`
- **Rate Limiting** على `/api/*`
- **CSRF** protection للـ Server Actions
- **Encryption** لـ `notes` بـ AES-256
- **Row Level Security** على Supabase
- **Cookie Consent** متوافق مع GDPR

تفاصيل أكثر في `SECURITY.md`.

---

## 🧪 الاختبارات

```
Test Suites: 6 passed, 6 total
Tests:       59 passed, 59 total
```

| الملف | عدد الاختبارات |
|------|----------------|
| `tests/encryption.test.ts` | 9 |
| `tests/i18n.test.ts` | 7 |
| `tests/logger.test.ts` | 12 |
| `tests/rate-limit.test.ts` | 8 |
| `tests/utils.test.ts` | 11 |
| `tests/validations.test.ts` | 12 |

---

## 📂 البنية الكاملة

```
spirmedical-wep/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # ✓ صفحات تسجيل دخول/إنشاء
│   │   │   ├── layout.tsx           # AuthLayout (auth-shell 480px)
│   │   │   ├── gate/
│   │   │   ├── login/{,phone/}
│   │   │   ├── register/{,patient/,specialist/}
│   │   │   ├── otp/
│   │   │   └── forgot/
│   │   │
│   │   ├── (dashboard)/             # ✓ نافذة المراجع
│   │   │   ├── layout.tsx           # حماية + AppShell
│   │   │   ├── dashboard/
│   │   │   ├── appointments/{,new/,[id]/}
│   │   │   ├── account/{,settings/,family/,subscription/,medical-record/}
│   │   │   └── favorites/
│   │   │
│   │   ├── (specialist)/            # ✓ نافذة المختص
│   │   │   ├── layout.tsx           # حماية role=specialist
│   │   │   └── specialist/
│   │   │       ├── page.tsx
│   │   │       ├── orders/
│   │   │       ├── chats/
│   │   │       └── account/
│   │   │
│   │   ├── api/
│   │   │   ├── health/
│   │   │   └── appointments/{,[id]/}
│   │   │
│   │   ├── guest/                   # ✓ نافذة الزائر
│   │   │   ├── layout.tsx           # AppShell (isGuest=true)
│   │   │   ├── page.tsx
│   │   │   ├── account/
│   │   │   ├── favorites/
│   │   │   ├── orders/
│   │   │   ├── services/{hospitals,pharmacies}/
│   │   │   ├── sos/
│   │   │   └── tools/{first-aid,risk-calculator,symptom-checker}/
│   │   │
│   │   ├── legal/
│   │   │   ├── terms/
│   │   │   ├── privacy/
│   │   │   ├── cookies/
│   │   │   └── disclaimer/
│   │   │
│   │   ├── globals.css              # ⭐ كل الـ CSS (Light only)
│   │   ├── layout.tsx               # Root layout
│   │   ├── manifest.ts              # PWA
│   │   ├── page.tsx                 # Landing
│   │   ├── error.tsx                # Error boundary
│   │   ├── loading.tsx              # Loading
│   │   └── not-found.tsx            # 404
│   │
│   ├── components/
│   │   ├── app/
│   │   │   └── LockedAction.tsx
│   │   ├── appointments/
│   │   │   ├── AppointmentActions.tsx
│   │   │   ├── AppointmentStatusCard.tsx
│   │   │   ├── AppointmentTimeline.tsx
│   │   │   ├── AppointmentWizard.tsx
│   │   │   └── OtpChannelSelector.tsx
│   │   ├── layout/
│   │   │   └── AppShell.tsx         # ⭐ الإطار الرئيسي
│   │   ├── legal/
│   │   │   └── CookieConsent.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   │
│   ├── lib/
│   │   ├── audit.ts
│   │   ├── encryption.ts
│   │   ├── logger.ts
│   │   ├── rate-limit.ts
│   │   ├── utils.ts
│   │   ├── permissions/index.ts
│   │   ├── services/
│   │   │   ├── otp-channels.ts
│   │   │   ├── services-data.ts
│   │   │   └── time-slots.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── server.ts
│   │   └── validations/
│   │       ├── appointment.ts
│   │       ├── auth-forms.ts
│   │       └── auth.ts
│   │
│   ├── types/
│   │   └── database.ts
│   │
│   └── middleware.ts
│
├── public/
│   ├── favicon.ico
│   ├── icon-{192,512}.png
│   ├── icon.svg
│   ├── og-image.png
│   ├── apple-icon.png
│   └── locales/{ar,en}.json
│
├── supabase/
│   ├── schema.sql
│   └── seed.sql
│
├── tests/
│   ├── encryption.test.ts
│   ├── i18n.test.ts
│   ├── logger.test.ts
│   ├── rate-limit.test.ts
│   ├── setup.ts
│   ├── utils.test.ts
│   └── validations.test.ts
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── SETUP.md
│
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTRUCTIONS.md
├── README.md                  # هذا الملف
├── SECURITY.md
├── jest.config.js
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 📊 إحصاءات المشروع

| المقياس | القيمة |
|---------|--------|
| ملفات TypeScript | 81 ملف |
| صفحات App Router | 38 صفحة |
| API routes | 3 endpoints |
| Components | 11 component |
| Test files | 6 ملف |
| Tests | 59 اختبار |
| globals.css | ~2120 سطر |
| Total source LOC | ~12000 سطر |

---

## 📝 ملاحظات تطويرية

### قواعد التصميم الصارمة

1. ❌ **لا توجد حسابات اختبار** في أي مكان
2. ❌ **لا توجد لوحة admin/CRM** في هذا المشروع (مشروع منفصل)
3. ❌ **لا يوجد Dark Mode** — Light Mode فقط
4. ❌ **لا يوجد إطار خارجي** على شكل الهاتف
5. ✅ **480px ثابت** للتطبيق على كل الشاشات
6. ✅ **1280px responsive** للموقع التسويقي فقط
7. ✅ **V3 reference** كمصدر الحقيقة للتصميم

### الأدوار والصلاحيات

```typescript
type UserRole = 'guest' | 'patient' | 'specialist'
```

- `guest` → `/guest/*` فقط
- `patient` → `(dashboard)/*`
- `specialist` → `(specialist)/*`

التحقق من الدور يتم في `(dashboard)/layout.tsx` و `(specialist)/layout.tsx` عبر middleware + Supabase auth.

---

## 📞 الدعم

- **البريد الإلكتروني**: info@spirmedical.iq
- **الدعم الفني**: support@spirmedical.iq
- **GitHub Issues**: للإبلاغ عن المشاكل

---

## 📜 الترخيص

جميع الحقوق محفوظة © ٢٠٢٦ Spir Medical · سباير ميديكال

صنع بعناية في بغداد 🇮🇶

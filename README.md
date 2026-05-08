# 🩺 Spir Medical · سباير ميديكال

> منصة طبية رقمية متكاملة في العراق — مبنية بـ Next.js 14 + Supabase

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com/inzohussein-blips-projects/spirmedical-wep)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E)](https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg)
[![License](https://img.shields.io/badge/License-Private-red)](#)
[![Live](https://img.shields.io/badge/Live-spirmedical--wep.vercel.app-brightgreen)](https://spirmedical-wep.vercel.app)

---

## 🎯 نظرة سريعة

**Spir Medical** هي منصة طبية رقمية شاملة تخدم العراق، توفّر **١٧ خدمة طبية** للمرضى والأخصائيين، مع وضع ضيف كامل (browse-only) لتجربة الخدمات قبل التسجيل.

**الموقع المنشور:** [spirmedical-wep.vercel.app](https://spirmedical-wep.vercel.app)

---

## ⚠️ حالة المشروع

هذا **MVP scaffold كامل** يحتوي على:

### الميزات المُكتملة ✅
- ✅ مصادقة OTP عبر الهاتف العراقي
- ✅ نظام أدوار كامل (مريض / أخصائي / أدمن)
- ✅ تسجيل مرضى وأخصائيين منفصل
- ✅ **وضع ضيف كامل** (`/guest`) - ١٧ خدمة + ٣ أدوات تفاعلية
- ✅ CRUD حجوزات (Appointments)
- ✅ لوحة تحكم محمية للمستخدم
- ✅ لوحة إدارة (للأدمن فقط)
- ✅ API endpoints موثّقة
- ✅ RLS كامل على Supabase
- ✅ TypeScript + Tailwind + RTL
- ✅ التزام قانوني (Cookies + Terms + Privacy)
- ✅ Vercel Analytics + Speed Insights
- ✅ Tests scaffolded
- ✅ Docker + CI/CD
- ✅ TEST MODE (للتطوير بدون SMS)

### يحتاج قبل الإنتاج الحقيقي ⚠️
- تكامل بوابات دفع (زين كاش، آسيا، فيزا)
- تكامل SMS عراقي محلي (بدلاً من Twilio)
- تدقيق أمني احترافي
- مراجعة قانونية شاملة
- اختبار شامل (E2E)
- ربط حقيقي مع المستشفيات والصيدليات

---

## 🏗️ التقنيات

| الفئة | التقنية |
|-------|---------|
| **Framework** | Next.js 14.2.35 (App Router) |
| **اللغة** | TypeScript 5 |
| **التصميم** | Tailwind CSS 3 + CSS Variables |
| **Backend** | Next.js API Routes + Server Actions |
| **قاعدة البيانات** | PostgreSQL (عبر Supabase) |
| **المصادقة** | Supabase Auth (Phone OTP) |
| **التحقق** | Zod + React Hook Form |
| **الاختبارات** | Jest + Testing Library |
| **التحليلات** | Vercel Analytics + Speed Insights |
| **النشر** | Vercel |
| **CI/CD** | GitHub Actions |
| **الخطوط** | Tajawal · Fraunces · JetBrains Mono |

---

## 🩺 الخدمات المتاحة (١٧ خدمة)

### 🌟 الخدمة المميزة (١)
- **⌬ طبيب العائلة المخصص** - طبيب مرافق طوال العام (مقفل للضيف)

### 🏥 الخدمات الطبية الأساسية (٨)
| الخدمة | للضيف | للمسجّل |
|--------|-------|---------|
| 🩸 سحب دم منزلي | 🔒 مقفل | ✅ |
| 🧪 تحاليل مختبرية | 🔒 مقفل | ✅ |
| 💉 تمريض وتداوي | 🔒 مقفل | ✅ |
| 💬 استشارة طبية | 🔒 مقفل | ✅ |
| 🏥 المستشفيات | ✅ تصفّح | ✅ حجز |
| 💊 دليل الصيدليات | ✅ تصفّح | ✅ |
| 📋 السجل الطبي | 🔒 مقفل | ✅ |
| 👨‍👩‍👧 حساب العائلة | 🔒 مقفل | ✅ |

### 🛠 أدوات الصحة الذكية (٥)
| الأداة | للضيف |
|--------|-------|
| 🧮 حاسبة المخاطر الصحية | ✅ مجاني تماماً |
| 🔍 مدقّق الأعراض | ✅ مجاني تماماً |
| 🚑 دليل الإسعافات الأولية | ✅ مجاني تماماً |
| ⏰ تذكير الأدوية | 🔒 مقفل |
| 📊 تتبع المؤشرات الحيوية | 🔒 مقفل |

### 🔮 ميزات قادمة (٤)
- 💰 المحفظة الداخلية + نقاط الولاء
- 📷 قراءة الوصفات (OCR)
- 💄 عيادات تجميل
- 💉 جدول التطعيمات

### 🚨 الطوارئ (١)
- 🚨 **طوارئ SOS** - متاح للجميع (الإسعاف ١٢٢)

---

## 📁 بنية المشروع

```
spirmedical-wep/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (RTL + خطوط + Cookie consent)
│   │   ├── page.tsx                      # الصفحة الرئيسية (Landing)
│   │   ├── globals.css                   # CSS كامل (٦,٥٥٩ سطر)
│   │   │
│   │   ├── (auth)/                       # المصادقة
│   │   │   ├── gate/                     # 🆕 صفحة اختيار الدخول
│   │   │   ├── login/                    # تسجيل الدخول
│   │   │   ├── login/phone/              # OTP عبر SMS
│   │   │   ├── register/                 # 🆕 اختيار نوع الحساب
│   │   │   │   ├── patient/              # تسجيل مريض
│   │   │   │   └── specialist/           # تسجيل أخصائي
│   │   │   ├── otp/                      # تأكيد OTP
│   │   │   └── forgot/                   # استعادة كلمة السر
│   │   │
│   │   ├── (dashboard)/                  # المنطقة المحمية
│   │   │   ├── dashboard/                # الإحصاءات
│   │   │   └── appointments/             # CRUD الحجوزات
│   │   │
│   │   ├── (admin)/                      # 🆕 لوحة الإدارة
│   │   │
│   │   ├── guest/                        # 🆕 وضع الضيف الكامل
│   │   │   ├── page.tsx                  # ١٧ خدمة منظّمة في ٥ أقسام
│   │   │   ├── orders/                   # طلباتي (empty state)
│   │   │   ├── favorites/                # المفضلة
│   │   │   ├── account/                  # حساب الضيف
│   │   │   ├── sos/                      # 🚨 طوارئ SOS
│   │   │   ├── services/
│   │   │   │   ├── hospitals/            # دليل المستشفيات
│   │   │   │   └── pharmacies/           # دليل الصيدليات
│   │   │   └── tools/
│   │   │       ├── risk-calculator/      # حاسبة المخاطر
│   │   │       ├── symptom-checker/      # مدقّق الأعراض
│   │   │       └── first-aid/            # الإسعافات الأولية
│   │   │
│   │   ├── legal/                        # 🆕 قانوني
│   │   │   ├── terms/                    # الشروط
│   │   │   └── privacy/                  # الخصوصية
│   │   │
│   │   └── api/                          # REST API
│   │       ├── appointments/             # GET, POST, PATCH, DELETE
│   │       └── health/                   # فحص الحالة
│   │
│   ├── components/
│   │   ├── app/                          # 🆕 مكوّنات التطبيق
│   │   │   ├── BottomNav.tsx             # شريط التنقّل السفلي
│   │   │   └── LockedAction.tsx          # أزرار مقفلة + Modal
│   │   ├── analytics/                    # 🆕 Vercel Analytics
│   │   ├── appointments/                 # مكوّنات الحجوزات
│   │   ├── legal/                        # 🆕 Cookie Consent
│   │   ├── shared/                       # مكوّنات مشتركة
│   │   └── ui/                           # Button, Input, Card
│   │
│   ├── lib/
│   │   ├── supabase/                     # client, server, middleware
│   │   ├── validations/                  # Zod schemas (auth + appointments)
│   │   ├── i18n/                         # الترجمات
│   │   └── utils.ts
│   │
│   ├── types/
│   │   └── database.ts                   # أنواع Supabase
│   │
│   └── middleware.ts                     # حماية المسارات
│
├── supabase/
│   ├── schema.sql                        # مخطط قاعدة البيانات
│   └── seed.sql                          # بيانات اختبار
│
├── public/
│   ├── og-image.png                      # 🆕 OG Image للمشاركة
│   └── locales/                          # ترجمات
│
├── tests/                                # Jest tests
├── docs/                                 # توثيق
├── .github/workflows/ci.yml              # CI
├── Dockerfile + docker-compose.yml
├── package.json                          # Next 14.2.35
└── vercel.json
```

---

## 🚀 البدء السريع (٥ دقائق)

### المتطلبات
- Node.js 18+
- حساب [Supabase](https://supabase.com) (مجاني)
- حساب [Vercel](https://vercel.com) (مجاني)

### ١. استنسخ وثبّت
```bash
git clone https://github.com/inzohussein-blip/spirmedical-wep.git
cd spirmedical-wep
npm install
```

### ٢. أعدّ Supabase
1. اذهب إلى مشروعك: `https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg`
2. **SQL Editor** → **New query** → الصق محتوى `supabase/schema.sql` → **Run**
3. **Authentication** → **Providers** → فعّل **Phone**
4. اختر مزوّد SMS (Twilio موصى به للبداية)
5. **Settings** → **API** → انسخ المفاتيح

### ٣. أنشئ `.env.local`
```bash
cp .env.example .env.local
```

عدّل القيم:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENCRYPTION_KEY=<32-byte-hex-key>

# اختياري: للاختبار بدون SMS
ENABLE_TEST_MODE=true
```

### ٤. شغّل محلياً
```bash
npm run dev
```

افتح: http://localhost:3000

### ٥. حسابات اختبارية (TEST MODE)

عند تفعيل `ENABLE_TEST_MODE=true`:

| النوع | الهاتف | كلمة السر |
|-------|--------|-----------|
| مريض | `+9647712345678` | `123456` |
| أخصائي | `+9647811111111` | `111111` |
| أدمن | `+9647900000000` | `000000` |

---

## 📜 الأوامر المتاحة

```bash
npm run dev          # خادم تطوير
npm run build        # بناء للإنتاج
npm run start        # تشغيل الـ build
npm run lint         # فحص ESLint
npm run type-check   # فحص TypeScript
npm test             # تشغيل الاختبارات
npm run test:watch   # اختبارات مع watch
npm run format       # تنسيق الكود (Prettier)
```

---

## 📡 API Endpoints

| الـ Method | الـ Endpoint | الوصف | يحتاج مصادقة |
|-----------|-------------|-------|----------------|
| `GET` | `/api/health` | فحص حالة التطبيق | ❌ |
| `GET` | `/api/appointments` | قائمة حجوزات المستخدم | ✅ |
| `POST` | `/api/appointments` | إنشاء حجز جديد | ✅ |
| `GET` | `/api/appointments/:id` | حجز محدّد | ✅ |
| `PATCH` | `/api/appointments/:id` | تحديث حجز | ✅ |
| `DELETE` | `/api/appointments/:id` | حذف حجز | ✅ |

تفاصيل في [`docs/API.md`](docs/API.md).

---

## 🚢 النشر

### Vercel (موصى به)

١. ادفع لـ GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

٢. اذهب إلى مشروعك في Vercel: `https://vercel.com/inzohussein-blips-projects/spirmedical-wep`

٣. **Settings** → **Environment Variables** → أضف:

| المتغيّر | الوصف | حساس |
|---------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط Supabase | ❌ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح public | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح private | ✅ |
| `ENCRYPTION_KEY` | مفتاح تشفير 32-byte | ✅ |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع | ❌ |
| `ENABLE_TEST_MODE` | للاختبار (اختياري) | ❌ |

٤. اضغط **Redeploy**

📖 توثيق تفصيلي: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Docker (محلي/خاص)
```bash
docker compose up --build
```

---

## 🎨 نظام التصميم

### الألوان الأساسية
| الاسم | اللون | الاستخدام |
|------|------|----------|
| Emerald Deep | `#0E5C4D` | اللون الأساسي |
| Amber Copper | `#B8540C` | اللون الثانوي |
| Rose Alarm | `#A82E3D` | الطوارئ |
| Ink Charcoal | `#0F1A1C` | النصوص |
| Paper Ivory | `#F4EFE2` | الخلفيات |

### الخطوط
- **Tajawal** - النص العربي والإنجليزي
- **Fraunces Italic** - العناوين الفنية
- **JetBrains Mono** - الكود والأرقام

---

## 🧪 الاختبارات

```bash
npm test
```

اختبارات حالية:
- ✅ Phone validation (عراقي)
- ✅ Phone normalization
- ✅ Appointment validation

---

## 🔐 الأمان

### مفعّل افتراضياً ✅
- HTTPS إجباري (Vercel)
- Security Headers (في `next.config.js`)
- Row-Level Security على كل الجداول
- مصادقة OTP عبر Supabase
- تحقق من المدخلات (Zod)
- حماية من XSS (React)
- حماية من SQL injection (Supabase ORM)
- Cookie Consent (GDPR-ready)
- Encryption للبيانات الحساسة (AES-256)

### يحتاج عمل قبل الإنتاج ⚠️
- تدقيق اختراق احترافي
- Audit logging شامل
- Rate limiting متقدّم
- مراجعة قانونية

📖 تفاصيل في [`SECURITY.md`](SECURITY.md)

---

## 🗺️ خارطة الطريق

### ✅ المرحلة الحالية (MVP) - مُكتملة
- [x] الموقع التسويقي
- [x] نظام المصادقة الكامل
- [x] **وضع الضيف بـ ١٧ خدمة**
- [x] **٣ أدوات تفاعلية مجانية**
- [x] دليل المستشفيات والصيدليات
- [x] طوارئ SOS كامل
- [x] CRUD الحجوزات
- [x] لوحة تحكم المستخدم
- [x] لوحة الإدارة
- [x] التزام قانوني كامل (Cookies + T&C + Privacy)

### 🔵 المرحلة التالية (٢-٣ أشهر)
- [ ] تفعيل الخدمات المقفلة (للمسجّلين)
- [ ] حجز موعد فعلي مع المستشفيات
- [ ] محادثات realtime
- [ ] تذكير الأدوية مع إشعارات
- [ ] تتبع المؤشرات الحيوية (ضغط، سكر، نبض)
- [ ] السجل الطبي الشامل
- [ ] إدارة العائلة
- [ ] لوحة الأخصائي

### 🟢 المرحلة المتقدمة (٣-٦ أشهر)
- [ ] تكامل بوابات دفع (زين كاش، آسيا)
- [ ] تكامل SMS عراقي محلي
- [ ] المحفظة الداخلية + نقاط الولاء
- [ ] تطبيق موبايل native (React Native)
- [ ] تكاملات مستشفيات حقيقية
- [ ] قراءة الوصفات (OCR)
- [ ] عيادات تجميل
- [ ] جدول التطعيمات

---

## 📊 إحصائيات المشروع

```
✓ Pages:        32 صفحة
✓ Services:     17 خدمة طبية
✓ Tools:        3 أدوات تفاعلية
✓ Languages:    العربية (RTL)
✓ TypeScript:   88.7%
✓ Build:        0 errors, 0 warnings
✓ Bundle:       ~99 kB First Load
```

---

## 🤝 المساهمة

```bash
git checkout -b feature/your-feature
git commit -m "feat: add X"
git push origin feature/your-feature
# افتح Pull Request
```

📖 [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## 📞 التواصل

- 🌐 [spirmedical.iq](https://spirmedical.iq)
- 📧 info@spirmedical.iq
- 🐙 [github.com/inzohussein-blip/spirmedical-wep](https://github.com/inzohussein-blip/spirmedical-wep)
- ☁️ [vercel.com/inzohussein-blips-projects/spirmedical-wep](https://vercel.com/inzohussein-blips-projects/spirmedical-wep)
- 🗄️ [supabase.com/dashboard/project/ioulxemokusfeykjcaxg](https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg)

---

## 📜 الترخيص

جميع الحقوق محفوظة © ٢٠٢٦ سباير ميديكال

---

**بُني بعناية في العراق 🇮🇶**

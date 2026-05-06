# 🩺 Spir Medical · سباير ميديكال

> منصة طبية رقمية متكاملة في العراق — مبنية بـ Next.js 14 + Supabase

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com/inzohussein-blips-projects/spirmedical-wep)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E)](https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg)
[![License](https://img.shields.io/badge/License-Private-red)](#)

---

## ⚠️ حالة المشروع

هذا **MVP scaffold كامل** يحتوي على:
- ✅ مصادقة OTP عبر الهاتف
- ✅ CRUD حجوزات (Appointments)
- ✅ لوحة تحكم محمية للمستخدم
- ✅ لوحة إدارة (للأدمن فقط)
- ✅ API endpoints موثّقة
- ✅ RLS كامل على Supabase
- ✅ TypeScript + Tailwind + RTL
- ✅ Tests scaffolded
- ✅ Docker + CI/CD

⚠️ **يحتاج قبل الإنتاج الحقيقي:** اختبار شامل، تدقيق أمني احترافي، مراجعة قانونية، تكامل دفع، تكامل SMS عربي.

---

## 🏗️ التقنيات

| الفئة | التقنية |
|-------|---------|
| Framework | Next.js 14 (App Router) |
| اللغة | TypeScript 5 |
| التصميم | Tailwind CSS 3 |
| Backend | Next.js API Routes + Server Actions |
| قاعدة البيانات | PostgreSQL (عبر Supabase) |
| المصادقة | Supabase Auth (Phone OTP) |
| التحقق | Zod + React Hook Form |
| الاختبارات | Jest + Testing Library |
| النشر | Vercel |
| CI/CD | GitHub Actions |

---

## 📁 بنية المشروع

```
spirmedical-wep/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (RTL + الخطوط)
│   │   ├── page.tsx                  # صفحة الهبوط
│   │   ├── globals.css
│   │   ├── (auth)/                   # المصادقة
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── actions.ts        # Server Actions
│   │   │   └── otp/page.tsx
│   │   ├── (dashboard)/              # المنطقة المحمية
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx    # الإحصاءات
│   │   │   └── appointments/
│   │   │       ├── page.tsx          # قائمة الحجوزات
│   │   │       └── new/
│   │   │           ├── page.tsx
│   │   │           └── actions.ts
│   │   ├── (admin)/                  # لوحة الإدارة
│   │   │   ├── layout.tsx
│   │   │   └── admin/page.tsx
│   │   └── api/                      # REST API
│   │       ├── appointments/
│   │       │   ├── route.ts          # GET, POST
│   │       │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │       └── health/route.ts
│   ├── components/
│   │   ├── ui/                       # Button, Input, Card
│   │   └── shared/                   # مكوّنات مشتركة
│   ├── lib/
│   │   ├── supabase/                 # client, server, middleware
│   │   ├── validations/              # Zod schemas
│   │   ├── i18n/                     # الترجمات
│   │   └── utils.ts                  # دوال مساعدة
│   ├── types/database.ts             # أنواع Supabase
│   └── middleware.ts                 # حماية المسارات
├── supabase/
│   ├── schema.sql                    # مخطط قاعدة البيانات
│   └── seed.sql                      # بيانات اختبار
├── public/
│   └── locales/                      # ترجمات (ar.json, en.json)
├── tests/
│   ├── setup.ts
│   └── validations.test.ts
├── docs/
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── API.md
│   └── ARCHITECTURE.md
├── .github/workflows/ci.yml          # CI
├── Dockerfile + docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
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
4. اختر مزوّد SMS (Twilio موصى به للبداية):
   - Twilio Account SID + Auth Token + Phone Number
5. **Settings** → **API** → انسخ:
   - `Project URL` (مثل `https://ioulxemokusfeykjcaxg.supabase.co`)
   - `anon` key
   - `service_role` key (سرّي!)

### ٣. أنشئ `.env.local`

```bash
cp .env.example .env.local
```

عدّل القيم:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ٤. شغّل محلياً

```bash
npm run dev
```

افتح: [http://localhost:3000](http://localhost:3000)

### ٥. سجّل أول حساب

١. اضغط **"ادخل التطبيق"**
٢. أدخل رقم هاتفك العراقي (`07XX XXX XXXX`)
٣. ستحصل على OTP عبر SMS (لأول استخدام في Supabase Free Tier، قد يكون عبر Twilio)
٤. أدخل الرمز
٥. ✅ ستصل للوحة التحكم

### ٦. اجعل نفسك أدمن (لاختبار لوحة الإدارة)

في Supabase SQL Editor:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE phone = '+964XXXXXXXXXX';
```

سجّل خروج وادخل من جديد، ستظهر لك لوحة `/admin`.

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

| الـ Method | الـ Endpoint | الوصف |
|------------|--------------|--------|
| `GET` | `/api/health` | فحص حالة التطبيق |
| `GET` | `/api/appointments` | قائمة حجوزات المستخدم |
| `POST` | `/api/appointments` | إنشاء حجز جديد |
| `GET` | `/api/appointments/:id` | حجز محدّد |
| `PATCH` | `/api/appointments/:id` | تحديث حجز |
| `DELETE` | `/api/appointments/:id` | حذف حجز |

كل المسارات (ما عدا `/health`) تتطلب مصادقة. تفاصيل في [`docs/API.md`](docs/API.md).

---

## 🚢 النشر

### Vercel (موصى به):

١. ادفع لـ GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

٢. اذهب إلى مشروعك في Vercel:
   `https://vercel.com/inzohussein-blips-projects/spirmedical-wep`

٣. **Settings** → **Environment Variables** → أضف:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ مع تفعيل "Sensitive"

٤. اضغط **Redeploy**

📖 توثيق تفصيلي: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Docker (محلي/خاص):

```bash
docker compose up --build
```

---

## 🧪 الاختبارات

```bash
npm test
```

اختبارات حالية:
- ✅ Phone validation (عراقي)
- ✅ Phone normalization
- ✅ Appointment validation

➕ أضف اختبارات في `tests/`.

---

## 🔐 الأمان

### مفعّل افتراضياً:
- ✅ HTTPS إجباري (Vercel)
- ✅ Security Headers (في `next.config.js`)
- ✅ Row-Level Security على كل الجداول
- ✅ مصادقة OTP عبر Supabase
- ✅ تحقق من المدخلات (Zod)
- ✅ حماية من XSS (React)
- ✅ حماية من SQL injection (Supabase ORM)

### يحتاج عمل قبل الإنتاج:
- ⚠️ تدقيق اختراق احترافي
- ⚠️ تشفير البيانات الحساسة (السجلات الطبية)
- ⚠️ Audit logging
- ⚠️ Rate limiting
- ⚠️ مراجعة قانونية

📖 تفاصيل في [`docs/SECURITY.md`](docs/SECURITY.md) (في المستودع الأصلي).

---

## 🗺️ خارطة الطريق

### ✅ المرحلة الحالية (MVP)
- مصادقة + حجوزات + إدارة أساسية

### 🔵 المرحلة التالية (٢-٣ أشهر)
- [ ] باقي الخدمات الـ ١٤ (تمريض، صيدليات، إلخ)
- [ ] لوحة أخصائي
- [ ] محادثات realtime
- [ ] تذكير الأدوية
- [ ] تتبع المؤشرات الحيوية

### 🟢 المرحلة المتقدمة (٣-٦ أشهر)
- [ ] تكامل بوابات دفع
- [ ] تكامل SMS عراقي محلي
- [ ] تطبيق موبايل native
- [ ] تكاملات مستشفيات

---

## 🤝 المساهمة

```bash
git checkout -b feature/your-feature
git commit -m "feat: add X"
git push origin feature/your-feature
# افتح Pull Request
```

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

<div align="center">

**بُني بعناية في العراق 🇮🇶**

</div>

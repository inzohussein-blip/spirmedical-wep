# 🩺 سباير ميديكال · Spir Medical

> منصة طبية رقمية متكاملة في العراق — الموقع الرسمي

[![Status](https://img.shields.io/badge/status-launching-amber)](https://spirmedical.iq)
[![License](https://img.shields.io/badge/license-private-red)](LICENSE)
[![Built with](https://img.shields.io/badge/built%20with-HTML5%20%2B%20CSS3-emerald)](#)

---

## 📋 جدول المحتويات

- [⚠️ تنبيه مهم](#️-تنبيه-مهم-اقرأ-قبل-المتابعة)
- [📦 ما يحتوي عليه هذا المستودع](#-ما-يحتوي-عليه-هذا-المستودع)
- [🏗️ المعمارية الكاملة](#️-المعمارية-الكاملة)
- [🚀 التثبيت والتشغيل المحلي](#-التثبيت-والتشغيل-المحلي)
- [☁️ النشر على Vercel](#️-النشر-على-vercel)
- [📚 إعداد GitHub](#-إعداد-github)
- [🗄️ إعداد Supabase (للتطبيق المستقبلي)](#️-إعداد-supabase-للتطبيق-المستقبلي)
- [🔐 الأمان والخصوصية](#-الأمان-والخصوصية)
- [🗺️ خارطة الطريق](#️-خارطة-الطريق)
- [📖 التوثيق الإضافي](#-التوثيق-الإضافي)
- [🤝 المساهمة](#-المساهمة)
- [📞 التواصل](#-التواصل)

---

## ⚠️ تنبيه مهم — اقرأ قبل المتابعة

هذا المستودع يحتوي على **الموقع التسويقي الرسمي** فقط (`spirmedical.iq`). 

### ✅ ما هو جاهز للإطلاق الآن:

- 🌐 صفحة الهبوط الرسمية (Landing Page)
- 📖 كتاب التصميم الكامل (Design Playbook) كمرجع
- ⚙️ إعدادات النشر لـ Vercel
- 📚 توثيق شامل للمشروع

### ❌ ما **ليس** جاهزاً (يحتاج تطوير):

- 🔴 **التطبيق نفسه** (`app.spirmedical.iq`) — لم يُبنَ بعد
- 🔴 **لوحة الإدارة** (`admin.spirmedical.iq`) — تصاميم فقط
- 🔴 **تكامل Supabase الفعلي** — مخطط فقط (`supabase/schema.sql`)
- 🔴 **بوابات الدفع** — تحتاج عقود وتكاملات
- 🔴 **خدمة OTP/SMS** — تحتاج شراكة مع مزوّد

### 🎯 الواقع الذي يجب فهمه:

> بناء تطبيق طبي حقيقي يخدم آلاف العملاء يحتاج فريق تطوير محترف + ٣-٦ أشهر عمل + مراجعة قانونية + تدقيق أمني. هذا المستودع يُمثّل **نقطة البداية الصلبة**، لا المنتج النهائي.

---

## 📦 ما يحتوي عليه هذا المستودع

```
spir-medical/
│
├── 📄 index.html                    ← الصفحة الرئيسية (الموقع التسويقي)
├── 📄 README.md                     ← هذا الملف
├── 📄 package.json                  ← معلومات المشروع
├── 📄 vercel.json                   ← إعدادات النشر على Vercel
├── 📄 .gitignore                    ← الملفات المُستبعدة من Git
│
├── 📁 public/                       ← ملفات إضافية
│   └── design-playbook.html         ← كتاب التصميم (مرجع داخلي)
│
├── 📁 docs/                         ← التوثيق التقني
│   ├── DEPLOYMENT.md                ← دليل النشر التفصيلي
│   ├── ROADMAP.md                   ← خارطة الطريق التطويرية
│   ├── ARCHITECTURE.md              ← المعمارية الكاملة
│   └── SECURITY.md                  ← الأمان والخصوصية
│
└── 📁 supabase/                     ← مخطط قاعدة البيانات (للتطبيق المستقبلي)
    └── schema.sql                   ← المخطط الكامل المقترح
```

---

## 🏗️ المعمارية الكاملة

سباير ميديكال يتكوّن من **٣ نطاقات منفصلة** كما خططنا:

```
┌──────────────────────────────────┐
│  🌐 spirmedical.iq               │
│  الموقع التسويقي (هذا المستودع)  │
│  HTML/CSS ساكن على Vercel        │
│  ✅ جاهز                          │
└────────────┬─────────────────────┘
             │
             ▼ زر "ادخل التطبيق"
             │
┌──────────────────────────────────┐
│  📱 app.spirmedical.iq           │
│  التطبيق الفعلي                  │
│  Next.js 14 + Supabase           │
│  ❌ يحتاج تطوير (~٤ أشهر)        │
└────────────┬─────────────────────┘
             │
             ▼ مزامنة البيانات
             │
┌──────────────────────────────────┐
│  👨‍💻 admin.spirmedical.iq         │
│  لوحة الإدارة (CRM)              │
│  Next.js 14 + Supabase           │
│  ❌ يحتاج تطوير (~٢ شهر)         │
└──────────────────────────────────┘

         🗄️ Backend مشترك
         Supabase (Postgres + Auth + Storage)
```

---

## 🚀 التثبيت والتشغيل المحلي

### المتطلبات الأساسية:

- 💻 جهاز يعمل بنظام macOS / Windows / Linux
- 🟢 Node.js نسخة 18 أو أحدث ([تنزيل](https://nodejs.org/))
- 📦 Git ([تنزيل](https://git-scm.com/))

### خطوات التثبيت:

#### 1️⃣ استنسخ المستودع:

```bash
git clone https://github.com/YOUR-USERNAME/spir-medical.git
cd spir-medical
```

#### 2️⃣ افتح الصفحة محلياً (طريقتان):

**الطريقة الأولى — أبسط (بدون Node.js):**

افتح ملف `index.html` مباشرة في المتصفح بضغطة مزدوجة. الموقع سيعمل بالكامل.

**الطريقة الثانية — مع خادم محلي (موصى به):**

```bash
# باستخدام npx (يأتي مع Node.js)
npx serve . -p 3000

# أو باستخدام Python (متوفر افتراضياً على macOS/Linux)
python3 -m http.server 3000

# أو باستخدام PHP
php -S localhost:3000
```

ثم افتح المتصفح على: `http://localhost:3000`

#### 3️⃣ المعاينة:

✅ الصفحة الرئيسية: `http://localhost:3000`
✅ كتاب التصميم: `http://localhost:3000/public/design-playbook.html`

---

## ☁️ النشر على Vercel

Vercel هو الخيار الأمثل لنشر هذا الموقع. **مجاني تماماً للاستخدام الشخصي والمشاريع الصغيرة.**

### 📝 الطريقة الأولى — عبر واجهة Vercel (الأسهل):

1. **سجّل في Vercel:**
   - اذهب إلى [https://vercel.com/signup](https://vercel.com/signup)
   - سجّل باستخدام حساب GitHub

2. **استورد المشروع:**
   - من لوحة Vercel، اضغط **"Add New..."** ← **"Project"**
   - اختر مستودع `spir-medical` من قائمة GitHub
   - اضغط **"Import"**

3. **إعدادات النشر:**
   - **Framework Preset:** Other
   - **Build Command:** اتركه فارغاً
   - **Output Directory:** اتركه فارغاً
   - **Install Command:** اتركه فارغاً
   - اضغط **"Deploy"**

4. **انتظر دقيقة واحدة** — الموقع سيُنشر تلقائياً.

5. **اربط النطاق `spirmedical.iq`:**
   - من إعدادات المشروع، اذهب إلى **"Domains"**
   - أضف `spirmedical.iq`
   - اتبع تعليمات تحديث DNS من مزوّد النطاق

### 💻 الطريقة الثانية — عبر سطر الأوامر:

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر (من داخل مجلد المشروع)
cd spir-medical
vercel

# للنشر على الإنتاج
vercel --prod
```

### 🌐 إعداد DNS بعد النشر:

من لوحة مزوّد النطاق العراقي (مثل [NASOFT](https://nasoft.iq) أو [SCOPESKY](https://scopesky.iq))، أضف:

| النوع | الاسم | القيمة |
|-------|-------|--------|
| `A` | `@` | `76.76.21.21` (IP من Vercel) |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `CNAME` | `app` | `cname.vercel-dns.com` (للتطبيق المستقبلي) |
| `CNAME` | `admin` | `cname.vercel-dns.com` (للوحة الإدارة) |

⏱️ **التحديث يستغرق ٥ دقائق إلى ٢٤ ساعة** حسب مزوّد DNS.

---

## 📚 إعداد GitHub

### 1️⃣ إنشاء المستودع على GitHub:

```bash
# اذهب إلى github.com وأنشئ مستودع جديد باسم: spir-medical
# لا تختار "Initialize with README" - الملف موجود بالفعل
```

### 2️⃣ ربط المستودع المحلي:

```bash
cd spir-medical

# إنشاء مستودع git محلي
git init
git branch -M main

# إضافة كل الملفات
git add .

# أول commit
git commit -m "🚀 Initial commit: Spir Medical landing page"

# ربط مع GitHub (استبدل YOUR-USERNAME باسمك)
git remote add origin https://github.com/YOUR-USERNAME/spir-medical.git

# دفع الملفات
git push -u origin main
```

### 3️⃣ إعدادات الحماية الموصى بها:

من إعدادات المستودع على GitHub:

- ✅ **Branches** ← **Protect main branch** (لا تسمح بـ push مباشر)
- ✅ **Security** ← **Enable Dependabot alerts**
- ✅ **Security** ← **Enable secret scanning**
- ✅ **General** ← **Disable wiki / projects** إذا لم تحتجها

---

## 🗄️ إعداد Supabase (للتطبيق المستقبلي)

> ⚠️ **ملاحظة:** هذا القسم للتحضير. المخطط جاهز لكنه يحتاج تطبيقاً فعلياً.

### المخطط المقترح — `supabase/schema.sql`:

يحتوي على ٢٠+ جدول مصمّم للتطبيق:
- 👥 `users` (المراجعون)
- ⚕️ `specialists` (الأخصائيون)
- 🏥 `services` (الخدمات الـ ١٤)
- 📋 `orders` (الطلبات)
- 💬 `consultations` (الاستشارات)
- 💊 `medications` (تذكير الأدوية)
- 📊 `vitals` (المؤشرات الحيوية)
- 👨‍👩‍👧 `families` (شجرة العائلة)
- 💰 `transactions` (المحفظة)
- 🎫 `tickets` (التذاكر)
- ⭐ `ratings` (التقييمات)
- ... المزيد في `supabase/schema.sql`

### عند الجاهزية لاستخدامه:

1. **سجّل في Supabase:** [https://supabase.com](https://supabase.com)
2. **أنشئ مشروعاً جديداً:**
   - اختر منطقة `Frankfurt` (الأقرب للعراق جغرافياً)
   - اختر باسورد قوي لقاعدة البيانات
3. **شغّل المخطط:**
   - من **SQL Editor** في لوحة Supabase
   - الصق محتوى `supabase/schema.sql`
   - اضغط **Run**
4. **فعّل المصادقة:**
   - **Authentication** ← **Providers**
   - فعّل **Phone** (للـ OTP)
   - اختر مزوّد SMS (Twilio أو MessageBird)
5. **احصل على المفاتيح:**
   - **Settings** ← **API**
   - انسخ `URL` و `anon key` و `service_role key`
   - **⚠️ لا تشارك `service_role key` أبداً!**

📖 توثيق تفصيلي في [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md)

---

## 🔐 الأمان والخصوصية

### للموقع التسويقي (هذا المستودع):

- ✅ **HTTPS إجباري** عبر Vercel
- ✅ **Security Headers** محدّدة في `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)
  - `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ **لا cookies، لا tracking، لا analytics خارجية**
- ✅ **لا JavaScript خارجي** (إلا Google Fonts)

### للتطبيق المستقبلي (مهم جداً):

⚠️ **لا تنشر تطبيقاً طبياً بدون:**

1. 🔒 **تشفير AES-256** للبيانات الحساسة
2. 🔐 **مصادقة قوية** (OTP + JWT + 2FA للأخصائيين)
3. 📋 **سجل تدقيق (Audit Log)** لكل وصول للبيانات الطبية
4. 🛡️ **Row-Level Security** على Supabase
5. 🔄 **نسخ احتياطي يومي** لقاعدة البيانات
6. 🚦 **Rate Limiting** لمنع الهجمات
7. 🔍 **اختبار اختراق احترافي** قبل الإطلاق
8. ⚖️ **مراجعة قانونية** لقوانين البيانات العراقية

📖 تفاصيل أمنية كاملة في [`docs/SECURITY.md`](docs/SECURITY.md)

---

## 🗺️ خارطة الطريق

### ✅ المرحلة ٠ — مكتملة

- [x] هوية بصرية كاملة
- [x] كتاب تصميم شامل (٢٢ شاشة)
- [x] صفحة هبوط احترافية
- [x] بنية مشروع GitHub
- [x] إعدادات Vercel
- [x] مخطط Supabase مقترح

### 🚧 المرحلة ١ — التطبيق الأساسي (٣ أشهر)

- [ ] إعداد Next.js 14 + TypeScript
- [ ] تكامل Supabase Auth (OTP)
- [ ] قاعدة بيانات حقيقية على Supabase
- [ ] واجهات المستخدم الأساسية
- [ ] تكامل بوابة دفع واحدة
- [ ] اختبار محدود (≤ ١٠٠ مستخدم)

### 🔮 المرحلة ٢ — التوسع (٣ أشهر)

- [ ] لوحة إدارة كاملة
- [ ] لوحة أخصائي
- [ ] تكامل SMS عراقي
- [ ] تكامل بوابات دفع متعددة
- [ ] اختبار اختراق
- [ ] إطلاق محدود (~ ١٠٠٠ مستخدم)

### 🌟 المرحلة ٣ — النضج (٣ أشهر)

- [ ] الميزات المتقدمة (تذكير أدوية، مؤشرات، إلخ)
- [ ] تطبيق موبايل native
- [ ] تكاملات مع مستشفيات
- [ ] إطلاق عام

📖 تفاصيل كاملة في [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## 📖 التوثيق الإضافي

| الملف | الوصف |
|-------|-------|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | دليل النشر التفصيلي خطوة بخطوة |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | خارطة الطريق الكاملة بالتفاصيل |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | المعمارية التقنية الشاملة |
| [`docs/SECURITY.md`](docs/SECURITY.md) | اعتبارات الأمان والامتثال |
| [`supabase/schema.sql`](supabase/schema.sql) | مخطط قاعدة البيانات الكامل |
| [`public/design-playbook.html`](public/design-playbook.html) | كتاب التصميم (مرجع داخلي) |

---

## 🤝 المساهمة

هذا مشروع خاص. إذا كنت عضواً في فريق سباير ميديكال:

1. أنشئ branch جديد: `git checkout -b feature/your-feature`
2. اعمل تعديلاتك واختبرها
3. ادفع: `git push origin feature/your-feature`
4. افتح Pull Request للمراجعة

---

## 📞 التواصل

- 🌐 **الموقع:** [spirmedical.iq](https://spirmedical.iq)
- 📧 **البريد:** info@spirmedical.iq
- 📱 **الهاتف:** +964 XXX XXX XXXX
- 📍 **العنوان:** بغداد، العراق

---

## 📜 الترخيص

جميع الحقوق محفوظة © ٢٠٢٦ سباير ميديكال. مشروع خاص — غير مفتوح المصدر.

---

<div align="center">

### بُني بعناية في العراق 🇮🇶

*Designed with care, built for Iraq.*

</div>

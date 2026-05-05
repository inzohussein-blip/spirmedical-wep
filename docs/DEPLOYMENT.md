# 🚀 دليل النشر التفصيلي — Deployment Guide

> دليل عملي خطوة بخطوة لنشر موقع سباير ميديكال من الصفر إلى الإنتاج.

---

## 📋 المتطلبات قبل البدء

| المتطلب | الحالة | كيف تحصل عليه |
|---------|--------|---------------|
| 🟢 Node.js 18+ | إجباري | [nodejs.org](https://nodejs.org) |
| 🐙 حساب GitHub | إجباري | [github.com/signup](https://github.com/signup) |
| ☁️ حساب Vercel | إجباري | [vercel.com/signup](https://vercel.com/signup) — **سجّل بحساب GitHub** |
| 🌐 نطاق spirmedical.iq | اختياري الآن | عبر [NASOFT](https://nasoft.iq) أو [scopesky.iq](https://scopesky.iq) |
| 🗄️ حساب Supabase | للتطبيق المستقبلي | [supabase.com](https://supabase.com) |

---

## 🗂️ المرحلة ١: إعداد المشروع محلياً

### ١.١ تنزيل الملفات

استلمت من المطوّر مجلد `spir-medical/` يحتوي على:

```
spir-medical/
├── index.html              ← الصفحة الرئيسية
├── README.md
├── package.json
├── vercel.json
├── .gitignore
├── public/
│   └── design-playbook.html
├── docs/
│   ├── DEPLOYMENT.md (هذا الملف)
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md
│   └── SECURITY.md
└── supabase/
    └── schema.sql
```

### ١.٢ افتح المجلد في Terminal

**على Windows:**
```cmd
cd C:\Users\YourName\Downloads\spir-medical
```

**على macOS/Linux:**
```bash
cd ~/Downloads/spir-medical
```

### ١.٣ اختبر محلياً

```bash
npx serve . -p 3000
```

افتح: `http://localhost:3000`

✅ يجب أن ترى الموقع يعمل بالكامل.

---

## 🐙 المرحلة ٢: رفع المشروع إلى GitHub

### ٢.١ إنشاء مستودع جديد

1. اذهب إلى [github.com/new](https://github.com/new)
2. **Repository name:** `spir-medical`
3. **Description:** `الموقع الرسمي لسباير ميديكال — منصة طبية رقمية`
4. **Visibility:** اختر **Private** (موصى به)
5. ⚠️ **لا تختار** "Add a README file" (موجود مسبقاً)
6. ⚠️ **لا تختار** "Add .gitignore" (موجود مسبقاً)
7. اضغط **"Create repository"**

### ٢.٢ ربط المشروع المحلي بـ GitHub

من Terminal داخل مجلد المشروع:

```bash
# تهيئة Git
git init
git branch -M main

# إضافة كل الملفات
git add .

# عرض الملفات المُضافة (تأكد فقط)
git status

# أول commit
git commit -m "🚀 Initial commit: Spir Medical landing page v1.0"

# ربط مع المستودع البعيد (استبدل YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/spir-medical.git

# دفع الملفات
git push -u origin main
```

**إذا طلب منك بيانات الدخول:**
- استخدم اسم مستخدم GitHub
- استخدم **Personal Access Token** بدلاً من كلمة المرور
- لإنشاء Token: [github.com/settings/tokens](https://github.com/settings/tokens) ← **Generate new token (classic)** ← اختر صلاحية `repo`

### ٢.٣ التحقق من الرفع

اذهب إلى `https://github.com/YOUR-USERNAME/spir-medical` — يجب أن ترى كل الملفات.

### ٢.٤ إعدادات الحماية (مهمة!)

من **Settings** ← **Branches**:

1. اضغط **"Add rule"**
2. Branch name pattern: `main`
3. ✅ **Require a pull request before merging**
4. ✅ **Require approvals** (1)
5. ✅ **Do not allow bypassing the above settings**

---

## ☁️ المرحلة ٣: النشر على Vercel

### ٣.١ ربط حساب Vercel بـ GitHub

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **"Sign Up"** (أو **"Log In"** إذا كان لديك حساب)
3. اختر **"Continue with GitHub"**
4. اسمح لـ Vercel بالوصول لمستودعاتك

### ٣.٢ استيراد المشروع

1. من لوحة Vercel، اضغط **"Add New..."** ← **"Project"**
2. ابحث عن `spir-medical` واضغط **"Import"**
3. **Configure Project:**
   - **Project Name:** `spir-medical` (يصبح `spir-medical.vercel.app`)
   - **Framework Preset:** **Other**
   - **Root Directory:** `./` (الافتراضي)
   - **Build Command:** _اتركه فارغاً_
   - **Output Directory:** _اتركه فارغاً_
   - **Install Command:** _اتركه فارغاً_
4. ⚙️ **Environment Variables:** لا حاجة لأي شيء حالياً
5. اضغط **"Deploy"**

### ٣.٣ انتظر النشر (~ ٣٠ ثانية)

ستحصل على رابط مثل: `https://spir-medical-xxx.vercel.app`

✅ **اختبر الموقع** — يجب أن يعمل مباشرة!

### ٣.٤ نشر تلقائي (تم تفعيله افتراضياً)

من الآن، **كل push إلى branch `main` سيُنشر تلقائياً.**

اختبر:

```bash
# عدّل أي ملف
echo "<!-- test -->" >> index.html

# ادفع التغييرات
git add .
git commit -m "test deployment"
git push

# انتظر ~ ٣٠ ثانية، الموقع يتحدّث تلقائياً!
```

---

## 🌐 المرحلة ٤: ربط النطاق spirmedical.iq

### ٤.١ شراء النطاق

من مزوّد عراقي:
- [nasoft.iq](https://nasoft.iq) — الأكثر شيوعاً
- [scopesky.iq](https://scopesky.iq)
- [domain.iq](https://www.domain.iq)

كلفة `.iq` تقريباً ٥٠-٧٠ دولار/سنة.

### ٤.٢ إضافة النطاق في Vercel

1. من لوحة المشروع في Vercel: **Settings** ← **Domains**
2. أدخل `spirmedical.iq` واضغط **"Add"**
3. Vercel سيُعطيك تعليمات DNS — احتفظ بها

### ٤.٣ تحديث DNS

من لوحة مزوّد النطاق العراقي، أضف:

**للنطاق الرئيسي (spirmedical.iq):**

| النوع | الاسم | القيمة | TTL |
|-------|-------|--------|-----|
| `A` | `@` | `76.76.21.21` | `Auto` |

**لـ www.spirmedical.iq:**

| النوع | الاسم | القيمة | TTL |
|-------|-------|--------|-----|
| `CNAME` | `www` | `cname.vercel-dns.com` | `Auto` |

**للنطاقات الفرعية (للمستقبل):**

| النوع | الاسم | القيمة | TTL |
|-------|-------|--------|-----|
| `CNAME` | `app` | `cname.vercel-dns.com` | `Auto` |
| `CNAME` | `admin` | `cname.vercel-dns.com` | `Auto` |
| `CNAME` | `blog` | `cname.vercel-dns.com` | `Auto` |

### ٤.٤ التحقق

⏱️ **انتظر ٥ دقائق إلى ٢٤ ساعة** للانتشار العالمي.

تحقق من نجاح DNS:

```bash
# على macOS/Linux
dig spirmedical.iq

# أو
nslookup spirmedical.iq
```

### ٤.٥ تفعيل HTTPS

Vercel يُولّد شهادة SSL تلقائياً عبر **Let's Encrypt** بمجرد نجاح DNS.

✅ بعد الانتشار، الموقع سيعمل على `https://spirmedical.iq`

---

## 🗄️ المرحلة ٥: إعداد Supabase (للتطبيق المستقبلي)

> ⚠️ هذه المرحلة للاستعداد للتطبيق الفعلي. ليست ضرورية لإطلاق الموقع التسويقي.

### ٥.١ إنشاء مشروع Supabase

1. اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
2. سجّل بحساب GitHub
3. اضغط **"New project"**
4. **Project settings:**
   - **Name:** `spir-medical-prod`
   - **Database Password:** **اختر كلمة قوية واحفظها فوراً!** (لن تُعرض مرة أخرى)
   - **Region:** `Frankfurt (eu-central-1)` ← الأقرب للعراق
   - **Pricing Plan:** ابدأ بـ **Free** (يكفي للتطوير)
5. اضغط **"Create new project"**
6. انتظر دقيقتين لتجهيز قاعدة البيانات

### ٥.٢ تطبيق المخطط

1. من لوحة Supabase، افتح **SQL Editor**
2. اضغط **"New query"**
3. افتح ملف `supabase/schema.sql` من المشروع وانسخ محتواه
4. الصقه في SQL Editor واضغط **"Run"** (أو Ctrl+Enter)
5. ✅ يجب أن ترى رسالة `Success. No rows returned`

### ٥.٣ احصل على المفاتيح

من **Settings** ← **API**:

```
Project URL: https://xxxxxxxxxx.supabase.co
anon (public) key: eyJhbGc...
service_role key: eyJhbGc...   ⚠️ سرّي - لا تشاركه!
```

### ٥.٤ احفظ المفاتيح بأمان

⚠️ **لا تضع المفاتيح في كود GitHub أبداً!**

عند بناء التطبيق الفعلي، استخدم:

**في ملف `.env.local` (مُستبعد من git):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...   # على الخادم فقط!
```

**في إعدادات Vercel:**
- **Settings** ← **Environment Variables**
- أضف نفس المتغيرات
- اختر `Production` و `Preview` و `Development` للجميع

---

## 🔧 صيانة وتحديث

### نشر تحديثات

```bash
# اعمل تعديلاتك على index.html أو أي ملف
# ثم:

git add .
git commit -m "📝 وصف التعديل"
git push

# Vercel ينشر تلقائياً خلال ٣٠ ثانية
```

### مراقبة الأداء

من لوحة Vercel:
- **Analytics** — إحصاءات الزوّار (مجاني)
- **Speed Insights** — أداء الصفحة (مجاني)
- **Logs** — سجلات الأخطاء

### النسخ الاحتياطي

GitHub هو نسختك الاحتياطية تلقائياً. لكن للأمان الإضافي:

```bash
# نسخة محلية احتياطية
cd ~
cp -r spir-medical spir-medical-backup-$(date +%Y%m%d)
```

---

## 🆘 حل المشاكل الشائعة

### ❌ المشكلة: `git push` يطلب كلمة مرور ولا يقبلها

**الحل:** GitHub لا يقبل كلمات المرور منذ ٢٠٢١. استخدم **Personal Access Token**:

1. اذهب إلى [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. اختر صلاحية `repo`
4. انسخ الـ token (لن يُعرض مرة أخرى!)
5. استخدمه بدلاً من كلمة المرور

### ❌ المشكلة: Vercel يفشل في النشر

**الحل:** تحقق من سجلات النشر:
- Vercel Dashboard ← Project ← **Deployments** ← اضغط على النشر الفاشل ← **View Build Logs**

عادةً السبب:
- Build Command أو Output Directory محدّد بشكل خاطئ — اتركهما **فارغين**
- ملف `vercel.json` به خطأ في صياغة JSON

### ❌ المشكلة: النطاق يقول "DNS not configured"

**الحل:**
1. تحقق من إعدادات DNS من مزوّد النطاق
2. انتظر ٢٤ ساعة كاملة (DNS propagation عالمياً)
3. تحقق عبر:

   ```bash
   dig spirmedical.iq +short
   # يجب أن يُرجع: 76.76.21.21
   ```

### ❌ المشكلة: الموقع يظهر "404 Not Found"

**الحل:**
- تأكد أن `index.html` في الجذر
- في Vercel Settings، تأكد أن **Output Directory** فارغ

### ❌ المشكلة: الخطوط لا تظهر بشكل صحيح

**الحل:**
- تحقق من الاتصال بالإنترنت (Google Fonts يتطلب اتصالاً)
- إذا تكرر، اعتبر استضافة الخطوط محلياً (راجع `docs/PERFORMANCE.md`)

---

## 📞 الدعم

- 📖 [توثيق Vercel](https://vercel.com/docs)
- 📖 [توثيق Supabase](https://supabase.com/docs)
- 📖 [توثيق GitHub](https://docs.github.com)

---

<div align="center">

**🚀 الإطلاق ليس النهاية، بل البداية.**

</div>

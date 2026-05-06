# 🚢 دليل النشر التفصيلي

> خطوة بخطوة لنشر سباير ميديكال على GitHub + Vercel + Supabase.

---

## 📋 قائمة الفحص قبل البدء

- [ ] حساب GitHub: `inzohussein-blip`
- [ ] حساب Vercel مرتبط بـ GitHub
- [ ] حساب Supabase: مشروع `ioulxemokusfeykjcaxg`
- [ ] Node.js 18+ مثبّت محلياً
- [ ] حساب Twilio (أو مزوّد SMS آخر) للـ OTP

---

## 🗄️ المرحلة ١: إعداد Supabase

### ١.١ افتح المشروع

اذهب إلى:
```
https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg
```

### ١.٢ شغّل المخطط

1. **SQL Editor** (في القائمة الجانبية)
2. **+ New query**
3. افتح `supabase/schema.sql` من المشروع
4. انسخ كل المحتوى → الصق → **Run** (أو `Ctrl+Enter`)
5. ✅ يجب أن ترى `Success. No rows returned`

### ١.٣ تحقق من الجداول

اذهب إلى **Table Editor** — يجب أن ترى:
- ✅ `users`
- ✅ `appointments`
- ✅ `appointments_with_users` (view)

### ١.٤ فعّل Phone Auth

1. **Authentication** → **Providers**
2. اختر **Phone**
3. فعّله وأدخل بيانات Twilio:
   - Account SID
   - Auth Token
   - Message Service SID (أو Phone Number)
4. احفظ

> 💡 **بديل Twilio:** MessageBird, Vonage. كلها تعمل مع Supabase Auth.

### ١.٥ احصل على المفاتيح

**Settings** → **API** — انسخ هذه القيم (احفظها بأمان):

```
Project URL:        https://ioulxemokusfeykjcaxg.supabase.co
anon public key:    eyJxxxxxxxxxxxxxxx...
service_role key:   eyJxxxxxxxxxxxxxxx... (⚠️ سرّي للغاية)
```

---

## 🐙 المرحلة ٢: رفع الكود لـ GitHub

### ٢.١ أنشئ المستودع (إذا لم يكن موجوداً)

```bash
# في GitHub.com → New repository
# الاسم: spirmedical-wep
# Visibility: Private (موصى به)
# لا تختار "Initialize with README"
```

### ٢.٢ ادفع الكود

```bash
cd spirmedical-wep

git init
git branch -M main
git add .
git commit -m "feat: initial MVP scaffold with Next.js + Supabase"

git remote add origin https://github.com/inzohussein-blip/spirmedical-wep.git
git push -u origin main
```

> 💡 إذا طلب credentials: استخدم [Personal Access Token](https://github.com/settings/tokens) (ليس password).

### ٢.٣ تحقق من الرفع

افتح: `https://github.com/inzohussein-blip/spirmedical-wep`

---

## ☁️ المرحلة ٣: النشر على Vercel

### ٣.١ افتح المشروع

```
https://vercel.com/inzohussein-blips-projects/spirmedical-wep
```

إذا لم يكن المشروع موجوداً:
1. **Add New** → **Project**
2. اختر مستودع `spirmedical-wep` من GitHub
3. **Import**

### ٣.٢ أضف Environment Variables

في **Settings** → **Environment Variables**، أضف هذه القيم:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ioulxemokusfeykjcaxg.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxxxx...` (من Supabase) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxxxx...` (من Supabase) | Production, Preview ⚠️ **فعّل "Sensitive"** |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production |

⚠️ **مهم:** فعّل خيار **"Sensitive"** على `SUPABASE_SERVICE_ROLE_KEY` — هذا يخفيه عن السجلات.

### ٣.٣ أعد النشر

بعد إضافة المتغيرات:
1. **Deployments** → اختر آخر deployment
2. الزر **⋯** → **Redeploy**
3. انتظر ٢-٣ دقائق

### ٣.٤ اختبر الـ Production

افتح الرابط الذي أعطاك Vercel (مثل `spirmedical-wep.vercel.app`):
- ✅ الصفحة الرئيسية تظهر
- ✅ زر "ادخل التطبيق" يعمل
- ✅ صفحة `/login` تعمل
- ✅ `/api/health` يُرجع `{"status":"ok"}`

---

## 🌐 المرحلة ٤: ربط النطاق المخصّص (اختياري)

### ٤.١ في Vercel

1. **Settings** → **Domains**
2. أدخل `spirmedical.iq`
3. اضغط **Add**

### ٤.٢ في مزوّد النطاق العراقي

أضف سجلات DNS:

```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

⏱️ الانتشار ٥ دقائق إلى ٢٤ ساعة.

---

## ✅ المرحلة ٥: اختبار النشر

### ٥.١ اختبر التسجيل

1. افتح الموقع المنشور
2. اضغط **"ادخل التطبيق"**
3. أدخل رقم هاتفك العراقي
4. تحقق من وصول OTP عبر SMS
5. أدخل الرمز
6. ✅ يجب أن تصل لـ `/dashboard`

### ٥.٢ اختبر إنشاء حجز

1. من Dashboard، اضغط **"+ حجز جديد"**
2. املأ النموذج
3. احفظ
4. ✅ يجب أن يظهر في القائمة

### ٥.٣ اختبر API

```bash
# Health check (لا يحتاج مصادقة)
curl https://your-domain.vercel.app/api/health

# يجب أن يُرجع:
# {"status":"ok","timestamp":"...","version":"0.1.0"}
```

### ٥.٤ اجعل نفسك أدمن (لاختبار لوحة الإدارة)

في Supabase SQL Editor:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE phone = '+964XXXXXXXXXX';
```

سجّل خروج وادخل من جديد — يجب أن يظهر رابط **"الإدارة"** في القائمة.

---

## 🔄 النشر التلقائي (CI/CD)

من الآن، كل `git push` لـ branch `main` سيُنشر تلقائياً!

```bash
# عدّل أي ملف
echo "<!-- update -->" >> README.md

git add .
git commit -m "docs: update readme"
git push

# Vercel سينشر تلقائياً خلال ٣٠ ثانية
```

كذلك GitHub Actions ستشغّل:
- ✅ Type check
- ✅ Lint
- ✅ Tests
- ✅ Build

---

## 🆘 حل المشاكل

### ❌ "Application error: a client-side exception"

**السبب:** متغيرات البيئة غير صحيحة.

**الحل:** تحقق من Vercel Settings → Environment Variables. أعد النشر.

### ❌ OTP لا يصل

**الأسباب:**
1. مزوّد SMS في Supabase غير مُعدّ → اذهب لـ Auth → Providers
2. رصيد Twilio فارغ → أضف رصيد
3. الرقم في صيغة خاطئة → استخدم `+964XXXXXXXXX`

### ❌ "permission denied for table users"

**السبب:** RLS يمنع الوصول.

**الحل:** تأكد أن المستخدم مُصادَق وأن السياسات في `schema.sql` طُبّقت.

### ❌ "Build failed"

**السبب:** خطأ TypeScript أو متغيرات بيئة مفقودة.

**الحل:**
```bash
npm run type-check
npm run build
```

محلياً أولاً للتأكد. ثم ادفع.

### ❌ النطاق لا يعمل

**الحل:**
```bash
dig spirmedical.iq +short
# يجب أن يُرجع: 76.76.21.21
```

إذا لم يُرجع، تحقق من DNS مزوّد النطاق وانتظر ٢٤ ساعة.

---

## 📊 المراقبة

### Vercel Analytics
- **Project** → **Analytics** (مجاني)
- يعرض: المتصفّحات، البلدان، أداء الصفحات

### Supabase Logs
- **Logs** → **Postgres / API / Auth**
- يعرض: استعلامات بطيئة، أخطاء، محاولات دخول

### Health Check
أضف monitor خارجي على:
```
https://your-domain.vercel.app/api/health
```
(عبر UptimeRobot أو Better Stack — مجاني)

---

## 🎯 ما بعد النشر

1. **اربط Google Search Console** (لـ SEO)
2. **أضف Analytics** (Plausible أو Vercel Analytics)
3. **أنشئ Privacy Policy** (مطلوب قانونياً)
4. **اربط Sentry** (لتتبع الأخطاء)
5. **خطّط للنسخ الاحتياطي** (Supabase Pro له daily backups)

---

<div align="center">

**النشر ليس النهاية — هو نقطة البداية الحقيقية.**

</div>

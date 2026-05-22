# 🚀 دليل النشر على Vercel (V25.35) - مشروعين منفصلين

## 📋 الخطوات الكاملة

### 🌐 الموقع التسويقي (Marketing Site)

**الـ deployment:** `spirmedical-web.vercel.app`

#### في Vercel Dashboard:

1. **اضغط "Add New Project"**
2. **اختر:** نفس الـ GitHub repo (`inzohussein-blip/spirmedical-wep`)
3. **اسم المشروع:** `spirmedical-web`
4. **Framework Preset:** Next.js
5. **Environment Variables (مطلوبة):**

```env
NEXT_PUBLIC_SITE_TYPE=marketing
NEXT_PUBLIC_APP_URL=https://spirmedical-app.vercel.app
NEXT_PUBLIC_MARKETING_URL=https://spirmedical-web.vercel.app
NEXT_PUBLIC_SITE_URL=https://spirmedical-web.vercel.app

# نفس Supabase الموجود
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<من Supabase>
SUPABASE_SERVICE_ROLE_KEY=<من Supabase>

# نفس الكيز الأخرى
ENCRYPTION_KEY=<موجود>
ADMIN_CREATE_KEY=<موجود>
OTP_PEPPER=<موجود>
```

6. **Deploy** ✓

---

### 📱 التطبيق (App Site)

**الـ deployment:** `spirmedical-app.vercel.app`

#### في Vercel Dashboard:

1. **اضغط "Add New Project"** مرة ثانية
2. **اختر:** نفس الـ GitHub repo
3. **اسم المشروع:** `spirmedical-app`
4. **Framework Preset:** Next.js
5. **Environment Variables (مطلوبة):**

```env
NEXT_PUBLIC_SITE_TYPE=app
NEXT_PUBLIC_APP_URL=https://spirmedical-app.vercel.app
NEXT_PUBLIC_MARKETING_URL=https://spirmedical-web.vercel.app
NEXT_PUBLIC_SITE_URL=https://spirmedical-app.vercel.app

# نفس Supabase والكيز
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<من Supabase>
SUPABASE_SERVICE_ROLE_KEY=<من Supabase>
ENCRYPTION_KEY=<موجود>
ADMIN_CREATE_KEY=<موجود>
OTP_PEPPER=<موجود>
```

6. **Deploy** ✓

---

### 🔄 المشروع القديم (spirmedical-wep)

**يمكنك:**

#### الخيار 1: حذفه (أنظف)
- Vercel Dashboard → الـ project القديم → Settings → Delete

#### الخيار 2: تركه كـ `SITE_TYPE=all`
- يكون legacy fallback
- لا تستخدمه في الـ marketing

#### الخيار 3: تحويله لـ marketing
- بدّل ENV → `NEXT_PUBLIC_SITE_TYPE=marketing`
- وفّر deploy واحد بدل اثنين

---

## 🎯 النتيجة بعد النشر

| الـ URL | المحتوى |
|---|---|
| `https://spirmedical-web.vercel.app` | الموقع التسويقي (Landing + About + Blog + FAQ) |
| `https://spirmedical-web.vercel.app/dashboard` | يُحوّل تلقائياً → `spirmedical-app.vercel.app/dashboard` |
| `https://spirmedical-app.vercel.app` | يُحوّل تلقائياً → `spirmedical-app.vercel.app/dashboard` |
| `https://spirmedical-app.vercel.app/about` | يُحوّل تلقائياً → `spirmedical-web.vercel.app/about` |
| `https://spirmedical-app.vercel.app/dashboard` | التطبيق نفسه |

---

## ✅ السيناريوهات بعد الفصل

### 🎬 مستخدم جديد:
1. يفتح `spirmedical-web.vercel.app`
2. يرى Landing page + خدمات + blog
3. يضغط "ابدأ الآن"
4. ينتقل لـ `/gate` (يعمل في الموقع)
5. بعد التسجيل → middleware يُحوّله لـ `spirmedical-app.vercel.app/dashboard`

### 🎬 مستخدم موجود:
1. يفتح `spirmedical-app.vercel.app`
2. ✓ login فوري (cookies مشتركة لو على نفس domain لاحقاً)
3. ينتقل لـ `/dashboard`

### 🎬 PWA Install:
1. يحدث **فقط** على `spirmedical-app.vercel.app`
2. الموقع التسويقي ليس له PWA install (احترافي)

### 🎬 SEO:
1. Google يفهرس `spirmedical-web.vercel.app` فقط
2. الـ app site محمي من crawlers (robots.txt)

---

## 🛠️ عند شراء domain لاحقاً

عند شراء `spirmedical.com`:

1. **في Vercel - مشروع web:**
   - Settings → Domains → Add: `spirmedical.com`
   - تحديث ENV: `NEXT_PUBLIC_SITE_URL=https://spirmedical.com`

2. **في Vercel - مشروع app:**
   - Settings → Domains → Add: `app.spirmedical.com`
   - تحديث ENV:
     ```
     NEXT_PUBLIC_APP_URL=https://app.spirmedical.com
     NEXT_PUBLIC_MARKETING_URL=https://spirmedical.com
     NEXT_PUBLIC_SITE_URL=https://app.spirmedical.com
     ```

3. **في DNS provider:**
   - Type A → `76.76.21.21` (للـ apex domain)
   - CNAME `app` → `cname.vercel-dns.com`

**بدون أي تعديل كود!** ✓

---

## 🔬 اختبار محلي قبل النشر

```bash
# لاختبار marketing
NEXT_PUBLIC_SITE_TYPE=marketing npm run dev

# لاختبار app
NEXT_PUBLIC_SITE_TYPE=app npm run dev

# الوضع العادي (كل شيء)
npm run dev
```

---

## 🎉 ملاحظات مهمّة

✅ **Supabase مشترك** - نفس database للاثنين
✅ **Cookies مشتركة** - عند domain موحّد لاحقاً
✅ **GitHub repo واحد** - تعديل في مكان واحد → deploy للاثنين
✅ **مجاني** على Vercel Free plan
✅ **PWA install** على app domain فقط
✅ **SEO منفصل** - الـ marketing site مفهرس، الـ app محمي

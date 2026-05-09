# 🚀 Spir Medical · Web App · v0.4.0

## ✅ شهادة البناء (Build Certificate)

تم اختبار هذا المشروع كاملاً قبل التغليف:

| الفحص | النتيجة |
|------|---------|
| TypeScript Type Check | ✅ 0 أخطاء |
| ESLint | ✅ 0 تحذيرات |
| Next.js Production Build | ✅ نجح |
| الصفحات المُولّدة | ✅ 32/32 |
| Jest Tests | ✅ 59/59 passed |
| Vercel Compatibility | ✅ متوافق |

```
Route (app)                              Size     First Load JS
┌ ○ /                                    202 B          96.2 kB
├ ƒ /api/appointments                    0 B                0 B
├ ƒ /api/appointments/[id]               0 B                0 B
├ ○ /api/health                          0 B                0 B
├ ƒ /appointments                        202 B          96.2 kB
├ ƒ /appointments/[id]                   5.18 kB         105 kB
├ ƒ /appointments/new                    10.3 kB         110 kB
├ ƒ /dashboard                           202 B          96.2 kB
├ ƒ /forgot                              202 B          96.2 kB
├ ƒ /gate                                204 B          96.2 kB
├ ○ /guest                               3.25 kB        99.3 kB
├ ○ /guest/account                       1.33 kB        97.3 kB
├ ○ /guest/favorites                     866 B          96.9 kB
├ ○ /guest/orders                        667 B          96.7 kB
├ ○ /guest/services/hospitals            1.58 kB        97.6 kB
├ ○ /guest/services/pharmacies           1.42 kB        97.4 kB
├ ○ /guest/sos                           1.29 kB        97.3 kB
├ ○ /guest/tools/first-aid               2.31 kB        98.3 kB
├ ○ /guest/tools/risk-calculator         2.29 kB        98.3 kB
├ ○ /guest/tools/symptom-checker         2.24 kB        98.2 kB
├ ○ /legal/privacy                       202 B          96.2 kB
├ ○ /legal/terms                         202 B          96.2 kB
├ ○ /login                               1.92 kB        97.9 kB
├ ƒ /login/phone                         202 B          96.2 kB
├ ○ /manifest.webmanifest                0 B                0 B
├ ƒ /otp                                 204 B          96.2 kB
├ ƒ /register                            202 B          96.2 kB
├ ○ /register/patient                    3.31 kB         112 kB
├ ○ /register/specialist                 4.27 kB         113 kB
├ ○ /robots.txt                          0 B                0 B
└ ○ /sitemap.xml                         0 B                0 B

ƒ Middleware                             56.8 kB
```

---

## 🛠 التشغيل المحلي

```bash
# 1. التثبيت
npm install

# 2. إعداد المتغيرات البيئية
cp .env.example .env.local
# عدّل .env.local وضع قيم Supabase

# 3. التشغيل
npm run dev
# → http://localhost:3000

# 4. البناء للإنتاج
npm run build
npm start
```

---

## 🔐 المتغيرات البيئية المطلوبة في Vercel

في **Vercel Project Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<من Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY=<من Supabase Dashboard>
ENCRYPTION_KEY=95ab29a877a0f42df526014ecdff459fe07f3d1a0428a73b9d588d4f4ff8776b
NEXT_PUBLIC_SITE_URL=https://spirmedical-wep.vercel.app
```

> ⚠️ **بدون هذه المتغيرات، البناء سيعمل لكن الـ runtime سيفشل.**

---

## 📦 طريقة الرفع لـ GitHub

### الطريقة الأسهل: استبدال كامل عبر CLI

```bash
# 1. استنسخ المستودع
git clone https://github.com/inzohussein-blip/spirmedical-wep.git
cd spirmedical-wep

# 2. احذف القديم (احفظ .git)
find . -mindepth 1 ! -path './.git*' -delete

# 3. فك الـ ZIP الجديد
unzip -j /path/to/spirmedical-wep-FULL.zip
# أو:
cp -r /path/to/extracted/spirmedical-wep/* .
cp -r /path/to/extracted/spirmedical-wep/.* . 2>/dev/null

# 4. ارفع
git add -A
git commit -m "chore: SPIR-V4 complete restructure"
git push origin main
```

### الطريقة الأبسط: GitHub Web UI

1. فك الـ ZIP محلياً
2. GitHub → Add file → **Upload files**
3. اسحب **محتوى مجلد spirmedical-wep** (ليس المجلد نفسه)
4. Commit → Vercel سيبني تلقائياً (~2 دقيقة)

---

## ✨ ما الجديد في v0.4.0

### 🎨 الواجهة
- ✅ AppShell بعرض هاتف ثابت (480px) - يعمل كتطبيق هاتف حتى على الديسكتوب
- ✅ بدون إطار خارجي - يظهر في وسط الشاشة
- ✅ Dark Mode كامل مع toggle و localStorage
- ✅ توحيد layouts بين Guest و Dashboard
- ✅ A11y compliance (skip link, ARIA, keyboard nav)

### 🧹 التنظيف
- ❌ حذف `(admin)/` كاملاً - لوحة CRM ستكون مشروع منفصل
- ❌ حذف **جميع** حسابات الاختبار
- ❌ حذف `BottomNav.tsx` القديم - مدمج في AppShell
- ❌ حذف `loginWithCredentials` و `DIRECT_ACCOUNTS`
- ❌ حذف `TEST_MODE` و `TEST_ACCOUNTS`

### 🔐 الأمان
- ✅ تسجيل الدخول عبر OTP فقط (Supabase Auth)
- ✅ Audit logging
- ✅ RLS على جدول users
- ✅ Encryption للبيانات الحساسة

### 🖼 الأصول
- ✅ Favicons (٧ أحجام)
- ✅ PWA manifest محدّث مع shortcuts
- ✅ Open Graph image

### 🐛 إصلاحات بناء
- ✅ `package.json` أُعيد بناؤه (كان تالفاً في النسخة السابقة)
- ✅ `manifest.ts`: `purpose: 'maskable any'` → `'any'` (TS error)
- ✅ `jest.config.js`: `setupFilesAfterEach` → `setupFilesAfterEnv`
- ✅ `.eslintrc.json`: إزالة `eslint-plugin-security` غير المثبّت
- ✅ `@supabase/supabase-js` مُثبّت بنسخة محددة `2.45.4` لتجنّب breaking changes

---

## 🔍 التحقق بعد الرفع

افتح:
```
https://spirmedical-wep.vercel.app/guest
```

**يجب أن ترى:**
- ✅ على الديسكتوب: تطبيق بعرض 480px في وسط الشاشة
- ✅ على الموبايل: ملء الشاشة
- ✅ Header مع Logo + 🌙 toggle + ☰
- ✅ Bottom Nav بـ 4 عناصر (الرئيسية، الطلبات، المفضلة، حسابي)
- ✅ خلفية فاتحة حول التطبيق

**اختبر Dark Mode:**
- اضغط 🌙 → التطبيق يصبح داكناً
- أعد تحميل الصفحة → القرار محفوظ في localStorage

**اختبر تسجيل الدخول:**
- اذهب لـ `/login`
- ضع رقم هاتف عراقي
- (سيُرسل OTP عبر Supabase - يحتاج SMS provider مفعّل)

---

## ❓ مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| Build failed على Vercel | تأكّد أن المتغيرات البيئية مضافة |
| OTP لا يصل | فعّل Phone Provider في Supabase Dashboard |
| Dark Mode لا يعمل | امسح cache المتصفح (Ctrl+Shift+R) |
| 404 على `/account` أو `/favorites` | هذه الصفحات لم تُبنَ بعد - في الجولة القادمة |
| 404 على `/specialist` | واجهة الأخصائي لم تُبنَ بعد - في الجولة القادمة |

---

## 🎯 الخطوة القادمة

بعد رفع هذا المشروع وتأكيد عمله، نبني:

1. **`/account/*`** للمراجع (تفاصيل الحساب، الإعدادات، الخروج)
2. **`/favorites`** للمراجع (الأطباء، الصيدليات، الفحوصات)
3. **`/specialist/*`** للأخصائيين (٤ نوافذ)
4. **`/sos`** بشكل احترافي
5. **مشروع CRM منفصل** للأدمن

---

**صنع بدقّة لـ Spir Medical · سباير ميديكال 🇮🇶**

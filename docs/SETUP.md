# ⚙️ Setup — الإعداد المحلي

> دليل سريع للبدء بالتطوير محلياً.

---

## ١. المتطلبات

| الأداة | الحد الأدنى | تنزيل |
|--------|--------------|-------|
| Node.js | 18.17+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | يأتي مع Node.js |
| Git | أي إصدار | [git-scm.com](https://git-scm.com) |

تحقق:
```bash
node --version   # v18.17.0 أو أعلى
npm --version    # 9.0.0 أو أعلى
git --version
```

---

## ٢. استنسخ المشروع

```bash
git clone https://github.com/inzohussein-blip/spirmedical-wep.git
cd spirmedical-wep
```

---

## ٣. ثبّت التبعيات

```bash
npm install
```

⏱️ هذا قد يستغرق ١-٢ دقيقة.

---

## ٤. أعدّ Supabase

### ٤.١ افتح المشروع
```
https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg
```

### ٤.٢ شغّل المخطط
1. **SQL Editor** → **New query**
2. الصق محتوى `supabase/schema.sql`
3. **Run**

### ٤.٣ احصل على المفاتيح
**Settings** → **API** — انسخ `URL`, `anon key`, `service_role key`.

### ٤.٤ فعّل Phone Auth
**Authentication** → **Providers** → **Phone** → فعّل وأضف بيانات Twilio.

---

## ٥. متغيرات البيئة

```bash
cp .env.example .env.local
```

عدّل `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<انسخ من Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY=<انسخ من Supabase Dashboard>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **لا ترفع `.env.local` لـ GitHub أبداً!** (موجود في `.gitignore`)

---

## ٦. شغّل الخادم

```bash
npm run dev
```

✅ افتح: [http://localhost:3000](http://localhost:3000)

---

## ✅ قائمة التحقق من الإعداد

- [ ] `node --version` يُرجع ≥ 18.17
- [ ] `npm install` نجح بدون أخطاء
- [ ] `.env.local` موجود بالقيم الصحيحة
- [ ] `npm run dev` يعمل
- [ ] الموقع يفتح على `localhost:3000`
- [ ] صفحة `/login` تفتح
- [ ] `curl localhost:3000/api/health` يُرجع `{"status":"ok"}`
- [ ] OTP يصل (يحتاج Twilio مُعدّ في Supabase)

---

## 🔧 الأوامر الأساسية

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | خادم تطوير (hot reload) |
| `npm run build` | بناء للإنتاج |
| `npm run start` | تشغيل الـ build |
| `npm run lint` | فحص ESLint |
| `npm run type-check` | فحص TypeScript |
| `npm test` | تشغيل الاختبارات |
| `npm run format` | تنسيق الكود |

---

## 🆘 حل مشاكل الإعداد

### ❌ `npm install` يفشل

```bash
# امسح وأعد
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Module not found" بعد `npm install`

تحقق أن `tsconfig.json` يحتوي:
```json
"paths": { "@/*": ["./src/*"] }
```

### ❌ خطأ "Supabase URL is not defined"

تأكد:
1. `.env.local` موجود
2. القيم تبدأ بـ `NEXT_PUBLIC_`
3. أعد تشغيل `npm run dev` بعد تعديل `.env.local`

### ❌ OTP لا يصل محلياً

السبب الأكثر شيوعاً: مزوّد SMS غير مُعدّ في Supabase.

الحل:
1. **Authentication** → **Providers** → **Phone**
2. أضف بيانات Twilio (أو مزوّد آخر)
3. تأكد أن رصيدك كافٍ

---

## 📁 ما بعد الإعداد

اقرأ:
- [`README.md`](../README.md) — نظرة عامة
- [`docs/API.md`](API.md) — توثيق الـ API
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) — النشر للإنتاج

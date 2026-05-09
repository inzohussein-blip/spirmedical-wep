# Spir Medical · سباير ميديكال

> منصة طبية رقمية متكاملة في العراق · Web App بعرض هاتف ثابت

## 🏗️ البنية

التطبيق يتكون من ٣ واجهات في wep-app:

1. **واجهة الضيف** (`/guest/*`) - تصفح فقط بدون تسجيل
2. **واجهة المراجع** (`/dashboard`, `/appointments`, `/account`, `/favorites`) - بعد تسجيل الدخول
3. **واجهة الأخصائي** (`/specialist/*`) - للأطباء/الممرضين/المحللين

> ⚠️ **لوحة الإدارة (CRM/Dashboard)** ليست جزءاً من هذا المشروع - مشروع منفصل تماماً.

## 🎨 التصميم

- **عرض ثابت 480px** على كل الشاشات (شكل تطبيق هاتف)
- **بدون إطار خارجي** - يظهر في وسط الشاشة على الديسكتوب
- **ألوان**: emerald `#0E5C4D` + paper `#F4EFE2` + amber `#B8540C` + rose `#A82E3D`
- **خطوط**: Tajawal (عربي) + Fraunces Italic + JetBrains Mono + Inter
- **Dark Mode** كامل
- **RTL** أصلي

## 🚀 التشغيل

```bash
# تثبيت
npm install

# تطوير
npm run dev

# بناء
npm run build

# اختبارات
npm test
```

## 🔐 المتغيرات البيئية

انسخ `.env.example` إلى `.env.local` وضع القيم:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ioulxemokusfeykjcaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ENCRYPTION_KEY=...
```

## 📂 الهيكل

```
src/
├── app/
│   ├── (auth)/          # تسجيل دخول/إنشاء حساب
│   ├── (dashboard)/     # واجهة المراجع
│   ├── api/             # API routes
│   ├── guest/           # واجهة الضيف
│   ├── legal/           # شروط/خصوصية
│   ├── globals.css      # CSS عام (light + dark mode)
│   ├── layout.tsx       # Root layout
│   ├── manifest.ts      # PWA manifest
│   └── page.tsx         # الصفحة الرئيسية
│
├── components/
│   ├── app/             # LockedAction, إلخ
│   ├── appointments/    # AppointmentWizard, AppointmentTimeline
│   ├── layout/          # AppShell (الحاوية الرئيسية)
│   ├── legal/           # CookieConsent
│   └── ui/              # Button, Card, Input
│
└── lib/
    ├── audit.ts
    ├── encryption.ts
    ├── i18n/
    ├── permissions/
    ├── rate-limit.ts
    ├── services/
    ├── supabase/
    └── validations/
```

## 🔑 تسجيل الدخول

يستخدم Supabase Auth مع OTP عبر الهاتف (SMS). لا توجد حسابات اختبار.

## 📜 الترخيص

جميع الحقوق محفوظة © ٢٠٢٦ Spir Medical

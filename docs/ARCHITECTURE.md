# 🏗️ المعمارية التقنية · Architecture

> الرؤية الكاملة لمعمارية سباير ميديكال — الموجود حالياً والمستقبلي.

---

## 📐 المعمارية الكلية (Big Picture)

```
┌────────────────────────────────────────────────────────────────┐
│                       المستخدم النهائي                           │
│           (موبايل / ديسكتوب / تابلت — ٣ لغات)                    │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                      🌐 Cloudflare CDN                          │
│              (تخزين مؤقت + حماية DDoS)                           │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────────────────┐    ┌─────────────────────┐            │
│   │  spirmedical.iq     │    │  app.spirmedical.iq │            │
│   │  (موقع تسويقي)       │    │  (التطبيق الفعلي)    │            │
│   │                     │    │                     │            │
│   │  HTML/CSS ساكن       │    │  Next.js 14         │            │
│   │  Vercel             │    │  Vercel             │            │
│   │  ✅ موجود حالياً       │    │  ❌ يحتاج بناء       │            │
│   └─────────────────────┘    └──────────┬──────────┘            │
│                                          │                       │
│                              ┌───────────┴───────────┐           │
│                              │                       │           │
│                              ▼                       ▼           │
│                   ┌─────────────────────┐  ┌──────────────────┐ │
│                   │  admin.spirmedical  │  │ specialist subapp│ │
│                   │  (لوحة الإدارة)      │  │  (لوحة الأخصائي) │ │
│                   │  Next.js 14         │  │  Next.js 14      │ │
│                   │  ❌ يحتاج بناء        │  │  ❌ يحتاج بناء    │ │
│                   └──────────┬──────────┘  └─────────┬────────┘ │
│                              │                       │           │
└──────────────────────────────┼───────────────────────┼──────────┘
                               │                       │
                               ▼                       ▼
┌────────────────────────────────────────────────────────────────┐
│                      🗄️ Supabase                                │
│        (Backend-as-a-Service — قاعدة البيانات + المصادقة)         │
│                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│   │  PostgreSQL  │ │     Auth     │ │   Storage    │           │
│   │  (٢٠+ جدول)   │ │  OTP + JWT   │ │  ملفات طبية   │           │
│   └──────────────┘ └──────────────┘ └──────────────┘           │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│   │  Realtime    │ │  Edge Funcs  │ │     RLS      │           │
│   │  (محادثات)    │ │  (Webhooks)  │ │   (الأمان)    │           │
│   └──────────────┘ └──────────────┘ └──────────────┘           │
└────────────┬─────────────────────┬─────────────────────────────┘
             │                     │
             ▼                     ▼
┌────────────────────┐    ┌────────────────────────┐
│   مزوّدو خدمات      │    │   مزوّدو دفع           │
│                    │    │                        │
│  📱 SMS / OTP      │    │  💳 زين كاش            │
│  📧 SendGrid       │    │  💳 آسيا حوالة         │
│  🔔 FCM / OneSignal│    │  💳 Visa / Mastercard │
│  🗺️  Google Maps   │    │  🏦 بنوك شريكة          │
└────────────────────┘    └────────────────────────┘
```

---

## 🟢 ما هو موجود ويعمل الآن

### ✅ الموقع التسويقي (`spirmedical.iq`)

**التقنيات:**
- HTML5 ساكن (لا backend)
- CSS3 (متغيرات + Grid + Flexbox)
- JavaScript خفيف (~ ٢٠ سطر للـ scroll و القائمة)
- Google Fonts (Tajawal, Fraunces)

**الاستضافة:**
- Vercel (CDN عالمي + HTTPS تلقائي)
- 100% uptime SLA
- نشر تلقائي من GitHub

**الأداء:**
- First Contentful Paint: < 1s
- Time to Interactive: < 1.5s
- Total Page Size: ~ 250 KB
- Lighthouse Score: 95+ متوقع

**الأمان:**
- HTTPS إجباري
- Security Headers (CSP, HSTS, X-Frame-Options)
- لا cookies، لا tracking، لا analytics خارجية

---

## 🔵 ما يحتاج بناءً (التطبيق الفعلي)

### 📱 `app.spirmedical.iq` — التطبيق الرئيسي

**Stack موصى به:**

```
Frontend:
├── Next.js 14 (App Router)
├── TypeScript 5+
├── Tailwind CSS 3+
├── shadcn/ui (مكونات)
├── React Hook Form (نماذج)
├── Zod (التحقق)
├── TanStack Query (state + caching)
└── Framer Motion (حركات)

Backend (عبر Supabase):
├── PostgreSQL 15
├── Supabase Auth (OTP + JWT)
├── Supabase Storage (ملفات طبية)
├── Row-Level Security (الأمان)
├── Realtime (محادثات حية)
└── Edge Functions (webhooks)

أدوات تطوير:
├── ESLint + Prettier
├── Husky (pre-commit hooks)
├── GitHub Actions (CI/CD)
├── Sentry (error tracking)
└── Vercel Analytics
```

**هيكل المشروع المقترح:**

```
app.spirmedical.iq/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # مجموعة المصادقة
│   │   ├── login/
│   │   ├── signup/
│   │   └── otp/
│   ├── (main)/                   # المجموعة الرئيسية
│   │   ├── home/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── chat/
│   │   ├── records/
│   │   └── profile/
│   ├── (specialist)/             # واجهة الأخصائي
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── chat/
│   │   └── earnings/
│   └── api/                      # API routes (إن لزم)
│       ├── webhooks/
│       └── revalidate/
├── components/
│   ├── ui/                       # shadcn components
│   ├── shared/                   # مكونات مشتركة
│   ├── patient/                  # مكونات المراجع
│   └── specialist/               # مكونات الأخصائي
├── lib/
│   ├── supabase/                 # Supabase client
│   ├── utils/
│   ├── validations/
│   └── i18n/                     # ترجمات (ar, en, ku)
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── styles/                       # Global CSS
├── public/                       # Static assets
└── middleware.ts                 # Auth middleware
```

---

## 🗄️ معمارية البيانات

### تنظيم Supabase:

```
PostgreSQL Schema:
│
├── 🔐 Auth Tables (Supabase managed)
│   ├── auth.users
│   └── auth.sessions
│
├── 👥 People & Identity
│   ├── public.users (مرتبط بـ auth.users)
│   ├── public.specialists
│   ├── public.family_members
│   └── public.specialist_documents
│
├── 🏥 Services & Orders
│   ├── public.services
│   ├── public.lab_tests
│   ├── public.orders
│   ├── public.order_items
│   └── public.consultations
│
├── 💬 Communication
│   ├── public.messages
│   ├── public.notifications
│   └── public.quick_reply_templates
│
├── 🩺 Medical Data (sensitive)
│   ├── public.medical_records
│   ├── public.prescriptions
│   ├── public.medications
│   ├── public.medication_doses
│   └── public.vitals
│
├── 💰 Financial
│   ├── public.wallet_transactions
│   ├── public.specialist_earnings
│   ├── public.specialist_withdrawals
│   └── public.promotions
│
├── ⭐ Engagement
│   └── public.ratings
│
├── 🎫 Operations
│   ├── public.tickets
│   ├── public.ticket_messages
│   └── public.translations
│
└── 📋 Compliance
    └── public.audit_logs
```

📖 **التفاصيل الكاملة في:** [`supabase/schema.sql`](../supabase/schema.sql)

---

## 🔄 تدفق البيانات (Data Flow)

### مثال: حجز فحص مختبري

```
١. المراجع يفتح التطبيق
   ↓ (HTTPS)
٢. Next.js يقرأ session من Supabase Auth
   ↓
٣. التطبيق يعرض الخدمات (cached للأداء)
   ↓ (المراجع يختار)
٤. تأكيد الموقع والوقت + الدفع
   ↓
٥. Next.js → Supabase: INSERT INTO orders
   ↓ (RLS يتحقق من الصلاحية)
٦. Supabase trigger: INSERT INTO notifications
   ↓
٧. Edge Function: تنبيه أقرب مختبري متاح
   ↓ (SMS via Twilio)
٨. المختبري يقبل عبر التطبيق
   ↓
٩. Realtime subscription: تحديث حالة الطلب فوراً
   ↓
١٠. عند الانتهاء: تحديث order.status = 'completed'
   ↓
١١. Webhook: إرسال نتائج للمراجع + طلب تقييم
```

---

## 🌐 تدفق الترجمة (i18n)

```
المستخدم يختار اللغة
       │
       ▼
حفظ في users.preferred_language
       │
       ▼
Next.js middleware يقرأ اللغة
       │
       ▼
يحمّل ملف الترجمة المناسب:
- /lib/i18n/ar.json (افتراضي)
- /lib/i18n/en.json
- /lib/i18n/ku.json
       │
       ▼
استخدام عبر useTranslation() hook
       │
       ▼
العرض بالاتجاه المناسب:
- ar / ku → dir="rtl"
- en → dir="ltr"
```

**ملاحظة على الكردية:** السوراني (سۆرانی) يُكتب من اليمين لليسار، والكرمانجي (Kurmancî) من اليسار لليمين. التطبيق يحتاج دعم كلاهما.

---

## 🔐 معمارية الأمان

### طبقات الحماية:

```
١. CDN Layer (Cloudflare)
   - DDoS Protection
   - Bot Mitigation
   - Rate Limiting

٢. Edge Layer (Vercel)
   - HTTPS enforcement
   - Security Headers (CSP, HSTS)
   - Geographic restrictions (إن لزم)

٣. Application Layer (Next.js)
   - Input Validation (Zod)
   - CSRF Protection
   - XSS Prevention (sanitization)
   - Authentication Middleware

٤. Database Layer (Supabase)
   - Row-Level Security (RLS)
   - Prepared Statements
   - Connection Pooling
   - Encrypted at rest (AES-256)

٥. Sensitive Data
   - Medical records: extra encryption
   - Financial data: PCI-DSS compliance
   - Audit logs: immutable
```

📖 **التفاصيل في:** [`docs/SECURITY.md`](SECURITY.md)

---

## 📊 معمارية الأداء

### استراتيجيات الأداء:

```
١. Static Generation (SSG):
   - الصفحات العامة (الموقع، عن، الخدمات)
   - حجوزات بـ revalidate

٢. Server Components:
   - بيانات أولية مع SSR
   - تقليل JavaScript المرسل

٣. Client Components (محدود):
   - فقط للتفاعل (نماذج، شات)
   - Suspense boundaries

٤. التخزين المؤقت:
   - TanStack Query للبيانات
   - Service Worker للأصول
   - Vercel Edge Cache للصفحات

٥. تحسينات الصور:
   - next/image (auto WebP)
   - Lazy loading
   - Blur placeholders

٦. تقسيم الكود:
   - Dynamic imports للميزات الكبيرة
   - Route-based splitting
```

### الأهداف:
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s (موبايل)
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1

---

## 📡 معمارية الإشعارات

```
حدث مهم (طلب جديد، رسالة، تذكير دواء)
       │
       ▼
Supabase Database Trigger
       │
       ▼
INSERT INTO notifications
       │
       ▼
Realtime subscription يطلق:
       │
   ┌───┴────┬────────┐
   ▼        ▼        ▼
 In-App   Push     SMS
       (FCM)    (Twilio)
       │        │       │
       ▼        ▼       ▼
    التطبيق   موبايل   رقم
    مفتوح    خلفية    مغلق
```

### قواعد الإشعارات:
- **عاجل** (طوارئ، تأكيد طلب): SMS + Push + In-app
- **مهم** (تذكير دواء، رد طبيب): Push + In-app
- **عادي** (عروض، تحديثات): In-app فقط

---

## 🔄 معمارية النشر (CI/CD)

```
المطوّر → git push → GitHub
                       │
                       ▼
              GitHub Actions:
              - Lint
              - Type check
              - Tests
              - Build
                       │
                       ├─ Pass ✅
                       │     ▼
                       │  Vercel Deploy
                       │  (Preview / Production)
                       │     │
                       │     ▼
                       │  Smoke Tests
                       │     │
                       │     ▼
                       │  Notify Team
                       │
                       └─ Fail ❌
                             ▼
                       Block merge
                       Notify dev
```

---

## 🌍 معمارية المناطق الجغرافية

### استضافة الخوادم:

| الخدمة | المنطقة | المسافة من العراق |
|--------|---------|-------------------|
| Vercel Edge | عالمي | < 50ms (PoP في Frankfurt) |
| Supabase | Frankfurt | ~ 100ms |
| Cloudflare | عالمي | < 30ms |
| SMS Provider | محلي عراقي | < 20ms |

### استراتيجية التوزيع:
- **Static assets:** Cloudflare (أقرب نقطة للمستخدم)
- **API responses:** Vercel Edge (Frankfurt + caching)
- **Database queries:** Supabase Frankfurt (~ 100ms)
- **SMS/Phone:** مزوّد عراقي محلي

---

## 📈 الـ Scaling Strategy

### المرحلة ١ (≤ ١،٠٠٠ مستخدم):
- Vercel Hobby + Supabase Free
- تكلفة: ~ $٢٠/شهر

### المرحلة ٢ (١،٠٠٠ - ١٠،٠٠٠):
- Vercel Pro + Supabase Pro
- Connection pooling مفعّل
- Read replicas للاستعلامات الثقيلة
- تكلفة: ~ $٢٠٠-٥٠٠/شهر

### المرحلة ٣ (١٠،٠٠٠ - ١٠٠،٠٠٠):
- Vercel Enterprise + Supabase Team
- Database sharding مدروس
- Redis للـ session cache
- CDN للملفات الطبية
- تكلفة: ~ $٢،٠٠٠-٥،٠٠٠/شهر

### المرحلة ٤ (١٠٠،٠٠٠+):
- Multi-region deployment
- Microservices للأجزاء الحرجة
- Dedicated infrastructure
- تكلفة: $١٠،٠٠٠+/شهر

---

<div align="center">

**هذا التوثيق هو مرجع للمستقبل، لا للحاضر.**

</div>

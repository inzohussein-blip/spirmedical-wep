# 🌿 Spir Medical — سباير ميديكال

> منصّة طبّية رقمية عربية (RTL) للعراق: سحبُ دمٍ وتمريضٌ منزليّ، حجوزاتٌ لدى
> الأطبّاء والمستشفيات والصيدليات، بوّابةٌ للمختصّين، ولوحةُ إدارة.

هذا الملفّ **خريطةُ المشروع**: أين كلُّ ميزة، وأيُّ ملفٍّ يفعل ماذا، وكيف تمرّ
الطلبات من المتصفّح إلى قاعدة البيانات. ملاحظاتُ العمل والقرارات المعلّقة في
[`CLAUDE.md`](CLAUDE.md).

---

## 🔗 روابط

| الخدمة | الرابط |
|---|---|
| 🌐 الموقع | [spir-medical.com](https://spir-medical.com) |
| 🔧 لوحة الإدارة | [spir-medical.com/admin](https://spir-medical.com/admin) |
| 🗄️ Supabase | [project ioulxemokusfeykjcaxg](https://supabase.com/dashboard/project/ioulxemokusfeykjcaxg) |
| 📊 Vercel | [spirmedical-wep](https://vercel.com/inzohussein-blip/spirmedical-wep) |
| 🐛 Sentry | [inzohussein-blip-ip](https://inzohussein-blip-ip.sentry.io/issues/?project=4511479851843664) |
| 📱 Meta WhatsApp | [app 978497158399226](https://developers.facebook.com/apps/978497158399226) |
| 💻 GitHub | [inzohussein-blip/spirmedical-wep](https://github.com/inzohussein-blip/spirmedical-wep) |

---

## 🏗️ التقنيات

| التقنية | الإصدار | الدور |
|---|---|---|
| Next.js (App Router) | 14.2.35 | الإطار: صفحات خادم + Server Actions |
| React | 18.3 | الواجهة |
| TypeScript | 5.5 | اللغة |
| Supabase (`@supabase/ssr` 0.5.2، `supabase-js` 2.45.4) | — | Postgres + Auth + RLS + Realtime + Storage |
| Tailwind CSS + ملفّات CSS يدوية + `styled-jsx` | 3.4 | التنسيق |
| MapLibre GL | 5 | الخرائط (بلا PostGIS) |
| Upstash Redis | — | تحديد المعدّل (rate limit) |
| Meta WhatsApp Cloud API | v21.0 | الرموز والإشعارات |
| Web Push (VAPID) | — | إشعارات المتصفّح |
| Resend | — | البريد |
| Sentry | 10 | مراقبة الأخطاء (نفق `/monitoring-tunnel`) |
| PostHog / Vercel Analytics | — | التحليلات (بموافقة الكوكيز) |
| Jest + Testing Library | — | الاختبارات |

---

## 🚀 البدء السريع

```bash
npm install
cp .env.example .env.local   # ثمّ املأ القيم — انظر «متغيّرات البيئة»
npm run dev                   # http://localhost:3000

npx jest                      # كلّ الاختبارات (يجب أن تمرّ قبل الدفع)
npx tsc --noEmit              # الأنواع
npm run lint                  # ESLint (next/core-web-vitals)
npm run build                 # البناء — ضروريٌّ حين تمسّ ملفّات 'use server'
```

> `tsc` و`jest` لا يعرفان قاعدة `'use server'` (لا يُصدَّر منها إلّا دوالُّ
> async)؛ `next build` وحده يكشفها. يحتاج البناء قيماً نائبة تُرضي
> `src/lib/env.ts` (رابط Supabase ومفاتيحه و`ENCRYPTION_KEY` بطول 64).

---

## 🧭 كيف يمرّ الطلب

```
المتصفّح
  │
  ▼
src/middleware.ts ──► lib/site-config.ts   (NEXT_PUBLIC_SITE_TYPE: app | marketing | all)
  │                    يحوّل بين نطاق التسويق ونطاق التطبيق
  ▼
lib/supabase/middleware.ts                  (تجديد جلسة Supabase في الكوكيز)
  │
  ▼
app/<group>/layout.tsx ──► lib/auth/session.ts → requireSession({ allowedRoles })
  │                         يقرأ users.role و approval_status ويحوّل حسب الدور
  ▼
page.tsx (خادم) ──► lib/supabase/server.ts   (عميلٌ بجلسة المستخدم — تحت RLS)
  │
  ▼
*Client.tsx (متصفّح) ──► actions.ts ('use server')
                           ├─ lib/supabase/server.ts        (RLS)
                           └─ lib/supabase/server-service.ts (service_role — يتخطّى RLS لا GRANT)
```

**الأدوار** (`users.role`): `patient` · `specialist` · `admin` · `super_admin`.
والمختصّ غيرُ المعتمَد (`approval_status ≠ approved`) يُحوَّل إلى
`/specialist/pending` أو `/specialist/rejected`.

---

## 📁 شجرة المجلّدات

```
spirmedical-wep/
├── src/
│   ├── middleware.ts            توجيه النطاق + تجديد الجلسة
│   ├── instrumentation*.ts      تهيئة Sentry (خادم/متصفّح)
│   ├── app/                     الصفحات (App Router) — انظر «المسارات»
│   │   ├── layout.tsx           الجذر: الخطوط، metadata، CookieConsent، DeferredGlobals
│   │   ├── page.tsx             الصفحة الرئيسية التسويقية
│   │   ├── styles/              shared.css · app.css · marketing.css · admin.css
│   │   ├── sitemap.ts · robots.ts
│   │   └── (auth) (dashboard) (specialist) (marketing) (app-utility)
│   │       admin/ admin-login/ admin-register/ guest/ onboarding/ offline/ auth/ api/
│   ├── components/              مكوّناتٌ مشتركة حسب الميزة (انظر الجدول أدناه)
│   ├── lib/                     المنطق: auth, supabase, whatsapp, services, validations …
│   └── types/database.ts        أنواع Supabase المولَّدة — npm run db:types
├── supabase/
│   ├── migrations/              0001 → 0045 (انظر «قاعدة البيانات»)
│   └── *.sql                    أدوات فحصٍ يدويّة (verify, health-check)
├── tests/                       64 ملفاً — حرّاسٌ ساكنة وسلوكية
├── public/                      sw.js · manifest.json · llms.txt · ai.txt · أيقونات
├── docs/                        API · SETUP · RUNBOOK · DESIGN_TOKENS …
├── vercel.json                  رؤوس، تحويلات، ومهامّ الكرون
└── CLAUDE.md                    ملاحظاتُ العمل والقرارات
```

---

## 🗺️ المسارات حسب المجموعة

| المجموعة | المسار | الدور | التخطيط/الحماية |
|---|---|---|---|
| `(marketing)` | `/about` `/faq` `/contact` `/blog/*` `/legal/*` `/home-blood-draw` `/feedback` `/help/install` `/data-deletion` | عامّ | `(marketing)/layout.tsx` |
| الجذر | `/` | عامّ | `app/page.tsx` + `components/landing/*` |
| `(auth)` | `/login` (`/phone` `/email`) `/register` (`/patient` `/specialist` `/email`) `/otp` `/forgot` `/gate` | زائر | `(auth)/layout.tsx` |
| `auth/` | `/auth/callback` `/auth/reset-password` `/auth/verify-email` | — | معالجاتُ Supabase |
| `guest/` | `/guest` + خدمات وأدوات للزائر (مستشفيات، صيدليات، طوارئ، إسعافات) | زائر | `guest/layout.tsx` |
| `(dashboard)` | `/dashboard` `/appointments/*` `/services/*` `/account/*` `/messages/*` `/consultations/*` `/tools/*` `/search` `/sos` | `patient` | `requireSession` + `AuthenticatedShell` |
| `(specialist)` | `/specialist` `/specialist/orders/*` `/inbox/*` `/chats` `/schedule` `/stats` `/account/*` `/pharmacy` | `specialist` معتمَد | بوّابة `approval_status` في `(specialist)/layout.tsx` |
| `admin/` | 39 صفحة: طلبات، مرضى، مختصّون، منشآت، تقارير، إعدادات… | `admin` / `super_admin` | `admin/layout.tsx` → `/admin-login` |
| `(app-utility)` | `/changelog` `/status` `/share-target` | — | أدوات PWA |
| `onboarding/` `offline/` | جولة التعريف، صفحة عدم الاتّصال | — | — |

---

## 🧩 خريطة الميزات — أين كلُّ شيء

### 🩸 رفعُ الطلبات (المريض)

| الميزة | الملفّات |
|---|---|
| صفحة الطلب | `app/(dashboard)/appointments/new/page.tsx` → `NewAppointmentClient.tsx` (يختار التدفّق من `?service=`) |
| سحب الدم + التحاليل | `components/appointments/BloodDrawFlow.tsx` · بيانات التحاليل `lib/services/blood-tests-data.ts` · المختبرات `lib/services/labs-data.ts` · التحقّق `lib/validations/blood-draw.ts` |
| التمريض المنزلي (6 خطوات) | `components/appointments/NursingFlow.tsx` · `lib/validations/nursing.ts` |
| الحجز العامّ (4 خطوات) | `components/appointments/AppointmentWizard.tsx` · الخدمات `lib/services/services-data.ts` · المواعيد `lib/services/time-slots.ts` |
| إنشاء الطلب في الخادم | `app/(dashboard)/appointments/new/actions.ts` → `createBloodDrawOrder` · `createNursingAppointment` · `createAppointmentV2` (مع `withIdempotency` و rate limit) |
| الحقول الناقصة | `components/forms/MissingFieldsSummary.tsx` (`compact` للأشرطة الثابتة) · `lib/forms/useFormErrors.ts` |
| اختيار فرد العائلة | `components/family/FamilyMemberPicker.tsx` |
| اختيار الموقع على الخريطة | `components/maps/UserLocationPicker*.tsx` · `lib/maps/*` |
| تغطية الخدمة جغرافياً | `lib/service-areas.ts` (اختبار الشعاع بلا PostGIS) · `lib/hooks/useServiceCoverage.ts` |
| تفاصيل/تتبّع/إلغاء/تقييم الطلب | `app/(dashboard)/appointments/[id]/*` · `components/appointments/AppointmentActions.tsx` · `AppointmentTimeline.tsx` |
| بطاقة حالة الطلب في الرئيسية | `components/dashboard/LiveStatusCard.tsx` · `ActiveAppointmentCard.tsx` |

> لا رمزَ تحقّق (OTP) في رفع الطلب — قرار المالك.
> صفحة الطلب «مهمّةٌ مُركَّزة»: بلا شريط تنقّل سفليّ ولا نوافذ منبثقة (`lib/focused-routes.ts`).

### 🩺 بوّابة المختصّ

| الميزة | الملفّات |
|---|---|
| الرئيسية والإحصاءات | `app/(specialist)/specialist/page.tsx` · `/stats` |
| طابور الطلبات | `app/(specialist)/specialist/orders/page.tsx` |
| تفاصيل الطلب وأفعاله | `orders/[id]/page.tsx` · `OrderActionsBar.tsx` · `actions.ts` → `acceptOrder` `startOrder` `completeOrder` `saveLabResults` … |
| نماذجُ حسب نوع المختصّ | `orders/[id]/role-forms/*` (نتائج مختبر، وصفة، ملاحظات جلسة، خطّة غذاء…) |
| أنواع المختصّين | `lib/specialist-types.ts` |
| صندوق الرسائل والقوالب | `specialist/inbox/*` · `specialist/chats` |
| الدوام | `specialist/schedule/ScheduleClient.tsx` |
| الاعتماد | `lib/auth/approval.ts` · صفحتا `/pending` و`/rejected` |

### 🏥 الخدمات والدليل الطبّي

| الخدمة | الصفحات | ملاحظات |
|---|---|---|
| شبكة الخدمات في الرئيسية | `components/dashboard-v3/BentoServicesGridV3.tsx` | الإعداد في `lib/services-v3.ts` |
| تشغيل/إطفاء الخدمات | `lib/service-switches.ts` (+`.server.ts`) · `admin/services` | المطفأة تبقى ظاهرةً بشارة «قريباً» |
| الأطبّاء | `services/doctors/*` · `components/doctors/DoctorBookingModal.tsx` | |
| المستشفيات | `services/hospitals/*` · `components/hospitals/HospitalBookingModal.tsx` | |
| الصيدليات والحجز | `services/pharmacies/*` · `components/pharmacies/PharmacyReservationModal.tsx` · `account/pharmacy-reservations` | |
| الأسنان، البصريات، الصحّة النفسية، التغذية، اللقاحات، التجميل | `services/<name>/*` | |
| العلاج الطبيعي | `services/physio/*` | **الحجز «قريباً»** (`bookingSoon` في `services-v3.ts`) والصفحات مفتوحة للتصفّح |
| أرقام هواتف المنشآت | `components/ui/PhoneLink.tsx` · `lib/format/phone.ts` | الرقمُ المُقنَّع («0770 xxx xxxx») زرٌّ معطّل |

### 👤 حساب المريض

| الميزة | المسار |
|---|---|
| الملفّ والتعديل | `account` · `account/edit` |
| العائلة | `account/family` |
| الأدوية والتذكيرات | `account/medications` · `account/reminders` |
| الوصفات والسجلّ الطبّي | `account/prescriptions` · `account/medical-record` |
| نتائج المختبر ومنحنياتها | `account/lab-history/*` · `account/lab-trends` · `account/vitals-trends` · `account/health` |
| المواقع المحفوظة | `account/locations` |
| الإشعارات وإعداداتها | `account/notifications/*` |
| الأمان (PIN) | `account/settings/PinSection.tsx` · `components/security/PinGate.tsx` · `PinLockScreen.tsx` |
| واتساب OTP | `account/whatsapp-otp` · `components/settings/WhatsAppOtpSettings.tsx` |
| المفضّلة، المكافآت، الاشتراك، المحفظة | `account/favorites` · `account/rewards` · `account/subscription` · `tools/wallet` |

### 🔐 الدخول والتسجيل

| الميزة | الملفّات |
|---|---|
| الجلسة والأدوار | `lib/auth/session.ts` (`requireSession`) · `lib/auth/home-path.ts` |
| الدخول بالهاتف + OTP | `app/(auth)/login/actions.ts` (`sendOtp` `verifyOtp` `resendOtp` `signOut`) · `lib/auth/otp-mode.ts` (`NEXT_PUBLIC_OTP_MODE`) |
| رموز واتساب | `lib/whatsapp/otp-service.ts` (توليد + bcrypt + حدّ محاولات) · `lib/whatsapp/meta-client.ts` |
| البريد وتأكيده | `lib/auth/email-auth.ts` · `lib/email/*` (Resend) |
| التسجيل | `app/(auth)/register/actions.ts` (`registerPatient` `registerSpecialist`) |
| إعادة التوجيه الآمنة | `lib/auth/safe-redirect.ts` |
| دخول الإدارة | `app/admin-login` · `app/admin-register` (`ADMIN_CREATE_KEY`) |

### 📨 الإشعارات

| القناة | الملفّات |
|---|---|
| الطابور (whatsapp + push) | `lib/notifications.ts` (`enqueueNotification` …) → جدول `notification_queue` |
| المعالج الوحيد للطابور | `lib/notifications-processor.ts` عبر كرون `/api/notifications/process` |
| Web Push | `lib/services/push.ts` · `lib/services/push-templates.ts` · `api/push/*` · `lib/push-client.ts` · `public/sw.js` |
| واتساب مباشر | `lib/services/whatsapp.ts` · `api/whatsapp/webhook` |
| داخل التطبيق | `components/notifications/NotificationToast.tsx` (Realtime) · `PushPermissionPrompt.tsx` |

> `sms` غير مُنفَّذة. و`cancelled` في الطابور تعني «لن يُسلَّم ولا عطب» (بلا اشتراك دفع).

### 💬 المحادثات والاستشارات

`app/(dashboard)/messages/*` · `components/chat/ChatList.tsx` · `ChatWindow.tsx` ·
`lib/chat/open-chat.ts` · `app/(dashboard)/consultations/*`.

### 🆘 الطوارئ والأدوات

`/sos` و`/guest/sos` (أرقام الطوارئ، `122` للإسعاف) · `/tools/first-aid` ·
`/tools/risk-calculator` · `/tools/symptom-checker` · `/tools/vaccinations` ·
`api/nurse/emergency` · `admin/emergencies`.

### 🎛️ لوحة الإدارة (`app/admin/*`)

| القسم | المسار |
|---|---|
| الطلبات والطوارئ | `admin/orders/*` · `admin/emergencies/*` |
| المستخدمون والمختصّون | `admin/patients/*` · `admin/specialists/*` (+`pending`) · `admin/users/create` · `admin/admins/*` |
| المنشآت | `admin/hospitals` `doctors` `pharmacies` `labs` `dental` `optical` `mental-health` `nutrition` `physio` `cosmetic` `medications` `nurses` |
| التغطية والخدمات | `admin/service-areas` · `admin/services` (مفاتيح التشغيل) · `admin/locations` |
| التقارير | `admin/reports/*` (جغرافي، خريطة حرارية، عمليات حيّة) · `admin/analytics` |
| التسويق | `admin/campaigns` · `admin/coupons` · `admin/beta-codes` · `admin/stories` |
| الإعدادات | `admin/settings` (منها الرفض التلقائيّ للطلبات المعلّقة) · `admin/settings/theme` |
| السجلّات | `admin/audit-log` · `admin/bugs` · `admin/feedback` · `admin/notifications` |
| البيانات الأوّلية | `admin/seed-data` · `api/admin/seed` · `lib/seed/*` (بيانات تطوير — الهواتف مُقنَّعة) |
| قائمة الإطلاق | `admin/launch-checklist` |

### 📱 PWA والتطبيق

| الميزة | الملفّات |
|---|---|
| الغلاف والتنقّل | `components/layout/AppShell.tsx` (الشريط السفليّ، الشريط الجانبيّ للحاسوب) · `AuthenticatedShell.tsx` |
| Service Worker والتحديث | `public/sw.js` · `components/pwa/ServiceWorkerRegistrar.tsx` · `components/ui/SWUpdateBanner.tsx` |
| التثبيت | `components/pwa/SmartInstallPrompt.tsx` · `IOSInstallPrompt.tsx` · `InstallAppButton.tsx` |
| عناصر عامّة مؤجَّلة | `components/pwa/DeferredGlobals.tsx` |
| جولة التعريف | `components/onboarding/*` · `app/onboarding` |
| الكوكيز والموافقة | `components/legal/CookieConsent.tsx` |

### 🔎 الفهرسة (SEO)

| الملفّ | الدور |
|---|---|
| `app/layout.tsx` | metadata الجذر — **بلا `alternates`**؛ كلُّ صفحةٍ تُعلن canonical نفسها |
| `components/seo/JsonLd.tsx` | بيانات منظَّمة تُرسم في الخادم (تراها زواحف الذكاء الاصطناعي) |
| `components/seo/StructuredData.tsx` | Organization + WebSite |
| `lib/seo/coverage.ts` | **المصدر الوحيد** للمدن المخدومة (`SERVED_CITIES`) |
| `app/sitemap.ts` · `app/robots.ts` · `public/llms.txt` · `public/ai.txt` | الفهرسة |
| `lib/site-config.ts` | أنواع النطاق (`app` / `marketing` / `all`) |

---

## 🎨 الواجهة والتنسيق

| الملفّ/المكوّن | الدور |
|---|---|
| `app/styles/shared.css` | الرموز (`--emerald` …)، مكوّناتٌ مشتركة، حارسُ iOS (حقول ≥16px على الهاتف)، `ModalShell` (`.ms-*`) |
| `app/styles/app.css` | شاشات التطبيق (`.scr-*`، `.app-bottom-nav`، بطاقات المختصّ) |
| `app/styles/marketing.css` · `admin.css` | التسويق · الإدارة |
| `components/ui/*` | `Button` `Input` `Field` `Card` `Badge` `Avatar` `Skeleton` `EmptyState` `Toaster` `StatusBadge` `FloatingActionButton` |
| نوافذ منبثقة | `components/ui/ModalShell.tsx` (ورقة سفليّة على الهاتف) · `BottomSheet.tsx` · `ConfirmDialog.tsx` · السلوك في `lib/hooks/useModalDialog.ts` |
| روابط الهاتف | `components/ui/PhoneLink.tsx` |
| التصميم | `docs/DESIGN_TOKENS.md` · `docs/design-system.md` · `docs/UI_PRIMITIVES.md` |

**قواعد مَقيسة:** لا نصَّ دون 12px، ولا زرَّ أيقونةٍ بلا `aria-label`، وأصنافُ
`styled-jsx` لا تحمي من أصنافٍ عامّةٍ بالاسم نفسه (لذلك أصنافُ المعالج بالبادئة `aw-`).

---

## 🗄️ قاعدة البيانات

- **Supabase** — المشروع `ioulxemokusfeykjcaxg`.
- `src/types/database.ts` فيه 90 جدولاً، ولم يُعَد توليده منذ جداول أحدث
  (`service_areas` 0030، `app_settings` 0042) — شغّل `npm run db:types` بعد أيّ ترحيل.
- **الترحيلات** في `supabase/migrations/0001…0045`.
  - `0001–0010` ليست في سجلّ Supabase (أُنشئت الجداول بطريقةٍ أخرى): **كلُّ إصلاحٍ ترحيلٌ جديد**، لا تعديلٌ لملفٍّ قديم.
  - مخطَّط `private` للدوالّ المُفوَّضة (`SECURITY DEFINER`)، وكلُّ دالّةٍ تُعلن `SET search_path = public, pg_temp`.
  - PostGIS مُسقَط عمداً (0025)؛ مناطق الخدمة `jsonb` + اختبار الشعاع (0030).

| الجدول | الدور |
|---|---|
| `users` | كلُّ الحسابات والأدوار و`approval_status` |
| `appointments` | الطلبات/المواعيد (الحالة: pending → confirmed → on_the_way → in_service → completed / cancelled) |
| `lab_orders` · `lab_results` | طلبات المختبر ونتائجها |
| `family_members` | أفراد العائلة |
| `notification_queue` · `notification_templates` · `notifications` | الإشعارات |
| `push_subscriptions` | اشتراكات Web Push |
| `whatsapp_otp` · `email_verification_tokens` | الرموز |
| `chats` · `messages` · `consultations` | المحادثات والاستشارات |
| `hospitals` `doctors` `pharmacies` `partner_labs` `dental_clinics` `optical_stores` … | الدليل الطبّي |
| `service_switches` · `service_areas` · `app_settings` | الإعدادات والتغطية |
| `audit_logs` | سجلّ التدقيق (لا يُعدَّل ولا يُحذف) — `lib/audit.ts` |

أحدثُ الترحيلات:

| # | ما يفعل |
|---|---|
| 0037–0040 | إغلاق ثغرات RLS (WITH CHECK، مُشغِّلات للأذرع بـOR، رموز البريد) |
| 0041 | منحُ `service_role` صلاحياتِه (يتخطّى RLS لا GRANT) |
| 0042 | الرفض التلقائيّ للطلبات المعلّقة (المدّة في `app_settings`) |
| 0043 | تثبيت `search_path` لدوالّ `private` |
| 0044 | فهرسٌ لمفتاحٍ أجنبيّ في `app_settings` |
| 0045 | إخفاء أرقام المنشآت المُختلَقة («0770 xxx xxxx»)، و`122` باقٍ |

```bash
npm run db:link     # ربط المشروع
npm run db:push     # دفع الترحيلات
npm run db:types    # توليد src/types/database.ts
```

---

## 🔌 واجهات API والكرون

| المسار | الدور |
|---|---|
| `/api/health` · `/api/monitoring/health` | فحص الصحّة |
| `/api/appointments` · `/api/appointments/[id]` | المواعيد |
| `/api/consultations/my-records` · `/api/family/*` | بيانات المريض |
| `/api/push/*` | اشتراك/إلغاء/مفتاح VAPID/اختبار |
| `/api/whatsapp/otp/*` · `/api/whatsapp/webhook` · `/api/whatsapp/settings/toggle-otp` | واتساب |
| `/api/nurse/emergency` | طوارئ التمريض |
| `/api/analytics/track` · `/api/og` | التحليلات · صور المشاركة |
| `/api/admin/*` | أفعال الإدارة (إنشاء مستخدم، بذور، طوارئ) |

**مهامّ الكرون** (`vercel.json`، محميّةٌ بـ`CRON_SECRET`، التوقيت UTC):

| الوقت | المسار | الدور |
|---|---|---|
| 05:00 | `/api/cron/auto-reject-pending` | رفضُ الطلبات المعلّقة القديمة + إخطار المريض في المعاملة نفسها |
| 06:00 | `/api/cron/nursing-recurring` | مواعيد التمريض المتكرّرة |
| 07:00 | `/api/cron/reminders` | تذكيرات المستخدم (دواء، موعد، فحص، لقاح) عبر الطابور |
| 08:00 | `/api/cron/appointment-reminders` | تذكيرات المواعيد |
| 09:00 | `/api/notifications/process` | معالجة طابور الإشعارات |

---

## 🧪 الاختبارات (`tests/` — 64 ملفاً)

العُرف: **كلُّ إصلاحٍ يُقرَن بحارس، ويُثبَت الحارسُ بكسر ما يحرسه** ثمّ إرجاعه.

| المجال | الحرّاس |
|---|---|
| الأمان وRLS | `rls-coverage` `rls-initplan` `rls-shared-row-participants` `rls-update-scope` `rpc-authorization` `security` `phi-policy-scope` `email-verification-tokens` `safe-redirect` |
| قاعدة البيانات | `schema-conformance` `insert-column-contracts` `enum-values` `auto-reject-stale` `seed-data-honesty` |
| الإشعارات | `notification-push-channel` `notification-toast` `whatsapp` |
| رفع الطلب والنوافذ | `order-flow-modals` `physio-booking-soon` `order-visibility` `order-clinical-details` `checkout` `validations` |
| الهاتف وواجهة المستخدم | `mobile-ux` `mobile-layout` `app-screens-ux` `specialist-screens` `facility-phones` `color-tokens` `font-weights` |
| البناء والفهرسة | `use-server-exports` `seo-canonical` `route-links` `wired-features` `env-coverage` `landing-routing` |

---

## ⚙️ متغيّرات البيئة

> الأسماء فقط — لا تضع القيم في المستودع. المرجع: `src/lib/env.ts`.

| المجموعة | المتغيّرات |
|---|---|
| **أساسية** | `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` `ENCRYPTION_KEY` |
| النطاق | `NEXT_PUBLIC_SITE_TYPE` (`all` افتراضياً — **لا تجعلها `app` على النطاق العامّ**) `NEXT_PUBLIC_SITE_URL` `NEXT_PUBLIC_APP_URL` `NEXT_PUBLIC_MARKETING_URL` |
| واتساب (Meta) | `META_PHONE_NUMBER_ID` `META_ACCESS_TOKEN` `META_APP_SECRET` `META_WEBHOOK_VERIFY_TOKEN` `META_API_VERSION` `WHATSAPP_PROVIDER` |
| المصادقة | `NEXT_PUBLIC_OTP_MODE` (`disabled`/`optional`/`required`) `ALLOW_PASSWORDLESS_LOGIN` `AUTH_PASSWORD_SECRET` `ADMIN_CREATE_KEY` `ADMIN_OWNER_EMAIL` `ADMIN_ALLOWED_EMAILS` |
| Web Push | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` `VAPID_PRIVATE_KEY` `VAPID_SUBJECT` |
| البريد | `RESEND_API_KEY` `RESEND_FROM_EMAIL` |
| تحديد المعدّل | `UPSTASH_REDIS_REST_URL` `UPSTASH_REDIS_REST_TOKEN` |
| الكرون | `CRON_SECRET` |
| المراقبة | `NEXT_PUBLIC_SENTRY_DSN` `SENTRY_AUTH_TOKEN` `SENTRY_ORG` `SENTRY_PROJECT` `LOG_LEVEL` |
| التحليلات | `NEXT_PUBLIC_POSTHOG_KEY` `NEXT_PUBLIC_POSTHOG_HOST` |
| أعلام الميزات | `NEXT_PUBLIC_ENABLE_FAMILY_ACCOUNTS` `NEXT_PUBLIC_ENABLE_SPECIALIST_CHAT` `NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS` `NEXT_PUBLIC_ENABLE_TELEGRAM_OTP` |
| Twilio (بديلٌ اختياري) | `TWILIO_ACCOUNT_SID` `TWILIO_AUTH_TOKEN` `TWILIO_WHATSAPP_FROM` |

---

## 🚢 النشر

- Vercel (المنطقة `fra1`)، البناء `next build`، والكرون من `vercel.json`.
- الترحيلات تُطبَّق على Supabase منفصلةً — **وكلُّ كتابةٍ على الإنتاج تُجرَّب أوّلاً في `BEGIN … ROLLBACK`**.
- `docs/DEPLOYMENT.md` · `docs/PRODUCTION_CHECKLIST.md` · `docs/RUNBOOK.md`.

---

## 🔑 ما ينتظر قرار المالك

القائمة الحيّة في [`CLAUDE.md`](CLAUDE.md) (قسم «معلّقٌ على المالك وحده»)، ومنها:
حمايةُ كلمات المرور المسرَّبة في Supabase، ودمجُ سياسات RLS المتراكبة، وأرقامُ
الصفحة الرئيسية المكتوبة في الكود، وإدخالُ أرقام المنشآت الموثَّقة، والتحقّقُ في
Google Search Console.

---

## 📞 التواصل

- **المالك:** حسين · **البريد:** inzohussein@gmail.com · **الهاتف/واتساب:** 07803993585
- **الموقع:** النجف، العراق · **النطاق:** spir-medical.com

> 🌿 **سباير ميديكال** — بُني بعناية في النجف 🇮🇶

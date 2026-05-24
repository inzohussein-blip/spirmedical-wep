# 🩺 سباير ميديكال V3 · مرجع نظام التصميم

> **هذا المستند هو المرجع الرسمي لتصميم تطبيق Spir Medical V3** — منصة طبية رقمية في العراق تركّز على سحب الدم المنزلي والتحاليل المختبرية. استخدم هذا المستند كمصدر وحيد للحقيقة عند بناء أو تعديل أي واجهة في المشروع.

**النسخة:** v3.0.0 · **التاريخ:** مايو 2026 · **المنصة:** Next.js 14 + TypeScript + Supabase + Tailwind

---

## 📑 الفهرس

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [المبادئ التصميمية](#2-المبادئ-التصميمية)
3. [لوحة الألوان](#3-لوحة-الألوان)
4. [الطباعة والخطوط](#4-الطباعة-والخطوط)
5. [المسافات والحواف](#5-المسافات-والحواف)
6. [الأيقونات](#6-الأيقونات)
7. [الشاشة الرئيسية (Dashboard)](#7-الشاشة-الرئيسية-dashboard)
8. [المكونات الأساسية](#8-المكونات-الأساسية)
9. [Bottom Navigation](#9-bottom-navigation)
10. [نظام الستوريز الإعلاني](#10-نظام-الستوريز-الإعلاني)
11. [الصور واللوغو والأفاتارات](#11-الصور-واللوغو-والأفاتارات)
12. [الـ 14 خدمة الطبية](#12-الـ-14-خدمة-الطبية)
13. [Design Tokens (CSS Variables)](#13-design-tokens-css-variables)
14. [قواعد بيانات أساسية](#14-قواعد-بيانات-أساسية)
15. [خارطة التنفيذ](#15-خارطة-التنفيذ)

---

## 1. نظرة عامة على المشروع

| العنصر | التفاصيل |
|--------|----------|
| **الاسم** | سباير ميديكال (Spir Medical) |
| **النطاق** | العراق (النجف · بغداد · كربلاء · البصرة) |
| **التركيز الأساسي** | سحب الدم المنزلي + التحاليل المختبرية (~90% من العمل) |
| **النطاق الفرعي** | 13 خدمة طبية أخرى (تمريض · صيدلية · استشارات · إلخ) |
| **اللغة** | العربية أولاً (RTL) + دعم EN لاحقاً |
| **العملة** | الدولار الأمريكي |
| **الستاك التقني** | Next.js 14.2 · TypeScript · Supabase · Tailwind CSS · Vercel |
| **الجمهور** | المستخدم العراقي العادي (موبايل أولاً، 100% mobile-first) |

### 🎯 4 واجهات في المشروع

1. **Patient Dashboard** (الأولوية الأولى) - تطبيق المريض
2. **Admin Panel** (الأولوية الثانية) - لوحة إدارة سباير
3. **Marketing Site** (الأولوية الثالثة) - الموقع التسويقي
4. **Specialist Portal** (الأولوية الرابعة) - بوابة الأخصائيين

---

## 2. المبادئ التصميمية

| المبدأ | التطبيق |
|--------|---------|
| 🎯 **وضوح أولاً** | كل عنصر له سبب · لا زخارف بدون وظيفة |
| 📱 **موبايل أولاً** | عرض ثابت 480px · على الديسكتوب يظهر في المنتصف |
| 🩺 **ثقة طبية** | ألوان هادئة · خطوط واضحة · لا مبالغة بصرية |
| 🇮🇶 **سياق عراقي** | اللهجة العراقية · أسعار $ · توقيت بغداد |
| ⚡ **سرعة فورية** | تحميل أقل من 2 ثانية · skeleton loaders · PWA |
| ♿ **وصول كامل** | WCAG AA · تباين مرتفع · 44px touch targets |
| 🚫 **لا emojis في الواجهة** | Tabler Icons حصرياً · emojis في النصوص التحفيزية فقط |
| 🌓 **Light Only** | لا Dark Mode في V3 (يضاف لاحقاً) |

---

## 3. لوحة الألوان

### 🎨 ألوان البراند (Google Play Palette)

نستخدم الألوان الرسمية لمتجر Google Play لإعطاء إحساس مألوف وموثوق.

#### Brand Colors (الأساسية)

| اللون | HEX | الاستخدام |
|------|-----|-----------|
| 🟢 **Spanish Green** | `#01875F` | اللون الأساسي · CTAs · Active states · Hero |
| 🟢 **Deep Green** | `#056559` | Hover · Pressed · Gradients |
| 🟢 **Soft Green** | `#E6F3EF` | خلفيات الأيقونات · الأفاتار · البطاقات الناعمة |
| 🟡 **Cyber Yellow** | `#FBBC04` | Badges "الأكثر طلباً" · Accents |
| 🟡 **Yellow Soft** | `#FEF7E0` | خلفيات الـ Badges الصفراء |
| 🟡 **Yellow Deep** | `#B06000` | نصوص على خلفية صفراء |
| 🔴 **Carmine Pink** | `#C71C56` | Badges "جديد" · Notification dots · Errors |
| 🌸 **Pink Soft** | `#FCE8E6` | خلفيات تنبيهات الطوارئ |
| 🌸 **Pink Deep** | `#8B1240` | نصوص على خلفية وردية |
| 🔵 **Google Blue** | `#1A73E8` | الروابط · المعلومات · المستشفيات |
| 🔵 **Blue Soft** | `#E8F0FE` | خلفيات Info |
| 🟣 **Purple** | `#9334E6` | الصيدلية |
| 🟣 **Purple Soft** | `#F3E8FD` | خلفيات الصيدلية |

#### Neutral Colors (الحيادية)

| اللون | HEX | الاستخدام |
|------|-----|-----------|
| ⬜ **Background** | `#FFFFFF` | خلفية التطبيق الأساسية |
| 🔘 **Surface** | `#F8F9FA` | البطاقات الثانوية · الأقسام |
| 🔘 **Surface 2** | `#F1F3F4` | خلفية البحث · الـ inputs الناعمة |
| 🔘 **Border** | `#DADCE0` | حدود البطاقات والأزرار |
| 🔘 **Border Soft** | `#E8EAED` | فواصل ناعمة |
| 🔘 **Text 4** | `#80868B` | Placeholders · Disabled |
| 🔘 **Text 3** | `#5F6368` | Captions · Secondary info |
| 🔘 **Text 2** | `#3C4043` | Body secondary |
| ⬛ **Text Primary** | `#202124` | النصوص الأساسية |

#### Service Colors (14 لون لكل خدمة)

| الخدمة | اللون | HEX | خلفية ناعمة |
|--------|------|-----|-------------|
| 🩸 سحب الدم | أحمر | `#EA4335` | `#FCE8E6` |
| 💉 التمريض | أصفر داكن | `#B06000` | `#FEF7E0` |
| 🩺 طبيب العائلة | أخضر | `#01875F` | `#E6F3EF` |
| 🏥 المستشفيات | أزرق | `#1A73E8` | `#E8F0FE` |
| 💊 الصيدلية | بنفسجي | `#9334E6` | `#F3E8FD` |
| 💬 الاستشارات | سماوي | `#00BCD4` | `#E0F7FA` |
| 🦷 الأسنان | تركواز | `#00838F` | `#E0F7FA` |
| 🍎 التغذية | أخضر فاتح | `#34A853` | `#E8F5E9` |
| 💉 اللقاحات | برتقالي | `#FF6D00` | `#FFF3E0` |
| 🚨 الطوارئ SOS | أحمر داكن | `#8B0000` | `#FCE8E6` |
| 📹 فيديو | بنفسجي | `#7C4DFF` | `#EDE7F6` |
| 🔍 الأعراض | تيل | `#00897B` | `#E0F2F1` |
| 📊 المخاطر | برتقالي | `#FF7043` | `#FBE9E7` |
| 📅 جدول اللقاحات | أزرق-أخضر | `#26A69A` | `#E0F2F1` |

---

## 4. الطباعة والخطوط

### 🔤 الخطوط

| الخط | الاستخدام |
|------|-----------|
| **Tajawal** (400/500/700/900) | كل النصوص العربية والإنجليزية |
| **JetBrains Mono** (400/500) | الأكواد · الأسعار · الأرقام الفنية |

```html
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 📏 سلم الأحجام

| المستوى | الحجم | الـ Weight | line-height | letter-spacing |
|---------|------|-----------|-------------|----------------|
| **Display** | 56px | 900 | 1.1 | -1.5px |
| **H1** | 36px | 900 | 1.15 | -0.8px |
| **H2** | 28px | 700 | 1.2 | -0.4px |
| **H3** | 20px | 700 | 1.3 | 0 |
| **Body Large** | 17px | 400 | 1.6 | 0 |
| **Body** | 15px | 400 | 1.6 | 0 |
| **Small** | 13px | 400 | 1.5 | 0 |
| **Caption** | 11px | 500 | 1.4 | 0 |
| **Mono** | 13px | 400 | 1.5 | 0 |

---

## 5. المسافات والحواف

### 📐 نظام المسافات (مبني على 4px)

| المتغير | القيمة | الاستخدام |
|---------|-------|-----------|
| `--space-1` | 4px | فجوات صغيرة جداً |
| `--space-2` | 8px | المسافة الأساسية · padding بطاقات صغيرة |
| `--space-3` | 12px | بين العناصر داخل البطاقات |
| `--space-4` | 16px | padding البطاقات · حواف الشاشة |
| `--space-5` | 20px | بين الأقسام · padding الـ Hero |
| `--space-6` | 24px | بين المكونات الكبيرة |
| `--space-8` | 32px | بين الأقسام الرئيسية |
| `--space-12` | 48px | بين أقسام الصفحة الكبيرة |

### 🔘 الحواف المنحنية

| المتغير | القيمة | الاستخدام |
|---------|-------|-----------|
| `--radius-sm` | 6px | Badges الصغيرة · Tags |
| `--radius-md` | 10px | Inputs · أزرار صغيرة |
| `--radius-lg` | 14px | البطاقات (Bento) · الإشعارات |
| `--radius-xl` | 18px | الستوريز · البطاقات الكبيرة |
| `--radius-2xl` | 20px | Hero Card · البطاقات المميزة |
| `--radius-3xl` | 28px | الأزرار الرئيسية (Pills) · CTAs |
| `--radius-full` | 9999px | الأفاتار · النقاط · Pills |

### 📱 تخطيط الشاشة

| العنصر | المواصفات |
|--------|-----------|
| **App Shell** | عرض ثابت `480px` · على الديسكتوب يظهر في المنتصف |
| **Edge Padding** | `16px` من اليمين واليسار · ثابت في كل الصفحات |
| **Hero Card** | هامش `6px` من الحواف · padding داخلي `16px` · radius `20px` |
| **Search Bar** | ارتفاع `44px` · padding `12px` · خلفية `#F1F3F4` |
| **Story Item** | `64×64px` · radius `18px` · gradient ring 2.5px |
| **Bento Card** | عمودين `1fr 1fr` · gap `8px` · padding داخلي `14px` |
| **Bottom Nav** | ارتفاع `60px` · 5 أيقونات `26px` · padding سفلي `16px` (safe area) |

---

## 6. الأيقونات

### 📚 المكتبة الرسمية: Tabler Icons

- **المصدر:** [tabler.io/icons](https://tabler.io/icons)
- **العدد المتاح:** 5800+ أيقونة
- **الترخيص:** MIT (مجاني وتجاري)
- **الـ stroke-width:** `2` (أو `1.75` للأحجام الكبيرة)
- **viewBox:** `0 0 24 24`

### 🚫 قواعد صارمة

1. ❌ **لا emojis في الواجهة** (في الأزرار · البطاقات · القوائم)
2. ✅ emojis مسموحة فقط في النصوص التحفيزية (مثل: "مرحباً 👋")
3. ✅ **Tabler Icons فقط** - لا Font Awesome ولا Material Icons
4. ✅ كل أيقونة لها لون موحّد عبر التطبيق

### 📦 طرق الاستخدام في Next.js

#### الطريقة الموصى بها: @tabler/icons-react

```bash
npm install @tabler/icons-react
```

```tsx
import { IconDroplet, IconStethoscope } from '@tabler/icons-react';

<IconDroplet size={24} color="#EA4335" stroke={2} />
<IconStethoscope size={28} color="#01875F" stroke={1.75} />
```

### 🎨 5 أنماط لعرض الأيقونات

| النمط | الاستخدام |
|------|-----------|
| **Plain** | بدون خلفية · للقوائم والـ Bottom Nav |
| **Soft Square** | مربع بخلفية ناعمة · لبطاقات الـ Dashboard |
| **Soft Circle** | دائرة بخلفية ناعمة · للأفاتارات |
| **Solid** | مربع ملوّن بأيقونة بيضاء · للبطاقات المميزة |
| **Gradient** | تدرّج لوني · للـ Hero Cards و Splash |

### 📋 الأيقونات الأساسية المُستخدمة

| الاستخدام | اسم Tabler |
|-----------|------------|
| الرئيسية | `IconHome` |
| الخدمات | `IconLayoutGrid` |
| طلباتي | `IconClipboardList` |
| الرسائل | `IconMessageCircle` |
| حسابي | `IconUser` |
| بحث | `IconSearch` |
| إشعارات | `IconBell` |
| إعدادات | `IconSettings` |
| سحب دم | `IconDroplet` |
| إبرة/لقاح | `IconVaccine` |
| طبيب | `IconStethoscope` |
| مستشفى | `IconBuildingHospital` |
| صيدلية | `IconPill` |
| استشارة | `IconMessage2` |
| طوارئ | `IconAlertTriangle` |
| ميكروفون | `IconMicrophone` |

---

## 7. الشاشة الرئيسية (Dashboard)

### 🦸 1. Hero Card (الترحيب)

```html
<div style="
  background: #01875F;
  margin: 6px;
  border-radius: 20px;
  padding: 16px;
  position: relative;
  overflow: hidden;
">
  <!-- شخصية الترحيب -->
  <div class="hero-row">
    <div class="avatar">ح</div>        <!-- 40px circle -->
    <div class="greeting">مرحباً حسين</div>
    <div class="bell-badge">🔔 + dot</div>
  </div>

  <!-- Stats Pills -->
  <div class="stats-row">
    <div class="stat-pill">🧪 5 فحوصات</div>
    <div class="stat-pill">💊 0 وصفة</div>
  </div>
</div>
```

**المواصفات:**
- خلفية: `#01875F`
- Border radius: `20px`
- Padding: `16px`
- يحتوي على decorative circles بـ `rgba(255,255,255,0.05)`
- Avatar: 40×40px · دائري · لون أخضر فاتح
- Stats pills: شفافة بـ `rgba(255,255,255,0.12)`

### 🔍 2. Search Bar

```html
<div style="
  margin: 0 14px 14px;
  background: #F1F3F4;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
">
  <IconSearch size={16} color="#5F6368" />
  <span>ابحث عن خدمة، طبيب، أو فحص...</span>
  <IconMicrophone size={16} color="#01875F" />
</div>
```

### 📦 3. Stories Row

شريط أفقي قابل للتمرير · يديره الأدمن للإعلانات.

**المواصفات:**
- حجم العنصر: `64×64px`
- Border radius: `18px` خارجي · `15px` داخلي
- Gradient ring (نشط): `linear-gradient(135deg, #01875F, #FBBC04, #C71C56)`
- Gradient ring (مشاهد): `linear-gradient(135deg, #DADCE0, #9AA0A6)`
- سمك الإطار: `2.5px`
- Gap بين العناصر: `10px`
- Label تحت: `9px` · weight 500
- Badge اختياري: مثل "15$" أو "-30%"

### ⭐ 4. Featured Service Card

بطاقة بارزة للخدمة الأساسية (سحب الدم).

```html
<div class="featured-card">
  <div class="icon-box">🩸 (76×76px · soft green bg)</div>
  <div class="info">
    <span class="badge">الأكثر طلباً</span>
    <h3>سحب الدم والتحاليل المنزلية</h3>
    <p>فني مختبر يأتي لمنزلك · نتائج رقمية</p>
    <div class="meta">⏱️ 30د · 💵 من 15$</div>
  </div>
</div>
```

### 🟦 5. Bento Cards Grid (14 خدمة)

```html
<div style="
  padding: 0 14px 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
">
  <BentoCard service="blood" badge="الأكثر طلباً" />
  <BentoCard service="nursing" />
  <BentoCard service="doctor" badge="جديد" />
  <BentoCard service="hospital" />
  <!-- ... 14 total -->
</div>
```

**مواصفات Bento Card:**
- Padding: `14px`
- Border radius: `14px`
- Border: `0.5px solid #DADCE0`
- Decorative circle: `70×70px` بـ soft color · opacity `0.7` · top-left `-12px`
- أيقونة: `26px` · padding-bottom `12px`
- عنوان: `12px` · weight 500
- وصف: `10px` · color `#5F6368`
- سهم: `IconArrowLeft 14px` في bottom-left

### ⬇️ 6. Bottom Navigation

تفاصيل كاملة في [القسم 9](#9-bottom-navigation).

---

## 8. المكونات الأساسية

### 🔘 Buttons

```tsx
// Primary (الأخضر)
<button className="bg-[#01875F] text-white px-6 py-3 rounded-full font-medium">
  احجز فحص
</button>

// Secondary (محاط)
<button className="bg-white text-[#01875F] border border-[#01875F] px-6 py-3 rounded-full">
  اعرف أكثر
</button>

// Ghost (رمادي)
<button className="bg-[#F1F3F4] text-[#202124] px-6 py-3 rounded-full">
  إلغاء
</button>

// Danger (أحمر)
<button className="bg-[#C71C56] text-white px-6 py-3 rounded-full">
  طوارئ
</button>

// FAB (مدور)
<button className="bg-[#01875F] text-white w-11 h-11 rounded-full">
  <IconPlus size={20} />
</button>
```

**مواصفات الأزرار:**
- Padding: `12px 24px`
- Border radius: `9999px` (Pills)
- Font: Tajawal · 14px · weight 500
- Touch target: ≥ 44px

### 🏷️ Badges

| النوع | الكود |
|------|------|
| الأكثر طلباً | `bg-[#FBBC04] text-[#202124]` |
| جديد | `bg-[#C71C56] text-white` |
| خصم | `bg-[#FEF7E0] text-[#B06000]` |
| مكتمل | `bg-[#E6F3EF] text-[#01875F]` |
| ملغي | `bg-[#FCE8E6] text-[#C71C56]` |
| قيد المعالجة | `bg-[#F1F3F4] text-[#5F6368]` |
| في الطريق | `bg-[#E8F0FE] text-[#1A73E8]` |

**مواصفات:**
- Padding: `3px 10px`
- Border radius: `9999px`
- Font size: `11px` · weight 500

### 📝 Inputs

```tsx
// Standard input
<div>
  <label className="text-xs text-[#3C4043] font-medium mb-1.5 block">
    الاسم الكامل
  </label>
  <input
    className="w-full px-3.5 py-2.5 border border-[#DADCE0] rounded-[10px] text-sm bg-white outline-none focus:border-[#01875F] focus:ring-3 focus:ring-[#01875F]/10"
    placeholder="حسين علي"
  />
</div>

// Search style
<div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F1F3F4] rounded-[14px]">
  <IconSearch size={18} color="#5F6368" />
  <input className="flex-1 bg-transparent outline-none text-sm" placeholder="ابحث..." />
  <IconMicrophone size={18} color="#01875F" />
</div>
```

### 🎚️ Toggles & Radios

```tsx
// Toggle ON
<div className="w-11 h-6 bg-[#01875F] rounded-full relative cursor-pointer">
  <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow" />
</div>

// Toggle OFF
<div className="w-11 h-6 bg-[#DADCE0] rounded-full relative cursor-pointer">
  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
</div>

// Radio (selected)
<div className="w-4.5 h-4.5 border-2 border-[#01875F] rounded-full flex items-center justify-center">
  <div className="w-2 h-2 bg-[#01875F] rounded-full" />
</div>
```

---

## 9. Bottom Navigation

### 📱 المواصفات الكاملة

شريط تنقل سفلي بأسلوب **Instagram** - أيقونات فقط بدون نصوص.

```tsx
<nav className="bottom-nav">
  <a href="/dashboard" className="nav-tab active">
    <IconHome size={26} />
  </a>
  <a href="/services" className="nav-tab">
    <IconLayoutGrid size={26} />
  </a>
  <a href="/orders" className="nav-tab">
    <IconClipboardList size={26} />
  </a>
  <a href="/messages" className="nav-tab has-badge">
    <IconMessageCircle size={26} />
    <span className="nav-badge">2</span>
  </a>
  <a href="/profile" className="nav-tab">
    <IconUser size={26} />
  </a>
</nav>
```

### 🎨 CSS الكامل

```css
.bottom-nav {
  position: sticky;
  bottom: 0;
  background: #FFFFFF;
  border-top: 0.5px solid #DADCE0;
  padding: 12px 8px calc(16px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 50;
}

.nav-tab {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5F6368;
  position: relative;
  border-radius: 50%;
  transition: background 180ms ease;
}

.nav-tab.active {
  color: #01875F;
}

.nav-tab:active {
  background: rgba(95, 99, 104, 0.08);
}

.nav-badge {
  position: absolute;
  top: 2px;
  right: 4px;
  background: #C71C56;
  color: #fff;
  font-size: 9px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 9999px;
  min-width: 14px;
  text-align: center;
  line-height: 1.2;
}
```

### 📋 الـ 5 تابات

| # | الأيقونة | التاب | الـ Route |
|---|---------|------|-----------|
| 1 | `IconHome` | الرئيسية | `/dashboard` |
| 2 | `IconLayoutGrid` | الخدمات | `/services` |
| 3 | `IconClipboardList` | طلباتي | `/orders` |
| 4 | `IconMessageCircle` | الرسائل | `/messages` |
| 5 | `IconUser` | حسابي | `/profile` |

### 📐 المواصفات

- **الارتفاع:** `60px` + safe area سفلي
- **خلفية:** `#FFFFFF` (لا شفافية)
- **حد علوي:** `0.5px solid #DADCE0`
- **حجم الأيقونة:** `26px` · stroke 1.5
- **منطقة اللمس:** `44×44px` لكل تاب
- **اللون النشط:** `#01875F`
- **اللون غير النشط:** `#5F6368`
- **Badge:** `#C71C56` بأبيض · top-right
- **بدون نصوص** - أيقونات فقط

---

## 10. نظام الستوريز الإعلاني

### 🎯 الفكرة

شريط ستوريز يديره الأدمن من لوحة التحكم. يستخدم للإعلانات والعروض والخدمات الجديدة والحملات الصحية.

### 🗄️ Database Schema (Supabase)

```sql
-- جدول الستوريز
CREATE TABLE admin_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                    -- "عرض خاص"
  image_url TEXT,                          -- صورة الستوري
  background_color TEXT DEFAULT '#01875F',
  badge_text TEXT,                         -- "15$" أو "-30%"
  action_url TEXT,                         -- /services/blood-test
  display_order INT DEFAULT 0,
  starts_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  views_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول مشاهدات المستخدمين
CREATE TABLE user_story_views (
  user_id UUID REFERENCES auth.users(id),
  story_id UUID REFERENCES admin_stories(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

-- RLS Policies
ALTER TABLE admin_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active" ON admin_stories
  FOR SELECT USING (
    is_active = true
    AND (ends_at IS NULL OR ends_at > NOW())
  );
```

### 🎨 المواصفات البصرية

| العنصر | المواصفات |
|--------|-----------|
| **الحجم** | `64×64px` · مربع متساوي |
| **الحواف** | `radius 18px` خارجي · `radius 15px` داخلي |
| **الإطار النشط** | `gradient 135deg` من `#01875F` → `#FBBC04` → `#C71C56` · 2.5px |
| **الإطار "مشاهد"** | `gradient` من `#DADCE0` → `#9AA0A6` |
| **الخلفية الداخلية** | gradient فريد لكل ستوري · أو صورة |
| **Badge اختياري** | في الزاوية السفلى · "15$" أو "-30%" |
| **Label تحت** | `9px` · weight 500 · 1 سطر max |
| **التمرير** | أفقي · gap 10px · scroll-snap |

### 🎮 Admin Panel Fields

| الحقل | النوع | الوصف |
|------|------|------|
| 🖼️ صورة الستوري | File Upload | JPG/PNG/WEBP · حد أقصى 2MB |
| 📝 العنوان | Text · 20 حرف | يظهر تحت الستوري |
| 🏷️ Badge | Text · اختياري | "15$" أو "-30%" |
| 🎨 لون الخلفية | Color Picker | 5 ألوان من اللوحة |
| 🔗 رابط الإجراء | URL | اختيار من الخدمات |
| ⏰ الصلاحية | Date Range | بداية + نهاية |
| 📊 الترتيب | Drag & Drop | ترتيب الظهور |
| 📈 الإحصائيات | Read Only | views + clicks + CTR |

---

## 11. الصور واللوغو والأفاتارات

### 🎨 اللوغو الرسمي

**التصميم:** حرف "س" بخط Tajawal Black 900 على خلفية gradient أخضر، داخل مربع بحواف منحنية.

```tsx
function SpirLogo({ size = 48 }) {
  const radius = size * 0.25;
  const fontSize = size * 0.55;
  const shadow = size >= 48
    ? '0 8px 24px rgba(1,135,95,0.25)'
    : 'none';

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: 'linear-gradient(135deg,#01875F 0%,#056559 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 900,
      fontSize,
      fontFamily: 'Tajawal, sans-serif',
      boxShadow: shadow,
    }}>
      س
    </div>
  );
}
```

### 📐 7 أحجام معتمدة

| الحجم | الاستخدام |
|------|-----------|
| 16px | Favicon |
| 24px | Inline |
| 32px | App Icon · Navbar |
| 40px | Navbar · Hero |
| 48px | Settings · Profile |
| 64px | Splash Screen |
| 128px | Marketing · Onboarding |

### 👤 الأفاتارات

| الحجم | القياس | حجم الحرف | الاستخدام |
|------|--------|-----------|-----------|
| **xs** | 24×24px | 11px | داخل الرسائل · القوائم الكثيفة |
| **sm** | 32×32px | 14px | قوائم الأطباء · التعليقات |
| **md** | 40×40px | 16px | Hero Card · بطاقات الأطباء |
| **lg** | 56×56px | 22px | صفحة الطبيب · معاينة الملف |
| **xl** | 96×96px | 38px | صفحة الملف الشخصي |

### 🖼️ مقاسات الصور الأمثل

| النوع | النسبة | المقاس | الصيغة | الحد الأقصى |
|------|--------|--------|--------|-------------|
| Service Hero | 16:9 | 1280×720 | WebP | 500KB |
| Card Thumbnail | 1:1 | 400×400 | WebP | 150KB |
| Banner | 21:9 | 1260×540 | WebP | 400KB |
| Story | 9:16 | 1080×1920 | WebP/JPG | 800KB |
| Doctor Photo | 1:1 | 400×400 | WebP | 120KB |
| User Avatar | 1:1 | 200×200 | WebP | 80KB |
| Hospital Photo | 4:3 | 800×600 | WebP | 250KB |
| Result PDF | A4 | 2480×3508 | PDF | 2MB |

### 📁 هيكل Supabase Storage

```
📦 supabase.storage
├── avatars/          (public · 5MB)
│   ├── users/{user_id}.webp
│   └── doctors/{doctor_id}.webp
├── services/         (public · 2MB)
│   ├── hero/{slug}.webp
│   ├── thumb/{slug}.webp
│   └── icons/{slug}.svg
├── stories/          (public · 1MB)
│   └── {story_id}.webp
├── banners/          (public · 500KB)
│   └── {banner_id}.webp
├── hospitals/        (public · 1MB)
│   └── {hospital_id}/main.webp
├── results/          (PRIVATE · RLS · 5MB)
│   └── {user_id}/{order_id}.pdf
├── prescriptions/    (PRIVATE · RLS · 3MB)
│   └── {user_id}/{rx_id}.pdf
└── logo/             (public · static)
    ├── primary.svg
    └── favicon.ico
```

---

## 12. الـ 14 خدمة الطبية

### 📋 القائمة الكاملة

| # | الخدمة | اسم الأيقونة | اللون | Badge | الـ Route |
|---|--------|--------------|------|-------|-----------|
| 1 | **سحب الدم والتحاليل** | `IconDroplet` | `#EA4335` | "الأكثر طلباً" | `/services/blood-test` |
| 2 | **التمريض المنزلي** | `IconVaccine` | `#B06000` | - | `/services/nursing` |
| 3 | **طبيب العائلة** | `IconStethoscope` | `#01875F` | "جديد" | `/services/family-doctor` |
| 4 | **المستشفيات** | `IconBuildingHospital` | `#1A73E8` | - | `/services/hospitals` |
| 5 | **الصيدلية** | `IconPill` | `#9334E6` | - | `/services/pharmacy` |
| 6 | **الاستشارات** | `IconMessage2` | `#00BCD4` | - | `/services/consultations` |
| 7 | **طب الأسنان** | `IconTooth` | `#00838F` | - | `/services/dental` |
| 8 | **التغذية** | `IconApple` | `#34A853` | - | `/services/nutrition` |
| 9 | **اللقاحات** | `IconVaccineBottle` | `#FF6D00` | - | `/services/vaccines` |
| 10 | **الطوارئ SOS** | `IconAlertTriangle` | `#8B0000` | - | `/services/emergency` |
| 11 | **استشارة فيديو** | `IconVideo` | `#7C4DFF` | - | `/services/video` |
| 12 | **فحص الأعراض** | `IconSearch` | `#00897B` | - | `/services/symptoms` |
| 13 | **حاسبة المخاطر** | `IconCalculator` | `#FF7043` | - | `/services/risk` |
| 14 | **جدول اللقاحات** | `IconCalendarCheck` | `#26A69A` | - | `/services/vaccine-schedule` |

### 🟦 مثال Bento Card كامل

```tsx
function BentoCard({ service }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #DADCE0',
      borderRadius: '14px',
      padding: '14px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '140px',
    }}>
      {service.badge && (
        <span style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: service.badge === 'جديد' ? '#C71C56' : '#FBBC04',
          color: service.badge === 'جديد' ? '#fff' : '#202124',
          fontSize: '8px',
          fontWeight: 500,
          padding: '1px 6px',
          borderRadius: '9999px',
          zIndex: 2,
        }}>
          {service.badge}
        </span>
      )}

      {/* Decorative circle */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '-12px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: service.softBg,
        opacity: 0.7,
      }} />

      {/* Icon */}
      <div style={{
        width: '36px',
        height: '36px',
        color: service.color,
        position: 'relative',
        zIndex: 1,
        marginBottom: '14px',
      }}>
        <service.Icon size={28} />
      </div>

      {/* Title & Description */}
      <p style={{
        fontSize: '13px',
        fontWeight: 700,
        color: '#202124',
        margin: '0 0 4px',
        position: 'relative',
        zIndex: 1,
      }}>
        {service.title}
      </p>
      <p style={{
        fontSize: '11px',
        color: '#5F6368',
        margin: 0,
        position: 'relative',
        zIndex: 1,
        lineHeight: 1.4,
      }}>
        {service.desc}
      </p>

      {/* Arrow */}
      <IconArrowLeft
        size={14}
        color={service.color}
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '16px',
        }}
      />
    </div>
  );
}
```

---

## 13. Design Tokens (CSS Variables)

### 📄 الملف الكامل (tokens.css)

```css
/* ========================================
   سباير V3 · Design Tokens
   مرجع: Google Play Brand Colors
   ======================================== */

:root {
  /* ===== Brand Colors ===== */
  --spir-primary:        #01875F;  /* Spanish Green */
  --spir-primary-deep:   #056559;
  --spir-primary-soft:   #E6F3EF;

  --spir-yellow:         #FBBC04;  /* Cyber Yellow */
  --spir-yellow-soft:    #FEF7E0;
  --spir-yellow-deep:    #B06000;

  --spir-pink:           #C71C56;  /* Carmine Pink */
  --spir-pink-soft:      #FCE8E6;
  --spir-pink-deep:      #8B1240;

  --spir-blue:           #1A73E8;  /* Google Blue */
  --spir-blue-soft:      #E8F0FE;

  --spir-purple:         #9334E6;
  --spir-purple-soft:    #F3E8FD;

  /* ===== Neutrals ===== */
  --bg:                  #FFFFFF;
  --surface:             #F8F9FA;
  --surface-2:           #F1F3F4;
  --border:              #DADCE0;
  --border-soft:         #E8EAED;

  --text:                #202124;
  --text-2:              #3C4043;
  --text-3:              #5F6368;
  --text-4:              #80868B;

  /* ===== Service Colors (14) ===== */
  --svc-blood:           #EA4335;
  --svc-nursing:         #FBBC04;
  --svc-doctor:          #01875F;
  --svc-hospital:        #1A73E8;
  --svc-pharmacy:        #9334E6;
  --svc-consult:         #00BCD4;
  --svc-dental:          #00838F;
  --svc-nutrition:       #34A853;
  --svc-vaccines:        #FF6D00;
  --svc-emergency:       #8B0000;
  --svc-video:           #7C4DFF;
  --svc-symptom:         #00897B;
  --svc-risk:            #FF7043;
  --svc-vaccine-table:   #26A69A;

  /* ===== Spacing ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* ===== Radius ===== */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   18px;
  --radius-2xl:  20px;
  --radius-3xl:  28px;
  --radius-full: 9999px;

  /* ===== Shadows ===== */
  --shadow-xs:    0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm:    0 2px 6px rgba(0,0,0,0.06);
  --shadow-md:    0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg:    0 8px 24px rgba(0,0,0,0.10);
  --shadow-green: 0 4px 12px rgba(1,135,95,0.25);

  /* ===== Typography ===== */
  --font-sans: 'Tajawal', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-display: 56px;
  --text-h1:      36px;
  --text-h2:      28px;
  --text-h3:      20px;
  --text-body-lg: 17px;
  --text-body:    15px;
  --text-sm:      13px;
  --text-caption: 11px;

  /* ===== Layout ===== */
  --app-shell:    480px;
  --page-padding: 16px;
  --nav-height:   60px;

  /* ===== Animation ===== */
  --ease:     cubic-bezier(0.4, 0, 0.2, 1);
  --duration: 180ms;
}
```

### 🔧 Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Spir Brand
        spir: {
          primary: '#01875F',
          'primary-deep': '#056559',
          'primary-soft': '#E6F3EF',
          yellow: '#FBBC04',
          'yellow-soft': '#FEF7E0',
          'yellow-deep': '#B06000',
          pink: '#C71C56',
          'pink-soft': '#FCE8E6',
          blue: '#1A73E8',
          'blue-soft': '#E8F0FE',
          purple: '#9334E6',
          'purple-soft': '#F3E8FD',
        },
        // Neutrals
        surface: {
          DEFAULT: '#F8F9FA',
          2: '#F1F3F4',
        },
        ink: {
          DEFAULT: '#202124',
          2: '#3C4043',
          3: '#5F6368',
          4: '#80868B',
        },
        // Services
        svc: {
          blood: '#EA4335',
          nursing: '#FBBC04',
          doctor: '#01875F',
          hospital: '#1A73E8',
          pharmacy: '#9334E6',
          consult: '#00BCD4',
          dental: '#00838F',
          nutrition: '#34A853',
          vaccines: '#FF6D00',
          emergency: '#8B0000',
          video: '#7C4DFF',
          symptom: '#00897B',
          risk: '#FF7043',
          'vaccine-table': '#26A69A',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '20px',
        '3xl': '28px',
      },
      maxWidth: {
        'app': '480px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 14. قواعد بيانات أساسية

### 🗄️ الجداول الرئيسية في Supabase

**Project ID:** `ioulxemokusfeykjcaxg`

#### جداول مرتبطة بنظام التصميم

```sql
-- ===== Stories System =====
CREATE TABLE admin_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  background_color TEXT DEFAULT '#01875F',
  badge_text TEXT,
  action_url TEXT,
  display_order INT DEFAULT 0,
  starts_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  views_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== Services =====
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  icon_name TEXT NOT NULL,       -- Tabler icon (e.g., 'IconDroplet')
  color HEX NOT NULL,             -- '#EA4335'
  soft_bg HEX NOT NULL,           -- '#FCE8E6'
  badge_text TEXT,                -- "الأكثر طلباً" أو "جديد"
  badge_type TEXT,                -- "yellow" أو "pink"
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 15. خارطة التنفيذ

### 🚀 4 مراحل متسلسلة

#### Phase 1: Design Tokens (جلسة واحدة)
```
✅ tokens.css                  · المتغيرات الكاملة
✅ globals.css                 · تطبيق الـ tokens
✅ tailwind.config.ts          · ربط Tailwind
✅ layout.tsx                  · تطبيق الخطوط والـ RTL
```

#### Phase 2: UI Kit (جلسة واحدة)
```
✅ Button.tsx                  · زر موحّد
✅ Badge.tsx                   · Badge موحّد
✅ BentoCard.tsx               · بطاقة الخدمة
✅ StoryItem.tsx               · عنصر ستوري
✅ HeroCard.tsx                · بطاقة الترحيب
✅ SearchBar.tsx               · شريط البحث
✅ BottomNav.tsx               · الشريط السفلي
✅ AppShell.tsx                · إطار 480px
```

#### Phase 3: Patient Screens (2-3 جلسات)
```
✅ /dashboard                  · الشاشة الرئيسية
✅ /services                   · كل الخدمات
✅ /services/[slug]            · صفحة الخدمة
✅ /orders                     · طلباتي
✅ /messages                   · الرسائل
✅ /profile                    · الملف الشخصي
✅ /settings                   · الإعدادات
```

#### Phase 4: Stories + Admin (2 جلسات)
```
✅ DB Migration                · admin_stories + user_story_views
✅ /admin/stories              · لوحة الأدمن
✅ StoriesBar.tsx              · شريط العرض
✅ StoryViewer.tsx             · عارض الستوريز
✅ Supabase Storage            · سياسات الرفع
```

---

## 📌 ملاحظات مهمة للتنفيذ

### ✅ افعل (DO)

- ✅ استخدم Tabler Icons React (`@tabler/icons-react`) - **مو الـ webfont**
- ✅ ابدأ بـ Phase 1 → Phase 2 → Phase 3 (لا تتخطى)
- ✅ كل صفحة `<480px` (App Shell)
- ✅ RTL في كل مكان · `dir="rtl"` في `<html>`
- ✅ Font Tajawal من Google Fonts
- ✅ استخدم `next/image` للصور
- ✅ Supabase Storage للصور · RLS للنتائج الحساسة
- ✅ نسخ ملف `tokens.css` كاملاً من القسم 13
- ✅ TypeScript صارم (`strict: true`)

### ❌ لا تفعل (DON'T)

- ❌ لا تستخدم Tabler webfont CDN (يفشل في بعض البيئات)
- ❌ لا تستخدم emojis في الواجهة الإدارية أو الأزرار
- ❌ لا تخالف نظام الألوان (لا ألوان خارج الـ tokens)
- ❌ لا تستخدم `inline styles` في الإنتاج (Tailwind فقط)
- ❌ لا تستخدم `console.log` في الإنتاج
- ❌ لا تحفظ صور في `/public` (استخدم Supabase Storage)
- ❌ لا تستخدم Dark Mode في V3
- ❌ لا تكسر الـ 480px shell على الديسكتوب

### 🎨 معيار الجودة

كل صفحة يجب أن:
1. تحمّل في أقل من **2 ثانية**
2. تعمل على أجهزة بطيئة (3G · أيفون قديم)
3. تدعم **PWA** (offline-first للقوائم)
4. تحقق **WCAG AA** (تباين 4.5:1 على الأقل)
5. تكون **mobile-first** (لا breakpoints معقدة)
6. تستخدم **Tabler Icons** فقط (لا Font Awesome)
7. تتبع لوحة **Google Play Colors** بدقة

---

## 🔗 مصادر مهمة

| المورد | الرابط |
|--------|--------|
| **GitHub Repo** | `inzohussein-blip/spirmedical-wep` |
| **Live App** | `spirmedical-wep.vercel.app` |
| **Supabase Project** | `ioulxemokusfeykjcaxg` |
| **Tabler Icons** | https://tabler.io/icons |
| **Tajawal Font** | https://fonts.google.com/specimen/Tajawal |
| **Google Play Brand** | المرجع للوحة الألوان |

---

## 📝 سجل التغييرات

| الإصدار | التاريخ | الملاحظات |
|---------|---------|-----------|
| **v3.0.0** | مايو 2026 | الإطلاق الأولي · Google Play Palette · Bento Cards · Stories System |
| v2.x | قبل مارس 2026 | الإصدار القديم - تم استبداله بالكامل |

---

**📌 آخر تحديث:** مايو 2026
**👤 المالك:** حسين (inzohussein-blip)
**🏢 المشروع:** سباير ميديكال (Spir Medical) · العراق

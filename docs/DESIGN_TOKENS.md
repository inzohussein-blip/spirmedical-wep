# 🎨 Design Tokens System — Spir Medical V25

نظام تصميم موحّد لكل المنصة. كل القيم البصرية (ألوان، مسافات، خطوط، ظلال) تأتي من **CSS Variables** في `globals.css`.

## 📋 الفلسفة

```
┌─────────────────────────────────┐
│  globals.css :root {}           │  ← مصدر الحقيقة الواحد
│  --space-4: 16px;               │
└────────┬────────────────────────┘
         │
    ┌────┴────────┬─────────────┐
    ▼             ▼             ▼
┌─────────┐  ┌────────┐  ┌────────────┐
│ CSS     │  │Tailwind│  │ Utility    │
│ مباشر   │  │ classes│  │ classes    │
│var(--..)│  │ p-4    │  │ .p-4       │
└─────────┘  └────────┘  └────────────┘
```

**النتيجة:** غيّر قيمة في `globals.css` → كل المنصة تتحدث!

---

## 📏 Spacing Scale

أساس 4px:

| Token | القيمة | الاستخدام |
|---|---|---|
| `--space-0` | 0 | لا مسافة |
| `--space-1` | 4px | xs - فجوات صغيرة جداً |
| `--space-2` | 8px | sm - فجوات داخلية |
| `--space-3` | 12px | md - padding افتراضي |
| `--space-4` | 16px | base - padding cards |
| `--space-5` | 20px | lg - padding sections |
| `--space-6` | 24px | xl - sections كبيرة |
| `--space-8` | 32px | 2xl - hero spacing |
| `--space-10` | 40px | 3xl |
| `--space-12` | 48px | 4xl |
| `--space-16` | 64px | 5xl |
| `--space-20` | 80px | 6xl |

**استخدام:**
```css
/* CSS مباشر */
.my-card { padding: var(--space-4); gap: var(--space-3); }

/* Tailwind */
<div className="p-4 gap-3">

/* Utility classes */
<div className="p-4 gap-3">
```

---

## 🔲 Border Radius

| Token | القيمة | الاستخدام |
|---|---|---|
| `--radius-none` | 0 | بدون |
| `--radius-sm` | 6px | inputs صغيرة |
| `--radius-md` | 10px | افتراضي |
| `--radius-lg` | 14px | cards |
| `--radius-xl` | 20px | sections كبيرة |
| `--radius-2xl` | 24px | hero cards |
| `--radius-full` | 9999px | pills, badges, avatars |

---

## 🌑 Shadows

| Token | الاستخدام |
|---|---|
| `--shadow-xs` | hover بسيط |
| `--shadow-sm` | cards عادية |
| `--shadow-md` | افتراضي للـ cards |
| `--shadow-lg` | popovers, dropdowns |
| `--shadow-xl` | modals |
| `--shadow-2xl` | hero elements |
| `--shadow-inner` | input fields focused |
| `--shadow-focus` | focus rings |

---

## ✍️ Typography

### Font Sizes
| Token | القيمة | الاستخدام |
|---|---|---|
| `--text-2xs` | 9px | footer fine print |
| `--text-xs` | 11px | labels صغيرة |
| `--text-sm` | 12px | metadata |
| `--text-base` | 13px | body |
| `--text-md` | 14px | subheadings |
| `--text-lg` | 16px | section titles |
| `--text-xl` | 18px | h3 |
| `--text-2xl` | 22px | h2 |
| `--text-3xl` | 28px | h1 mobile |
| `--text-4xl` | 36px | hero mobile |
| `--text-5xl` | 48px | hero desktop |

### Font Weights
| Token | الاستخدام |
|---|---|
| `--weight-normal` (400) | body text |
| `--weight-medium` (500) | labels |
| `--weight-semibold` (600) | inputs |
| `--weight-bold` (700) | buttons |
| `--weight-extrabold` (800) | headings ✨ الأكثر استخداماً |
| `--weight-black` (900) | hero |

### Line Heights
| Token | الاستخدام |
|---|---|
| `--leading-tight` (1.2) | headings |
| `--leading-snug` (1.35) | subheadings |
| `--leading-normal` (1.5) | UI text |
| `--leading-relaxed` (1.6) | body text |
| `--leading-loose` (1.75) | long-form |

---

## 🎨 Colors (Brand)

| Token | الاستخدام |
|---|---|
| `--emerald` (#0E5C4D) | اللون الأساسي، CTAs |
| `--emerald-deep` (#073B30) | hover للزر الأساسي |
| `--emerald-soft` (#D9E5DF) | خلفيات highlights |
| `--amber` (#B8540C) | تحذيرات |
| `--amber-soft` (#F0DBC2) | خلفيات تحذير |
| `--rose` (#A82E3D) | أخطاء، حذف |
| `--rose-soft` (#F0D7D8) | خلفيات خطأ |
| `--paper` (#F4EFE2) | الخلفية الرئيسية |
| `--paper-2` (#EDE6D3) | خلفيات بديلة |
| `--paper-3` (#FAF6EB) | inputs |
| `--ink` (#0F1A1C) | نص رئيسي |
| `--ink-2` (#1F2A2C) | نص ثانوي |
| `--ink-3` (#6E7878) | متادايتا |
| `--ink-4` (#A4ACAA) | disabled |

⚠️ **مهم:** كل هذه قابلة للتعديل من `/admin/settings/theme` (Dynamic Theme System).

---

## ⏱️ Transitions

| Token | المدة | الاستخدام |
|---|---|---|
| `--transition-fast` | 150ms | hover صغيرة |
| `--transition-base` | 200ms | افتراضي |
| `--transition-slow` | 300ms | modals, sheets |
| `--transition-slower` | 500ms | hero animations |

### Easings
| Token | الاستخدام |
|---|---|
| `--ease-out` | smooth entry |
| `--ease-in-out` | balanced |
| `--ease-spring` | playful (bouncy) |

---

## 📐 Layout

| Token | القيمة | الاستخدام |
|---|---|---|
| `--shell-max-width` | 480px | app shell width |
| `--landing-max-width` | 1280px | landing wrap |
| `--header-height` | 64px | top nav |
| `--bottom-nav-height` | 72px | bottom nav |

---

## 🎚️ Z-Index Scale

| Token | الاستخدام |
|---|---|
| `--z-base` (1) | افتراضي |
| `--z-dropdown` (10) | dropdowns |
| `--z-sticky` (20) | sticky header |
| `--z-overlay` (30) | overlays |
| `--z-modal` (40) | modals |
| `--z-popover` (50) | popovers |
| `--z-toast` (60) | toasts |
| `--z-tooltip` (70) | tooltips |

---

## 💡 أمثلة عملية

### Card بسيط
```tsx
// ❌ قديم (inline styles)
<div style={{
  background: '#fff',
  borderRadius: 14,
  padding: 18,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}}>

// ✅ جديد (Tailwind)
<div className="bg-white rounded-lg p-5 shadow-md">

// ✅ أو CSS مباشر
<div className="my-card">
.my-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
}
```

### Button
```tsx
// ✅ Tailwind
<button className="bg-emerald text-paper-3 px-5 py-3 rounded-md font-extrabold transition-fast">
  تسجيل دخول
</button>
```

### Section
```tsx
// ✅ Tailwind
<section className="py-20 bg-paper border-t border-line">
  <div className="max-w-landing mx-auto px-5">
    <h2 className="text-3xl font-extrabold mb-6">العنوان</h2>
  </div>
</section>
```

---

## 🔄 التحديث (Theme System)

أهم 5 ألوان قابلة للتعديل ديناميكياً من `/admin/settings/theme`:
- `--emerald` (primary)
- `--emerald-deep` (primary dark)
- `--emerald-soft` (primary soft)
- `--amber` (accent)
- `--rose` (danger)

كل ما يستخدم هذه التوكنز يتحدّث فوراً عند تغييرها من admin.

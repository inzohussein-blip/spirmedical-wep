# 🧩 UI Primitives — Spir Medical V25

مكوّنات أساسية قابلة لإعادة الاستخدام في كل المنصة.

كلها مبنية على **Design Tokens** — أي تغيير في `globals.css` يطبّق على كل المكوّنات تلقائياً.

## 📦 Import

```tsx
// كل شيء من index واحد
import {
  Button, Card, Input, Badge, Avatar,
  EmptyState, Skeleton, Separator,
} from '@/components/ui';
```

---

## 🃏 Card

**5 variants × 4 sizes = 20 شكل**

```tsx
<Card>          {/* default + md */}
<Card variant="elevated" size="lg">
<Card variant="filled" size="xl">
<Card variant="bordered" interactive>  {/* قابل للنقر */}
```

### مع Sections
```tsx
<Card>
  <CardHeader>
    <CardTitle>عنوان</CardTitle>
    <CardDescription>وصف مختصر</CardDescription>
  </CardHeader>
  <CardContent>
    المحتوى الرئيسي
  </CardContent>
  <CardFooter>
    <Button>حفظ</Button>
    <Button variant="secondary">إلغاء</Button>
  </CardFooter>
</Card>
```

---

## ⌨️ Input + Textarea

```tsx
<Input
  label="رقم الهاتف"
  required
  placeholder="07XXXXXXXXX"
  leftIcon={<Phone size={16} />}
  hint="رقم عراقي يبدأ بـ 07"
  error={phoneError}
  inputSize="lg"
  variant="filled"
/>

<Textarea
  label="الملاحظات"
  rows={4}
  hint="حتى 500 حرف"
/>
```

**Sizes:** sm (36px), md (44px), lg (48px)
**Variants:** default, filled

---

## 🏷️ Badge

**7 variants:** emerald, amber, rose, paper, ink, soft, outline
**3 sizes:** sm, md, lg

```tsx
<Badge variant="emerald">جديد</Badge>
<Badge variant="amber" size="lg">عرض محدود</Badge>
<Badge variant="rose" icon={<X size={10} />}>ملغى</Badge>
<Badge variant="outline" pulse>قيد المراجعة</Badge>

// نقطة فقط
<DotBadge variant="emerald" pulse />
```

---

## 🏷️ StatusBadge (للحالات الطبية)

مختلف عن Badge العام - مخصص للحالات الطبية مع أيقونات ثابتة.

```tsx
<StatusBadge status="pending" />          // "جديد"
<StatusBadge status="confirmed" />        // "مؤكّد" + ✓
<StatusBadge status="in_progress" />      // "جارٍ" + spinner
<StatusBadge status="completed" />        // "مكتمل"
<StatusBadge status="cancelled" />        // "ملغى" + ✕
```

---

## 👤 Avatar

**6 sizes:** xs (24px) → 2xl (80px)
**4 variants:** default, patient, specialist, admin
**4 statuses:** online, offline, away, busy

```tsx
<Avatar name="حسين أحمد" />
<Avatar name="د. علي" variant="specialist" status="online" />
<Avatar name="فاطمة" src="/avatars/f.jpg" size="lg" />

// Group
<AvatarGroup
  avatars={[
    { name: 'أحمد' },
    { name: 'علي' },
    { name: 'سارة' },
    { name: 'محمد' },
  ]}
  max={3}
  size="sm"
/>
```

Fallback تلقائي: يأخذ أول حرفين من الاسم (يتجاهل "د." و "أ.").

---

## 📭 EmptyState

```tsx
<EmptyState
  icon="📭"
  title="لا توجد طلبات"
  description="ابدأ بإنشاء أول طلب"
  action={<Button>+ طلب جديد</Button>}
  secondaryAction={<Link href="/help">مساعدة</Link>}
  size="md"        // sm | md | lg
  variant="default" // default | bordered | plain
/>
```

### مخصص للأخطاء
```tsx
<ErrorState
  error={error}
  action={<Button onClick={retry}>إعادة المحاولة</Button>}
/>
```

---

## 💀 Skeleton

```tsx
<Skeleton className="w-32 h-4" />          // text
<Skeleton variant="circle" className="w-10 h-10" />  // avatar
<Skeleton variant="rect" className="w-full h-32" />  // card image
```

### جاهزة:
```tsx
<SkeletonCard />          // بطاقة كاملة
<SkeletonListItem />      // عنصر قائمة
<SkeletonTable rows={5} columns={4} />
<SkeletonStats count={4} />
```

---

## ➖ Separator

```tsx
<Separator />                              // افتراضي
<Separator orientation="vertical" />       // عمودي
<Separator label="أو" />                   // مع نص
<Separator dashed thick />                 // متقطع وسميك
```

---

## 🎯 أمثلة عملية

### قبل: inline styles فوضوية
```tsx
<div style={{
  background: '#fff',
  borderRadius: 14,
  padding: 18,
  marginBottom: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
}}>
  <h3 style={{
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 12
  }}>إحصاءات</h3>
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  }}>
    {/* ... */}
  </div>
</div>
```

### بعد: نظيف ومفهوم
```tsx
<Card className="mb-4">
  <CardHeader>
    <CardTitle>إحصاءات</CardTitle>
  </CardHeader>
  <div className="grid grid-cols-2 gap-3">
    {/* ... */}
  </div>
</Card>
```

---

## 📊 الحجم

كل المكوّنات معاً = **~15 KB** بعد bundle (مع tree-shaking).

| Primitive | حجم تقريبي |
|---|---|
| Button | 1.5 KB |
| Card | 1.2 KB |
| Input | 2.5 KB |
| Badge | 0.8 KB |
| Avatar | 1.8 KB |
| EmptyState | 1.4 KB |
| Skeleton | 1.6 KB |
| Separator | 0.6 KB |

---

## 🔄 يستخدم Design Tokens

كل المكوّنات تستخدم:
- `--space-*` للمسافات
- `--radius-*` للأقطار
- `--shadow-*` للظلال
- `--text-*` للخطوط
- `--emerald/amber/rose/etc` للألوان

**أي تغيير في `globals.css` → كل المكوّنات تتحدث.**

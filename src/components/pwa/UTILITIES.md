# 📱 PWA Utilities - دليل الاستخدام

هذا الدليل يوثّق الـ utilities الجاهزة في `src/components/pwa/` لتحسين تجربة المستخدم على mobile.

---

## ✅ مُفعّلة حالياً

### 📳 HapticButton (V25.16)
**مُستخدم في:** `DoctorBookingModal.tsx` (زر "تأكيد الحجز")

```tsx
import HapticButton from '@/components/pwa/HapticButton';

<HapticButton hapticStrength="success" onClick={handleBook}>
  احجز الآن
</HapticButton>
```

**Strengths:** `light` (افتراضي) · `selection` · `medium` · `heavy` · `success` · `error` · `warning` · `none`

**استخدامات مُقترحة:**
- ✅ تأكيد الحجز (`success`)
- ✅ تأكيد الدفع (`medium`)
- ✅ إلغاء/خطأ (`error`)
- ✅ Toggle/Checkbox (`selection`)

---

### 📷 CameraCapture (V25.16)
**مُستخدم في:** `NursingFlow.tsx` (step 3 - رفع الوصفة الطبية)

```tsx
import CameraCapture from '@/components/pwa/CameraCapture';

<CameraCapture
  mode="both"           // 'camera' | 'gallery' | 'both'
  maxFiles={1}
  maxSizeMB={5}
  label="ارفع أو التقط صورة"
  onCapture={(files) => {
    const file = files[0];
    // معالجة الصورة...
  }}
/>
```

**استخدامات مُقترحة:**
- ✅ رفع وصفات طبية
- ✅ رفع نتائج تحاليل
- ✅ رفع صورة شخصية
- ✅ رفع وثيقة هوية

---

## 🆕 جاهزة للاستخدام (لم تُفعّل بعد)

### 👆 SwipeGestures (V25.16)
Swipe-to-action في القوائم (مثل تطبيقات email).

```tsx
import { SwipeableItem, SwipeActions } from '@/components/pwa/SwipeGestures';

<SwipeableItem
  onSwipeLeft={() => deleteItem(id)}
  leftAction={{ 
    icon: <Trash2 size={20} />, 
    color: '#A32D2D',
    label: 'حذف'
  }}
>
  <div>{itemContent}</div>
</SwipeableItem>
```

**استخدامات مُقترحة:**
- 📋 `/appointments` - swipe للإلغاء
- ❤️ `/account/favorites` - swipe لإزالة من المفضلة
- 🔔 `/account/notifications` - swipe لحذف الإشعار

---

### 🍃 BottomDrawer (V25.32)
Bottom sheet مثل native apps (مبني على `vaul`).

```tsx
import BottomDrawer from '@/components/ui/BottomDrawer';

<BottomDrawer 
  open={show} 
  onOpenChange={setShow}
  title="عنوان"
>
  {drawerContent}
</BottomDrawer>
```

**استخدامات مُقترحة:**
- 📅 اختيار التاريخ
- 📍 اختيار الموقع
- ⚙️ Filters للقوائم
- 💊 تفاصيل الدواء

---

## 💡 ملاحظات

- كل الـ utilities **تحترم** `prefers-reduced-motion`
- HapticButton يحترم الـ user preferences في haptic
- CameraCapture يضغط الصور تلقائياً قبل الرفع
- BottomDrawer يدعم drag-to-close

---

**تنبيه:** كل هذه الـ utilities موجودة لكنها لا تُستخدم في جميع الصفحات. لتحسين UX على mobile، يمكن إدخالها تدريجياً في الصفحات المهمّة.

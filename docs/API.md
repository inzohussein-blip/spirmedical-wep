# 📡 API Documentation

> توثيق REST API لتطبيق سباير ميديكال.

---

## 🔐 المصادقة

كل المسارات (ما عدا `/health`) تتطلب مصادقة عبر Supabase session cookie.

تُحفَظ الـ session تلقائياً عند تسجيل الدخول من المتصفح.

للاختبار من خارج المتصفح، استخدم Bearer token:
```
Authorization: Bearer <jwt-token>
```

---

## 📋 Endpoints

### Health Check

#### `GET /api/health`

فحص حالة التطبيق. لا يحتاج مصادقة.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-06T12:00:00.000Z",
  "version": "0.1.0"
}
```

---

### Appointments

#### `GET /api/appointments`

قائمة حجوزات المستخدم الحالي.

**Query Parameters:**
- `status` (اختياري): `pending` | `confirmed` | `in_progress` | `completed` | `cancelled`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "service_type": "سحب دم منزلي",
      "scheduled_at": "2026-05-08T10:00:00Z",
      "address": "بغداد - حي الجامعة",
      "notes": "فحص شامل",
      "status": "pending",
      "created_at": "2026-05-06T09:00:00Z",
      "updated_at": "2026-05-06T09:00:00Z"
    }
  ]
}
```

**Errors:**
- `401`: غير مصرّح
- `500`: خطأ في الخادم

---

#### `POST /api/appointments`

إنشاء حجز جديد.

**Body:**
```json
{
  "service_type": "سحب دم منزلي",
  "scheduled_at": "2026-05-08T10:00:00Z",
  "address": "بغداد - حي الجامعة - شارع 14",
  "notes": "فحص شامل دوري"
}
```

**Validation:**
- `service_type`: 2-100 حرف، مطلوب
- `scheduled_at`: ISO 8601 datetime، يجب أن يكون في المستقبل
- `address`: 10-500 حرف، مطلوب
- `notes`: 0-1000 حرف، اختياري

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "...": "..."
  }
}
```

**Errors:**
- `400`: بيانات غير صحيحة
- `401`: غير مصرّح
- `500`: خطأ في الخادم

---

#### `GET /api/appointments/:id`

تفاصيل حجز محدّد.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "service_type": "...",
    "...": "..."
  }
}
```

**Errors:**
- `401`: غير مصرّح
- `404`: غير موجود (أو لا يخصّ المستخدم)

---

#### `PATCH /api/appointments/:id`

تحديث حجز.

**Body** (كل الحقول اختيارية):
```json
{
  "service_type": "string",
  "scheduled_at": "ISO datetime",
  "address": "string",
  "notes": "string",
  "status": "pending|confirmed|in_progress|completed|cancelled"
}
```

**Response 200:**
```json
{
  "data": { "...": "..." }
}
```

**Errors:**
- `400`: بيانات غير صحيحة
- `401`: غير مصرّح
- `404`: غير موجود

---

#### `DELETE /api/appointments/:id`

حذف حجز.

**Response 200:**
```json
{
  "success": true
}
```

**Errors:**
- `401`: غير مصرّح
- `500`: خطأ في الحذف

---

## 🔍 أمثلة

### مع `curl`:

```bash
# Health check
curl https://spirmedical-wep.vercel.app/api/health

# قائمة الحجوزات (يحتاج cookie session)
curl -b "sb-access-token=..." \
     https://spirmedical-wep.vercel.app/api/appointments

# إنشاء حجز
curl -X POST \
     -H "Content-Type: application/json" \
     -b "sb-access-token=..." \
     -d '{"service_type":"سحب دم منزلي","scheduled_at":"2026-06-01T10:00:00Z","address":"بغداد - حي الجامعة - شارع 14"}' \
     https://spirmedical-wep.vercel.app/api/appointments
```

### مع `fetch` (من المتصفح):

```typescript
// قائمة الحجوزات
const res = await fetch('/api/appointments');
const { data } = await res.json();

// إنشاء حجز
const res = await fetch('/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_type: 'سحب دم منزلي',
    scheduled_at: '2026-06-01T10:00:00Z',
    address: 'بغداد - حي الجامعة - شارع 14',
  }),
});
```

### مع Supabase Client (مباشرة):

في Server Components / Server Actions:

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

// قراءة
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .order('scheduled_at', { ascending: false });

// إنشاء
const { data, error } = await supabase
  .from('appointments')
  .insert({ ... })
  .select()
  .single();

// تحديث
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId);

// حذف
const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId);
```

---

## 🔒 أمان

- ✅ **RLS مفعّل:** المستخدم لا يستطيع رؤية حجوزات غيره (إلا الأدمن)
- ✅ **Validation:** كل المدخلات تُفحص بـ Zod
- ✅ **Rate limiting:** عبر Supabase (يحتاج تخصيص لمعدل أعلى)
- ⚠️ **Audit logging:** غير مُفعّل في الـ MVP — يحتاج إضافة

---

## 🧪 اختبار API

```bash
# تأكد من تشغيل الخادم
npm run dev

# في terminal آخر
curl http://localhost:3000/api/health
```

---

## 📈 مستقبلاً

سيُضاف:
- [ ] `/api/users` (إدارة الملف الشخصي)
- [ ] `/api/specialists` (قائمة الأخصائيين)
- [ ] `/api/services` (الخدمات الـ ١٤)
- [ ] `/api/admin/*` (للأدمن فقط)
- [ ] WebSocket للمحادثات الفورية
- [ ] Webhooks للأحداث الخارجية

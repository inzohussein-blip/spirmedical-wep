# 🔄 خطوات مزامنة GitHub — Spir Medical

> آخر تحديث: 13 مايو 2026
> الهدف: مزامنة الـ GitHub repo مع الحالة الفعلية لـ Supabase + إزالة الملفات اليتيمة

---

## 📊 الملخّص

| العملية | العدد | التفاصيل |
|---------|------|----------|
| 🗑️ ملفات للحذف | **10** | SQL قديمة + Sentry + first-aid |
| 📤 ملفات جديدة للرفع | **7** | SQL migrations نظيفة |
| ✏️ ملفات للتعديل | **0** | الـ 12 ملف الكود **مرفوعة بالفعل** ✅ |

---

## 🗑️ الخطوة 1: حذف الملفات القديمة (10 ملفات/مجلدات)

### عبر GitHub Web UI:
اذهب إلى الـ repo: https://github.com/inzohussein-blip/spirmedical-wep

احذف هذه الملفات/المجلدات واحداً تلو الآخر:

```
1.  supabase/schema.sql
2.  supabase/seed.sql
3.  supabase/migrations/20260510_001_idempotency_keys.sql
4.  supabase/migrations/20260510_002_rate_limit_buckets.sql
5.  supabase/migrations/20260511_003_inbox_system.sql
6.  supabase/migrations/20260511_004_payments_ratings.sql
7.  supabase/migrations/20260511_005_enable_realtime.sql
8.  src/sentry.client.config.ts
9.  src/sentry.server.config.ts
10. src/app/(dashboard)/tools/first-aid/      (المجلد كاملاً)
```

### الطريقة عبر الـ Web:
1. افتح الملف على GitHub
2. اضغط على أيقونة 🗑️ (Delete file) في أعلى يمين عرض الملف
3. اكتب رسالة commit واحدة لكل ملف، أو اجمعها في PR واحد

---

## 📤 الخطوة 2: رفع الـ 7 ملفات SQL الجديدة

ارفعها كلها إلى المجلد: `supabase/migrations/`

| # | اسم الملف | الحجم | الوصف |
|---|-----------|-------|--------|
| 1 | `00_cleanup.sql` | 6.6 KB | تنظيف الجداول القديمة |
| 2 | `01_foundation.sql` | 11 KB | users + appointments + audit_logs |
| 3 | `02_security.sql` | 8.6 KB | OTP + rate limits + telegram |
| 4 | `03_inbox.sql` | 11 KB | chats + messages + quick_replies |
| 5 | `04_payments_ratings.sql` | 7.7 KB | payments + ratings |
| 6 | `05_realtime_admin.sql` | 9 KB | realtime + admin views |
| 7 | `06_crm_roles.sql` | 4.4 KB | 6 أدوار CRM |

### الطريقة:
**Web UI**: 
1. اذهب إلى `supabase/migrations/` 
2. اضغط "Add file" → "Upload files"
3. اسحب الـ 7 ملفات
4. اكتب commit message: `chore(db): replace old SQL with clean migrations 00→06`

**Terminal** (لو محلياً):
```bash
git pull
cp /path/to/00_cleanup.sql supabase/migrations/
cp /path/to/01_foundation.sql supabase/migrations/
# ... وهكذا
git add supabase/migrations/
git commit -m "chore(db): replace old SQL with clean migrations 00→06"
git push
```

---

## ✅ الخطوة 3: التحقق

بعد الانتهاء، تحقق من:

```
supabase/
└── migrations/
    ├── 00_cleanup.sql
    ├── 01_foundation.sql
    ├── 02_security.sql
    ├── 03_inbox.sql
    ├── 04_payments_ratings.sql
    ├── 05_realtime_admin.sql
    └── 06_crm_roles.sql
```

❌ لا يجب أن تبقى:
- ❌ `supabase/schema.sql`
- ❌ `supabase/seed.sql`
- ❌ أي ملف `20260510_*` أو `20260511_*`
- ❌ `src/sentry.*.config.ts`
- ❌ `src/app/(dashboard)/tools/first-aid/`

---

## 🚀 الخطوة 4: التحقق من Vercel deploy

بعد آخر push:
1. اذهب إلى https://vercel.com/inzohussein-blips-projects/spirmedical-wep
2. تأكد أن الـ deployment الجديد ✅ Ready
3. افتح https://spirmedical-wep.vercel.app وتحقق

---

## 💡 ملاحظة مهمة

الـ SQL migrations **بالفعل مطبّقة على Supabase** (قاعدة البيانات الحالية فيها 13 جدول نظيف). 
الرفع على GitHub هو فقط **لمزامنة الكود** مع الـ DB، **مش لتطبيقها مرة ثانية**.

✅ DB في Supabase: نظيفة 13 جدول
✅ Frontend code: مرفوع و mأمن  
⏳ GitHub migrations folder: قديمة - تحتاج تحديث


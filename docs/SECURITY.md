# 🔐 الأمان والخصوصية · Security & Privacy

> دليل شامل لاعتبارات الأمان لتطبيق طبي رقمي.

---

## ⚠️ الإعلان المهم

**هذا التطبيق يتعامل مع بيانات طبية حساسة.** الإهمال الأمني هنا له عواقب قانونية وأخلاقية وإنسانية. يجب التعامل مع كل بايت بأقصى درجات الجدية.

---

## 🛡️ الموقع التسويقي الحالي (`spirmedical.iq`)

### ما هو محمي:
- ✅ HTTPS إجباري عبر Vercel SSL
- ✅ Security Headers (في `vercel.json`)
- ✅ لا cookies تتبّع
- ✅ لا analytics خارجية
- ✅ لا JavaScript خارجي (إلا Google Fonts)
- ✅ لا بيانات شخصية تُجمع

### المخاطر الحالية:
- 🟢 **منخفضة جداً** — موقع HTML ساكن، لا backend، لا database

---

## 🚨 التطبيق المستقبلي — قائمة فحص أمنية

### 🔐 المصادقة (Authentication)

#### ✅ يجب فعله:
- [ ] استخدام OTP عبر SMS (Supabase Auth)
- [ ] JWT tokens مع تجديد دوري (~٣٠ دقيقة)
- [ ] Refresh tokens مع rotation
- [ ] Rate limiting على محاولات الدخول (5 محاولات في الساعة)
- [ ] حظر الحسابات بعد فشل متكرر
- [ ] 2FA إجباري للأخصائيين والإدارة
- [ ] جلسات منفصلة لكل جهاز
- [ ] تسجيل خروج بعد عدم نشاط طويل (٣٠ يوم)

#### ❌ ممنوع منعاً باتاً:
- ❌ كلمات مرور قابلة للاسترجاع (يجب hash مع bcrypt/argon2)
- ❌ تخزين OTP في الـ logs
- ❌ نقل tokens في URL
- ❌ session IDs قابلة للتنبؤ

---

### 🔒 التشفير (Encryption)

#### للبيانات في الراحة (At Rest):
- [ ] PostgreSQL encryption عبر Supabase (مفعّل افتراضياً)
- [ ] **تشفير إضافي** للبيانات الحساسة:
  - السجل الطبي (AES-256-GCM)
  - الوصفات الطبية
  - ملاحظات الأخصائيين الخاصة
  - بيانات الدفع (PCI-DSS)
- [ ] مفاتيح التشفير في **Supabase Vault** (لا في الكود)
- [ ] Backup مشفّر

#### للبيانات أثناء النقل (In Transit):
- [ ] TLS 1.3 على كل الاتصالات
- [ ] Certificate pinning للتطبيق Native
- [ ] HSTS مع preload list
- [ ] لا اتصالات HTTP أبداً

#### كود مثال — تشفير ملاحظة طبية:
```typescript
// ❌ خطأ — تخزين النص الخام
const note = "المريض يعاني من اكتئاب"

// ✅ صحيح — تشفير قبل التخزين
import { encrypt, decrypt } from '@/lib/encryption'

const encryptedNote = await encrypt(note, userKey)
await supabase.from('medical_records').insert({
  encrypted_content: encryptedNote,
  // ...
})

// عند القراءة
const record = await supabase.from('medical_records').select().single()
const decryptedNote = await decrypt(record.encrypted_content, userKey)
```

---

### 🔍 Row-Level Security (RLS)

**أهم طبقة حماية في Supabase.**

#### قواعد إجبارية:
- [ ] تفعيل RLS على **كل** الجداول (لا استثناء)
- [ ] منع الوصول الافتراضي (deny by default)
- [ ] policies لكل عملية: SELECT, INSERT, UPDATE, DELETE
- [ ] اختبار الـ policies بمستخدمين وهميين

#### مثال على RLS قوي:
```sql
-- جدول السجل الطبي
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى سجله فقط
CREATE POLICY "users_view_own_records"
  ON medical_records FOR SELECT
  USING (auth.uid() = user_id);

-- الأخصائي يرى سجلات مرضاه فقط (وفي الاستشارة فقط)
CREATE POLICY "specialists_view_active_consultations"
  ON medical_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations c
      JOIN specialists s ON s.id = c.specialist_id
      WHERE s.user_id = auth.uid()
      AND c.user_id = medical_records.user_id
      AND c.status IN ('active', 'scheduled')
      AND c.scheduled_at >= NOW() - INTERVAL '7 days'
    )
  );

-- الإدارة لا ترى السجلات الطبية إطلاقاً (حتى الأدمن)
-- (إلا في حالة شكوى محددة عبر procedure خاص)
```

---

### 📋 Audit Logging

**كل وصول لبيانات طبية يُسجَّل.**

#### يجب تسجيل:
- [ ] من قرأ السجل (user_id + timestamp)
- [ ] من عدّل (قبل/بعد)
- [ ] من حذف
- [ ] من حاول الوصول وفشل
- [ ] محاولات تسجيل الدخول
- [ ] استرجاع كلمة المرور
- [ ] تغيير الإعدادات الأمنية

#### الجدول:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ
);

-- الـ logs immutable (لا تُعدّل ولا تُحذف)
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
```

---

### 🚫 منع الهجمات الشائعة

#### SQL Injection:
- ✅ Supabase يستخدم prepared statements تلقائياً
- ✅ لا تنشئ SQL strings يدوياً
- ❌ ممنوع: `query("SELECT * FROM users WHERE id = '" + id + "'")`
- ✅ صحيح: `supabase.from('users').select().eq('id', id)`

#### XSS (Cross-Site Scripting):
- ✅ React/Next.js يفلتر تلقائياً
- ⚠️ احذر من `dangerouslySetInnerHTML`
- ✅ استخدم DOMPurify إذا اضطررت
- ✅ Content Security Policy headers

#### CSRF:
- ✅ Next.js Server Actions محمية افتراضياً
- ✅ SameSite=Strict cookies
- ✅ Origin validation

#### Rate Limiting:
- [ ] على API endpoints (Vercel + Upstash)
- [ ] على المصادقة (5/min)
- [ ] على إنشاء الطلبات (10/min)
- [ ] على رفع الملفات (3/min)

#### Brute Force:
- [ ] Captcha بعد ٣ محاولات فاشلة
- [ ] حظر IP بعد ١٠ محاولات
- [ ] إشعار المستخدم بمحاولات مشبوهة

---

### 📁 رفع الملفات (File Uploads)

**نقطة ضعف شائعة — يجب الحذر القصوى.**

#### قواعد إجبارية:
- [ ] **التحقق من نوع الملف** بـ magic number (لا الـ extension)
- [ ] **حد أقصى للحجم** (٥ MB للصور، ١٠ MB للـ PDF)
- [ ] **تخزين في Supabase Storage** (لا الخادم نفسه)
- [ ] **أسماء عشوائية** (لا أسماء المستخدم)
- [ ] **مسح فيروسات** قبل التخزين (ClamAV عبر Edge Function)
- [ ] **أنواع مسموحة فقط:**
  - الصور: jpg, png, webp
  - الوثائق: pdf
  - **لا exe, zip, rar, js**
- [ ] **عدم تنفيذ الملفات** (Content-Disposition: attachment)
- [ ] **HTTPS only** للوصول

#### مثال:
```typescript
async function uploadDocument(file: File, userId: string) {
  // ✅ تحقق من النوع
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('نوع الملف غير مسموح')
  }
  
  // ✅ تحقق من الحجم
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('الملف كبير جداً')
  }
  
  // ✅ اسم عشوائي
  const filename = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
  
  // ✅ رفع لـ Supabase Storage
  const { data, error } = await supabase.storage
    .from('medical-docs')
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  return data.path
}
```

---

### 🔑 إدارة الأسرار (Secrets Management)

#### القاعدة الذهبية:
**لا تضع أسراراً في الكود أبداً.** ولا في GitHub، ولا في Slack، ولا في أي مكان عام.

#### التخزين الصحيح:

**في التطوير:**
```bash
# .env.local (مُستبعد من git)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # ⚠️ سرّي
DATABASE_URL=postgresql://xxx
SMS_API_KEY=xxx
ENCRYPTION_KEY=xxx  # ⚠️ سرّي للغاية
```

**في الإنتاج:**
- Vercel: Settings → Environment Variables
- Supabase: Settings → Vault
- لا تنسخها لـ Slack/Email أبداً

#### إذا تم تسريب مفتاح:
1. **اعتبره مكشوفاً فوراً** — حتى لو لم تتأكد
2. أعد توليده فوراً (Supabase: Settings → API → Regenerate)
3. حدّث Vercel env vars
4. أعد النشر
5. راجع الـ logs لأي وصول مشبوه

---

### 🌐 الامتثال القانوني (Compliance)

#### قوانين العراق (٢٠٢٦):
- ⚠️ **لا توجد قوانين شاملة لحماية البيانات الرقمية بعد**
- ⚠️ لكن قانون العقوبات يحمي السرية الطبية
- ⚠️ الأخصائيون ملزمون بقسم أبقراط

#### المعايير الدولية الموصى بها:

##### HIPAA (أمريكا) — مرجع للتطبيقات الطبية:
- [ ] BAA (Business Associate Agreement) مع كل مزوّد
- [ ] تشفير البيانات في الراحة وأثناء النقل
- [ ] Access controls
- [ ] Audit trails
- [ ] Breach notification (٧٢ ساعة)
- [ ] Risk assessments دورية

##### GDPR (أوروبا) — للمستخدمين الأوروبيين:
- [ ] موافقة صريحة قبل جمع البيانات
- [ ] حق الوصول (المستخدم يطلب نسخة من بياناته)
- [ ] حق المحو ("right to be forgotten")
- [ ] Data Portability
- [ ] Privacy by Design
- [ ] DPO (Data Protection Officer)

##### PCI-DSS (للدفع):
- [ ] لا تخزّن أرقام البطاقات
- [ ] استخدم بوابات معتمدة (لا تعالج البطاقة بنفسك)
- [ ] tokenization

#### للعراق تحديداً:
- [ ] تخزين البيانات على خوادم في **منطقة قريبة** (Frankfurt مقبول)
- [ ] محامي متخصص بالقانون الطبي العراقي
- [ ] اتفاقية مع نقابة الأطباء العراقية
- [ ] ترخيص من وزارة الصحة (إن لزم)

---

### 🔍 اختبار الاختراق (Penetration Testing)

**قبل الإطلاق العام، يجب اختبار اختراق احترافي.**

#### ما يُختبر:
- [ ] OWASP Top 10
- [ ] Authentication vulnerabilities
- [ ] Authorization bypasses
- [ ] SQL injection
- [ ] XSS / CSRF
- [ ] File upload exploits
- [ ] API security
- [ ] Mobile app security

#### مزوّدون موصى بهم:
- HackerOne (bug bounty)
- Cobalt.io (pen testing)
- Local: شركات أمن سيبراني عراقية/خليجية

#### التكلفة:
- Pen test أساسي: $٥،٠٠٠ - $١٥،٠٠٠
- Bug bounty مستمر: $١٠٠+/bug

---

### 🚨 الاستجابة للحوادث (Incident Response)

#### قبل الحادث:
- [ ] خطة استجابة موثّقة
- [ ] فريق مسؤول (CTO + Legal + Comms)
- [ ] قائمة اتصالات طوارئ
- [ ] backup يومي مختبر

#### أثناء الحادث:
1. **احتواء الضرر** (عزل النظام المُخترق)
2. **تقييم الأثر** (كم مستخدم، أي بيانات)
3. **إبلاغ المتضرّرين** (خلال ٧٢ ساعة)
4. **توثيق** (logs + timeline)
5. **إصلاح الثغرة**
6. **استعادة من backup** (إن لزم)

#### بعد الحادث:
- [ ] Post-mortem تحليل
- [ ] تحديث الإجراءات
- [ ] تدريب الفريق
- [ ] إعلان شفّاف للمستخدمين

---

### 📊 المراقبة الأمنية (Security Monitoring)

#### ما يُراقَب:
- [ ] محاولات تسجيل دخول مشبوهة
- [ ] استعلامات غير عادية (queries كبيرة)
- [ ] محاولات وصول غير مصرّح
- [ ] تغييرات في إعدادات الأمان
- [ ] حركة شبكة شاذة

#### الأدوات:
- **Sentry** — error tracking
- **Vercel Analytics** — traffic
- **Supabase logs** — DB activity
- **Cloudflare** — DDoS detection
- **Logtail/Better Stack** — log aggregation

---

### ✅ قائمة فحص قبل الإطلاق

#### يجب التحقق من كل بند قبل أول مستخدم حقيقي:

- [ ] HTTPS فقط (لا HTTP)
- [ ] All RLS policies tested
- [ ] لا مفاتيح API في الكود
- [ ] لا console.log لبيانات حساسة
- [ ] Rate limiting مفعّل
- [ ] Backup يعمل تلقائياً
- [ ] Backup restore تم اختباره
- [ ] Audit logging مفعّل
- [ ] Error tracking يعمل (Sentry)
- [ ] Monitoring dashboards جاهزة
- [ ] Privacy Policy منشورة
- [ ] Terms of Service منشورة
- [ ] Cookie consent (إن لزم)
- [ ] Pen test تم إجراؤه
- [ ] Pen test issues تم إصلاحها
- [ ] فريق متاح ٢٤/٧ للحوادث
- [ ] خطة استجابة موثّقة
- [ ] محامي تم استشارته

---

## 🚫 ما يجب تجنّبه إطلاقاً

### الأخطاء القاتلة:

❌ **عدم تفعيل RLS** — أي مستخدم يقرأ بيانات أي مستخدم آخر
❌ **تخزين كلمات المرور كنص** — يحدث أكثر مما تتخيّل
❌ **رفع `.env` لـ GitHub** — يفضح المفاتيح للعالم
❌ **الثقة بالـ frontend** — كل تحقق يجب تكراره في الـ backend
❌ **استخدام `eval()` أو `dangerouslySetInnerHTML`** — XSS مضمون
❌ **عدم تحديث المكتبات** — ثغرات معروفة
❌ **اختبار في الإنتاج** — استخدم staging environment
❌ **النسخ الاحتياطي على نفس الخادم** — مخاطر مضاعفة
❌ **مشاركة حسابات إدارة** — كل أدمن له حساب فردي
❌ **Magic Links بدون تتبع** — إعادة الإرسال infinite

---

## 📞 موارد إضافية

- 📖 [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 📖 [Supabase Security Guide](https://supabase.com/docs/guides/auth)
- 📖 [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)
- 📖 [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

<div align="center">

**الأمان ليس ميزة. هو شرط أساسي لاستحقاق ثقة المستخدمين.**

</div>

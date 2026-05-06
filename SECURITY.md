# 🔐 Security Policy

## دعم النسخ

| الإصدار | الدعم |
|---------|--------|
| 0.2.x   | ✅ نعم |
| 0.1.x   | ⚠️ إصلاحات حرجة فقط |
| < 0.1   | ❌ لا |

---

## 🚨 الإبلاغ عن ثغرات

⚠️ **لا تفتح Issue عام لمشاكل أمنية.** هذا قد يعرّض المستخدمين للخطر.

### الطريقة الصحيحة:

١. **أرسل تفاصيل لـ:** `security@spirmedical.iq`
٢. **ضمّن:**
   - وصف الثغرة
   - خطوات إعادة إنتاجها
   - الأثر المحتمل
   - PoC إن أمكن (بدون استغلال فعلي)

### ما تتوقّعه:
- ✅ رد خلال ٤٨ ساعة
- ✅ تحديث حالة كل أسبوع
- ✅ شكر عام (إن وافقت) بعد الإصلاح

---

## 🛡️ ميزات الأمان المُفعّلة

### Application Layer
- ✅ HTTPS إجباري عبر Vercel
- ✅ Security Headers (X-Frame-Options, HSTS, CSP-ready)
- ✅ Input validation (Zod)
- ✅ XSS prevention (React)
- ✅ CSRF (Server Actions محمية افتراضياً)
- ✅ Rate limiting (in-memory MVP)
- ✅ Structured logging مع تنظيف بيانات حساسة

### Data Layer
- ✅ Row-Level Security على Supabase
- ✅ Encryption AES-256-GCM للملاحظات الطبية
- ✅ Audit log immutable (no UPDATE/DELETE من المستخدمين)
- ✅ Triggers لمنع تعديل audit logs
- ✅ Encrypted at rest (Supabase managed)
- ✅ Encrypted in transit (TLS 1.3)

### Auth Layer
- ✅ Phone OTP (لا كلمات مرور)
- ✅ JWT مع تجديد تلقائي
- ✅ Session في httpOnly cookies
- ✅ Middleware لحماية المسارات

---

## ⚠️ ميزات الأمان المطلوبة قبل الإنتاج

| البند | الحالة | الأولوية |
|------|--------|----------|
| 2FA للأدمن | ❌ مفقود | 🔴 حرج |
| Rate limit عبر Redis (موزّع) | ⚠️ in-memory فقط | 🔴 حرج |
| Pen testing احترافي | ❌ لم يتم | 🔴 حرج |
| Bug bounty program | ❌ لا | 🟡 موصى به |
| Secrets rotation | ❌ يدوي | 🟡 موصى به |
| WAF (Cloudflare) | ❌ غير مُفعّل | 🟡 موصى به |
| Backup encryption verification | ❌ غير مُختبَر | 🟡 موصى به |

---

## 📋 Checklist للمطوّرين

### عند كل Pull Request
- [ ] لا توجد `console.log` لبيانات حساسة
- [ ] لا توجد API keys في الكود
- [ ] Inputs محقَّقة بـ Zod
- [ ] RLS policies مختبرة لو غُيّرت الـ schema
- [ ] الميزات الحساسة تُسجَّل في audit log

### عند نشر إصدار جديد
- [ ] `npm audit` بدون vulnerabilities عالية
- [ ] Environment variables محدَّثة في Vercel
- [ ] Supabase backups مفعّلة
- [ ] Logs تعمل (Sentry/Vercel)

---

## 🔑 إدارة الأسرار

### القاعدة الذهبية
**لا تضع أسراراً في الكود أبداً.** ولا في GitHub، ولا في Slack.

### إذا تسرّب مفتاح:
١. **اعتبره مكشوفاً فوراً** (حتى لو لم تتأكد)
٢. **Regenerate** فوراً:
   - Supabase: Settings → API → Generate new keys
   - Twilio: Console → Auth Token → Regenerate
   - Vercel: Settings → Environment Variables
٣. **حدّث Vercel env vars**
٤. **Redeploy**
٥. **راجع logs** لأي وصول مشبوه

### دوران المفاتيح (Rotation)
- 🔄 Supabase service_role: كل ٦ شهور
- 🔄 ENCRYPTION_KEY: ⚠️ **لا يُغيّر أبداً** (البيانات المشفّرة لن تُفَك)
- 🔄 SMS provider tokens: عند تغيير المزوّد

---

## 📞 جهات الاتصال

| السبب | البريد |
|------|---------|
| ثغرات أمنية | security@spirmedical.iq |
| استفسارات تطوير | dev@spirmedical.iq |
| استفسارات قانونية | legal@spirmedical.iq |
| دعم عام | support@spirmedical.iq |

---

## 📚 موارد

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)

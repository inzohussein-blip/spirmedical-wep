# 🚨 Production Runbook

> دليل العمليات للإنتاج — ما يجب فعله عند الحوادث

## 📞 جهات الاتصال

| الدور | الشخص | البريد |
|------|------|------|
| Engineering Lead | حسين | info@spirmedical.iq |
| DevOps | حسين | support@spirmedical.iq |
| Security | حسين | security@spirmedical.iq |

## 🔥 سيناريوهات الحوادث

### 1) الموقع لا يفتح (Down)

**التشخيص:**
```bash
# 1. تحقق من Vercel status
curl https://spirmedical-wep.vercel.app/api/health

# 2. تحقق من Vercel dashboard
# https://vercel.com/inzohussein-blips-projects/spirmedical-wep

# 3. تحقق من آخر deployment
# هل هناك commit جديد كسر شيئاً؟
```

**الإجراء:**
1. اذهب لـ Vercel → Deployments → Last working deploy
2. اضغط `⋯` → `Promote to production` (rollback فوري)
3. أبلغ المستخدمين عبر Twitter/Email
4. افحص الـ logs: Vercel → Logs → Errors
5. أصلح في PR منفصل، اختبر، redeploy

### 2) قاعدة البيانات بطيئة

**التشخيص:**
```bash
# Supabase Dashboard → Logs → Slow queries
# ابحث عن queries > 1000ms
```

**الإجراء:**
1. حدد الـ query البطيء
2. أضف index إن لزم
3. تأكد من RLS policies كفؤة
4. إذا استمرت — Supabase plan upgrade

### 3) معدل خطأ مرتفع (Error Spike)

**التشخيص:**
- Sentry → Issues → Last hour
- Vercel → Logs → Filter by 5xx

**الإجراء:**
1. هل خطأ في commit جديد؟ → rollback
2. هل خطأ في dependency؟ → pin إلى آخر نسخة عاملة
3. هل خطأ في Supabase? → تواصل مع الدعم
4. أبلغ المستخدمين

### 4) هجوم DDoS / Spam

**التشخيص:**
- Vercel → Analytics → Traffic spike
- معدل ratelimit hits > 50%

**الإجراء:**
1. فعّل Vercel Firewall rules
2. أضف Cloudflare في الأمام (إذا لم يكن مُفعّلاً)
3. شدّد rate limits في `src/lib/rate-limit.ts`
4. احظر IPs المُسيئة في Vercel firewall

### 5) تسرّب بيانات (Suspected Breach)

**فوراً:**
1. غيّر `ENCRYPTION_KEY` (مع plan لإعادة تشفير البيانات)
2. غيّر `SUPABASE_SERVICE_ROLE_KEY` من Supabase
3. أبطل كل sessions في Supabase Auth
4. راجع `audit_logs` للنشاط المشبوه

**خلال 24 ساعة:**
5. أبلغ المستخدمين المتأثرين
6. أبلغ السلطات (إن لزم وفقاً للقانون)
7. كتابة post-mortem

## 🔄 Rollback إجراءات

### Rollback سريع (Vercel)
```
Vercel Dashboard → Deployments → Last working → Promote
```

### Rollback لـ DB migration
```sql
-- داخل supabase/migrations/rollback_*.sql
BEGIN;
  -- alter/drop statements
COMMIT;
```

## 📊 Monitoring

### Health Checks
- `GET /api/health` — يجب أن يعيد 200 وقت < 500ms

### Metrics للمراقبة
| المقياس | الحد | التنبيه |
|---------|------|---------|
| Response time p95 | < 1s | إذا > 2s |
| Error rate | < 0.5% | إذا > 1% |
| DB connections | < 80% | إذا > 90% |
| Memory usage | < 70% | إذا > 85% |

### تنبيهات (Alerts)
- Vercel → Notifications → Email/Slack
- Sentry → Project Settings → Alerts

## 🗓️ Maintenance Windows

**جدول الصيانة:**
- DB migrations: الجمعة 3-5 ص (أقل ترافيك)
- Major releases: الأحد 2-4 ص

**قبل أي تغيير في الإنتاج:**
1. ✅ Build نجح في CI
2. ✅ كل الـ tests نجحت
3. ✅ Preview deployment تم اختباره
4. ✅ Backup حديث (آخر 24 ساعة)
5. ✅ Rollback plan جاهز

## 🧪 اختبارات قبل الإطلاق

### Smoke Tests
```bash
# الموقع يفتح
curl -f https://spirmedical-wep.vercel.app/api/health

# الصفحات الرئيسية تستجيب
for page in / /gate /guest /legal/terms; do
  curl -fsI "https://spirmedical-wep.vercel.app$page" | head -1
done
```

### Load Test (اختياري)
```bash
# k6 أو artillery
k6 run --vus 50 --duration 30s loadtest.js
```

## 📝 Post-Mortem Template

بعد أي حادثة، اكتب post-mortem في `docs/post-mortems/YYYY-MM-DD.md`:

```markdown
# حادثة: [العنوان]
## التاريخ: YYYY-MM-DD
## المدّة: HH:MM ساعات
## التأثير: عدد المستخدمين المتأثرين

## ماذا حدث؟
## السبب الجذري
## الحل الذي طُبّق
## ماذا تعلّمنا؟
## Action Items
- [ ] ...
```

# تدقيقُ شاشات الهاتف — محلّياً وبلا إنتاج

أداةُ القياس التي كُشفت بها عيوبُ الهاتف في هذا المستودع (فيضٌ أفقيّ، أهدافُ لمسٍ
صغيرة، خطٌّ دون 12px، حقولٌ تُكبّر iOS). تعمل على **خادمٍ يحاكي Supabase**، فلا
حسابَ تجريبيّاً في الإنتاج ولا بيانات حقيقيّة.

| الملف | ما يفعل |
|---|---|
| `mock-supabase.mjs` | يحاكي `auth/v1` و`rest/v1` على المنفذ 54399 ببياناتٍ ثابتة (`FIX`). `MOCK_ROLE=specialist` لجلسة مختصّ |
| `session-cookie.mjs` | يطبع كعكة جلسة `@supabase/ssr` للمستخدم الوهميّ |
| `audit.mjs` | Playwright بعرضَي 360 و390: لقطةٌ + `report.json` لكلّ صفحة |
| `up.sh` / `down.sh` | تشغيلُ الخادمين وإيقافُهما |

## التشغيل

```bash
npm --prefix tools/mobile-audit install          # playwright-core وحده، لا متصفّح
# بناءٌ بمتغيّرات المحاكاة (مرّةً لكلّ تغيير في الشيفرة)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-0000000000000000 \
SUPABASE_SERVICE_ROLE_KEY=mock-service-key-00000000000000 \
ENCRYPTION_KEY=$(printf '0%.0s' {1..64}) NEXT_PUBLIC_SITE_TYPE=all npm run build

MOCK_ROLE=patient tools/mobile-audit/up.sh
SB_COOKIE=$(MOCK_ROLE=patient node tools/mobile-audit/session-cookie.mjs) \
  node tools/mobile-audit/audit.mjs /dashboard,/appointments/new,/account/inbox .audit/patient
tools/mobile-audit/down.sh
```

المتصفّح: `CHROMIUM_PATH` (الافتراضيّ `/opt/pw-browsers/chromium` في بيئة Claude Code).
المخرجات في `.audit/` (متجاهَلة في git).

## قراءةُ التقرير

- `overCount` > 0 — عنصرٌ يتجاوز عرض الشاشة (فيضٌ أفقيّ).
- `tiny` — هدفُ لمسٍ دون 24px؛ `small` — دون 40px.
- `fonts` — نصٌّ دون 12px، مجمَّعٌ بالحجم.
- `zoom` — حقلٌ خطُّه دون 16px (iOS يُكبّر الصفحة عند التركيز).
- جدولٌ تسأله الصفحةُ وليس في `FIX` يُرجع `[]` — أضِفه إن ظهرت الشاشةُ فارغة
  (سجلُّ الطلبات في `.audit/requests.log`).

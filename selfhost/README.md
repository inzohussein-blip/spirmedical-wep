# 🖥️ تشغيلُ الموقع على جهازك أو خادمٍ مستأجر — احتياطيٌّ ثالث

الموقعُ نفسُه (الكودُ من `main` وقاعدةُ Supabase نفسُها) يعمل على أيّ جهازٍ فيه Node 24 أو Docker. **البياناتُ لا تضيع** لأنّها في
Supabase لا على الجهاز، و**العميلُ لا يلاحظ**: بوّابةُ التبديل (`edge/failover`) تسأل Vercel ثمّ Netlify ثمّ جهازَك، والعنوانُ في
متصفّحه `www.spir-medical.com` دائماً — فجلستُه وما حفظه باقٍ.

```
المتصفّح ── www.spir-medical.com ──▶ بوّابة Cloudflare
                                     ├─▶ Vercel                    (أوّلاً)
                                     ├─▶ Netlify                   (ثانياً)
                                     └─▶ origin.spir-medical.com   (ثالثاً: جهازُك عبر النفق)
```

## 1) المتغيّرات — مرّةً واحدة

أنشئ في **جذر المستودع** ملفّ `.env.production` وانسخ إليه متغيّراتِ الإنتاج من Vercel (Settings ← Environment Variables)،
بالأسماء نفسِها في `.env.example`. الأساسيّة: `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` و`SUPABASE_SERVICE_ROLE_KEY`
و`ENCRYPTION_KEY` و`NEXT_PUBLIC_SITE_URL=https://www.spir-medical.com` و`CRON_SECRET` و`EDGE_PROXY_SECRET`. **لا ترفعه إلى GitHub**
(`.gitignore` يمنعه).

## 2) النفق — يوصل جهازَك إلى الإنترنت بلا فتح منافذ ولا عنوانٍ ثابت

1. Cloudflare ← **Zero Trust** ← Networks ← **Tunnels** ← Create a tunnel ← Cloudflared ← سمِّه `spir-selfhost`.
2. انسخ **الرمز** (Token) الذي يعرضه.
3. **Public Hostname**: `origin` . `spir-medical.com` ← Service: `http://app:3000` مع Docker، أو `http://localhost:3000` بدونه.

(يتطلّب أن يكون النطاقُ على Cloudflare — الخطوةُ نفسُها التي تحتاجها بوّابةُ التبديل.)

## 3أ) التشغيل بـ Docker — الأسهل، على الخادم المستأجر أو جهازك

ثبّت Docker (على Windows/Mac: Docker Desktop). ثمّ في `selfhost/.env` ضع سطراً واحداً: `TUNNEL_TOKEN=<الرمز>`، وشغّل من جذر المستودع:

```bash
docker compose -f selfhost/docker-compose.yml up -d --build
```

يبني الموقعَ ويشغّله مع النفق، ويُعيد تشغيلَهما بعد إعادة تشغيل الجهاز. للتحديث بعد كلّ دمجٍ في `main`:

```bash
git pull && docker compose -f selfhost/docker-compose.yml up -d --build
```

## 3ب) التشغيل بلا Docker

ثبّت **Node 24** و**cloudflared**، ثمّ:

- **Linux / Mac:** `bash selfhost/start.sh` — وفي نافذةٍ ثانية: `cloudflared tunnel run --token <الرمز>`
- **Windows:** `powershell -ExecutionPolicy Bypass -File selfhost\start.ps1` — وفي نافذةٍ ثانية: `cloudflared.exe tunnel run --token <الرمز>`

`--no-build` (أو `-NoBuild`) يشغّل آخرَ بناءٍ بلا إعادة بناء. ولتشغيل cloudflared خدمةً دائمة: `cloudflared service install <الرمز>`.

## 4) التجربة

- على الجهاز: افتح `http://127.0.0.1:3000` ← الموقع.
- من أيّ مكان: `https://origin.spir-medical.com/about` ← **يحوّلك إلى `www.spir-medical.com`** (مقصود: الزائرُ لا يبقى على نطاق
  الاحتياط، والبوّابةُ وحدها تطلبه مباشرة).
- حين تتوقّف Vercel وNetlify: `curl -I https://www.spir-medical.com` ← `x-spir-origin: origin.spir-medical.com`.

## ما يجب معرفته

- **الجهازُ يجب أن يبقى مشغّلاً ومتّصلاً**؛ انقطاعُ الكهرباء أو الإنترنت يوقفه (والبوّابةُ تتخطّاه إلى غيره). الخادمُ المستأجر أثبت.
- **المهامُّ المجدولة** (التذكيرات، الرفضُ التلقائيّ) لا تعمل على جهازك: يشغّلها GitHub Actions على النطاق، فتصل المنصّةَ العاملةَ
  مرّةً واحدة — جهازَك حين يكون هو العامل.
- **الذاكرة:** البناءُ يحتاج نحو 4GB؛ التشغيلُ أقلُّ من 512MB.
- كلُّ دمجٍ في `main` يصل Vercel وNetlify تلقائياً، أمّا جهازُك فبـ`git pull` وإعادة البناء.

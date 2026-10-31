#!/usr/bin/env bash
# 🖥️ تشغيلُ الموقع بلا Docker على Linux أو Mac (selfhost/README.md).
#   bash selfhost/start.sh          ← يبني ثمّ يشغّل على المنفذ 3000
#   bash selfhost/start.sh --no-build  ← يشغّل آخرَ بناء
# يحتاج Node 24 و`.env.production` في جذر المستودع (انسخه من Vercel).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  echo "✗ لا يوجد .env.production في جذر المستودع — انسخ متغيّرات الإنتاج من Vercel (selfhost/README.md)" >&2
  exit 1
fi
major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$major" -lt 24 ]; then
  echo "✗ يلزم Node 24 أو أحدث (الموجود: $(node -v 2>/dev/null || echo لا شيء))" >&2
  exit 1
fi

if [ "${1:-}" != "--no-build" ]; then
  npm ci --no-audit --no-fund
  NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1 npm run build
  # النسخةُ المستقلّة لا تحمل public ولا الملفّاتِ الساكنة
  rm -rf .next/standalone/public .next/standalone/.next/static
  cp -r public .next/standalone/public
  cp -r .next/static .next/standalone/.next/static
fi

# المتغيّراتُ للخادم عند التشغيل (البناءُ قرأها وحده)
set -a; . ./.env.production; set +a
export NODE_ENV=production PORT="${PORT:-3000}" HOSTNAME="${HOSTNAME_BIND:-127.0.0.1}"
echo "✓ الموقع على http://127.0.0.1:$PORT — والنفقُ (cloudflared) يوصله إلى origin.spir-medical.com"
exec node .next/standalone/server.js

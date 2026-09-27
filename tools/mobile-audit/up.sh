#!/bin/bash
# يشغّل خادمَ Supabase الوهميّ وخادمَ التطبيق (من بناءٍ قائم: npm run build بالمتغيّرات أدناه)
# الاستعمال: MOCK_ROLE=patient|specialist tools/mobile-audit/up.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
OUT=${AUDIT_OUT:-$ROOT/.audit}
mkdir -p "$OUT"

MOCK_LOG="$OUT/requests.log" nohup node "$HERE/mock-supabase.mjs" > "$OUT/mock.out" 2>&1 &

cd "$ROOT"
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399
export NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-0000000000000000
export SUPABASE_SERVICE_ROLE_KEY=mock-service-key-00000000000000
export ENCRYPTION_KEY=$(printf '0%.0s' {1..64})
export NEXT_PUBLIC_SITE_TYPE=all
nohup npx next start -p 3917 > "$OUT/next.out" 2>&1 &

for _ in $(seq 1 45); do
  curl -s -o /dev/null http://127.0.0.1:3917/robots.txt \
    && curl -s -o /dev/null http://127.0.0.1:54399/auth/v1/user \
    && { echo up; exit 0; }
  sleep 1
done
echo "not up — see $OUT/next.out and $OUT/mock.out"; exit 1

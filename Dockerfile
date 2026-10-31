# 🖥️ الاستضافة الذاتيّة — الموقعُ نفسُه على جهازك أو خادمٍ مستأجر، نسخةً احتياطيّةً ثالثة بعد Vercel وNetlify.
# الدليل: selfhost/README.md. التشغيل: docker compose -f selfhost/docker-compose.yml up -d --build
#
# المتغيّراتُ من `.env.production` في جذر المستودع (انسخها من Vercel). يقرؤها `next build` (قيمُ NEXT_PUBLIC_ تُضمَّن
# في الواجهة عند البناء) ويقرؤها الخادمُ عند التشغيل عبر env_file في docker-compose.

FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S spir && adduser -S spir -G spir
# النسخةُ المستقلّة لا تحمل public ولا الملفّاتِ الساكنة — تُنسخ بجانبها
COPY --from=build --chown=spir:spir /app/.next/standalone ./
COPY --from=build --chown=spir:spir /app/.next/static ./.next/static
COPY --from=build --chown=spir:spir /app/public ./public
USER spir
EXPOSE 3000
# حيّ؟ robots.txt لا يمسّ القاعدة — فعطلُ Supabase لا يُعيد تشغيلَ الحاوية بلا داعٍ
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "server.js"]

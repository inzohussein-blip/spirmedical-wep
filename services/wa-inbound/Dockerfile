# بوّابة واتساب الواردة — Railway يبنيها من هذا المجلّد
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
# جلسةُ واتساب على القرص الدائم (Railway Volume على /data) — وإلّا يُطلب QR بعد كلّ إعادة تشغيل
ENV AUTH_DIR=/data/auth
CMD ["node", "src/index.mjs"]

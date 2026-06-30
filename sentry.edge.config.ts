/**
 * ═══════════════════════════════════════════════════════════════
 * Sentry — Edge Configuration
 * يعمل في Edge runtime (middleware)
 * ═══════════════════════════════════════════════════════════════
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_spirmedical_SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // ─── بيئة التشغيل ───
    environment: process.env.NODE_ENV ?? 'production',

    // ─── معدّل تتبّع الأداء (أقل في Edge لتوفير الاستدعاءات) ───
    tracesSampleRate: 0.05,

    // ─── فلترة الأخطاء ───
    beforeSend(event) {
      if (event.exception?.values?.[0]?.type === 'NEXT_REDIRECT') {
        return null;
      }
      return event;
    },
  });
}

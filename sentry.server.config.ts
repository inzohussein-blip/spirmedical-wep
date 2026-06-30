/**
 * ═══════════════════════════════════════════════════════════════
 * Sentry — Server Configuration
 * يعمل في Node.js runtime (server-side)
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
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',

    // ─── معدّل تتبّع الأداء ───
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // ─── فلترة الأخطاء ───
    beforeSend(event, hint) {
      const error = hint.originalException;

      // تجاهل redirects (next/navigation)
      if (
        error instanceof Error &&
        (error.message === 'NEXT_REDIRECT' ||
          error.message.includes('NEXT_NOT_FOUND'))
      ) {
        return null;
      }

      // تجاهل أخطاء next/navigation المُصنَّفة
      if (event.exception?.values?.[0]?.type === 'NEXT_REDIRECT') {
        return null;
      }

      return event;
    },

    // ─── بيانات إضافية للسياق ───
    initialScope: {
      tags: {
        platform: 'spir-medical',
        region: 'iraq-middle-euphrates',
      },
    },
  });
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 🌐 Client-Side Instrumentation — Sentry v10+
 * ═══════════════════════════════════════════════════════════════
 * يجمع محتوى sentry.client.config.ts هنا مباشرة (v10+ requirement)
 * بعد هذا الملف يمكن حذف sentry.client.config.ts
 * ═══════════════════════════════════════════════════════════════
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_spirmedical_SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// ─── Init ────────────────────────────────────────────────────
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // ─── بيئة التشغيل ───
    environment: process.env.NODE_ENV ?? 'production',
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',

    // ─── معدّل تتبّع الأداء ───
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // ─── Session Replay ───
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true,
      }),
    ],

    // ─── فلترة الأخطاء ───
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error instanceof Error) {
        if (
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Load failed') ||
          error.message.includes('ChunkLoadError')
        ) {
          return null;
        }
      }
      if (event.exception?.values?.[0]?.type === 'NEXT_REDIRECT') {
        return null;
      }
      return event;
    },

    // ─── تجاهل URLs معيّنة ───
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
}

// ─── Navigation tracking (Sentry v10.62+) ────────────────────
let _captureNav: ((href: string, nav: string) => void) | undefined;
import('@sentry/nextjs').then((mod) => {
  _captureNav = mod.captureRouterTransitionStart;
}).catch(() => { /* no-op */ });

export const onRouterTransitionStart = (
  href: string,
  navigationType: string
): void => {
  _captureNav?.(href, navigationType);
};

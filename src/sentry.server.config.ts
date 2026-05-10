/**
 * Sentry — Server-side error tracking
 */

import { env } from '@/lib/env';

async function initSentry() {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) return;

  // @ts-ignore
  const Sentry = await import('@sentry/nextjs').catch(() => null);
  if (!Sentry) return;

  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,

    beforeSend(event: Record<string, unknown>) {
      // إخفاء بيانات حساسة من الـ server logs
      const contexts = event.contexts as Record<string, unknown> | undefined;
      const runtime = contexts?.runtime as Record<string, unknown> | undefined;
      if (runtime?.name === 'node') {
        const extra = event.extra as Record<string, unknown> | undefined;
        if (extra?.body) delete extra.body;
      }
      return event;
    },
  });
}

initSentry();

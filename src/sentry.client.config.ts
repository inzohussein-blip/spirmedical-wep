/**
 * Sentry — Client-side error tracking
 *
 * مُفعّل فقط إذا توفّر NEXT_PUBLIC_SENTRY_DSN في env.
 *
 * للتفعيل:
 *   1. أنشئ مشروع على https://sentry.io
 *   2. أضف NEXT_PUBLIC_SENTRY_DSN لـ Vercel env vars
 *   3. أضف SENTRY_AUTH_TOKEN للـ source maps
 *   4. npm install @sentry/nextjs
 */

import { env } from '@/lib/env';

// import dynamically to avoid bundling Sentry when not in use
async function initSentry() {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  // @ts-ignore — sentry is optional dependency
  const Sentry = await import('@sentry/nextjs').catch(() => null);

  if (!Sentry) {
    // eslint-disable-next-line no-console
    console.warn('[sentry] DSN configured but @sentry/nextjs not installed');
    return;
  }

  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: env.NODE_ENV,

    // أخذ عينة 10% فقط في الإنتاج
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // لا تُسجّل بيانات حساسة
    sendDefaultPii: false,

    // مرشحات
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
    ],

    beforeSend(event: Record<string, unknown>) {
      // احذف بيانات حساسة قبل الإرسال
      const req = event.request as Record<string, unknown> | undefined;
      if (req?.cookies) {
        delete req.cookies;
      }
      const user = event.user as Record<string, unknown> | undefined;
      if (user?.email) {
        user.email = '[REDACTED]';
      }
      return event;
    },
  });
}

if (typeof window !== 'undefined') {
  initSentry();
}

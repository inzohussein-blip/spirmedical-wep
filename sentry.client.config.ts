/**
 * ═══════════════════════════════════════════════════════════════
 * Sentry — Client Configuration
 * يعمل في المتصفّح (client-side)
 * ═══════════════════════════════════════════════════════════════
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// لا تُفعّل Sentry إن لم يكن الـ DSN موجوداً
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // ─── بيئة التشغيل ───
    environment: process.env.NODE_ENV ?? 'production',
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',

    // ─── معدّل تتبّع الأداء ───
    // 10% فقط في الإنتاج (يوفّر الحصّة المجانية)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // ─── Session Replay (تسجيل الجلسات) ───
    // 0% عادي، 100% عند حدوث خطأ
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        // إخفاء البيانات الحسّاسة
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true, // إخفاء كل حقول الإدخال
      }),
    ],

    // ─── فلترة الأخطاء ───
    beforeSend(event, hint) {
      const error = hint.originalException;

      // تجاهل أخطاء الشبكة العادية
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

      // تجاهل أخطاء next/navigation (redirects)
      if (event.exception?.values?.[0]?.type === 'NEXT_REDIRECT') {
        return null;
      }

      return event;
    },

    // ─── تجاهل URLs معيّنة ───
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
}

'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * ═══════════════════════════════════════════════════════════════
 * Web Vitals Reporter (V25.4)
 * ═══════════════════════════════════════════════════════════════
 *
 * يُسجّل Core Web Vitals (LCP, FID, CLS, INP, FCP, TTFB)
 * يُرسلها لـ Vercel Analytics (موجود مسبقاً)
 * + يُسجّلها في console في development
 * ═══════════════════════════════════════════════════════════════
 */

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: Math.round(metric.value * 100) / 100,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // إرسال لـ Vercel Analytics (تلقائي)
    // إذا أردت تحليلات إضافية، يمكن إرسالها لـ:
    // - PostHog: posthog.capture('web_vitals', metric)
    // - Google Analytics: gtag('event', metric.name, ...)
  });

  return null;
}

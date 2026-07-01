/**
 * ═══════════════════════════════════════════════════════════════
 * 🌐 Client-Side Instrumentation — Sentry v10+
 * ═══════════════════════════════════════════════════════════════
 */

import '../sentry.client.config';

// Sentry v10.62+ يتطلب هذا الـ export لتتبّع التنقل
// نستخدم dynamic import بدل require (آمن مع ESLint)
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

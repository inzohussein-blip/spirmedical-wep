/**
 * ═══════════════════════════════════════════════════════════════
 * 🌐 Client-Side Instrumentation — Sentry v10+
 * ═══════════════════════════════════════════════════════════════
 */

import * as Sentry from '@sentry/nextjs';

import '../sentry.client.config';

// مطلوب في Sentry v10+ لتتبّع تنقّلات الراوتر (App Router navigation)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

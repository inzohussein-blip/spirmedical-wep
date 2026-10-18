/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 Next.js Instrumentation — Sentry v10+
 * ═══════════════════════════════════════════════════════════════
 * ملف في src/ → الـ sentry configs في root/ → نستخدم ../
 * ═══════════════════════════════════════════════════════════════
 */

import { captureRequestError } from '@sentry/nextjs';
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

/**
 * أخطاءُ مكوّنات الخادم المتداخلة وServer Actions تصل إلى Sentry عبر هذا الخطّاف (Next 15+).
 * بدونه كانت تُبتلع في `error.tsx` بلا أثرٍ في Sentry.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  captureRequestError(error, request, context);
  // رصدُ الأخطاء في لوحة الإدارة (0057) — يعمل بلا Sentry، ولا يرمي
  const err = error as Error & { digest?: string };
  const { recordSystemError } = await import('@/lib/ops/system-errors');
  await recordSystemError({
    source: 'server',
    message: err?.message || String(error),
    path: request.path,
    detail: {
      method: request.method,
      digest: err?.digest,
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
      stack: err?.stack?.split('\n').slice(0, 8).join('\n'),
    },
  });
};

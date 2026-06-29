/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 Next.js Instrumentation — Sentry v10+
 * ═══════════════════════════════════════════════════════════════
 * ملف في src/ → الـ sentry configs في root/ → نستخدم ../
 * ═══════════════════════════════════════════════════════════════
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

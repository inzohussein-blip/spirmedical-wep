/**
 * ═══════════════════════════════════════════════════════════════
 * 🛡️ Sentry Error Tracking - Optional Integration (V25.12)
 * ═══════════════════════════════════════════════════════════════
 *
 * تفعيل Sentry لتتبّع الأخطاء في production.
 *
 * ─── خطوات التفعيل ───
 * 1. أنشئ حساب على https://sentry.io
 * 2. أنشئ Next.js project جديد
 * 3. أضف الـ env vars في Vercel:
 *    NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 *    SENTRY_ORG=your-org
 *    SENTRY_PROJECT=spirmedical
 *    SENTRY_AUTH_TOKEN=xxx (للـ source maps)
 *
 * 4. ثبّت الحزمة:
 *    npm install @sentry/nextjs
 *
 * 5. أعد deploy
 *
 * ─── ماذا يفعل Sentry ───
 * - يلتقط الأخطاء التلقائية في الـ client و server
 * - يرسل تنبيهات على Slack/Email
 * - يُحلّل الأخطاء حسب user, route, browser
 * - يُحفظ session replay (مع موافقة المستخدم)
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/logger';

// يدعم اسم متغير التكامل (بسابقة spirmedical_) مع fallback للاسم القياسي
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_spirmedical_SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

interface ErrorContext {
  user_id?: string;
  url?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

let sentryInitialized = false;

/**
 * تهيئة Sentry (lazy)
 * يُستدعى تلقائياً عند أول خطأ
 */
async function initSentry(): Promise<unknown | null> {
  if (typeof window === 'undefined') return null;
  if (sentryInitialized) return null;

  const dsn = SENTRY_DSN;
  if (!dsn) return null;

  try {
    // Dynamic import - safe if @sentry/nextjs not installed
    const mod = await import(/* webpackIgnore: true */ '@sentry/nextjs' as string).catch(() => null);
    if (!mod) {
      logger.warn('Sentry: @sentry/nextjs not installed - errors not tracked');
      return null;
    }

    const Sentry = mod as {
      init: (config: unknown) => void;
      captureException?: (e: unknown, ctx?: unknown) => void;
      captureMessage?: (m: string, level?: string) => void;
      setUser?: (u: unknown) => void;
    };

    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,           // 10% من الـ requests
      replaysSessionSampleRate: 0,     // عطّل replays بدون موافقة
      replaysOnErrorSampleRate: 1.0,   // فقط عند الأخطاء
      environment: process.env.NODE_ENV,
    });

    sentryInitialized = true;
    return Sentry;
  } catch (e) {
    logger.warn('Sentry init failed', { error: e });
    return null;
  }
}

/**
 * تسجيل خطأ يدوياً
 */
export async function trackError(
  error: Error | unknown,
  context?: ErrorContext
): Promise<void> {
  // 1. Console (دائماً)
  logger.error('Error captured', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });

  // 2. Sentry (لو مُفعّل)
  if (typeof window !== 'undefined' && SENTRY_DSN) {
    const sentry = await initSentry() as {
      captureException?: (e: unknown, ctx?: unknown) => void;
    } | null;
    if (sentry?.captureException) {
      sentry.captureException(error, { extra: context });
    }
  }
}

/**
 * تسجيل رسالة معلومات
 */
export async function trackInfo(
  message: string,
  context?: ErrorContext
): Promise<void> {
  logger.info(message, context as Record<string, unknown>);

  if (typeof window !== 'undefined' && SENTRY_DSN) {
    const sentry = await initSentry() as {
      captureMessage?: (m: string, l?: string) => void;
    } | null;
    if (sentry?.captureMessage) {
      sentry.captureMessage(message, 'info');
    }
  }
}

/**
 * ربط الـ user للأخطاء
 */
export async function identifySentryUser(userId: string, email?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!SENTRY_DSN) return;

  const sentry = await initSentry() as {
    setUser?: (u: unknown) => void;
  } | null;
  if (sentry?.setUser) {
    sentry.setUser({ id: userId, email });
  }
}

/**
 * Wrapper لـ try/catch async
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    await trackError(error, context);
    return null;
  }
}

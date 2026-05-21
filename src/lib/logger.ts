/**
 * Structured Logger
 *
 * في التطوير: يطبع JSON ملوّن للقراءة
 * في الإنتاج: يطبع JSON خام يُمكن تجميعه (Vercel logs, Datadog, إلخ)
 *
 * للترقية: استبدله بـ Pino:
 *   npm install pino pino-pretty
 *   import pino from 'pino';
 *   export const logger = pino({ ... });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

/**
 * تنظيف بيانات حساسة من الـ context
 */
function sanitize(ctx: LogContext): LogContext {
  const SENSITIVE_KEYS = [
    'password',
    'token',
    'otp',
    'secret',
    'api_key',
    'authorization',
    'cookie',
  ];
  const cleaned: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 500) {
      cleaned[key] = value.slice(0, 500) + '...';
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...sanitize(context),
  };

  const json = JSON.stringify(entry);

  switch (level) {
    case 'error':
      // eslint-disable-next-line no-console
      console.error(json);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(json);
      break;
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(json);
      break;
    default:
      // eslint-disable-next-line no-console
      console.log(json);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};

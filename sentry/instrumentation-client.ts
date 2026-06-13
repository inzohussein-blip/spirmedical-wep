import { defineInstrumentation } from '@sentry/nextjs';

// DSN من.env.local
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export default defineInstrumentation({
  dsn: DSN,
  // Sample 10% من الطلبات لتقليل الشحن
  sampleRate: 0.1,
  // تعطيل Logger إذا لم يُستخدم
  options: {
    autoSessionTracking: false,
    ignoreErrors: [
      'SupabaseError',
      'TypeError: Failed to execute \'setContext\'',
      'TypeError: Cannot read property \'name\' of undefined',
    ],
  },
  // تعديل تلقائي لطلبات API
  requestHandler: (scope, envelope) => {
    const transaction = scope.lastEvent().transaction;
    if (transaction && transaction.name.includes('api')) {
      scope.setTransactionName('API Requests');
    }
    // استخدم Default RequestHandler
    return defineInstrumentation.default.requestHandler(scope, envelope);
  },
});

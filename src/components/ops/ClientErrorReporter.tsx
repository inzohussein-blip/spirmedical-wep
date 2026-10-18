'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/ops/report-client-error';

/** يلتقط ما لا تراه حدودُ الأخطاء: أخطاءُ الأحداث والمؤقّتات والوعودُ المرفوضة بلا معالج. */
export default function ClientErrorReporter() {
  useEffect(() => {
    const onError = (ev: ErrorEvent) => reportClientError(ev.error ?? ev.message, 'error');
    const onRejection = (ev: PromiseRejectionEvent) => reportClientError(ev.reason, 'unhandledrejection');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}

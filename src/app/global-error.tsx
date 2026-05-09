'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // في الإنتاج: أرسل لـ Sentry/error tracking
    console.error('[error.tsx]', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-soft text-3xl font-bold text-rose">
            !
          </div>
          <h2 className="mb-3 text-2xl font-extrabold">حدث خطأ غير متوقع</h2>
          <p className="mb-6 text-ink-3">
            نعتذر عن هذا الإزعاج. الفريق التقني تم إخطاره بالخطأ.
          </p>
          {error.digest && (
            <p className="mb-6 font-mono text-xs text-ink-4">
              معرّف الخطأ: {error.digest}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>حاول مرة أخرى</Button>
            <Link href="/">
              <Button variant="secondary">العودة للرئيسية</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

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
    console.error('[app/error]', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-soft text-3xl font-bold text-rose">
          !
        </div>
        <h2 className="mb-3 text-2xl font-extrabold">حدث خطأ</h2>
        <p className="mb-6 text-ink-3">
          نعتذر، حدث خطأ أثناء معالجة طلبك.
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
    </main>
  );
}

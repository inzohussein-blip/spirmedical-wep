'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard/error]', error);
  }, [error]);

  return (
    <Card className="text-center">
      <div className="py-8">
        <h2 className="mb-2 text-xl font-extrabold">تعذّر تحميل البيانات</h2>
        <p className="mb-6 text-sm text-ink-3">
          يبدو أن هناك مشكلة مؤقتة. الرجاء المحاولة مرة أخرى.
        </p>
        <Button onClick={reset}>إعادة المحاولة</Button>
      </div>
    </Card>
  );
}

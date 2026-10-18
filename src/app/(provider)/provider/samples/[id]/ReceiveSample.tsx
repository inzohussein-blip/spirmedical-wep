'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { receiveSample } from '../actions';

/** «استلمتُ العيّنة» — يفتح إدخالَ النتائج */
export default function ReceiveSample({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="pv-receive">
      <button
        type="button"
        className="pv-btn"
        disabled={pending}
        onClick={() => start(async () => {
          setError(null);
          const r = await receiveSample(orderId);
          if (r.ok) router.refresh();
          else setError(r.error ?? 'تعذّر الحفظ');
        })}
      >
        {pending ? 'جارٍ الحفظ…' : 'استلمتُ العيّنة'}
      </button>
      {error && <p className="pv-err" role="alert">{error}</p>}
    </div>
  );
}

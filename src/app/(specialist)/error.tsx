'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function SpecialistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[specialist/error]', error);
  }, [error]);

  return (
    <main className="app-screen">
      <div className="scr-content" style={{ display: 'flex', alignItems: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 20px',
              background: 'var(--rose-soft)',
              color: 'var(--rose)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={40} strokeWidth={1.5} />
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.7 }}>
            عذراً، لم نتمكّن من تحميل لوحة الاختصاصي.
            <br />
            يمكنك المحاولة مرة أخرى.
          </p>

          {error.digest && (
            <div
              style={{
                background: 'var(--paper-3)',
                padding: '6px 12px',
                borderRadius: 100,
                fontSize: 10,
                color: 'var(--ink-3)',
                fontFamily: 'monospace',
                display: 'inline-block',
                marginBottom: 20,
              }}
            >
              رقم الخطأ: {error.digest}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '10px 18px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </button>
            <Link
              href="/specialist"
              style={{
                padding: '10px 18px',
                background: 'var(--white)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowRight size={14} />
              العودة للوحة
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

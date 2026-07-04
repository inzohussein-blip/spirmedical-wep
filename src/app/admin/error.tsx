'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[admin/error]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 16px',
            background: 'var(--amber-soft)',
            color: 'var(--amber)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={32} strokeWidth={1.5} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>
          خطأ في لوحة الإدارة
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.7 }}>
          حدث خطأ أثناء تحميل البيانات.
        </p>

        <div
          style={{
            background: 'var(--rose-soft)',
            color: 'var(--rose)',
            padding: 10,
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 20,
            fontFamily: 'monospace',
            textAlign: 'start',
          }}
        >
          {error.message || 'Unknown error'}
        </div>

        {error.digest && (
          <p style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 16 }}>
            رقم الخطأ: <code style={{ fontFamily: 'monospace' }}>{error.digest}</code>
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 18px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 10,
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
            المحاولة مجدّداً
          </button>
          <Link
            href="/admin"
            style={{
              padding: '10px 18px',
              background: 'var(--paper-3)',
              color: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Shield size={14} />
            لوحة الإدارة
          </Link>
        </div>
      </div>
    </div>
  );
}

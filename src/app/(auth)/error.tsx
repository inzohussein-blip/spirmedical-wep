'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🚨 Auth Error Boundary (V25.29)
 * ════════════════════════════════════════════════════════════════════
 *
 * يلتقط أخطاء في صفحات (auth):
 *   /gate, /login, /login/phone, /register, /otp, /forgot
 *
 * يستخدم نفس فلسفة auth-shell (480px مع ظل وسط)
 * ════════════════════════════════════════════════════════════════════
 */

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Auth Error]:', error);
  }, [error]);

  return (
    <main className="auth-screen">
      <div className="auth-header">
        <div className="auth-logo">س</div>
        <h1 className="auth-brand">Spir Medical</h1>
        <div className="auth-brand-sub">سباير ميديكال</div>
      </div>

      <div className="auth-status-icon" style={{ color: 'var(--rose)' }}>
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>

      <div className="auth-title-section">
        <h2 className="auth-title">حدث خطأ غير متوقّع</h2>
        <p className="auth-subtitle" style={{ lineHeight: 1.7 }}>
          نعتذر عن هذا الإزعاج. الرجاء المحاولة مرّة أخرى.
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: 'var(--rose-soft)',
          border: '1px solid var(--rose)',
          borderRadius: 10,
          padding: 12,
          margin: '14px 0',
          fontSize: 11,
          color: 'var(--ink-2)',
          fontFamily: 'monospace',
          maxHeight: 100,
          overflow: 'auto',
        }}>
          {error.message}
          {error.digest && (
            <div style={{ marginTop: 6, fontSize: 10, opacity: 0.7 }}>
              Digest: {error.digest}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 20,
      }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '12px 18px',
            background: 'var(--emerald)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          حاول مرّة أخرى
        </button>

        <Link
          href="/"
          style={{
            padding: '12px 18px',
            background: 'var(--white)',
            color: 'var(--ink-2)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Home size={16} />
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}

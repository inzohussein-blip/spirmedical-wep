'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, CheckCircle2 } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * Offline Page — V25.3
 * ═══════════════════════════════════════════════════════════════
 */

export default function OfflineClient() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((c) => c + 1);

    try {
      await fetch('/', { method: 'HEAD', cache: 'no-store' });
      window.location.reload();
    } catch {
      setIsRetrying(false);
    }
  };

  return (
    <main className="offline-wrap">
      <div className="offline-container">
        <div
          className={`offline-icon-wrap ${isOnline ? 'offline-icon-online' : ''}`}
          aria-hidden="true"
        >
          <WifiOff size={48} strokeWidth={1.8} />
        </div>

        <div className="offline-status">
          {isOnline ? (
            <span className="offline-status-online">
              <CheckCircle2 size={14} strokeWidth={2.4} />
              <span>عاد الاتصال! جارٍ إعادة التحميل...</span>
            </span>
          ) : (
            <span className="offline-status-offline">
              <span className="offline-status-dot" />
              <span>غير متصل بالإنترنت</span>
            </span>
          )}
        </div>

        <h1 className="offline-title">
          {isOnline ? 'تم استعادة الاتصال!' : 'لا يوجد اتصال'}
        </h1>

        <p className="offline-desc">
          {isOnline
            ? 'جارٍ إعادة تحميل الصفحة...'
            : 'تحقق من شبكة الواي فاي أو بيانات الجوال وحاول مرة أخرى'}
        </p>

        <div className="offline-features">
          <h3 className="offline-features-title">
            ✨ ما زال يمكنك:
          </h3>
          <ul>
            <li>
              <CheckCircle2 size={14} strokeWidth={2.4} className="offline-check" />
              <span>تصفّح الصفحات المحفوظة</span>
            </li>
            <li>
              <CheckCircle2 size={14} strokeWidth={2.4} className="offline-check" />
              <span>مراجعة سجلك الطبي</span>
            </li>
            <li>
              <CheckCircle2 size={14} strokeWidth={2.4} className="offline-check" />
              <span>عرض المواعيد السابقة</span>
            </li>
          </ul>
        </div>

        <div className="offline-actions">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="offline-btn-primary"
          >
            <RefreshCw
              size={16}
              strokeWidth={2.4}
              className={isRetrying ? 'offline-spin' : ''}
            />
            <span>
              {isRetrying ? 'جارٍ التحقق...' : 'حاول مجدداً'}
              {retryCount > 0 && !isRetrying && ` (${retryCount})`}
            </span>
          </button>

          <Link href="/" className="offline-btn-secondary">
            <Home size={16} strokeWidth={2.4} />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .offline-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--paper);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .offline-container {
          max-width: 440px;
          width: 100%;
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
          box-shadow: 0 16px 48px -16px rgba(0, 0, 0, 0.12);
          animation: offline-fade-in 0.4s ease-out;
        }
        .offline-icon-wrap {
          width: 96px;
          height: 96px;
          margin: 0 auto 16px;
          border-radius: 28px;
          background: var(--rose-soft);
          color: var(--rose);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s;
          animation: offline-pulse 2s ease-in-out infinite;
        }
        .offline-icon-online {
          background: var(--emerald-soft);
          color: var(--emerald);
          animation: none;
        }
        .offline-status {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }
        .offline-status-offline {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--rose-soft);
          color: var(--rose);
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
        }
        .offline-status-online {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--emerald-soft);
          color: var(--emerald);
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
        }
        .offline-status-dot {
          width: 8px;
          height: 8px;
          background: var(--rose);
          border-radius: 50%;
          animation: offline-pulse-fast 1.2s ease-in-out infinite;
        }
        .offline-title {
          font-size: 22px;
          font-weight: 900;
          color: var(--ink);
          margin: 0 0 8px;
        }
        .offline-desc {
          font-size: 14px;
          color: var(--ink-3);
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .offline-features {
          background: var(--paper-3);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 20px;
          text-align: start;
        }
        .offline-features-title {
          font-size: 12px;
          font-weight: 800;
          color: var(--ink-2);
          margin: 0 0 10px;
        }
        .offline-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .offline-features li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--ink-2);
          font-weight: 600;
        }
        .offline-check {
          color: var(--emerald);
          flex-shrink: 0;
        }
        .offline-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .offline-btn-primary,
        .offline-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s;
          font-family: inherit;
          border: none;
        }
        .offline-btn-primary {
          background: var(--emerald);
          color: var(--paper-3);
        }
        .offline-btn-primary:hover:not(:disabled) {
          background: var(--emerald-deep);
          transform: translateY(-1px);
        }
        .offline-btn-primary:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .offline-btn-secondary {
          background: transparent;
          color: var(--ink-2);
          border: 1px solid var(--line);
        }
        .offline-btn-secondary:hover {
          background: var(--paper-3);
        }
        .offline-spin {
          animation: offline-rotate 0.8s linear infinite;
        }

        @keyframes offline-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes offline-pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes offline-rotate {
          to { transform: rotate(360deg); }
        }
        @keyframes offline-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

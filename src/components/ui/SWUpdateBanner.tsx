'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X, RefreshCw } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * SWUpdateBanner — V25.3
 * ═══════════════════════════════════════════════════════════════
 *
 * يكشف وجود إصدار جديد من Service Worker ويعرض banner للتحديث.
 *
 * عند ضغط [حدّث الآن]:
 *   1. يُرسل postMessage 'SKIP_WAITING' للـ SW الجديد
 *   2. يستمع لـ controllerchange
 *   3. يُعيد تحميل الصفحة
 * ═══════════════════════════════════════════════════════════════
 */

export default function SWUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    // ابحث عن SW registration
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // 1. لو هناك SW جديد ينتظر بالفعل (waiting)
      if (reg.waiting) {
        setUpdateAvailable(true);
      }

      // 2. استمع لـ updatefound (SW جديد قيد التثبيت)
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // عندما يكتمل تثبيت SW الجديد
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    // 3. استمع لـ controllerchange (SW الجديد أصبح نشطاً)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;

    // اطلب من SW الجديد أن يأخذ السيطرة
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!updateAvailable || isDismissed) return null;

  return (
    <>
      <div className="sw-update-banner" role="region" aria-label="إصدار جديد">
        <div className="sw-update-icon">
          <Sparkles size={18} strokeWidth={2.2} />
        </div>
        <div className="sw-update-content">
          <div className="sw-update-title">إصدار جديد متاح ✨</div>
          <div className="sw-update-desc">
            تحديث للحصول على آخر المزايا
          </div>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          className="sw-update-btn"
        >
          <RefreshCw size={12} strokeWidth={2.4} />
          <span>حدّث</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="sw-update-close"
          aria-label="إغلاق"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>

      <style jsx>{`
        .sw-update-banner {
          position: fixed;
          top: env(safe-area-inset-top, 16px);
          left: 16px;
          right: 16px;
          max-width: 480px;
          margin: 0 auto;
          background: var(--emerald);
          color: var(--paper-3);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 9997;
          box-shadow: 0 12px 32px -8px rgba(14, 92, 77, 0.4);
          animation: sw-update-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sw-update-icon {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sw-update-content {
          flex: 1;
          min-width: 0;
        }
        .sw-update-title {
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 2px;
        }
        .sw-update-desc {
          font-size: 11px;
          opacity: 0.9;
          font-weight: 600;
        }
        .sw-update-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 7px 12px;
          background: var(--paper-3);
          color: var(--emerald-deep);
          border: none;
          border-radius: 100px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .sw-update-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .sw-update-close {
          width: 28px;
          height: 28px;
          padding: 0;
          background: rgba(255, 255, 255, 0.15);
          color: var(--paper-3);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sw-update-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        @keyframes sw-update-slide {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

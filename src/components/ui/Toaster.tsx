'use client';

import * as React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 * Toaster — Simple Toast System (V25)
 * ═══════════════════════════════════════════════════════════════
 *
 * استبدال بسيط لـ alert() مع UI احترافي.
 *
 * استخدام:
 *   import { toast } from '@/components/ui/Toaster';
 *
 *   toast.success('تم الحفظ');
 *   toast.error('فشل العملية');
 *   toast.info('جارٍ التحميل...');
 *   toast.warning('انتبه!');
 *
 * في layout.tsx:
 *   <Toaster />
 * ═══════════════════════════════════════════════════════════════
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

/* ─── Global state للـ toasts ─────────────────────────── */

type Listener = (toasts: ToastMessage[]) => void;
const listeners: Set<Listener> = new Set();
let toastQueue: ToastMessage[] = [];

function notify() {
  listeners.forEach((l) => l(toastQueue));
}

function addToast(toast: Omit<ToastMessage, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9);
  const newToast: ToastMessage = {
    id,
    duration: toast.duration ?? 4000,
    ...toast,
  };

  toastQueue = [...toastQueue, newToast];
  notify();

  // إزالة تلقائية
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      toastQueue = toastQueue.filter((t) => t.id !== id);
      notify();
    }, newToast.duration);
  }

  return id;
}

function removeToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notify();
}

/* ─── Public API ──────────────────────────────────────── */

export const toast = {
  success(message: string, title?: string) {
    return addToast({ variant: 'success', message, title });
  },
  error(message: string, title?: string) {
    return addToast({ variant: 'error', message, title, duration: 6000 });
  },
  warning(message: string, title?: string) {
    return addToast({ variant: 'warning', message, title });
  },
  info(message: string, title?: string) {
    return addToast({ variant: 'info', message, title });
  },
  dismiss(id: string) {
    removeToast(id);
  },
  custom(opts: Omit<ToastMessage, 'id'>) {
    return addToast(opts);
  },
};

/* ─── Hook للقراءة من state ─────────────────────────── */

export function useToasts(): ToastMessage[] {
  const [toasts, setToasts] = React.useState<ToastMessage[]>(toastQueue);

  React.useEffect(() => {
    const listener: Listener = (newToasts) => {
      setToasts([...newToasts]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return toasts;
}

/* ─── الـ Toaster Component ────────────────────────── */

const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
  success: {
    background: 'var(--emerald)',
    color: 'var(--paper-3)',
    borderColor: 'var(--emerald-deep)',
  },
  error: {
    background: 'var(--rose)',
    color: 'var(--paper-3)',
    borderColor: '#8A2532',
  },
  warning: {
    background: 'var(--amber)',
    color: 'var(--paper-3)',
    borderColor: '#854F0B',
  },
  info: {
    background: 'var(--ink-2)',
    color: 'var(--paper-3)',
    borderColor: 'var(--ink)',
  },
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function Toaster() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 'calc(100% - 32px)',
          maxWidth: 440,
          pointerEvents: 'none',
        }}
        role="region"
        aria-live="polite"
        aria-label="إشعارات"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              ...VARIANT_STYLES[t.variant],
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${VARIANT_STYLES[t.variant].borderColor}`,
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25)',
              fontSize: 13,
              fontWeight: 700,
              pointerEvents: 'auto',
              animation: 'toaster-slide-in 0.25s ease-out',
              fontFamily: 'inherit',
              direction: 'rtl',
            }}
            role="alert"
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {VARIANT_ICONS[t.variant]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.title && (
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
                  {t.title}
                </div>
              )}
              <div style={{ fontSize: t.title ? 12 : 13, fontWeight: 700, opacity: t.title ? 0.95 : 1 }}>
                {t.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: 4,
                fontSize: 16,
                fontWeight: 900,
                lineHeight: 1,
                opacity: 0.7,
              }}
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes toaster-slide-in {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

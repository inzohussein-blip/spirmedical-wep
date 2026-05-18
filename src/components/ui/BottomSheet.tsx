'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════
 * BottomSheet — Mobile-First Modal (V25.2)
 * ═══════════════════════════════════════════════════════════════
 *
 * بديل أفضل من Modal العادي للجوال:
 *   - يظهر من الأسفل (الأقرب للإبهام)
 *   - swipe down للإغلاق
 *   - backdrop يُغلق عند الضغط
 *   - يحترم safe-area على iPhone
 *
 * استخدام:
 *   <BottomSheet open={open} onClose={() => setOpen(false)}>
 *     <BottomSheetHeader title="عنوان" />
 *     <BottomSheetBody>محتوى</BottomSheetBody>
 *     <BottomSheetFooter>
 *       <Button>تأكيد</Button>
 *     </BottomSheetFooter>
 *   </BottomSheet>
 * ═══════════════════════════════════════════════════════════════
 */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** هل يمكن إغلاقها بـ swipe down؟ */
  swipeToClose?: boolean;
  /** هل تظهر شريط السحب في الأعلى؟ */
  showHandle?: boolean;
  /** أقصى ارتفاع (نسبة من الشاشة) */
  maxHeight?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  swipeToClose = true,
  showHandle = true,
  maxHeight = '85vh',
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Touch handlers
  const handleTouchStart = (e: ReactTouchEvent) => {
    if (!swipeToClose) return;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (!isDragging || !swipeToClose) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;
    if (delta > 0) {
      setTranslateY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (translateY > 100) {
      // إغلاق إذا تم سحبه أكثر من 100px
      onClose();
    }
    setTranslateY(0);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="bs-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={cn('bs-sheet', className)}
        style={{
          maxHeight,
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {/* Handle bar (للـ swipe) */}
        {showHandle && (
          <div
            className="bs-handle-area"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="bs-handle" />
          </div>
        )}

        {children}
      </div>

      <style jsx>{`
        .bs-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          animation: bs-backdrop-in 0.2s ease-out;
        }
        .bs-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--white);
          border-radius: 20px 20px 0 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
          animation: bs-sheet-in 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .bs-handle-area {
          display: flex;
          justify-content: center;
          padding: 12px 0 4px;
          touch-action: none;
          cursor: grab;
        }
        .bs-handle-area:active {
          cursor: grabbing;
        }
        .bs-handle {
          width: 40px;
          height: 4px;
          background: var(--ink-4);
          border-radius: 100px;
          opacity: 0.4;
        }

        /* Desktop: center horizontally with max-width */
        @media (min-width: 768px) {
          .bs-sheet {
            left: 50%;
            transform: translateX(-50%) translateY(0);
            max-width: 480px;
            border-radius: 20px;
            bottom: auto;
            top: 50%;
            margin-top: -25vh;
          }
          .bs-handle-area {
            display: none;
          }
        }

        @keyframes bs-backdrop-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes bs-sheet-in {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

/* ─── BottomSheetHeader ──────────────────────────────────── */

export interface BottomSheetHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function BottomSheetHeader({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
}: BottomSheetHeaderProps) {
  return (
    <div className="bsh-wrap">
      <div className="bsh-content">
        <h2 className="bsh-title">{title}</h2>
        {subtitle && <p className="bsh-subtitle">{subtitle}</p>}
      </div>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="bsh-close"
          aria-label="إغلاق"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      )}

      <style jsx>{`
        .bsh-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 20px 16px;
          border-bottom: 1px solid var(--line);
        }
        .bsh-content {
          flex: 1;
          min-width: 0;
        }
        .bsh-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--ink);
          margin: 0;
          line-height: 1.3;
        }
        .bsh-subtitle {
          font-size: 12px;
          color: var(--ink-3);
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .bsh-close {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--paper-3);
          border: 1px solid var(--line);
          border-radius: 50%;
          cursor: pointer;
          color: var(--ink-2);
          transition: all 0.15s;
        }
        .bsh-close:hover {
          background: var(--paper-2);
        }
      `}</style>
    </div>
  );
}

/* ─── BottomSheetBody ─────────────────────────────────── */

export function BottomSheetBody({ children }: { children: ReactNode }) {
  return (
    <div className="bsb-wrap">
      {children}
      <style jsx>{`
        .bsb-wrap {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}

/* ─── BottomSheetFooter ───────────────────────────────── */

export function BottomSheetFooter({ children }: { children: ReactNode }) {
  return (
    <div className="bsf-wrap">
      {children}
      <style jsx>{`
        .bsf-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--line);
          background: var(--paper-3);
        }
      `}</style>
    </div>
  );
}

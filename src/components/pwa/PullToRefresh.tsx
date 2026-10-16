'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔄 Pull-to-Refresh (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * Pull-down to refresh للقوائم - تجربة شبيهة بـ native apps
 *
 * Usage:
 *   <PullToRefresh onRefresh={async () => { ... }}>
 *     {children}
 *   </PullToRefresh>
 *
 * يدعم:
 *   ✓ Visual indicator مع progress
 *   ✓ Haptic feedback على iOS/Android
 *   ✓ Smooth animation
 *   ✓ Disabled state أثناء التحميل
 *   ✓ يعمل فقط من أعلى الصفحة (لا يتعارض مع scroll)
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  /** المسافة المطلوبة للتفعيل (px) */
  threshold?: number;
  /** أقصى مسافة للسحب */
  maxPullDistance?: number;
}

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 70,
  maxPullDistance = 120,
}: Props) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);

  // تشغيل اهتزاز خفيف
  const triggerHaptic = useCallback((duration = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // ignore
      }
    }
  }, []);

  // ─── Touch handlers ───
  useEffect(() => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // فقط لو نحن في أعلى الصفحة
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;

      startY.current = e.touches[0].clientY;
      hasTriggeredHaptic.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // فقط الـ swipe للأسفل
      if (diff <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      // resistance progressive (الـ damping)
      const damped = Math.min(diff * 0.5, maxPullDistance);

      setPullDistance(damped);
      setIsPulling(true);

      // haptic عند تجاوز threshold لأول مرة
      if (damped >= threshold && !hasTriggeredHaptic.current) {
        triggerHaptic(15);
        hasTriggeredHaptic.current = true;
      }

      // منع الـ overscroll الافتراضي
      if (diff > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (startY.current === null) return;

      const shouldRefresh = pullDistance >= threshold;
      startY.current = null;
      setIsPulling(false);

      if (shouldRefresh && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        triggerHaptic(20);

        try {
          await Promise.resolve(onRefresh());
        } catch (e) {
          console.error('Refresh failed:', e);
        } finally {
          // delay صغير لإظهار "تم"
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 300);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, threshold, maxPullDistance, onRefresh, triggerHaptic]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const readyToRefresh = pullDistance >= threshold;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Indicator */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(var(--sat, 0px) + 4px)',
          insetInline: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 50,
          transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: readyToRefresh ? 'var(--emerald)' : 'var(--white)',
            border: '1px solid',
            borderColor: readyToRefresh ? 'var(--emerald)' : 'var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            color: readyToRefresh ? 'var(--paper-3)' : 'var(--emerald)',
            transition: 'all 0.25s ease',
          }}
        >
          {isRefreshing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <RefreshCw
              size={20}
              style={{
                transform: `rotate(${progress * 3.6}deg)`,
                transition: isPulling ? 'none' : 'transform 0.3s ease',
              }}
            />
          )}
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance * 0.7}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

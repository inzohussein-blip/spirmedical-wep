'use client';

import {
  useState, useRef, useCallback, useEffect, type ReactNode, type CSSProperties,
} from 'react';
import { Trash2, Archive, Heart, Pin } from 'lucide-react';
import { haptic } from '@/lib/haptic';

/**
 * ═══════════════════════════════════════════════════════════════
 * 👆 Swipe Gestures (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. useSwipe hook - لاكتشاف swipes في أي مكان
 * 2. SwipeableItem - بطاقة قابلة للسحب مع actions
 *
 * Usage:
 *   // Hook
 *   const handlers = useSwipe({
 *     onSwipeLeft: () => alert('left'),
 *     onSwipeRight: () => alert('right'),
 *   });
 *   <div {...handlers}>content</div>
 *
 *   // Component
 *   <SwipeableItem
 *     onSwipeRight={() => deleteItem(id)}
 *     rightAction={{ icon: <Trash2 />, color: 'rose', label: 'حذف' }}
 *   >
 *     <Card />
 *   </SwipeableItem>
 * ═══════════════════════════════════════════════════════════════
 */

// ─── Hook: useSwipe ───────────────────────────────

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** المسافة الدنيا (px) لاحتساب swipe */
  threshold?: number;
  /** هل نُشغّل haptic */
  haptic?: boolean;
}

export function useSwipe({
  onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
  threshold = 50, haptic: useHaptic = true,
}: SwipeOptions) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;

    // تجاهل لو طويل جداً (drag، لا swipe)
    if (dt > 500) {
      touchStart.current = null;
      return;
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // أيّ اتجاه أقوى؟
    if (absDx > absDy && absDx > threshold) {
      // Horizontal swipe
      if (useHaptic) haptic.light();
      if (dx > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absDy > threshold) {
      // Vertical swipe
      if (useHaptic) haptic.light();
      if (dy > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, useHaptic]);

  return { onTouchStart, onTouchEnd };
}

// ─── Component: SwipeableItem ─────────────────────

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: 'rose' | 'amber' | 'emerald' | 'ink';
  onAction: () => void;
}

interface SwipeableItemProps {
  children: ReactNode;
  /** Action عند السحب لليمين (RTL: من الأيمن لليسار) */
  rightAction?: SwipeAction;
  /** Action عند السحب لليسار (RTL: من اليسار لليمين) */
  leftAction?: SwipeAction;
  /** المسافة المطلوبة لتفعيل الـ action */
  threshold?: number;
  /** Disable الـ swipe */
  disabled?: boolean;
}

const COLOR_MAP = {
  rose:    { bg: 'var(--rose)',    text: 'var(--paper-3)' },
  amber:   { bg: 'var(--amber)',   text: 'var(--paper-3)' },
  emerald: { bg: 'var(--emerald)', text: 'var(--paper-3)' },
  ink:     { bg: 'var(--ink-2)',   text: 'var(--paper-3)' },
};

export function SwipeableItem({
  children, rightAction, leftAction,
  threshold = 80, disabled = false,
}: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startX = useRef<number | null>(null);
  const triggered = useRef(false);

  // ─── Handlers ───
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    triggered.current = false;
    setIsAnimating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || startX.current === null) return;

    const dx = e.touches[0].clientX - startX.current;

    // resistance: السماح بالسحب فقط في اتجاه الـ action المتاح
    let nextX = dx;

    if (!rightAction && dx > 0) {
      nextX = dx * 0.2;  // resistance لو ما في action
    }
    if (!leftAction && dx < 0) {
      nextX = dx * 0.2;
    }

    // Cap على الـ translate
    const maxSwipe = 120;
    nextX = Math.max(-maxSwipe, Math.min(maxSwipe, nextX));

    setTranslateX(nextX);

    // Haptic عند تجاوز threshold لأول مرة
    if (Math.abs(nextX) >= threshold && !triggered.current) {
      haptic.medium();
      triggered.current = true;
    }
    if (Math.abs(nextX) < threshold) {
      triggered.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (disabled || startX.current === null) return;
    startX.current = null;
    setIsAnimating(true);

    const passed = Math.abs(translateX) >= threshold;

    if (passed) {
      if (translateX > 0 && rightAction) {
        // RTL: swipe لليمين = swipe-from-left
        haptic.medium();
        rightAction.onAction();
      } else if (translateX < 0 && leftAction) {
        haptic.medium();
        leftAction.onAction();
      }
    }

    setTranslateX(0);
  };

  // ─── Reset on disabled change ───
  useEffect(() => {
    if (disabled) {
      setTranslateX(0);
    }
  }, [disabled]);

  const showingRightAction = translateX > 0 && rightAction;
  const showingLeftAction = translateX < 0 && leftAction;
  const action = showingRightAction ? rightAction : showingLeftAction ? leftAction : null;
  const actionColors = action ? COLOR_MAP[action.color] : null;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
      }}
    >
      {/* Background action */}
      {action && actionColors && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: actionColors.bg,
            color: actionColors.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: showingRightAction ? 'flex-start' : 'flex-end',
            padding: '0 20px',
            gap: 8,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {action.icon}
          <span>{action.label}</span>
        </div>
      )}

      {/* Foreground content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isAnimating ? 'transform 0.3s ease' : 'none',
          background: 'var(--white)',
          position: 'relative',
          willChange: 'transform',
        } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Preset Actions (للسهولة) ───
export const SwipeActions = {
  delete: (onAction: () => void): SwipeAction => ({
    icon: <Trash2 size={16} />,
    label: 'حذف',
    color: 'rose',
    onAction,
  }),
  archive: (onAction: () => void): SwipeAction => ({
    icon: <Archive size={16} />,
    label: 'أرشفة',
    color: 'ink',
    onAction,
  }),
  favorite: (onAction: () => void): SwipeAction => ({
    icon: <Heart size={16} />,
    label: 'مفضّلة',
    color: 'rose',
    onAction,
  }),
  pin: (onAction: () => void): SwipeAction => ({
    icon: <Pin size={16} />,
    label: 'تثبيت',
    color: 'amber',
    onAction,
  }),
};

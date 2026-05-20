'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ═══════════════════════════════════════════════════════════════
 * ✨ Page Transitions (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * Wrap الصفحة بـ animation ناعم عند الانتقال
 *
 * Usage:
 *   في layout أو في أي صفحة
 *   <PageTransition>
 *     {children}
 *   </PageTransition>
 *
 * يحترم prefers-reduced-motion
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  children: ReactNode;
  /** نوع الـ animation */
  variant?: 'fade' | 'slide-up' | 'slide-side' | 'scale';
  /** المدة */
  duration?: number;
}

export default function PageTransition({
  children,
  variant = 'fade',
  duration = 250,
}: Props) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // عند تغيير الصفحة
  useEffect(() => {
    if (reducedMotion) {
      setDisplayChildren(children);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, duration / 2);
    return () => clearTimeout(timer);
  }, [pathname, children, duration, reducedMotion]);

  // الـ styles بحسب الـ variant
  const animationStyle = getAnimationStyle(variant, isAnimating, duration, reducedMotion);

  return (
    <>
      <style>{`
        @keyframes pt-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pt-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes pt-slide-up-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pt-slide-up-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes pt-slide-side-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pt-slide-side-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-20px); }
        }
        @keyframes pt-scale-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pt-scale-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.04); }
        }
      `}</style>
      <div style={animationStyle}>{displayChildren}</div>
    </>
  );
}

function getAnimationStyle(
  variant: Props['variant'],
  isAnimating: boolean,
  duration: number,
  reducedMotion: boolean
): React.CSSProperties {
  if (reducedMotion) return {};

  const animationName = isAnimating
    ? `pt-${variant === 'fade' ? 'fade' : variant === 'slide-up' ? 'slide-up' : variant === 'slide-side' ? 'slide-side' : 'scale'}-out`
    : `pt-${variant === 'fade' ? 'fade' : variant === 'slide-up' ? 'slide-up' : variant === 'slide-side' ? 'slide-side' : 'scale'}-in`;

  return {
    animation: `${animationName} ${duration / 2}ms ease forwards`,
  };
}

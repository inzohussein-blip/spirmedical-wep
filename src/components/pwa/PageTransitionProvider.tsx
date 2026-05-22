'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎬 PageTransitionProvider (V25.32)
 * ════════════════════════════════════════════════════════════════════
 *
 * تأثير انتقال سلس بين الصفحات (slide + fade)
 *
 * يحترم prefers-reduced-motion (يستخدم fade خفيف للمستخدمين الحساسين)
 *
 * Usage:
 *   في layout.tsx:
 *   <PageTransitionProvider>
 *     {children}
 *   </PageTransitionProvider>
 * ════════════════════════════════════════════════════════════════════
 */
export default function PageTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // إعدادات الـ animation
  const variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: 12 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
      };

  const transition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

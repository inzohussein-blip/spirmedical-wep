'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isPWAInstalled } from '@/lib/pwa';

/**
 * AppBackHandler (V25.23)
 *
 * يجعل الـ back button في PWA يتصرّف مثل تطبيقات الـ native:
 *
 * 1. في الصفحة الرئيسية (/dashboard, /, /login):
 *    - يطلب تأكيد قبل الخروج من التطبيق
 *
 * 2. في باقي الصفحات:
 *    - يرجع للصفحة السابقة عادي
 *
 * 3. Double-tap للخروج: ضغطتان متتاليتان خلال 2 ثانية = خروج
 */
export default function AppBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPWAInstalled()) return;

    let lastBackPress = 0;
    const HOME_PATHS = ['/', '/dashboard', '/login', '/auth/login'];

    const handlePopState = (event: PopStateEvent) => {
      const isHomePath = HOME_PATHS.some((p) => pathname === p);

      if (isHomePath) {
        const now = Date.now();
        const diff = now - lastBackPress;

        if (diff < 2000 && diff > 100) {
          // Double-tap detected - allow exit
          return;
        }

        // First press - prevent default + show toast
        event.preventDefault();
        history.pushState(null, '', pathname);
        lastBackPress = now;

        // Show toast hint
        const toast = document.createElement('div');
        toast.textContent = '⬅️ اضغط مرّة أخرى للخروج';
        toast.style.cssText = `
          position: fixed;
          bottom: 80px;
          inset-inline-start: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 12px 20px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          z-index: 9999;
          pointer-events: none;
          font-family: inherit;
          animation: fadeInOut 2s ease-out forwards;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
    };

    // نُضيف history entry للتعامل مع back
    history.pushState(null, '', pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);

  return null;
}

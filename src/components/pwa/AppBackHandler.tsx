'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isPWAInstalled } from '@/lib/pwa';

/**
 * AppBackHandler (V25.24)
 *
 * يجعل الـ back button في PWA يتصرّف مثل تطبيقات الـ native:
 *
 * 1. في الصفحة الرئيسية فقط (/, /dashboard, /login):
 *    - يضع history entry لمنع الخروج المباشر
 *    - أوّل ضغطة: toast "اضغط مرّة أخرى للخروج"
 *    - ضغطتان خلال 2 ثانية: السماح بالخروج
 *
 * 2. في باقي الصفحات:
 *    - back navigation طبيعي (يرجع للصفحة السابقة)
 */
const HOME_PATHS = ['/', '/dashboard', '/login', '/gate', '/specialist', '/admin44'];

export default function AppBackHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isPWAInstalled()) return;

    // 🎯 V25.24: نُفعّل فقط في الصفحات الرئيسية
    const isHomePath = HOME_PATHS.includes(pathname);
    if (!isHomePath) return;

    let lastBackPress = 0;

    const handlePopState = (event: PopStateEvent) => {
      const now = Date.now();
      const diff = now - lastBackPress;

      if (diff < 2000 && diff > 100) {
        // Double-tap detected - allow exit
        return;
      }

      // First press - prevent default + show toast + re-add history
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
    };

    // نُضيف history entry فقط في HOME_PATHS لتفعيل الـ back handler
    history.pushState(null, '', pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return null;
}

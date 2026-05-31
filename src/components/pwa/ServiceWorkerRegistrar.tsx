'use client';

import { useEffect } from 'react';
import { initInstallPromptCapture } from '@/lib/pwa';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🛠️ ServiceWorkerRegistrar (V31/V32)
 * ════════════════════════════════════════════════════════════════════
 *
 * 1. يُسجّل /sw.js (مطلوب لإطلاق beforeinstallprompt → زر التثبيت)
 * 2. يُهيّئ الالتقاط العالمي للحدث beforeinstallprompt مبكّراً
 *    (قبل أن تُركّب مكوّنات الزر، لأنّ الحدث يُطلق مرّة واحدة فقط).
 * ════════════════════════════════════════════════════════════════════
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 🆕 V32: ابدأ التقاط حدث التثبيت فوراً (قبل أي مكوّن زر)
    initInstallPromptCapture();

    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // فشل التسجيل (مثلاً بيئة غير HTTPS) — نتجاهل بهدوء
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}

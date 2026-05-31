'use client';

import { useEffect } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🛠️ ServiceWorkerRegistrar (V31)
 * ════════════════════════════════════════════════════════════════════
 *
 * يُسجّل /sw.js عند تحميل الموقع.
 *
 * لماذا هذا مهم:
 *   - بدون Service Worker مُسجّل، المتصفّح لا يُطلق حدث
 *     `beforeinstallprompt` → زر "تثبيت التطبيق" لا يعمل أبداً.
 *   - هذا كان السبب الجذري لعدم عمل خاصية التثبيت.
 *
 * يُسجّل فقط في الإنتاج (أو HTTPS/localhost) ويتجاهل الأخطاء بهدوء.
 * ════════════════════════════════════════════════════════════════════
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // نُسجّل بعد تحميل الصفحة (لا نُعطّل الـ initial render)
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // فشل التسجيل (مثلاً في بيئة غير HTTPS) — نتجاهل بهدوء
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

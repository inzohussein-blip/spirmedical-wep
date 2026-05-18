'use client';

import { useEffect, useRef } from 'react';
import { toast } from './Toaster';

/**
 * ═══════════════════════════════════════════════════════════════
 * NetworkStatusDetector — V25.3
 * ═══════════════════════════════════════════════════════════════
 *
 * يستمع لتغيّرات الاتصال ويُظهر toast:
 *   - 🔴 عند فقدان الاتصال: "أنت غير متصل بالإنترنت"
 *   - 🟢 عند العودة: "عاد الاتصال"
 *
 * يُضاف في الـ root layout مرّة واحدة.
 * لا يُظهر toast في أول تحميل.
 * ═══════════════════════════════════════════════════════════════
 */

export default function NetworkStatusDetector() {
  const wasOfflineRef = useRef(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // أول تحميل: نتجاهل الـ initial state
    hasInitializedRef.current = true;

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        toast.success('عاد الاتصال بالإنترنت ✓', 'متصل');
        wasOfflineRef.current = false;
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      toast.warning(
        'تحقّق من الواي فاي أو بيانات الجوال',
        'أنت غير متصل'
      );
    };

    // فحص الحالة الحالية (لو فُتح offline من البداية)
    if (!navigator.onLine) {
      wasOfflineRef.current = true;
      // ننتظر ثانيتين قبل عرض toast (حتى يحمّل Toaster)
      setTimeout(() => {
        toast.warning(
          'تحقّق من اتصالك',
          'أنت غير متصل'
        );
      }, 2000);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}

'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function PushPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // عرض الـ prompt فقط لو الإذن لم يُطلب من قبل
    if (Notification.permission === 'default') {
      // الانتظار 5 ثوانٍ قبل الإظهار (لتجربة أفضل)
      const timer = setTimeout(() => {
        // تحقق من sessionStorage لتجنّب الإزعاج المتكرر
        if (!sessionStorage.getItem('push-dismissed')) {
          setShow(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        // إشعار تجريبي
        new Notification('سباير ميديكال', {
          body: 'الإشعارات مُفعّلة! ستصلك تنبيهات الرسائل الجديدة.',
          icon: '/icon.svg',
        });
      }
    }
    setShow(false);
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('push-dismissed', '1');
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="push-prompt">
      <div className="push-prompt-content">
        <div className="push-prompt-icon" aria-hidden="true">
          <Bell size={22} strokeWidth={2.2} />
        </div>
        <div className="push-prompt-text">
          <div className="push-prompt-title">فعّل الإشعارات</div>
          <div className="push-prompt-desc">احصل على تنبيهات فورية للرسائل الجديدة</div>
        </div>
      </div>
      <div className="push-prompt-actions">
        <button type="button" onClick={handleDismiss} className="push-prompt-btn-skip">
          ليس الآن
        </button>
        <button type="button" onClick={handleAllow} className="push-prompt-btn-allow">
          فعّل
        </button>
      </div>
    </div>
  );
}

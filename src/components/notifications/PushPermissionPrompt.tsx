'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { subscribeToPush } from '@/lib/push-client';
import { toast } from '@/components/ui/Toaster';

export default function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // عرض الـ prompt فقط لو الإذن لم يُطلب من قبل
    if (Notification.permission === 'default') {
      const timer = setTimeout(() => {
        if (!sessionStorage.getItem('push-dismissed')) {
          setShow(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('متصفّحك لا يدعم الإشعارات');
      setShow(false);
      return;
    }

    setLoading(true);
    try {
      // 🔧 V32: نطلب الإذن ونشترك فعلياً في Push (لم يكن يشترك سابقاً)
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // اشترك في Web Push (يربط الجهاز بالخادم لإرسال إشعارات حقيقية)
        const result = await subscribeToPush().catch(() => null);

        // إشعار تأكيد (PNG وليس SVG — الإشعارات لا تدعم SVG)
        try {
          new Notification('سباير ميديكال', {
            body: 'تم تفعيل الإشعارات بنجاح ✓',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          });
        } catch {
          // بعض المتصفّحات تتطلّب الإشعار عبر الـ SW — نتجاهل لو فشل
        }

        if (result && result.success) {
          toast.success('تم تفعيل الإشعارات بنجاح');
        } else {
          toast.success('تم تفعيل إشعارات المتصفّح');
        }
      } else if (permission === 'denied') {
        toast.error('تم رفض الإذن. فعّله من إعدادات المتصفّح');
      }
    } catch {
      toast.error('تعذّر تفعيل الإشعارات');
    } finally {
      setLoading(false);
      setShow(false);
    }
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
        <button type="button" onClick={handleDismiss} className="push-prompt-btn-skip" disabled={loading}>
          ليس الآن
        </button>
        <button type="button" onClick={handleAllow} className="push-prompt-btn-allow" disabled={loading}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'فعّل'}
        </button>
      </div>
    </div>
  );
}

'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * Push Subscription Helper (V25.3 - Client-side)
 * ═══════════════════════════════════════════════════════════════
 *
 * يدير الـ subscription على الـ client:
 *   - subscribeToPush() — يطلب الإذن + يشترك + يحفظ في DB
 *   - unsubscribeFromPush() — يلغي الاشتراك
 *   - getPushPermission() — يفحص حالة الإذن
 * ═══════════════════════════════════════════════════════════════
 */

export type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermission(): PushPermission {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * يحوّل VAPID public key (base64) → Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * يجلب VAPID public key من الـ API
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch('/api/push/vapid-key');
    if (!response.ok) return null;
    const data = await response.json();
    return data.publicKey || null;
  } catch {
    return null;
  }
}

/**
 * يطلب إذن الإشعارات + يشترك + يحفظ في DB
 *
 * @returns true إذا نجح، false إذا فشل
 */
export async function subscribeToPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isPushSupported()) {
    return { success: false, error: 'متصفحك لا يدعم الإشعارات' };
  }

  // 1. اطلب الإذن
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      error: 'لم تسمح بالإشعارات. غيّر الإذن من إعدادات المتصفح.',
    };
  }

  // 2. جلب VAPID public key
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    return {
      success: false,
      error: 'الإشعارات غير مفعّلة حالياً (VAPID keys مفقودة)',
    };
  }

  // 3. سجّل في PushManager
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    // 4. أرسل لـ DB
    const subData = subscription.toJSON();
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subData.endpoint,
        keys: subData.keys,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        error: err.error || 'فشل حفظ الاشتراك',
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
    };
  }
}

/**
 * يلغي الاشتراك على هذا الجهاز
 */
export async function unsubscribeFromPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isPushSupported()) {
    return { success: false, error: 'غير مدعوم' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true }; // لا اشتراك أصلاً
    }

    // 1. ألغِ من PushManager
    await subscription.unsubscribe();

    // 2. احذف من DB
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'حدث خطأ',
    };
  }
}

/**
 * يفحص ما إذا كان هذا الجهاز مُشترك حالياً
 */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * إرسال إشعار تجريبي
 */
export async function sendTestPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('/api/push/test', { method: 'POST' });
    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'لم يُرسَل أي إشعار. تأكد من الاشتراك أولاً.',
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'فشل الإرسال',
    };
  }
}

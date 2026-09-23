/**
 * ════════════════════════════════════════════════════════════════════
 * 🚪 Logout Cleanup (V25.26)
 * ════════════════════════════════════════════════════════════════════
 *
 * تنظيف شامل عند logout:
 *   - SW caches (HTML pages الشخصية)
 *   - localStorage (session info)
 *   - Push subscription (optional)
 */


/**
 * يُرسل رسالة للـ Service Worker لمسح كل cache المستخدم
 */
export async function clearUserCacheInSW(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({ type: 'CLEAR_USER_CACHE' });
    }
  } catch (err) {
    console.warn('[Logout] Failed to clear SW cache:', err);
  }
}


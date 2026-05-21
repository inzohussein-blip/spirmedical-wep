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

import { clearPersistedSession } from '@/lib/pwa';

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

/**
 * يُنفّذ كل خطوات تنظيف logout على الـ client
 * يُستدعى قبل redirect لـ logout
 */
export async function performLogoutCleanup(): Promise<void> {
  // 1. مسح localStorage
  clearPersistedSession();

  // 2. مسح SW caches
  await clearUserCacheInSW();

  // 3. مسح أي بيانات أخرى محفوظة
  try {
    // نمسح فقط الـ keys الخاصة بنا (لا نمسح كل localStorage)
    const ourKeys = [
      'spir-session-info',
      'spir-install-dismissed-at',
      'spir-last-route',
    ];
    ourKeys.forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });
  } catch {
    // ignore
  }
}

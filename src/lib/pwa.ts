/**
 * ════════════════════════════════════════════════════════════════════
 * 🎯 PWA Detection & Persistent Auth (V25.23)
 * ════════════════════════════════════════════════════════════════════
 *
 * يكتشف هل التطبيق مُثبّت + يدير الـ persistent auth
 */

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Method 1: display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;

  // Method 2: iOS Safari
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;

  // Method 3: Android - مُثبّت من خلال WebAPK
  if (document.referrer.startsWith('android-app://')) return true;

  return false;
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  return isIOSDevice() || isAndroidDevice();
}

/* ════════════════════════════════════════════════════════════════════
   🆕 V32: نظام موحّد لالتقاط beforeinstallprompt
   ════════════════════════════════════════════════════════════════════
   المشكلة: عدّة مكوّنات (SmartInstallPrompt + InstallAppButton) كانت
   تستمع لنفس الحدث الذي يُطلق مرّة واحدة فقط → تضارب وعدم عمل الزر.

   الحلّ: نلتقط الحدث مرّة واحدة عالمياً ونخزّنه، وكل المكوّنات تقرأ منه
   عبر getDeferredPrompt() وتشترك في التحديثات عبر onInstallPromptChange().
   ════════════════════════════════════════════════════════════════════ */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(p: BeforeInstallPromptEvent | null) => void>();
let captureInitialized = false;

/** يُهيّئ الالتقاط العالمي (يُستدعى مرّة واحدة من ServiceWorkerRegistrar) */
export function initInstallPromptCapture(): void {
  if (typeof window === 'undefined' || captureInitialized) return;
  captureInitialized = true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn(deferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    promptListeners.forEach((fn) => fn(null));
  });
}

/** يُرجع الحدث المُخزّن (أو null لو لم يُطلق بعد) */
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/** يشترك في تغييرات الحدث — يُرجع دالة إلغاء الاشتراك */
export function onInstallPromptChange(
  fn: (p: BeforeInstallPromptEvent | null) => void
): () => void {
  promptListeners.add(fn);
  return () => promptListeners.delete(fn);
}

/** يُشغّل التثبيت ويُنظّف الحدث بعد الاستخدام */
export async function triggerInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  promptListeners.forEach((fn) => fn(null));
  return outcome;
}

/**
 * يحفظ session info في localStorage بشكل دائم
 * للوصول السريع بدون انتظار Supabase
 */
export interface PersistedSession {
  userId: string;
  role: string;
  fullName: string;
  phone: string;
  savedAt: number;
}

const SESSION_KEY = 'spir-session-info';

export function savePersistedSession(session: PersistedSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage full or unavailable
  }
}

export function getPersistedSession(): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * يتحقّق هل في حاجة لتذكير المستخدم بتثبيت التطبيق
 */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;

  // إذا مُثبّت بالفعل - لا
  if (isPWAInstalled()) return false;

  // إذا رفض المستخدم سابقاً خلال آخر 7 أيام - لا
  try {
    const dismissedAt = localStorage.getItem('spir-install-dismissed-at');
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < 7) return false;
    }
  } catch {
    // ignore
  }

  return true;
}

export function dismissInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('spir-install-dismissed-at', Date.now().toString());
  } catch {
    // ignore
  }
}

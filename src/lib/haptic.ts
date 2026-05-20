/**
 * ═══════════════════════════════════════════════════════════════
 * 📳 Haptic Feedback System (V25.16)
 * ═══════════════════════════════════════════════════════════════
 *
 * نظام موحّد للـ vibration feedback يُحاكي haptic engine
 *
 * Usage:
 *   import { haptic } from '@/lib/haptic';
 *
 *   haptic.light();         // اهتزاز خفيف (للأزرار)
 *   haptic.medium();        // متوسط (لتأكيد عملية)
 *   haptic.heavy();         // قوي (لتحذير)
 *   haptic.success();       // نجاح (3 نبضات قصيرة)
 *   haptic.error();         // خطأ (نبضة طويلة)
 *   haptic.selection();     // اختيار (للسلايدر/checkbox)
 *
 *   // يحترم preferences المستخدم
 *   haptic.setEnabled(false);
 * ═══════════════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'spir_haptic_enabled';

class HapticFeedback {
  private enabled = true;
  private supported = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.supported = 'vibrate' in navigator;
      // قراءة الإعداد المحفوظ
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    }
  }

  /** فعّل أو عطّل الـ haptic */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  }

  /** هل الـ haptic مُفعّل ومدعوم */
  isEnabled(): boolean {
    return this.enabled && this.supported;
  }

  /** هل الجهاز يدعم vibration */
  isSupported(): boolean {
    return this.supported;
  }

  /** اهتزاز مخصّص */
  private vibrate(pattern: number | number[]): void {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore (Safari iOS لا يدعم Vibration API)
    }
  }

  // ─── المستويات الأساسية ───

  /** اهتزاز خفيف جداً (تنقّل، tap) */
  light(): void {
    this.vibrate(10);
  }

  /** اهتزاز متوسط (تأكيد عملية) */
  medium(): void {
    this.vibrate(20);
  }

  /** اهتزاز قوي (تنبيه مهم) */
  heavy(): void {
    this.vibrate(30);
  }

  // ─── الأنماط ───

  /** اختيار - نبضة قصيرة جداً */
  selection(): void {
    this.vibrate(5);
  }

  /** نجاح - 2 نبضات قصيرة */
  success(): void {
    this.vibrate([15, 50, 15]);
  }

  /** تحذير - نبضتان متوسطتان */
  warning(): void {
    this.vibrate([30, 100, 30]);
  }

  /** خطأ - 3 نبضات قوية */
  error(): void {
    this.vibrate([20, 50, 20, 50, 20]);
  }

  /** نبضة قلب (للإشعارات الطبية) */
  heartbeat(): void {
    this.vibrate([100, 30, 100, 200]);
  }

  /** إشعار جديد */
  notification(): void {
    this.vibrate([50, 50, 50]);
  }

  /** إيقاف فوري */
  stop(): void {
    if (this.supported) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }
}

export const haptic = new HapticFeedback();

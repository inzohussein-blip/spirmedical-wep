/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 Analytics System (V25.10)
 * ═══════════════════════════════════════════════════════════════
 *
 * نظام Analytics موحّد يدعم:
 *   - PostHog (لو NEXT_PUBLIC_POSTHOG_KEY مُعرّف)
 *   - Console logging (في dev)
 *   - Internal DB tracking (دائماً)
 *
 * يستخدم في الـ Client Components بدون أي إعداد إضافي.
 * ═══════════════════════════════════════════════════════════════
 */

// ─── أنواع الأحداث المُعرّفة ───────────────────────────────
export type AnalyticsEvent =
  // Auth events
  | 'auth_signup_started'
  | 'auth_signup_completed'
  | 'auth_login'
  | 'auth_logout'
  // Booking events
  | 'booking_started'           // المريض بدأ wizard
  | 'booking_step_completed'    // أنهى خطوة
  | 'booking_completed'         // أكمل الحجز
  | 'booking_cancelled'         // ألغى
  // Service events
  | 'service_viewed'            // فتح صفحة خدمة
  | 'doctor_viewed'             // فتح ملف طبيب
  | 'hospital_viewed'           // فتح مستشفى
  | 'pharmacy_searched'         // بحث صيدلية
  // Subscription events
  | 'subscription_started'      // بدأ اشتراك طبيب عائلة
  | 'subscription_cancelled'
  // Consultation events
  | 'consultation_started'
  | 'consultation_message_sent'
  | 'consultation_image_shared'
  | 'consultation_record_shared'
  | 'consultation_closed'
  // Family events
  | 'family_member_added'
  | 'family_booking_made'        // حجز لفرد عائلة
  // Discovery
  | 'map_opened'
  | 'search_performed'
  // Engagement
  | 'page_viewed'
  | 'feature_used';

export interface AnalyticsProperties {
  // Common props
  user_id?: string;
  user_role?: 'patient' | 'specialist' | 'admin' | 'guest';
  // Service-specific
  service_type?: string;
  doctor_id?: string;
  hospital_id?: string;
  pharmacy_id?: string;
  // Booking-specific
  appointment_id?: string;
  step?: number;
  total_price?: number;
  for_family_member?: boolean;
  // Consultation
  consultation_id?: string;
  message_type?: 'text' | 'image' | 'medical_record';
  // Subscription
  subscription_plan?: 'monthly' | 'yearly';
  // Free-form
  [key: string]: unknown;
}

// ─── PostHog instance (singleton) ─────────────────────────
let posthogClient: unknown = null;
let posthogReady = false;

async function initPostHog(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (posthogReady) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  try {
    // Dynamic import - won't fail at build time if package not installed
    const mod = await import(/* webpackIgnore: true */ 'posthog-js' as string).catch(() => null);
    if (!mod) return;

    const posthog = (mod as { default?: unknown }).default ?? mod;
    if (posthog && typeof (posthog as { init?: unknown }).init === 'function') {
      (posthog as { init: (key: string, opts: unknown) => void }).init(apiKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false,
        autocapture: false,
        disable_session_recording: false,
      });
      posthogClient = posthog;
      posthogReady = true;
    }
  } catch (e) {
    console.warn('PostHog init failed:', e);
  }
}

// ─── Track function (الواجهة الرئيسية) ────────────────────
export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (typeof window === 'undefined') return;

  // 1. Console log (dev only)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`📊 [Analytics] ${event}`, properties || {});
  }

  // 2. PostHog (lazy init)
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    void initPostHog().then(() => {
      if (posthogClient && typeof (posthogClient as { capture?: unknown }).capture === 'function') {
        (posthogClient as { capture: (e: string, p?: unknown) => void }).capture(event, properties);
      }
    });
  }

  // 3. Custom internal tracking
  void sendToInternal(event, properties);
}

// ─── Identify user ────────────────────────────────────────
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    void initPostHog().then(() => {
      if (posthogClient && typeof (posthogClient as { identify?: unknown }).identify === 'function') {
        (posthogClient as { identify: (id: string, t?: unknown) => void }).identify(userId, traits);
      }
    });
  }
}

// ─── Reset (logout) ───────────────────────────────────────
export function resetAnalytics(): void {
  if (typeof window === 'undefined') return;

  if (posthogClient && typeof (posthogClient as { reset?: unknown }).reset === 'function') {
    (posthogClient as { reset: () => void }).reset();
  }
}

// ─── Internal tracking (DB) ───────────────────────────────
async function sendToInternal(event: AnalyticsEvent, properties?: AnalyticsProperties): Promise<void> {
  try {
    // Use sendBeacon if possible (won't block)
    const payload = JSON.stringify({ event, properties, timestamp: Date.now() });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', payload);
    } else {
      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // fail silently
  }
}

// ─── Page view helper ─────────────────────────────────────
export function trackPageView(path: string, title?: string): void {
  track('page_viewed', { path, title });
}

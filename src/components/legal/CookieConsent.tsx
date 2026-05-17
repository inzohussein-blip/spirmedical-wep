'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

const CONSENT_KEY = 'spir_cookie_consent_v1';
// مدة صلاحية الموافقة: سنة كاملة
const CONSENT_DURATION = 365 * 24 * 60 * 60 * 1000;

/**
 * فحص الموافقة الموجودة من مصادر متعدّدة
 * - localStorage (الأساسي)
 * - cookie (احتياطي)
 */
function hasValidConsent(): boolean {
  if (typeof window === 'undefined') return true; // SSR: لا تُظهر

  try {
    // ١. فحص localStorage
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const consent: ConsentState = JSON.parse(stored);
      const age = Date.now() - consent.timestamp;
      if (age < CONSENT_DURATION) {
        return true; // موافقة صالحة
      }
    }
  } catch (e) {
    // localStorage غير متاح (private mode أو blocked)
  }

  try {
    // ٢. احتياطي: فحص الـ cookie
    const cookieMatch = document.cookie.match(
      new RegExp(`(^|;)\\s*${CONSENT_KEY}=([^;]+)`)
    );
    if (cookieMatch) {
      return true;
    }
  } catch (e) {}

  return false;
}

/**
 * حفظ الموافقة في مكانين: localStorage + cookie
 */
function saveConsentEverywhere(consent: ConsentState) {
  // ١. حفظ في localStorage
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (e) {
    console.warn('localStorage not available');
  }

  // ٢. حفظ في cookie (احتياطي - يعمل حتى لو localStorage مغلق)
  try {
    const expires = new Date(Date.now() + CONSENT_DURATION);
    document.cookie = `${CONSENT_KEY}=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('cookies not available');
  }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // فحص الموافقة بعد mount (لتجنب hydration issues)
  useEffect(() => {
    setMounted(true);
    if (!hasValidConsent()) {
      // عرض الـ banner بعد ١.٥ ثانية (UX أفضل)
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (state: Partial<ConsentState>) => {
    const consent: ConsentState = {
      necessary: true,
      analytics: state.analytics ?? analytics,
      marketing: state.marketing ?? marketing,
      timestamp: Date.now(),
    };

    saveConsentEverywhere(consent);
    setShow(false);

    // إرسال event للتطبيق ليُحدّث Analytics
    try {
      window.dispatchEvent(
        new CustomEvent('consent-updated', { detail: consent })
      );
    } catch (e) {}
  };

  const acceptAll = () => saveConsent({ analytics: true, marketing: true });
  const acceptNecessary = () => saveConsent({ analytics: false, marketing: false });
  const acceptCustom = () => saveConsent({ analytics, marketing });

  // إغلاق بـ Escape (يحفظ الضرورية فقط)
  useEffect(() => {
    if (!show) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        acceptNecessary();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // لا تعرض شيئاً قبل mount (يحل hydration mismatch)
  if (!mounted || !show) return null;

  return (
    <div
      className="cookie-overlay"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      aria-modal="true"
    >
      <div className="cookie-banner">
        <div className="cookie-icon" aria-hidden="true">🍪</div>

        <h2 id="cookie-title" className="cookie-title">
          نحترم خصوصيتك
        </h2>

        <p id="cookie-desc" className="cookie-desc">
          نستخدم الكوكيز لتحسين تجربتك وتحليل استخدام الموقع. الكوكيز الضرورية
          فقط مُفعّلة بشكل افتراضي. يمكنك تغيير اختيارك في أي وقت من{' '}
          <Link href="/legal/privacy" className="cookie-link">
            سياسة الخصوصية
          </Link>.
        </p>

        {showDetails && (
          <div className="cookie-options" role="group" aria-label="تفضيلات الكوكيز">
            <label className="cookie-option disabled">
              <input
                type="checkbox"
                checked
                disabled
                aria-describedby="cookie-necessary-desc"
              />
              <div>
                <strong>كوكيز ضرورية</strong>
                <span id="cookie-necessary-desc">
                  لازمة لعمل الموقع (تسجيل الدخول، الجلسات)
                </span>
              </div>
              <span className="cookie-required">إجباري</span>
            </label>

            <label className="cookie-option">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                aria-describedby="cookie-analytics-desc"
              />
              <div>
                <strong>كوكيز التحليلات</strong>
                <span id="cookie-analytics-desc">
                  لفهم كيفية استخدام الموقع وتحسينه (Vercel Analytics)
                </span>
              </div>
            </label>

            <label className="cookie-option">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                aria-describedby="cookie-marketing-desc"
              />
              <div>
                <strong>كوكيز التسويق</strong>
                <span id="cookie-marketing-desc">
                  لعرض إعلانات مخصّصة (غير مُفعّلة حالياً)
                </span>
              </div>
            </label>
          </div>
        )}

        <div className="cookie-actions">
          {!showDetails ? (
            <>
              <button
                onClick={() => setShowDetails(true)}
                className="cookie-btn outline"
                type="button"
              >
                التفاصيل
              </button>
              <button
                onClick={acceptNecessary}
                className="cookie-btn outline"
                type="button"
              >
                الضرورية فقط
              </button>
              <button
                onClick={acceptAll}
                className="cookie-btn primary"
                type="button"
                autoFocus
              >
                قبول الكل
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDetails(false)}
                className="cookie-btn outline"
                type="button"
              >
                ← العودة
              </button>
              <button
                onClick={acceptCustom}
                className="cookie-btn primary"
                type="button"
              >
                حفظ التفضيلات
              </button>
            </>
          )}
        </div>

        <p className="cookie-legal">
          باستمرارك في استخدام الموقع، فإنك توافق على{' '}
          <Link href="/legal/terms" className="cookie-link">
            الشروط
          </Link>{' '}
          و{' '}
          <Link href="/legal/privacy" className="cookie-link">
            سياسة الخصوصية
          </Link>.
        </p>
      </div>
    </div>
  );
}

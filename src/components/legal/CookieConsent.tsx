'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ConsentState = {
  necessary: boolean; // دائماً true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

const CONSENT_KEY = 'spir_cookie_consent_v1';

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // فحص الموافقة الموجودة
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // عرض الـ banner بعد ثانية واحدة (UX أفضل)
      const timer = setTimeout(() => setShow(true), 1000);
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
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setShow(false);

    // إرسال event للتطبيق ليُحدّث Analytics
    window.dispatchEvent(
      new CustomEvent('consent-updated', { detail: consent })
    );
  };

  const acceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
  };

  const acceptNecessary = () => {
    saveConsent({ analytics: false, marketing: false });
  };

  const acceptCustom = () => {
    saveConsent({ analytics, marketing });
  };

  // لإغلاق الـ banner عند الضغط على Escape
  useEffect(() => {
    if (!show) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // قبول الضرورية فقط عند Escape
        const consent: ConsentState = {
          necessary: true,
          analytics: false,
          marketing: false,
          timestamp: Date.now(),
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
        setShow(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show]);

  if (!show) return null;

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
          <div className="cookie-options" role="group" aria-label="Cookie preferences">
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

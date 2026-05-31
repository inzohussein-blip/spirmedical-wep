'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 📲 LandingInstallButton (V31)
 * ════════════════════════════════════════════════════════════════════
 *
 * زر تثبيت حقيقي في قسم "التطبيق" بالموقع.
 *
 *   • Android/Desktop Chrome: يلتقط beforeinstallprompt → زر تثبيت فوري
 *   • iOS Safari: يعرض تعليمات (لا يدعم beforeinstallprompt)
 *   • مُثبّت بالفعل / غير متاح: يُخفي نفسه
 *
 * يتطلّب Service Worker مُسجّلاً (ServiceWorkerRegistrar) — وإلا لن
 * يُطلق المتصفّح beforeinstallprompt.
 * ════════════════════════════════════════════════════════════════════
 */
export default function LandingInstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // كشف iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    // كشف إذا مُثبّت بالفعل (standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  async function handleClick() {
    if (isIOS) {
      setShowIOS(true);
      return;
    }
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  // مُثبّت بالفعل → لا نعرض شيئاً
  if (installed) return null;

  // لا prompt ولا iOS → التثبيت غير متاح في هذا المتصفّح، نُخفي
  if (!prompt && !isIOS) return null;

  return (
    <>
      <button type="button" onClick={handleClick} className="landing-install-direct-btn">
        <span aria-hidden="true">📲</span>
        {isIOS ? 'ثبّت على iPhone/iPad' : 'ثبّت التطبيق الآن'}
      </button>

      {/* تعليمات iOS */}
      {showIOS && (
        <div
          role="dialog"
          aria-label="تعليمات التثبيت على iOS"
          onClick={() => setShowIOS(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 9999, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, maxWidth: 380, width: '100%',
              padding: 24, textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>📲</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px', color: '#0F1A1C' }}>
              تثبيت على iPhone / iPad
            </h3>
            <ol style={{ textAlign: 'start', fontSize: 14, lineHeight: 2, color: '#5F5E5A', paddingInlineStart: 20, margin: '0 0 16px' }}>
              <li>اضغط زر المشاركة <strong>⬆️</strong> في أسفل Safari</li>
              <li>اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong></li>
              <li>اضغط <strong>«إضافة»</strong> في الأعلى</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOS(false)}
              style={{
                width: '100%', padding: 12, borderRadius: 12, border: 'none',
                background: '#0E5C4D', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}

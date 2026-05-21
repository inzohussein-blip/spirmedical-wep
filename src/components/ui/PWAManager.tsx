'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share2, Plus } from 'lucide-react';
import { isPWAInstalled } from '@/lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * PWA Manager (V25.27 - مُوحّد مع lib/pwa.ts)
 * ═══════════════════════════════════════════════════════════════
 */

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

const DISMISSED_KEY = 'pwa-banner-dismissed';
const DAYS_BEFORE_RE_PROMPT = 7;

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua) && !('MSStream' in window)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function shouldShowBanner(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) return true;

    const dismissedAt = parseInt(dismissed);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince > DAYS_BEFORE_RE_PROMPT;
  } catch {
    return true;
  }
}

export default function PWAManager() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [showBanner, setShowBanner] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPlatform = detectPlatform();
    setPlatform(currentPlatform);
    const installed = isPWAInstalled();
    setIsInstalled(installed);

    // تسجيل Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            setInterval(() => {
              registration.update();
            }, 3600000);
          })
          .catch(() => {});
      });
    }

    if (installed) return;
    if (!shouldShowBanner()) return;

    // Android/Desktop: استمع لـ beforeinstallprompt
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setInstallPrompt(event);
      setTimeout(() => setShowBanner(true), 30000);
    };

    // iOS: أظهر banner بعد 30 ثانية (لا API)
    if (currentPlatform === 'ios') {
      setTimeout(() => setShowBanner(true), 30000);
    }

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    const installedHandler = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowIosInstructions(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIosInstructions(true);
      setShowBanner(false);
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
    setShowBanner(false);
    setShowIosInstructions(false);
  };

  if (isInstalled) return null;

  // iOS Instructions Modal
  if (showIosInstructions) {
    return (
      <>
        <div className="pwa-backdrop" onClick={handleDismiss} aria-hidden="true" />
        <div className="pwa-ios-modal" role="dialog">
          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-ios-close"
            aria-label="إغلاق"
          >
            <X size={18} strokeWidth={2.4} />
          </button>

          <div className="pwa-ios-icon">📱</div>
          <h2 className="pwa-ios-title">أضف للشاشة الرئيسية</h2>
          <p className="pwa-ios-subtitle">
            اتبع الخطوات لتثبيت التطبيق على هاتفك:
          </p>

          <ol className="pwa-ios-steps">
            <li>
              <span className="pwa-ios-step-num">1</span>
              <div>
                اضغط على زر المشاركة{' '}
                <Share2
                  size={16}
                  strokeWidth={2.2}
                  style={{ verticalAlign: 'middle', color: '#007AFF' }}
                />{' '}
                في أسفل المتصفّح
              </div>
            </li>
            <li>
              <span className="pwa-ios-step-num">2</span>
              <div>اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</div>
            </li>
            <li>
              <span className="pwa-ios-step-num">3</span>
              <div>
                اضغط &quot;إضافة&quot; في الأعلى{' '}
                <Plus size={14} strokeWidth={2.4} style={{ verticalAlign: 'middle' }} />
              </div>
            </li>
          </ol>

          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-ios-ok"
          >
            فهمت ✓
          </button>
        </div>

        <PwaStyles />
      </>
    );
  }

  // Install Banner
  if (!showBanner) return null;
  if (platform !== 'ios' && !installPrompt) return null;

  return (
    <>
      <div className="pwa-banner" role="region" aria-label="تثبيت التطبيق">
        <div className="pwa-banner-icon">
          <Download size={20} strokeWidth={2.2} />
        </div>
        <div className="pwa-banner-content">
          <div className="pwa-banner-title">ثبّت سباير ميديكال</div>
          <div className="pwa-banner-desc">
            {platform === 'ios'
              ? 'أضفه للشاشة الرئيسية للوصول السريع'
              : 'يعمل بدون إنترنت · إشعارات فورية'}
          </div>
        </div>
        <div className="pwa-banner-actions">
          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-banner-skip"
            aria-label="لاحقاً"
          >
            لاحقاً
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="pwa-banner-install"
          >
            {platform === 'ios' ? 'كيف؟' : 'ثبّت'}
          </button>
        </div>
      </div>

      <PwaStyles />
    </>
  );
}

function PwaStyles() {
  return (
    <style jsx global>{`
      .pwa-banner {
        position: fixed;
        bottom: env(safe-area-inset-bottom, 16px);
        left: 16px;
        right: 16px;
        max-width: 480px;
        margin: 0 auto;
        background: var(--white);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9998;
        box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.18);
        animation: pwa-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .pwa-banner-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--emerald-soft);
        color: var(--emerald-deep);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pwa-banner-content {
        flex: 1;
        min-width: 0;
      }
      .pwa-banner-title {
        font-size: 13px;
        font-weight: 800;
        color: var(--ink);
        margin-bottom: 2px;
      }
      .pwa-banner-desc {
        font-size: 11px;
        color: var(--ink-3);
        line-height: 1.4;
      }
      .pwa-banner-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .pwa-banner-skip {
        background: transparent;
        border: none;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        color: var(--ink-3);
        cursor: pointer;
        padding: 8px 10px;
        border-radius: 8px;
      }
      .pwa-banner-skip:hover {
        background: var(--paper-3);
      }
      .pwa-banner-install {
        background: var(--emerald);
        color: var(--paper-3);
        border: none;
        font-family: inherit;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        padding: 8px 14px;
        border-radius: 100px;
        transition: all 0.15s;
      }
      .pwa-banner-install:hover {
        background: var(--emerald-deep);
        transform: translateY(-1px);
      }
      .pwa-banner-install:active {
        transform: scale(0.97);
      }

      /* iOS Modal */
      .pwa-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        animation: pwa-fade-in 0.2s ease-out;
      }
      .pwa-ios-modal {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--white);
        border-radius: 20px 20px 0 0;
        padding: 24px 20px env(safe-area-inset-bottom, 20px);
        z-index: 10000;
        animation: pwa-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        max-height: 90vh;
        overflow-y: auto;
      }
      .pwa-ios-close {
        position: absolute;
        top: 16px;
        inset-inline-end: 16px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--paper-3);
        border: 1px solid var(--line);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ink-2);
      }
      .pwa-ios-icon {
        font-size: 48px;
        text-align: center;
        margin: 8px 0 16px;
      }
      .pwa-ios-title {
        text-align: center;
        font-size: 20px;
        font-weight: 800;
        color: var(--ink);
        margin: 0 0 8px;
      }
      .pwa-ios-subtitle {
        text-align: center;
        font-size: 13px;
        color: var(--ink-3);
        margin: 0 0 24px;
      }
      .pwa-ios-steps {
        list-style: none;
        padding: 0;
        margin: 0 0 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pwa-ios-steps li {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 14px;
        background: var(--paper-3);
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.6;
        color: var(--ink-2);
      }
      .pwa-ios-step-num {
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--emerald);
        color: var(--paper-3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
      }
      .pwa-ios-ok {
        width: 100%;
        padding: 14px;
        background: var(--emerald);
        color: var(--paper-3);
        border: none;
        border-radius: 14px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
      }
      .pwa-ios-ok:hover {
        background: var(--emerald-deep);
      }

      @keyframes pwa-slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes pwa-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `}</style>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // تسجيل Service Worker
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return; // فقط في production

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // console.log('[PWA] SW registered:', registration.scope);

          // تحقق من التحديثات كل ساعة
          setInterval(() => {
            registration.update();
          }, 3600000);
        })
        .catch((err) => {
          // console.error('[PWA] SW registration failed:', err);
        });
    });

    // تحقق إذا كان التطبيق مُثبّت بالفعل
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // استمع لـ beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setInstallPrompt(event);

      // اعرض الـ prompt بعد 30 ثانية إذا لم يُرفض من قبل
      const dismissed = localStorage.getItem('pwa-dismissed');
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      if (!dismissed || daysSince > 7) {
        setTimeout(() => setShowInstall(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // استمع لـ appinstalled
    const installedHandler = () => {
      setIsInstalled(true);
      setShowInstall(false);
      // console.log('[PWA] App installed!');
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      // console.log('[PWA] User accepted install');
    }
    setInstallPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', String(Date.now()));
    setShowInstall(false);
  };

  if (isInstalled || !showInstall || !installPrompt) return null;

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-icon" aria-hidden="true">📱</div>
      <div className="pwa-install-content">
        <div className="pwa-install-title">ثبّت سباير ميديكال</div>
        <div className="pwa-install-desc">
          ادخل التطبيق بضغطة واحدة · يعمل بدون إنترنت
        </div>
      </div>
      <div className="pwa-install-actions">
        <button type="button" onClick={handleDismiss} className="pwa-install-btn-skip">
          لاحقاً
        </button>
        <button type="button" onClick={handleInstall} className="pwa-install-btn-install">
          ثبّت الآن
        </button>
      </div>
    </div>
  );
}

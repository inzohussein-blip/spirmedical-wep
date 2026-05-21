'use client';

import { useEffect, useState } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';
import { isPWAInstalled, isIOSDevice, isAndroidDevice } from '@/lib/pwa';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * InstallAppButton (V25.27)
 *
 * زر دائم في الـ Settings لتثبيت التطبيق
 *   ✅ Android Chrome: زر تثبيت فوري
 *   ✅ iOS Safari: يفتح modal تعليمات
 *   ✅ Desktop Chrome: زر تثبيت فوري
 *   ✅ Already installed: يعرض "مُثبّت بالفعل"
 */
export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    setInstalled(isPWAInstalled());

    // Android/Desktop: استمع لـ beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // كشف عند التثبيت
    const installedHandler = () => {
      setInstalled(true);
      setInstallPrompt(null);
      toast.success('🎉 تم تثبيت التطبيق بنجاح!');
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    haptic.medium();

    // iOS: اعرض تعليمات
    if (isIOSDevice()) {
      setShowIOSInstructions(true);
      return;
    }

    // Android/Desktop: استخدم beforeinstallprompt
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          haptic.success();
        } else {
          haptic.error();
        }
        setInstallPrompt(null);
      } catch {
        toast.error('فشل التثبيت');
      }
    } else {
      // لا يوجد prompt - ربما المتصفّح غير مدعوم
      toast.error('التثبيت غير متاح في هذا المتصفّح');
    }
  };

  // إذا مُثبّت بالفعل
  if (installed) {
    return (
      <div style={{
        background: 'var(--emerald-soft)',
        border: '1px solid var(--emerald)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: 'var(--emerald)',
          color: 'var(--paper-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Check size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--emerald)' }}>
            ✓ التطبيق مُثبّت
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            استمتع بتجربة كاملة بدون متصفّح
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop: زر تثبيت مباشر
  // iOS: زر يفتح تعليمات
  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          width: '100%',
          background: 'var(--white)',
          border: '1px solid var(--emerald)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'start',
        }}
      >
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: 'var(--emerald)',
          color: 'var(--paper-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Download size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
            ثبّت التطبيق على شاشتك الرئيسية
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {isIOSDevice() ? 'تعليمات Safari' : 'تجربة سريعة بدون متصفّح'}
          </div>
        </div>
        <Smartphone size={20} color="var(--emerald)" />
      </button>

      {showIOSInstructions && (
        <div
          onClick={() => setShowIOSInstructions(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--paper)',
              borderRadius: 18,
              padding: 22,
              maxWidth: 380,
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>
              📱 تثبيت على iPhone
            </h3>
            <ol style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: 'var(--ink-2)',
              paddingInlineStart: 18,
            }}>
              <li>اضغط زر <strong>المشاركة</strong> ⎙ في Safari</li>
              <li>مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية</strong> ✚</li>
              <li>اضغط <strong>إضافة</strong> 🎉</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              style={{
                width: '100%',
                marginTop: 14,
                padding: '10px 16px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 800,
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

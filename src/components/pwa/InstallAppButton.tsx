'use client';

import { useEffect, useState } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';
import {
  isPWAInstalled, isIOSDevice,
  getDeferredPrompt, onInstallPromptChange, triggerInstall,
} from '@/lib/pwa';
import { haptic } from '@/lib/haptic';

/**
 * InstallAppButton (V32)
 *
 * زر دائم في الـ Settings لتثبيت التطبيق — يستخدم النظام الموحّد
 * لالتقاط beforeinstallprompt (يحلّ تضارب الاستماع المتعدّد).
 *   ✅ Android/Desktop Chrome: زر تثبيت فوري
 *   ✅ iOS Safari: يفتح modal تعليمات
 *   ✅ Already installed: يعرض "مُثبّت بالفعل"
 */
export default function InstallAppButton() {
  const [hasPrompt, setHasPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    setInstalled(isPWAInstalled());

    // 🆕 V32: اقرأ من النظام الموحّد (الحدث قد يكون التُقط مسبقاً)
    setHasPrompt(getDeferredPrompt() !== null);

    const unsub = onInstallPromptChange((p) => {
      setHasPrompt(p !== null);
      if (p === null && isPWAInstalled()) {
        setInstalled(true);
      }
    });

    return unsub;
  }, []);

  const handleInstall = async () => {
    haptic.medium();

    // iOS: اعرض تعليمات
    if (isIOSDevice()) {
      setShowIOSInstructions(true);
      return;
    }

    // 🆕 V32: Android/Desktop عبر النظام الموحّد
    const outcome = await triggerInstall();
    if (outcome === 'accepted') {
      haptic.success();
    } else if (outcome === 'dismissed') {
      haptic.error();
    } else {
      // unavailable — لا prompt جاهز، نعرض تعليمات يدوية
      setShowIOSInstructions(true);
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
            {isIOSDevice()
              ? 'تعليمات Safari'
              : hasPrompt
                ? 'جاهز للتثبيت بضغطة واحدة ✓'
                : 'تجربة سريعة بدون متصفّح'}
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
              📱 {isIOSDevice() ? 'تثبيت على iPhone / iPad' : 'تثبيت التطبيق'}
            </h3>
            {isIOSDevice() ? (
              <ol style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--ink-2)', paddingInlineStart: 18 }}>
                <li>اضغط زر <strong>المشاركة</strong> ⎙ في Safari</li>
                <li>مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية</strong> ✚</li>
                <li>اضغط <strong>إضافة</strong> 🎉</li>
              </ol>
            ) : (
              <ol style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--ink-2)', paddingInlineStart: 18 }}>
                <li>افتح قائمة المتصفّح <strong>⋮</strong> (أعلى الزاوية)</li>
                <li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«Add to Home screen»</strong></li>
                <li>أكّد التثبيت 🎉</li>
              </ol>
            )}
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

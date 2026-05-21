'use client';

import { useEffect, useState } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { isIOSDevice, isPWAInstalled, shouldShowInstallPrompt, dismissInstallPrompt } from '@/lib/pwa';
import { haptic } from '@/lib/haptic';

/**
 * iOS Install Instructions Modal (V25.23)
 *
 * يظهر للمستخدمين على iOS Safari لتعليمهم كيف يثبّتوا التطبيق
 * (iOS لا يدعم beforeinstallprompt event)
 */
export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // نتفقد فقط على iOS غير المُثبّت
    if (!isIOSDevice()) return;
    if (isPWAInstalled()) return;
    if (!shouldShowInstallPrompt()) return;

    // نُظهره بعد 10 ثوان من الزيارة (لا نُزعجه فوراً)
    const timer = setTimeout(() => {
      setShow(true);
      haptic.light();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    haptic.light();
    setShow(false);
    dismissInstallPrompt();
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          borderRadius: 24,
          padding: 24,
          maxWidth: 420,
          width: '100%',
          marginBottom: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: 14,
              background: 'var(--emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}>
              📱
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                ثبّت سباير على الـ iPhone
              </h2>
              <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
                لتجربة أسرع وأسهل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              color: 'var(--ink-3)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 14,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
                flexShrink: 0,
              }}>
                1
              </div>
              <div style={{ flex: 1, paddingTop: 3 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                  اضغط على زر المشاركة <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> في الأسفل (Safari) أو الأعلى
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
                flexShrink: 0,
              }}>
                2
              </div>
              <div style={{ flex: 1, paddingTop: 3 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                  مرّر للأسفل واختر <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong>
                  <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginInlineStart: 4 }} />
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
                flexShrink: 0,
              }}>
                3
              </div>
              <div style={{ flex: 1, paddingTop: 3 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                  اضغط <strong>&quot;إضافة&quot;</strong> وسيظهر التطبيق على الشاشة الرئيسية 🎉
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 10,
          padding: 12,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
          marginBottom: 14,
        }}>
          ✨ <strong>المزايا:</strong>
          <br />
          ⚡ فتح أسرع · 🔔 إشعارات فورية · 📲 يعمل بدون إنترنت
        </div>

        {/* Buttons */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '12px 18px',
            background: 'var(--white)',
            color: 'var(--ink-2)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          سأثبّتها لاحقاً
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📱 Smart Install Prompt (V25.15)
 * ═══════════════════════════════════════════════════════════════
 *
 * نظام ذكي لعرض install banner:
 *   1. يظهر بعد 3 زيارات (engagement)
 *   2. يُخفى لو المستخدم رفض (لمدة 7 أيام)
 *   3. يُخفى لو التطبيق مُثبّت بالفعل
 *   4. يدعم iOS (instructions) + Android (auto)
 *
 * يُضاف في layout.tsx
 * ═══════════════════════════════════════════════════════════════
 */

const STORAGE_KEY_VISITS = 'spir_pwa_visits';
const STORAGE_KEY_DISMISSED = 'spir_pwa_dismissed_at';
const STORAGE_KEY_INSTALLED = 'spir_pwa_installed';
const MIN_VISITS = 3;
const DISMISS_DURATION_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function SmartInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ─── Detection ───
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      // التطبيق مُثبّت بالفعل
      localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      return;
    }

    if (localStorage.getItem(STORAGE_KEY_INSTALLED) === 'true') return;

    // ─── Check dismissed recently ───
    const dismissedAt = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DURATION_DAYS) return;
    }

    // ─── Count visits ───
    const visits = parseInt(localStorage.getItem(STORAGE_KEY_VISITS) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY_VISITS, visits.toString());

    if (visits < MIN_VISITS) return;

    // ─── iOS detection ───
    const userAgent = navigator.userAgent.toLowerCase();
    const iOSDetected = /iphone|ipad|ipod/.test(userAgent) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(iOSDetected);

    if (iOSDetected) {
      // iOS لا يدعم beforeinstallprompt - نُظهر banner مع instructions
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // ─── Android/Desktop: استمع للـ beforeinstallprompt ───
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // App installed event
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      } else {
        localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());
      }

      setDeferredPrompt(null);
      setShow(false);
    } catch (e) {
      console.error('Install failed:', e);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  if (showIOSInstructions) {
    return <IOSInstructionsModal onClose={() => setShowIOSInstructions(false)} />;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 80,
        insetInline: 12,
        zIndex: 9997,
        animation: 'pwa-slide-up 0.5s ease',
      }}
    >
      <style>{`
        @keyframes pwa-slide-up {
          from { transform: translateY(120%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pwa-pulse-icon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 14,
          boxShadow: '0 12px 32px rgba(15, 107, 88, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
            color: 'var(--paper-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            animation: 'pwa-pulse-icon 2.5s ease-in-out infinite',
          }}
        >
          <Smartphone size={24} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>
              ثبّت التطبيق
            </h3>
            <Sparkles size={11} color="var(--amber)" />
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>
            وصول أسرع · يعمل offline · إشعارات فورية
          </p>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          style={{
            padding: '8px 14px',
            background: 'var(--emerald)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <Download size={13} />
          ثبّت
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إغلاق"
          style={{
            width: 28,
            height: 28,
            background: 'var(--paper-3)',
            color: 'var(--ink-3)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// iOS Install Instructions Modal
// ═══════════════════════════════════════════════════════════════
function IOSInstructionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          width: '100%',
          maxWidth: 440,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 24,
          paddingBottom: 32,
          animation: 'pwa-slide-up 0.4s ease',
        }}
      >
        <div style={{
          width: 40,
          height: 4,
          background: 'var(--paper-3)',
          borderRadius: 2,
          margin: '0 auto 20px',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 12px',
              background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
              color: 'var(--paper-3)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            📱
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>
            ثبّت Spir Medical
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
            على iPhone أو iPad - خطوتان فقط
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <Step
            number={1}
            title="اضغط زر المشاركة"
            description="في أسفل Safari، اضغط أيقونة المشاركة"
            icon="⬆️"
          />
          <Step
            number={2}
            title='اختر "Add to Home Screen"'
            description='ابحث عن "Add to Home Screen" أو "أضف إلى الشاشة الرئيسية"'
            icon="➕"
          />
          <Step
            number={3}
            title='اضغط "Add"'
            description="سيظهر التطبيق على شاشتك الرئيسية كأي تطبيق آخر"
            icon="✓"
          />
        </div>

        <div
          style={{
            background: 'var(--emerald-soft)',
            borderRadius: 10,
            padding: 12,
            fontSize: 11,
            color: 'var(--ink-2)',
            lineHeight: 1.6,
            marginBottom: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          <Sparkles size={14} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>المميزات بعد التثبيت:</strong><br />
            ⚡ فتح أسرع · 📡 يعمل بدون نت · 🔔 إشعارات
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: 14,
            background: 'var(--emerald)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          فهمت!
        </button>
      </div>
    </div>
  );
}

function Step({ number, title, description, icon }: {
  number: number;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        background: 'var(--paper-3)',
        borderRadius: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          background: 'var(--emerald)',
          color: 'var(--paper-3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>
          {title} <span style={{ fontSize: 14 }}>{icon}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

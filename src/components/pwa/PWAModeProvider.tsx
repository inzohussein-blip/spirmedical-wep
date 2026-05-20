'use client';

import { useEffect, useState, createContext, useContext } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 PWA Mode Provider (V25.15)
 * ═══════════════════════════════════════════════════════════════
 *
 * يُوفّر:
 *   - معرفة هل التطبيق في standalone mode
 *   - معرفة platform (iOS / Android / Desktop)
 *   - معرفة safe areas (notch)
 *   - معرفة orientation
 *   - تطبيق theme-color تلقائياً
 *
 * Usage:
 *   const { isStandalone, platform } = usePWAMode();
 * ═══════════════════════════════════════════════════════════════
 */

export type PWAPlatform = 'ios' | 'android' | 'desktop' | 'unknown';

interface PWAModeContextValue {
  isStandalone: boolean;
  platform: PWAPlatform;
  isOnline: boolean;
  hasNotch: boolean;
  orientation: 'portrait' | 'landscape';
}

const PWAModeContext = createContext<PWAModeContextValue>({
  isStandalone: false,
  platform: 'unknown',
  isOnline: true,
  hasNotch: false,
  orientation: 'portrait',
});

export function usePWAMode() {
  return useContext(PWAModeContext);
}

export default function PWAModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PWAModeContextValue>({
    isStandalone: false,
    platform: 'unknown',
    isOnline: true,
    hasNotch: false,
    orientation: 'portrait',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ─── Detect standalone ───
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    // ─── Detect platform ───
    const ua = navigator.userAgent.toLowerCase();
    let platform: PWAPlatform = 'unknown';

    if (/iphone|ipad|ipod/.test(ua)) platform = 'ios';
    else if (/android/.test(ua)) platform = 'android';
    else if (/mac|win|linux/.test(ua)) platform = 'desktop';

    // ─── Detect notch (iOS only) ───
    const hasNotch =
      platform === 'ios' &&
      CSS.supports('padding-top: env(safe-area-inset-top)') &&
      parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--sat')
          .replace('px', '') || '0',
        10
      ) > 0;

    // ─── Online status ───
    const isOnline = navigator.onLine;

    // ─── Orientation ───
    const orientation: 'portrait' | 'landscape' =
      window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

    setState({ isStandalone, platform, isOnline, hasNotch, orientation });

    // Add CSS classes to root
    document.documentElement.classList.toggle('pwa-standalone', isStandalone);
    document.documentElement.classList.add(`pwa-${platform}`);
    if (hasNotch) document.documentElement.classList.add('pwa-has-notch');

    // ─── Listen for online/offline ───
    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ─── Listen for orientation ───
    const handleOrientation = () => {
      setState((s) => ({
        ...s,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      }));
    };
    window.addEventListener('resize', handleOrientation);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleOrientation);
    };
  }, []);

  return (
    <PWAModeContext.Provider value={state}>
      {children}

      {/* Offline indicator */}
      {!state.isOnline && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 0,
            insetInline: 0,
            background: 'var(--rose)',
            color: 'var(--paper-3)',
            padding: '6px 12px',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            zIndex: 99999,
            paddingTop: 'calc(6px + env(safe-area-inset-top, 0px))',
            animation: 'slideDown 0.3s ease',
          }}
        >
          📡 لا يوجد اتصال - بعض الميزات قد لا تعمل
          <style>{`
            @keyframes slideDown {
              from { transform: translateY(-100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </PWAModeContext.Provider>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from './OnboardingFlow';

const ONBOARDING_KEY = 'spir_onboarding_completed';

/**
 * ═══════════════════════════════════════════════════════════════
 * AppRouter — Client-side check للـ onboarding
 * ═══════════════════════════════════════════════════════════════
 */

export default function AppRouter() {
  const router = useRouter();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    // تحقق من localStorage
    try {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (completed === 'true') {
        // شاهد الـ onboarding من قبل → /login
        router.replace('/login');
      } else {
        // أول مرة → نُظهر Onboarding
        setShouldShowOnboarding(true);
      }
    } catch {
      // لو localStorage معطّل، نُظهر onboarding
      setShouldShowOnboarding(true);
    }
  }, [router]);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // ignore
    }
    router.replace('/login');
  };

  // أثناء التحقق من localStorage
  if (shouldShowOnboarding === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid var(--paper-2)',
            borderTopColor: 'var(--emerald)',
            borderRadius: '50%',
            animation: 'app-loading-spin 0.8s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes app-loading-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // أول مرة → Onboarding
  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
}

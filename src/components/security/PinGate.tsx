'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PinLockScreen from './PinLockScreen';

interface Props {
  pinEnabled: boolean;
  children: React.ReactNode;
}

// مسارات لا تُقفل أبداً (طوارئ)
const ALWAYS_UNLOCKED = ['/sos'];

/**
 * يظهر شاشة PIN عند فتح التطبيق إذا كان PIN مفعّلاً
 * ولم يتم unlock في هذه الجلسة.
 * استثناء: /sos دائماً متاح في حالات الطوارئ.
 */
export default function PinGate({ pinEnabled, children }: Props) {
  const pathname = usePathname();
  const [isUnlocked, setIsUnlocked] = useState(!pinEnabled);
  const [hasMounted, setHasMounted] = useState(false);

  // SOS مفتوح دائماً
  const isEmergencyRoute = ALWAYS_UNLOCKED.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    setHasMounted(true);
    if (!pinEnabled || isEmergencyRoute) {
      setIsUnlocked(true);
      return;
    }
    const unlocked = sessionStorage.getItem('spir_unlocked') === '1';
    setIsUnlocked(unlocked);
  }, [pinEnabled, isEmergencyRoute]);

  if (!hasMounted) return <>{children}</>;

  if (!isUnlocked) {
    return <PinLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return <>{children}</>;
}

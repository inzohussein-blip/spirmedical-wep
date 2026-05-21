'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, ScanFace, Loader2 } from 'lucide-react';
import {
  isBiometricAvailable, hasRegisteredBiometric,
  loginWithBiometric, registerBiometric,
} from '@/lib/biometric';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Biometric Login Button (V25.17)
 * ═══════════════════════════════════════════════════════════════
 *
 * زر تسجيل دخول بالبصمة (يظهر فقط إذا الجهاز يدعمها)
 *
 * Usage:
 *   // في صفحة /auth/login (بعد form العادي)
 *   <BiometricLoginButton onSuccess={(userId) => router.push('/dashboard')} />
 *
 *   // في settings (للتسجيل)
 *   <BiometricLoginButton mode="register" userId={user.id} email={user.email} />
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  mode?: 'login' | 'register';
  userId?: string;
  email?: string;
  displayName?: string;
  onSuccess?: (userId: string) => void;
  onError?: (error: string) => void;
}

export default function BiometricLoginButton({
  mode = 'login',
  userId,
  email,
  displayName,
  onSuccess,
  onError,
}: Props) {
  const [available, setAvailable] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');

    // Check biometric availability
    isBiometricAvailable().then(setAvailable);
    setRegistered(hasRegisteredBiometric());
  }, []);

  const handleAction = async () => {
    haptic.medium();
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!userId || !email) {
          toast.error('بيانات المستخدم ناقصة');
          return;
        }
        const result = await registerBiometric(userId, email, displayName || email);
        if (result.success) {
          haptic.success();
          toast.success('تم تفعيل البصمة ✓');
          setRegistered(true);
          onSuccess?.(userId);
        } else {
          haptic.error();
          toast.error(result.error || 'فشل التسجيل');
          onError?.(result.error || '');
        }
      } else {
        const result = await loginWithBiometric();
        if (result.success && result.userId) {
          haptic.success();
          onSuccess?.(result.userId);
        } else {
          haptic.error();
          if (result.error && result.error !== 'تم إلغاء البصمة') {
            toast.error(result.error);
          }
          onError?.(result.error || '');
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Biometric error:', e);
      haptic.error();
      toast.error('حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── No support → لا تعرض شيئاً ───
  if (!available) return null;

  // ─── Login mode: must have registered first ───
  if (mode === 'login' && !registered) return null;

  // ─── Choose icon based on platform ───
  const Icon = platform === 'ios' ? ScanFace : Fingerprint;
  const platformLabel = platform === 'ios' ? 'Face ID / Touch ID' : 'البصمة';

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={isLoading}
      aria-label={mode === 'register' ? `فعّل ${platformLabel}` : `تسجيل دخول بـ ${platformLabel}`}
      style={{
        width: '100%',
        padding: 14,
        background: mode === 'register' ? 'var(--paper-3)' : 'var(--white)',
        color: 'var(--emerald)',
        border: '2px solid var(--emerald)',
        borderRadius: 12,
        cursor: isLoading ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          جاري التحقّق...
        </>
      ) : (
        <>
          <Icon size={20} />
          {mode === 'register'
            ? `فعّل ${platformLabel}`
            : `الدخول بـ ${platformLabel}`}
        </>
      )}
    </button>
  );
}

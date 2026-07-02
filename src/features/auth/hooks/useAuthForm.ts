'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 useAuthForm Hook
 * ═══════════════════════════════════════════════════════════════
 *
 * يجمع Phone validation + Remember me + OTP mode + Dialog state.
 * الـ central hook للـ Login/Register forms.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { haptic } from '@/lib/haptic';
import { usePhoneValidation } from './usePhoneValidation';
import { useRememberPhone } from './useRememberPhone';
import { DEFAULT_COUNTRY } from '../lib/countries';
import { readOtpMode, shouldUseOtp as shouldUseOtpLogic } from '../lib/otp-mode';
import type { Role, OtpMode, OtpChannel } from '../types';

export function useAuthForm(initialRole: Role = 'patient') {
  const searchParams = useSearchParams();

  // ─── من URL params ───
  const role: Role =
    (searchParams.get('role') as Role | null) ?? initialRole;
  const redirectTo = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const errorCode = searchParams.get('code');

  // ─── Phone ───
  const phone = usePhoneValidation(DEFAULT_COUNTRY);
  const remember = useRememberPhone(
    phone.fullPhoneE164,
    phone.country,
    phone.phoneValid
  );

  // ─── استعادة الرقم المحفوظ عند mount ───
  useEffect(() => {
    const savedLocal = remember.loadSavedLocal();
    if (savedLocal) {
      phone.setPhone(savedLocal);
    }
    // تنظيف session unlock القديم
    try {
      sessionStorage.removeItem('spir_unlocked');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── OTP mode ───
  const otpMode: OtpMode = readOtpMode();

  // ─── Confirm dialog (للـ skip OTP) ───
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const openSkipDialog = useCallback(() => setSkipDialogOpen(true), []);
  const closeSkipDialog = useCallback(() => {
    haptic.selection();
    setSkipDialogOpen(false);
  }, []);

  // ─── helpers ───
  const shouldUseOtp = useCallback(
    (action: 'otp' | 'skip' | 'auto') =>
      shouldUseOtpLogic(otpMode, action),
    [otpMode]
  );

  return {
    // route-driven
    role,
    redirectTo,
    errorParam,
    errorCode,

    // mode
    otpMode,

    // phone
    phone,

    // remember
    remember,

    // dialog
    skipDialogOpen,
    openSkipDialog,
    closeSkipDialog,

    // logic
    shouldUseOtp,
  };
}

export type UseAuthFormReturn = ReturnType<typeof useAuthForm>;

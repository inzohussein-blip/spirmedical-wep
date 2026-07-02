'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 💾 useRememberPhone Hook
 * ═══════════════════════════════════════════════════════════════
 *
 * يحفظ/يستعيد رقم الهاتف في localStorage.
 * ملاحظة: localStorage يخزّن نص عادي — هذا trade-off مع UX.
 *      للإنتاج الحساس، استخدم sessionStorage أو encrypted storage.
 */

import { useState, useEffect, useCallback } from 'react';
import { haptic } from '@/lib/haptic';
import { fromE164 } from '../lib/phone-formatter';
import type { Country } from '../types';

const STORAGE_KEY = 'spir_remember_phone';

export function useRememberPhone(
  fullPhoneE164: string,
  country: Country,
  isValid: boolean
) {
  const [rememberMe, setRememberMeState] = useState(false);

  // استعادة عند mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return setRememberMeState(true);
    } catch {
      // localStorage غير متاح
    }
  }, []);

  // حفظ عند التغيير
  useEffect(() => {
    try {
      if (rememberMe && isValid && fullPhoneE164) {
        localStorage.setItem(STORAGE_KEY, fullPhoneE164);
      } else if (!rememberMe) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [rememberMe, isValid, fullPhoneE164]);

  const setRememberMe = useCallback((value: boolean) => {
    haptic.selection();
    setRememberMeState(value);
  }, []);

  /**
   * استخراج الجزء المحلي من رقم محفوظ (مع افتراض default country)
   */
  const loadSavedLocal = useCallback((): string | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      return fromE164(saved, country.code);
    } catch {
      return null;
    }
  }, [country.code]);

  return {
    rememberMe,
    setRememberMe,
    loadSavedLocal,
  };
}

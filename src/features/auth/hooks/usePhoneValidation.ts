'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📱 usePhoneValidation Hook
 * ═══════════════════════════════════════════════════════════════
 *
 * يختصّ بـ state + validation logic للرقم.
 * قابل لإعادة الاستخدام في LoginForm, RegisterForm, EditPhone.
 */

import { useState, useCallback, useMemo } from 'react';
import { haptic } from '@/lib/haptic';
import { validateIraqiPhone, toE164 } from '../lib/phone-formatter';
import type { Country } from '../types';

export function usePhoneValidation(initialCountry: Country) {
  const [country, setCountry] = useState<Country>(initialCountry);
  const [phone, setPhoneState] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [phoneValid, setPhoneValid] = useState(false);

  const setPhone = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, country.maxLen);
      setPhoneState(digits);
      setPhoneError(undefined);

      if (digits.length === country.maxLen) {
        const r = validateIraqiPhone(digits);
        if (r.valid) {
          setPhoneValid(true);
          haptic.selection();
        } else {
          setPhoneValid(false);
          setPhoneError(r.reason);
        }
      } else {
        setPhoneValid(false);
      }
    },
    [country.maxLen]
  );

  const validateManually = useCallback((): boolean => {
    if (!phoneValid) {
      const r = validateIraqiPhone(phone);
      setPhoneError(r.reason || 'رقم الهاتف غير صحيح');
      return false;
    }
    return true;
  }, [phone, phoneValid]);

  const fullPhoneE164 = useMemo(
    () => (phoneValid ? toE164(phone, country.code) : ''),
    [phone, country.code, phoneValid]
  );

  const reset = useCallback(() => {
    setPhoneState('');
    setPhoneError(undefined);
    setPhoneValid(false);
  }, []);

  return {
    // state
    country,
    phone,
    phoneError,
    phoneValid,
    // setters
    setCountry,
    setPhone,
    setPhoneError,
    // actions
    validateManually,
    reset,
    // derived
    fullPhoneE164,
  };
}

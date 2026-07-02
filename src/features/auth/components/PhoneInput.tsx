'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📱 PhoneInput Component
 * ═══════════════════════════════════════════════════════════════
 *
 * Phone input مع Country Picker مدمج.
 * Pure UI — يستقبل state/setters من الـ parent.
 */

import { useState, useRef, useEffect } from 'react';
import { Phone, Check, AlertCircle } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { formatDisplay } from '../lib/phone-formatter';
import type { Country } from '../types';
import { COUNTRIES } from '../lib/countries';

interface Props {
  value: string;
  country: Country;
  onCountryChange: (c: Country) => void;
  onChange: (value: string) => void;
  error?: string;
  valid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  inputId?: string;
}

export function PhoneInput({
  value,
  country,
  onCountryChange,
  onChange,
  error,
  valid,
  disabled,
  autoFocus,
  inputId = 'phone',
}: Props) {
  return (
    <div className="auth-field">
      <label htmlFor={inputId} className="auth-field-label">
        <Phone size={14} />
        <span>رقم الهاتف</span>
        <span className="auth-required" aria-label="إلزامي">*</span>
      </label>

      <div className={`auth-phone-group ${valid ? 'is-valid' : ''} ${error ? 'is-error' : ''}`}>
        <CountryPicker value={country} onChange={onCountryChange} />
        <input
          id={inputId}
          name="phone"
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={formatDisplay('7'.repeat(country.maxLen))}
          autoComplete="tel-national"
          autoFocus={autoFocus}
          required
          maxLength={country.maxLen}
          className="auth-input"
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-help`}
          dir="ltr"
          disabled={disabled}
        />
        {valid && (
          <div className="auth-phone-check" aria-hidden="true">
            <Check size={18} />
          </div>
        )}
      </div>

      {error ? (
        <span id={`${inputId}-error`} className="auth-field-error" role="alert">
          <AlertCircle size={12} />
          <span>{error}</span>
        </span>
      ) : (
        <span id={`${inputId}-help`} className="auth-field-hint">
          سيُحفظ رقمك بشكل آمن ومشفّر
        </span>
      )}
    </div>
  );
}

// ─── Country Picker (داخلي) ───
function CountryPicker({
  value,
  onChange,
}: {
  value: Country;
  onChange: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="auth-country" ref={ref}>
      <button
        type="button"
        className="auth-country-trigger"
        onClick={() => {
          haptic.selection();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="اختر رمز الدولة"
      >
        <span className="auth-country-flag" aria-hidden="true">{value.flag}</span>
        <span className="auth-country-code">{value.code}</span>
        <span className="auth-country-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <ul className="auth-country-list" role="listbox">
          {COUNTRIES.map((c) => (
            <li key={c.iso}>
              <button
                type="button"
                role="option"
                aria-selected={c.iso === value.iso}
                className={`auth-country-item ${c.iso === value.iso ? 'is-active' : ''}`}
                onClick={() => {
                  haptic.selection();
                  onChange(c);
                  setOpen(false);
                }}
              >
                <span className="auth-country-flag">{c.flag}</span>
                <span className="auth-country-name">{c.label}</span>
                <span className="auth-country-code">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

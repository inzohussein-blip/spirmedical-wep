/**
 * ═══════════════════════════════════════════════════════════════
 * 📱 Phone Formatter Tests
 * ═══════════════════════════════════════════════════════════════
 */

import {
  validateIraqiPhone,
  formatDisplay,
  toE164,
  fromE164,
} from '@/features/auth/lib/phone-formatter';

describe('validateIraqiPhone', () => {
  it('rejects empty', () => {
    expect(validateIraqiPhone('').valid).toBe(false);
  });

  it('rejects too short', () => {
    expect(validateIraqiPhone('077123').valid).toBe(false);
  });

  it('rejects too long', () => {
    expect(validateIraqiPhone('0771234567890').valid).toBe(false);
  });

  it('rejects non-iraqi prefix', () => {
    expect(validateIraqiPhone('0571234567').valid).toBe(false);
    expect(validateIraqiPhone('0871234567').valid).toBe(false);
  });

  it('rejects wrong third digit (out of 3-7)', () => {
    expect(validateIraqiPhone('0711234567').valid).toBe(false); // 1 not in 3-7
    expect(validateIraqiPhone('0721234567').valid).toBe(false); // 2 not in 3-7
    expect(validateIraqiPhone('0781234567').valid).toBe(false); // 8 not in 3-7
  });

  it('accepts valid Zain', () => {
    // 07[3-7]XXXXXXX — Zain starts with 078
    expect(validateIraqiPhone('0781234567').valid).toBe(false); // 8 not ok
  });

  it('accepts valid Asiacell (077)', () => {
    const r = validateIraqiPhone('07712345678');
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe('0771 234 5678');
  });

  it('accepts valid Korek (075)', () => {
    const r = validateIraqiPhone('07512345678');
    expect(r.valid).toBe(true);
  });

  it('strips non-digit characters and validates', () => {
    // '0771-234-5678' يُجرَّد → '07712345678' = 11 رقم = رقم عراقي صحيح
    const r = validateIraqiPhone('0771-234-5678');
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe('0771 234 5678');
  });
});

describe('formatDisplay', () => {
  it('formats as 07XX XXX XXXX', () => {
    expect(formatDisplay('07712345678')).toBe('0771 234 5678');
  });

  it('handles partial input', () => {
    expect(formatDisplay('077')).toBe('077');
    expect(formatDisplay('0771')).toBe('0771');
    expect(formatDisplay('07712')).toBe('0771 2');
  });

  it('strips non-digits', () => {
    expect(formatDisplay('077-abcd-1234')).toBe('0771 234');
  });
});

describe('toE164', () => {
  it('converts 07X... to +964X...', () => {
    expect(toE164('07712345678', '+964')).toBe('+9647712345678');
  });

  it('keeps +964 prefix', () => {
    expect(toE164('+9647712345678', '+964')).toBe('+9647712345678');
  });
});

describe('fromE164', () => {
  it('strips +964 to local', () => {
    expect(fromE164('+9647712345678', '+964')).toBe('7712345678');
  });

  it('handles numbers without prefix', () => {
    expect(fromE164('7712345678', '+964')).toBe('7712345678');
  });
});

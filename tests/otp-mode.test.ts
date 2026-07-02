/**
 * ═══════════════════════════════════════════════════════════════
 * ⚙️ OTP Mode Tests
 * ═══════════════════════════════════════════════════════════════
 */

import { readOtpMode, shouldUseOtp, canSkipOtp } from '@/features/auth/lib/otp-mode';

describe('readOtpMode', () => {
  const originalEnv = process.env.NEXT_PUBLIC_OTP_MODE;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_OTP_MODE;
    } else {
      process.env.NEXT_PUBLIC_OTP_MODE = originalEnv;
    }
  });

  it('defaults to disabled', () => {
    delete process.env.NEXT_PUBLIC_OTP_MODE;
    expect(readOtpMode()).toBe('disabled');
  });

  it('reads required', () => {
    process.env.NEXT_PUBLIC_OTP_MODE = 'required';
    expect(readOtpMode()).toBe('required');
  });

  it('reads optional', () => {
    process.env.NEXT_PUBLIC_OTP_MODE = 'optional';
    expect(readOtpMode()).toBe('optional');
  });

  it('reads disabled', () => {
    process.env.NEXT_PUBLIC_OTP_MODE = 'disabled';
    expect(readOtpMode()).toBe('disabled');
  });

  it('falls back to disabled on invalid value', () => {
    process.env.NEXT_PUBLIC_OTP_MODE = 'whatever';
    expect(readOtpMode()).toBe('disabled');
  });
});

describe('shouldUseOtp', () => {
  it('required always sends otp', () => {
    expect(shouldUseOtp('required', 'otp')).toBe(true);
    expect(shouldUseOtp('required', 'skip')).toBe(true);
    expect(shouldUseOtp('required', 'auto')).toBe(true);
  });

  it('optional respects action', () => {
    expect(shouldUseOtp('optional', 'otp')).toBe(true);
    expect(shouldUseOtp('optional', 'skip')).toBe(false);
    expect(shouldUseOtp('optional', 'auto')).toBe(false);
  });

  it('disabled never sends otp', () => {
    expect(shouldUseOtp('disabled', 'otp')).toBe(false);
    expect(shouldUseOtp('disabled', 'skip')).toBe(false);
  });
});

describe('canSkipOtp', () => {
  it('allows skip in disabled mode', () => {
    expect(canSkipOtp('disabled')).toBe(true);
  });

  it('allows skip in optional mode', () => {
    expect(canSkipOtp('optional')).toBe(true);
  });

  it('disallows skip in required mode', () => {
    expect(canSkipOtp('required')).toBe(false);
  });
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔑 Error Codes Tests
 * ═══════════════════════════════════════════════════════════════
 */

import { getOtpError, OTP_ERROR_CODES } from '@/features/auth/lib/error-codes';

describe('getOtpError', () => {
  it('returns null for null/undefined', () => {
    expect(getOtpError(null)).toBeNull();
    expect(getOtpError(undefined)).toBeNull();
    expect(getOtpError('')).toBeNull();
  });

  it('returns known error', () => {
    const err = getOtpError('DB_42501');
    expect(err?.code).toBe('DB_42501');
    expect(err?.message).toBeTruthy();
  });

  it('returns fallback for unknown', () => {
    const err = getOtpError('FOO_BAR');
    expect(err?.code).toBe('FOO_BAR');
    expect(err?.message).toBe('حدث خطأ');
  });

  it('has expected keys', () => {
    expect(OTP_ERROR_CODES.RATE_LIMIT).toBeDefined();
    expect(OTP_ERROR_CODES.SEND_FAILED).toBeDefined();
  });
});

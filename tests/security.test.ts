/**
 * اختبارات انحدار أمنية (Phase 0)
 *
 * تحرس ضد إعادة إدخال الثغرات التي أُصلحت:
 *  - مفتاح تشفير احتياطي معروف
 *  - باب OTP خلفي على العميل
 *  - دخول بدون رمز في الإنتاج
 */

import { encrypt } from '@/lib/encryption';
import { isPasswordlessLoginAllowed } from '@/lib/flags';

describe('Security: ENCRYPTION_KEY مطلوب دائماً (لا مفتاح احتياطي)', () => {
  it('يرمي خطأً عند غياب ENCRYPTION_KEY', () => {
    const original = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => encrypt('phi')).toThrow();
    } finally {
      process.env.ENCRYPTION_KEY = original;
    }
  });

  it('يرمي خطأً عند مفتاح غير صالح (ليس 64 hex)', () => {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'too-short';
    try {
      expect(() => encrypt('phi')).toThrow();
    } finally {
      process.env.ENCRYPTION_KEY = original;
    }
  });
});

describe('Security: وحدة otp-channels بلا إرسال/تحقق على العميل', () => {
  it('لا تُصدّر sendOtp ولا verifyOtp (لا باب خلفي)', async () => {
    const mod = (await import('@/lib/services/otp-channels')) as Record<string, unknown>;
    expect(mod.sendOtp).toBeUndefined();
    expect(mod.verifyOtp).toBeUndefined();
  });
});

describe('Security: الدخول بدون رمز يُقفَل في وضع required', () => {
  it('required يمنع، optional يسمح، والعلم الصريح يتجاوز', () => {
    const origMode = process.env.NEXT_PUBLIC_OTP_MODE;
    const origFlag = process.env.ALLOW_PASSWORDLESS_LOGIN;
    delete process.env.ALLOW_PASSWORDLESS_LOGIN;
    try {
      // required → ممنوع
      process.env.NEXT_PUBLIC_OTP_MODE = 'required';
      expect(isPasswordlessLoginAllowed()).toBe(false);

      // العلم الصريح يتجاوز حتى في required
      process.env.ALLOW_PASSWORDLESS_LOGIN = 'true';
      expect(isPasswordlessLoginAllowed()).toBe(true);
      delete process.env.ALLOW_PASSWORDLESS_LOGIN;

      // optional → مسموح
      process.env.NEXT_PUBLIC_OTP_MODE = 'optional';
      expect(isPasswordlessLoginAllowed()).toBe(true);
    } finally {
      if (origMode === undefined) delete process.env.NEXT_PUBLIC_OTP_MODE;
      else process.env.NEXT_PUBLIC_OTP_MODE = origMode;
      if (origFlag === undefined) delete process.env.ALLOW_PASSWORDLESS_LOGIN;
      else process.env.ALLOW_PASSWORDLESS_LOGIN = origFlag;
    }
  });
});

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

describe('Security: رمزُ التحقّق خادميٌّ وحده', () => {
  // كانت وحدةُ otp-channels طبقةَ عرضٍ على العميل وحارسُها يمنع أن تُصدّر
  // sendOtp/verifyOtp. حُذفت مع خطوة الرمز في رفع الطلب؛ والحارسُ الأعمّ:
  // لا ملفَّ عميلٍ يستورد خدمة الرمز فيولّد أو يتحقّق في المتصفّح.
  it('لا ملفَّ «use client» يستورد otp-service', () => {
    const fs = require('fs');
    const path = require('path');
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(p)) files.push(p);
      }
    };
    walk(path.join(process.cwd(), 'src'));
    const offenders = files.filter((f) => {
      const s = fs.readFileSync(f, 'utf8');
      return /^['"]use client['"]/m.test(s) && /whatsapp\/otp-service/.test(s);
    });
    expect(offenders).toEqual([]);
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

/**
 * ═══════════════════════════════════════════════════════════════
 * ⚙️ OTP Mode Configuration
 * ═══════════════════════════════════════════════════════════════
 *
 * يقرأ من env + متوافق مع flags.ts الموجود.
 *
 * Modes:
 *   - 'disabled': دخول مباشر بدون OTP
 *   - 'optional': المستخدم يختار (إرسال رمز أو دخول سريع)
 *   - 'required': إرسال OTP إلزامي
 */

import type { OtpMode } from '../types';

const DEFAULT_MODE: OtpMode = 'disabled';

/**
 * قراءة وضع OTP من الـ env (client-side safe — NEXT_PUBLIC_*)
 */
export function readOtpMode(): OtpMode {
  const v = process.env.NEXT_PUBLIC_OTP_MODE;
  if (v === 'required' || v === 'optional' || v === 'disabled') {
    return v;
  }
  return DEFAULT_MODE;
}

/**
 * هل يجب إرسال OTP في الـ flow الحالي؟
 */
export function shouldUseOtp(mode: OtpMode, action: 'otp' | 'skip' | 'auto'): boolean {
  if (mode === 'required') return true;
  if (mode === 'optional') return action === 'otp';
  return false;
}

/**
 * هل وضع "الدخول السريع" متاح؟
 */
export function canSkipOtp(mode: OtpMode): boolean {
  return mode === 'disabled' || mode === 'optional';
}

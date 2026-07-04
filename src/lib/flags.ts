/**
 * Feature Flags
 *
 * يُتيح تفعيل/تعطيل ميزات بدون redeploy عبر تعديل env vars في Vercel.
 *
 * الاستخدام:
 *   import { isEnabled, getOtpMode } from '@/lib/flags';
 *
 *   if (getOtpMode() === 'required') { ... }
 */

import { env, getOtpMode, type OtpMode } from './env';

export type FeatureFlag =
  | 'specialist_chat'
  | 'family_accounts'
  | 'subscriptions'
  | 'medical_record'
  | 'sos_active'
  | 'pharmacy_delivery'
  | 'video_consultations';

const FLAGS: Record<FeatureFlag, boolean> = {
  specialist_chat: env.NEXT_PUBLIC_ENABLE_SPECIALIST_CHAT,
  family_accounts: env.NEXT_PUBLIC_ENABLE_FAMILY_ACCOUNTS,
  subscriptions: env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS,

  // ميزات ممكّنة افتراضياً
  medical_record: false,
  sos_active: true,
  pharmacy_delivery: true,
  video_consultations: true,
};

/**
 * تحقق من تفعيل ميزة
 */
export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag] ?? false;
}

/**
 * احصل على كل الـ flags (للـ debug)
 */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  return { ...FLAGS };
}

/**
 * Helper async للـ Server Components
 */
export async function checkFlag(flag: FeatureFlag): Promise<boolean> {
  return isEnabled(flag);
}

// ─────────────────────────────────────────────────────────
// OTP Mode helpers
// ─────────────────────────────────────────────────────────

export { getOtpMode };
export type { OtpMode };

/**
 * هل OTP إجباري؟ (المستخدم لا يمكنه التخطي)
 */
export function isOtpRequired(): boolean {
  return getOtpMode() === 'required';
}

/**
 * هل OTP اختياري؟ (يمكن للمستخدم التخطي)
 */
export function isOtpOptional(): boolean {
  return getOtpMode() === 'optional';
}

/**
 * هل OTP معطّل تماماً؟ (لا يظهر إطلاقاً)
 */
export function isOtpDisabled(): boolean {
  return getOtpMode() === 'disabled';
}

/**
 * هل يُسمح بالدخول بدون رمز (مسار اشتقاق كلمة السر)؟
 *
 * ⚠️ خطر أمني: هذا المسار يُنشئ/يُدخل حساباً اعتماداً على رقم الهاتف فقط،
 * بلا عامل تحقّق (possession/knowledge).
 *
 * القاعدة:
 *   - وضع `required` → ممنوع نهائياً (إلا بعلم ALLOW_PASSWORDLESS_LOGIN=true صريح).
 *   - وضع `optional`/`disabled` → مسموح (اختيار صريح من المالك لإبقاء الدخول شغّالاً).
 *
 * لإقفال الثغرة نهائياً: اضبط NEXT_PUBLIC_OTP_MODE=required.
 */
export function isPasswordlessLoginAllowed(): boolean {
  if (process.env.ALLOW_PASSWORDLESS_LOGIN === 'true') return true;
  return (process.env.NEXT_PUBLIC_OTP_MODE ?? 'optional') !== 'required';
}

/**
 * هل يمكن التخطي؟ (وضع غير required + السماح بالدخول بدون رمز)
 */
export function canSkipOtp(): boolean {
  return !isOtpRequired() && isPasswordlessLoginAllowed();
}

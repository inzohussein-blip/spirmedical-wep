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
 * هل يمكن التخطي؟ (في وضع disabled أو optional)
 */
export function canSkipOtp(): boolean {
  return !isOtpRequired();
}

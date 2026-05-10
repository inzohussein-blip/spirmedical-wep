/**
 * Feature Flags
 *
 * يُتيح تفعيل/تعطيل ميزات بدون redeploy عبر تعديل env vars في Vercel.
 *
 * الاستخدام:
 *   import { isEnabled } from '@/lib/flags';
 *   if (isEnabled('specialist_chat')) { ... }
 *
 * للترقية لاحقاً:
 *   - Vercel Edge Config (للتحديث الفوري بدون redeploy)
 *   - GrowthBook / LaunchDarkly (للـ user-targeted flags)
 *   - PostHog Flags (للـ A/B testing)
 */

import { env } from './env';

export type FeatureFlag =
  | 'specialist_chat'      // محادثات المختص (لم تُطبَّق بعد)
  | 'family_accounts'      // إدارة العائلة
  | 'subscriptions'        // باقات العضوية
  | 'medical_record'       // السجل الطبي
  | 'sos_active'           // طوارئ SOS مفعّلة
  | 'pharmacy_delivery'    // توصيل الصيدلية
  | 'video_consultations'; // استشارات بالفيديو

const FLAGS: Record<FeatureFlag, boolean> = {
  specialist_chat: env.NEXT_PUBLIC_ENABLE_SPECIALIST_CHAT,
  family_accounts: env.NEXT_PUBLIC_ENABLE_FAMILY_ACCOUNTS,
  subscriptions: env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS,

  // ميزات ممكّنة افتراضياً
  medical_record: false,    // قريباً
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
 * Helper لاستخدام في React Server Components
 *
 * @example
 *   const showChat = await checkFlag('specialist_chat');
 *   if (!showChat) return null;
 */
export async function checkFlag(flag: FeatureFlag): Promise<boolean> {
  return isEnabled(flag);
}

// عرض قنوات OTP وتفضيل المستخدم (طبقة عرض فقط — لا إرسال/تحقق هنا).
//
// ⚠️ الإرسال والتحقق الحقيقيان يتمّان في الخادم عبر:
//   src/lib/whatsapp/otp-service.ts  (توليد آمن + bcrypt + تخزين DB + حد محاولات)
//   ويُستدعيان من Server Actions (مثل sendOtpAction/verifyOtpAction).
// لا تُضِف أي منطق إرسال/تحقق (ولا رموزاً ثابتة) في هذا الملف الذي يعمل على العميل.

export type OtpChannel = 'whatsapp' | 'telegram';

// معلومات قنوات OTP للعرض
export const OTP_CHANNELS: Record<OtpChannel, {
  name: string;
  emoji: string;
  description: string;
  color: string;
  deliveryTime: string;
  reliability: number; // 0-100
}> = {
  whatsapp: {
    name: 'WhatsApp',
    emoji: '💬',
    description: 'استلم الرمز على واتساب فوراً',
    color: '#25D366',
    deliveryTime: 'خلال ٥ ثواني',
    reliability: 98,
  },
  telegram: {
    name: 'Telegram',
    emoji: '✈️',
    description: 'استلم الرمز على تيليجرام',
    color: '#0088CC',
    deliveryTime: 'خلال ٣ ثواني',
    reliability: 99,
  },
};

/**
 * تحديد القناة المفضّلة بناءً على آخر استخدام (localStorage)
 */
export function getPreferredChannel(): OtpChannel {
  if (typeof window === 'undefined') return 'whatsapp';
  const saved = localStorage.getItem('spir_otp_channel');
  return (saved === 'telegram' || saved === 'whatsapp') ? saved : 'whatsapp';
}

/**
 * حفظ القناة المفضّلة
 */
export function savePreferredChannel(channel: OtpChannel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('spir_otp_channel', channel);
}

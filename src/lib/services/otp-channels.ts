// نظام OTP عبر WhatsApp و Telegram
// بدلاً من SMS التقليدي - أرخص وأسرع وأكثر موثوقية في العراق

export type OtpChannel = 'whatsapp' | 'telegram';

export interface OtpRequest {
  phone: string; // +964XXXXXXXXXX
  channel: OtpChannel;
  purpose: 'register' | 'login' | 'appointment' | 'password-reset';
}

export interface OtpResponse {
  success: boolean;
  channel: OtpChannel;
  message: string;
  expiresIn: number; // بالثواني
  resendAfter: number; // بالثواني
  error?: string;
}

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
 * إرسال OTP عبر القناة المختارة
 *
 * في الإنتاج:
 * - WhatsApp: استخدم WhatsApp Business API أو Meta Cloud API
 * - Telegram: استخدم Bot API (BotFather)
 *
 * مثال:
 * - https://developers.facebook.com/docs/whatsapp/cloud-api
 * - https://core.telegram.org/bots/api
 */
export async function sendOtp(request: OtpRequest): Promise<OtpResponse> {
  // محاكاة الاستجابة (للاختبار)
  // في الإنتاج: يستدعي API الفعلي

  const otp = generateOtp();
  const channelInfo = OTP_CHANNELS[request.channel];

  // في الإنتاج: حفظ OTP في Redis بـ TTL ٥ دقائق
  // await redis.setex(`otp:${request.phone}`, 300, otp);

  // محاكاة الإرسال
  await sleep(500);

  if (request.channel === 'whatsapp') {
    // WhatsApp Business API call
    // const response = await fetch('https://graph.facebook.com/v18.0/PHONE_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: request.phone,
    //     type: 'template',
    //     template: {
    //       name: 'spir_otp',
    //       language: { code: 'ar' },
    //       components: [
    //         {
    //           type: 'body',
    //           parameters: [{ type: 'text', text: otp }]
    //         }
    //       ]
    //     }
    //   })
    // });
  } else {
    // Telegram Bot API call
    // const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: telegramChatId, // يحصل عليه عند الربط الأول
    //     text: `🔐 رمز التحقق الخاص بك في Spir Medical:\n\n*${otp}*\n\nصالح لمدة ٥ دقائق.`,
    //     parse_mode: 'Markdown'
    //   })
    // });
  }

  return {
    success: true,
    channel: request.channel,
    message: `تم إرسال الرمز إلى ${channelInfo.name}`,
    expiresIn: 300, // ٥ دقائق
    resendAfter: 60, // إعادة الإرسال بعد دقيقة
  };
}

/**
 * التحقق من OTP المُدخل
 */
export async function verifyOtp(phone: string, code: string): Promise<{ valid: boolean; reason?: string }> {
  // في الإنتاج: استرجاع من Redis ومقارنة
  // const storedOtp = await redis.get(`otp:${phone}`);

  // محاكاة
  await sleep(300);

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return { valid: false, reason: 'الرمز يجب أن يكون ٦ أرقام' };
  }

  // للاختبار فقط: ١٢٣٤٥٦ صحيح دائماً
  if (code === '123456') {
    return { valid: true };
  }

  return { valid: false, reason: 'الرمز غير صحيح' };
}

// === Helpers ===

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * تحديد القناة المفضّلة بناءً على آخر استخدام
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

/**
 * ربط Telegram (يستخدم deep link لبوت BotFather)
 *
 * مثال: https://t.me/SpirMedicalBot?start=link_USER_ID
 *
 * عند الضغط على الرابط في تيليجرام، البوت يستلم الـ start command
 * مع الـ user ID، ويربط chat_id بالحساب.
 */
export function getTelegramLinkUrl(userId: string): string {
  const botUsername = 'SpirMedicalBot'; // غيّرها حسب botك
  return `https://t.me/${botUsername}?start=link_${userId}`;
}

/**
 * فحص هل المستخدم ربط Telegram
 */
export async function isTelegramLinked(userId: string): Promise<boolean> {
  // في الإنتاج: تحقق من قاعدة البيانات
  // const { data } = await supabase
  //   .from('user_telegram_links')
  //   .select('chat_id')
  //   .eq('user_id', userId)
  //   .single();
  // return !!data;

  return false; // افتراضياً غير مربوط
}

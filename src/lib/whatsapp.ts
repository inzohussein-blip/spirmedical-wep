/**
 * مكتبة إرسال WhatsApp — تدعم Provider واحد في كل مرة
 *
 * المزودات المدعومة:
 * 1. Meta Business API (الأرسمي والأرخص للحجم الكبير)
 * 2. Twilio WhatsApp Business API
 *
 * طريقة الإعداد:
 *   اختر مزود واحد عبر WHATSAPP_PROVIDER في .env
 *   وأضف credentials المطلوبة
 */

import { logger } from '@/lib/logger';

export interface SendWhatsAppParams {
  to: string;          // رقم هاتف عراقي 07XXXXXXXXX
  body: string;        // نص الرسالة (يدعم Markdown WhatsApp)
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * تحويل رقم هاتف عراقي (07XXXXXXXXX) إلى E.164 (+9647XXXXXXXXX)
 */
export function normalizePhoneIQ(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Already E.164
  if (cleaned.startsWith('+964')) return cleaned;
  if (cleaned.startsWith('964')) return `+${cleaned}`;

  // Iraqi 07XXXXXXXXX
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    return `+964${cleaned.substring(1)}`;
  }

  // Iraqi 7XXXXXXXXX
  if (cleaned.startsWith('7') && cleaned.length === 10) {
    return `+964${cleaned}`;
  }

  // Fallback - أضف +964
  return cleaned.startsWith('+') ? cleaned : `+964${cleaned}`;
}

/**
 * استبدال {{placeholders}} في القالب
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : '';
  });
}

// ═══════════════════════════════════════════════════════════════════
// المزود 1: Meta Business API (الأفضل للحجم الكبير)
// ═══════════════════════════════════════════════════════════════════
async function sendViaMetaBusiness(params: SendWhatsAppParams): Promise<SendResult> {
  // 🔧 V33: متغيّرات موحّدة — META_* أولاً، مع دعم الأسماء القديمة للتوافق الخلفي
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_META_PHONE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_META_TOKEN;
  const apiVersion = process.env.META_API_VERSION || 'v21.0';

  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: 'Meta credentials missing (set META_PHONE_NUMBER_ID, META_ACCESS_TOKEN)', provider: 'meta' };
  }

  const to = normalizePhoneIQ(params.to).replace('+', '');

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: params.body, preview_url: false },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message ?? `HTTP ${res.status}`,
        provider: 'meta',
      };
    }

    return {
      ok: true,
      messageId: data?.messages?.[0]?.id,
      provider: 'meta',
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'unknown',
      provider: 'meta',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// المزود 2: Twilio WhatsApp
// ═══════════════════════════════════════════════════════════════════
async function sendViaTwilio(params: SendWhatsAppParams): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // مثلاً: whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: 'Twilio credentials missing', provider: 'twilio' };
  }

  const to = `whatsapp:${normalizePhoneIQ(params.to)}`;

  try {
    const formData = new URLSearchParams();
    formData.append('From', fromNumber);
    formData.append('To', to);
    formData.append('Body', params.body);

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data?.message ?? `HTTP ${res.status}`,
        provider: 'twilio',
      };
    }

    return {
      ok: true,
      messageId: data?.sid,
      provider: 'twilio',
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'unknown',
      provider: 'twilio',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// المزود 3: Mock (للتطوير - يطبع للـ console)
// ═══════════════════════════════════════════════════════════════════
async function sendViaMock(params: SendWhatsAppParams): Promise<SendResult> {
  const to = normalizePhoneIQ(params.to);
  /* eslint-disable no-console */
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // eslint-disable-next-line no-console
  console.log(`📱 [MOCK WhatsApp] → ${to}`);
  // eslint-disable-next-line no-console
  console.log(params.body);
  // eslint-disable-next-line no-console
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  /* eslint-enable no-console */
  return {
    ok: true,
    messageId: `mock_${Date.now()}`,
    provider: 'mock',
  };
}

// ═══════════════════════════════════════════════════════════════════
// نقطة الإرسال الرئيسية
// ═══════════════════════════════════════════════════════════════════
export async function sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? 'mock';

  if (provider === 'meta') return sendViaMetaBusiness(params);
  if (provider === 'twilio') return sendViaTwilio(params);

  // 🔒 لا نسمح بمزوّد mock في الإنتاج — يمنع "إرسالاً وهمياً" ناجحاً كذباً
  if (process.env.NODE_ENV === 'production') {
    logger.error('WHATSAPP_PROVIDER not configured in production (mock disabled)');
    return {
      ok: false,
      provider: 'mock',
      error: 'WhatsApp provider not configured',
    };
  }
  return sendViaMock(params);
}

/**
 * إرسال OTP (رمز تحقق) — قالب موحد
 */
export async function sendOTPWhatsApp(phone: string, code: string): Promise<SendResult> {
  return sendWhatsApp({
    to: phone,
    body: `*سباير ميديكال* 🌿

رمز التحقق الخاص بك:
*${code}*

صالح لمدة 5 دقائق.
لا تشاركه مع أي شخص.`,
  });
}

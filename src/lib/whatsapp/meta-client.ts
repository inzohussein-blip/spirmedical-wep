/**
 * Meta WhatsApp Cloud API Client — OTP Edition
 * 
 * نسخة مُبسّطة تحتوي على الوظائف الضرورية لـ OTP فقط:
 *   - إرسال OTP template
 *   - التحقق من webhook signature
 *   - معالجة delivery status
 * 
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import crypto from 'crypto';

const META_API_VERSION = process.env.META_API_VERSION || 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// ─── Types ───
export interface MetaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: number;
}

// ─── Helpers ───
function getCredentials() {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      'Missing Meta credentials. Set META_PHONE_NUMBER_ID and META_ACCESS_TOKEN in env.'
    );
  }

  return { phoneNumberId, accessToken };
}

/**
 * تطبيع رقم الهاتف لصيغة Meta (بدون +، بدون مسافات)
 * مثلاً: '+9647701234567' → '9647701234567'
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * الإرسال الأساسي لـ Meta API
 */
async function sendToMeta(payload: Record<string, unknown>): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken } = getCredentials();
  const url = `${META_API_BASE}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('[Meta] API error:', data);
      return {
        success: false,
        error: data?.error?.message || 'Unknown Meta API error',
        errorCode: data?.error?.code,
      };
    }

    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Meta] Network error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🔐 إرسال OTP عبر authentication template
// ═══════════════════════════════════════════════════════════════════

/**
 * إرسال OTP عبر authentication template
 * يستخدم template مخصص "spir_otp" (يجب إنشاؤه في Meta Business)
 * 
 * ✅ مجاناً (Authentication conversations مجانية في العراق وغيرها)
 * ✅ يعمل في أي وقت (حتى خارج 24h customer service window)
 * ✅ مع زر "نسخ الرمز" تلقائي
 */
export async function sendOtpMessage(
  phone: string,
  otpCode: string
): Promise<MetaSendResult> {
  return sendToMeta({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(phone),
    type: 'template',
    template: {
      name: 'spir_otp',
      language: { code: 'ar' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otpCode }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otpCode }], // لزر النسخ التلقائي
        },
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🔐 Webhook signature verification
// ═══════════════════════════════════════════════════════════════════

/**
 * تحقّق من توقيع webhook من Meta
 * Meta ترسل X-Hub-Signature-256 لكل webhook
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    // eslint-disable-next-line no-console
    console.error('[Meta] META_APP_SECRET not set');
    return false;
  }

  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf-8')
      .digest('hex');

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

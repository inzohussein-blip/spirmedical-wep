/**
 * ═══════════════════════════════════════════════════════════════
 * 📱 WhatsApp Business API Service (V25.10)
 * ═══════════════════════════════════════════════════════════════
 *
 * تكامل مع WhatsApp Cloud API (Meta)
 *
 * متطلبات Environment Variables:
 *   - WHATSAPP_API_TOKEN          (من Meta Business)
 *   - WHATSAPP_PHONE_NUMBER_ID    (من Meta)
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID (اختياري)
 *
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * الـ Templates يجب الموافقة عليها من Meta Business Manager قبل الاستخدام.
 * ═══════════════════════════════════════════════════════════════
 */

import { logger } from '@/lib/logger';

// ─── Configuration ─────────────────────────────────────
const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

interface WhatsAppConfig {
  apiToken: string;
  phoneNumberId: string;
  enabled: boolean;
}

function getConfig(): WhatsAppConfig {
  return {
    apiToken: process.env.WHATSAPP_API_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    enabled: !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  };
}

export function isWhatsAppEnabled(): boolean {
  return getConfig().enabled;
}

// ─── Format phone for WhatsApp ────────────────────────
/**
 * تنسيق رقم الهاتف العراقي:
 *   - 07XXXXXXXXX → 9647XXXXXXXXX
 *   - +9647XXXXXXXXX → 9647XXXXXXXXX
 *   - 9647XXXXXXXXX → 9647XXXXXXXXX
 */
function formatIraqiPhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');

  // 07XXXXXXXXX (Iraq) → 9647XXXXXXXXX
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    return '964' + cleaned.slice(1);
  }
  // 9647XXXXXXXXX
  if (cleaned.startsWith('964') && cleaned.length === 13) {
    return cleaned;
  }
  return null;
}

// ─── Low-level send function ──────────────────────────
interface SendMessageOptions {
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: string;
    components?: Array<{
      type: 'body' | 'header' | 'button';
      parameters: Array<{ type: 'text'; text: string }>;
    }>;
  };
  text?: { body: string };
}

async function sendMessage(options: SendMessageOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const config = getConfig();
  if (!config.enabled) {
    logger.warn('WhatsApp disabled - skipping send');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatIraqiPhone(options.to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone format' };
  }

  try {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: options.type,
    };

    if (options.type === 'template' && options.template) {
      body.template = options.template;
    } else if (options.type === 'text' && options.text) {
      body.text = options.text;
    }

    const response = await fetch(`${WHATSAPP_API_BASE}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('WhatsApp send failed', { status: response.status, error: data });
      return { success: false, error: data.error?.message || 'Send failed' };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    logger.error('WhatsApp send exception', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: 'Network error' };
  }
}

// ════════════════════════════════════════════════════════════════
// 📨 Templates (يجب الموافقة عليها في Meta Business Manager)
// ════════════════════════════════════════════════════════════════

/**
 * Template: appointment_confirmed
 * إخطار تأكيد الموعد للمريض
 *
 * Meta template body example:
 *   "مرحباً {{1}}، تم تأكيد موعدك لخدمة {{2}} يوم {{3}}. سيتواصل معك المختص قريباً."
 */
export async function sendAppointmentConfirmedWA(params: {
  phone: string;
  patientName: string;
  serviceName: string;
  scheduledDate: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    to: params.phone,
    type: 'template',
    template: {
      name: 'appointment_confirmed',
      language: 'ar',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.patientName },
            { type: 'text', text: params.serviceName },
            { type: 'text', text: params.scheduledDate },
          ],
        },
      ],
    },
  });
}

/**
 * Template: appointment_reminder
 * تذكير قبل ساعة من الموعد
 */
export async function sendAppointmentReminderWA(params: {
  phone: string;
  patientName: string;
  serviceName: string;
  scheduledTime: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    to: params.phone,
    type: 'template',
    template: {
      name: 'appointment_reminder',
      language: 'ar',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.patientName },
            { type: 'text', text: params.serviceName },
            { type: 'text', text: params.scheduledTime },
          ],
        },
      ],
    },
  });
}

/**
 * Template: lab_results_ready
 * نتائج التحاليل جاهزة
 */
export async function sendLabResultsReadyWA(params: {
  phone: string;
  patientName: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    to: params.phone,
    type: 'template',
    template: {
      name: 'lab_results_ready',
      language: 'ar',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.patientName },
          ],
        },
      ],
    },
  });
}

/**
 * Template: consultation_reply
 * إشعار رد الطبيب على الاستشارة
 */
export async function sendConsultationReplyWA(params: {
  phone: string;
  patientName: string;
  doctorName: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    to: params.phone,
    type: 'template',
    template: {
      name: 'consultation_reply',
      language: 'ar',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.patientName },
            { type: 'text', text: params.doctorName },
          ],
        },
      ],
    },
  });
}

/**
 * Template: otp_verification
 * إرسال OTP عبر WhatsApp (بديل لـ SMS)
 */
export async function sendOtpWA(params: {
  phone: string;
  otp: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    to: params.phone,
    type: 'template',
    template: {
      name: 'otp_verification',
      language: 'ar',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.otp },
          ],
        },
      ],
    },
  });
}

/**
 * إرسال نص حر (للمحادثات النشطة فقط - 24 ساعة من آخر تفاعل)
 * يستخدم بعد ما يبدأ المريض المحادثة
 */
export async function sendTextWA(params: {
  phone: string;
  text: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    to: params.phone,
    type: 'text',
    text: { body: params.text },
  });
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { appointmentSchema } from '@/lib/validations/appointment';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { encrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

interface CreateAppointmentInput {
  service_id: string;
  service_name: string;
  scheduled_at: string; // ISO
  address?: string;
  notes?: string;
  estimated_price: number;
  duration: number;
  needs_address: boolean;
  // OTP verification
  otp_channel: 'whatsapp' | 'telegram';
  otp_verified: boolean;
}

/**
 * Server Action لإنشاء حجز جديد
 *
 * - يتحقّق من OTP أولاً (عبر WhatsApp أو Telegram)
 * - يُشفّر الملاحظات الحساسة (AES-256)
 * - يُسجّل audit log
 * - يُرسل تأكيد عبر القناة المختارة
 */
export async function createAppointmentV2(input: CreateAppointmentInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: 'يجب تسجيل الدخول أولاً',
      redirect: '/login',
    };
  }

  // التحقق من OTP
  if (!input.otp_verified) {
    return {
      success: false,
      error: 'يجب تأكيد رقم الهاتف أولاً',
    };
  }

  // Rate limit: ١٠ حجوزات / ساعة
  const limit = await checkRateLimit(`appointment:create:${user.id}`, {
    max: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    return {
      success: false,
      error: `عدد كبير من الحجوزات. حاول بعد ${Math.ceil(limit.resetIn / 60)} دقيقة`,
    };
  }

  // Validation
  const validation = appointmentSchema.safeParse({
    service_type: input.service_name,
    scheduled_at: input.scheduled_at,
    address: input.address || 'خدمة عن بُعد',
    notes: input.notes,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  // تشفير الملاحظات الطبية الحساسة
  const notesEncrypted = validation.data.notes
    ? encrypt(validation.data.notes)
    : null;

  // إنشاء الحجز
  const { data: created, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      service_id: input.service_id,
      service_type: input.service_name,
      scheduled_at: input.scheduled_at,
      address: input.address || null,
      notes_encrypted: notesEncrypted,
      estimated_price: input.estimated_price,
      duration_minutes: input.duration,
      otp_channel: input.otp_channel,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !created) {
    logger.error('Create appointment failed', {
      user_id: user.id,
      error: error?.message,
    });
    return {
      success: false,
      error: 'فشل إنشاء الحجز. حاول مرة أخرى',
    };
  }

  // Audit log
  const ip = headers().get('x-forwarded-for') ?? 'unknown';
  await logAuditEvent({
    action: 'appointment.create',
    user_id: user.id,
    entity_type: 'appointment',
    entity_id: created.id,
    metadata: {
      ip,
      service_id: input.service_id,
      otp_channel: input.otp_channel,
      price: input.estimated_price,
    },
  });

  logger.info('Appointment created', {
    user_id: user.id,
    appointment_id: created.id,
    service: input.service_id,
  });

  // إرسال تأكيد عبر القناة المختارة
  await sendBookingConfirmation({
    appointmentId: created.id,
    userId: user.id,
    channel: input.otp_channel,
    serviceName: input.service_name,
    scheduledAt: input.scheduled_at,
  });

  revalidatePath('/dashboard');
  revalidatePath('/appointments');

  return {
    success: true,
    appointmentId: created.id,
    message: `تم تأكيد الحجز · ستصلك التفاصيل عبر ${input.otp_channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`,
  };
}

/**
 * إرسال تأكيد الحجز عبر WhatsApp أو Telegram
 *
 * في الإنتاج:
 * - WhatsApp: Meta Cloud API مع template message
 * - Telegram: Bot API مع formatted message
 */
async function sendBookingConfirmation(params: {
  appointmentId: string;
  userId: string;
  channel: 'whatsapp' | 'telegram';
  serviceName: string;
  scheduledAt: string;
}) {
  const date = new Date(params.scheduledAt);
  const message = `
✅ *تم تأكيد حجزك في Spir Medical*

📋 *الخدمة:* ${params.serviceName}
📅 *الموعد:* ${date.toLocaleDateString('ar-IQ')}
⏰ *الوقت:* ${date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
🔢 *رقم الحجز:* ${params.appointmentId.slice(0, 8).toUpperCase()}

سنُرسل لك تذكير قبل الموعد بساعة.

للإلغاء أو التعديل: ادخل التطبيق
`.trim();

  if (params.channel === 'whatsapp') {
    // await sendWhatsAppMessage(params.userId, message);
    logger.info('WhatsApp confirmation queued', { userId: params.userId });
  } else {
    // await sendTelegramMessage(params.userId, message);
    logger.info('Telegram confirmation queued', { userId: params.userId });
  }
}

/**
 * Server Action لإرسال OTP عبر القناة المختارة
 */
export async function sendOtpAction(phone: string, channel: 'whatsapp' | 'telegram') {
  // Rate limit: ٣ محاولات / ١٥ دقيقة
  const limit = await checkRateLimit(`otp:send:${phone}`, {
    max: 3,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    return {
      success: false,
      error: 'محاولات كثيرة. حاول بعد ١٥ دقيقة',
    };
  }

  // إنشاء OTP عشوائي
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // حفظ في Redis بـ TTL ٥ دقائق
  // await redis.setex(`otp:${phone}`, 300, otp);

  // إرسال عبر القناة المختارة
  try {
    if (channel === 'whatsapp') {
      // await sendViaWhatsApp(phone, otp);
    } else {
      // await sendViaTelegram(phone, otp);
    }

    logger.info('OTP sent', { phone: phone.slice(0, 5) + '***', channel });

    return {
      success: true,
      message: `تم إرسال الرمز إلى ${channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`,
      expiresIn: 300,
    };
  } catch (e) {
    logger.error('OTP send failed', { phone: phone.slice(0, 5) + '***', channel });
    return {
      success: false,
      error: 'فشل إرسال الرمز. حاول مع قناة أخرى',
    };
  }
}

/**
 * Server Action للتحقّق من OTP
 */
export async function verifyOtpAction(phone: string, code: string) {
  // const storedOtp = await redis.get(`otp:${phone}`);

  // محاكاة (للتطوير فقط)
  if (code === '123456') {
    // await redis.del(`otp:${phone}`);
    return { success: true };
  }

  return {
    success: false,
    error: 'الرمز غير صحيح',
  };
}

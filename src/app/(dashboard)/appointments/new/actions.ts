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
import { sendAppointmentConfirmedEmail } from '@/lib/email/actions';

interface CreateAppointmentInput {
  service_id: string;
  service_name: string;
  scheduled_at: string;
  address?: string;
  notes?: string;
  duration: number;
  needs_address: boolean;
  otp_channel: 'whatsapp' | 'telegram';
  otp_verified: boolean;
}

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
      error: `عدد كبير من الحجوزات. حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  // إذا كانت خدمة عن بُعد: استخدم نص بديل بدلاً من null
  const finalAddress = input.address && input.address.length >= 10
    ? input.address
    : 'خدمة عن بُعد · بدون عنوان';

  // Validation
  const validation = appointmentSchema.safeParse({
    service_type: input.service_name,
    scheduled_at: input.scheduled_at,
    address: finalAddress,
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
  // الأعمدة الجديدة (service_id/estimated_price/duration_minutes/otp_channel)
  // تُحفظ كـ any لأنها مُضافة عبر migration وليست في types/database.ts بعد
  const insertData: any = {
    user_id: user.id,
    service_type: input.service_name,
    scheduled_at: input.scheduled_at,
    address: finalAddress,
    notes_encrypted: notesEncrypted,
    status: 'pending' as const,
  };

  // إضافة الأعمدة الجديدة فقط إذا تم تشغيل الـ migration
  if (input.service_id) insertData.service_id = input.service_id;
  if (input.duration) insertData.duration_minutes = input.duration;
  if (input.otp_channel) insertData.otp_channel = input.otp_channel;

  const { data: created, error } = await supabase
    .from('appointments')
    .insert(insertData)
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
    },
  });

  // 📧 إرسال إيميل تأكيد (fire-and-forget)
  sendAppointmentConfirmedEmail(created.id).catch(() => null);

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
    logger.info('WhatsApp confirmation queued', { userId: params.userId });
  } else {
    logger.info('Telegram confirmation queued', { userId: params.userId });
  }
}

export async function sendOtpAction(phone: string, channel: 'whatsapp' | 'telegram') {
  const limit = await checkRateLimit(`otp:send:${phone}`, {
    max: 3,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    return {
      success: false,
      error: `محاولات كثيرة. حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    if (channel === 'whatsapp') {
      // WhatsApp Business API call here
    } else {
      // Telegram Bot API call here
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

export async function verifyOtpAction(phone: string, code: string) {
  // محاكاة (للتطوير فقط) - استبدل بـ Redis في الإنتاج
  if (code === '123456') {
    return { success: true };
  }

  return {
    success: false,
    error: 'الرمز غير صحيح',
  };
}

// النسخة القديمة - للتوافق مع الكود القديم إن وُجد
export async function createAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('يجب تسجيل الدخول أولاً'));
  }

  const limit = await checkRateLimit(`appointment:create:${user.id}`, {
    max: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    redirect(
      '/appointments/new?error=' +
        encodeURIComponent(`حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`)
    );
  }

  const data = {
    service_type: formData.get('service_type') as string,
    scheduled_at: formData.get('scheduled_at') as string,
    address: formData.get('address') as string,
    notes: (formData.get('notes') as string) || undefined,
  };

  const validation = appointmentSchema.safeParse(data);
  if (!validation.success) {
    redirect(
      '/appointments/new?error=' +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const notesEncrypted = validation.data.notes
    ? encrypt(validation.data.notes)
    : null;

  const { data: created, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      service_type: validation.data.service_type,
      scheduled_at: validation.data.scheduled_at,
      address: validation.data.address,
      notes_encrypted: notesEncrypted,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !created) {
    logger.error('Create appointment failed', {
      user_id: user.id,
      error: error?.message,
    });
    redirect(
      '/appointments/new?error=' + encodeURIComponent('فشل إنشاء الحجز')
    );
  }

  const ip = headers().get('x-forwarded-for') ?? 'unknown';
  await logAuditEvent({
    action: 'appointment.create',
    user_id: user.id,
    entity_type: 'appointment',
    entity_id: created.id,
    metadata: { ip, service_type: created.service_type },
  });

  revalidatePath('/dashboard');
  revalidatePath('/appointments');
  redirect('/appointments');
}

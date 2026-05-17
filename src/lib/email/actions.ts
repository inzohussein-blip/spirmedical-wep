'use server';

import { sendEmail, type EmailTemplate } from './send';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * إرسال إيميل ترحيب لمريض جديد
 */
export async function sendWelcomePatientEmail(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!user?.email) {
    logger.info('[Email] No email for user:', { userId: userId });
    return;
  }

  await sendEmail({
    to: user.email,
    template: 'welcome_patient',
    data: {
      name: user.full_name || 'عزيزي',
    },
  });
}

/**
 * إرسال إيميل ترحيب لأخصائي جديد
 */
export async function sendWelcomeSpecialistEmail(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    template: 'welcome_specialist',
    data: {
      name: user.full_name || 'الدكتور',
    },
  });
}

/**
 * إرسال تأكيد موعد
 */
export async function sendAppointmentConfirmedEmail(appointmentId: string): Promise<void> {
  const supabase = createClient();
  const { data: appt } = await supabase
    .from('appointments')
    .select('*, users:user_id(email, full_name)')
    .eq('id', appointmentId)
    .single();

  if (!appt) return;
  // @ts-expect-error - join field
  const userEmail = appt.users?.email;
  if (!userEmail) return;

  const date = new Date(appt.scheduled_at);
  const dateStr = date.toLocaleDateString('ar-IQ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeStr = date.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  await sendEmail({
    to: userEmail,
    template: 'appointment_confirmed',
    data: {
      service: appt.service_type,
      date: dateStr,
      time: timeStr,
      id: appointmentId,
    },
  });
}

/**
 * إرسال تذكير قبل الموعد بيوم
 */
export async function sendAppointmentReminderEmail(appointmentId: string): Promise<void> {
  const supabase = createClient();
  const { data: appt } = await supabase
    .from('appointments')
    .select('*, users:user_id(email)')
    .eq('id', appointmentId)
    .single();

  if (!appt) return;
  // @ts-expect-error - join
  const userEmail = appt.users?.email;
  if (!userEmail) return;

  const time = new Date(appt.scheduled_at).toLocaleString('ar-IQ', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  await sendEmail({
    to: userEmail,
    template: 'appointment_reminder',
    data: {
      service: appt.service_type,
      time,
      id: appointmentId,
    },
  });
}

/**
 * طلب تقييم بعد إكمال الموعد
 */
export async function sendRatingRequestEmail(appointmentId: string): Promise<void> {
  const supabase = createClient();
  const { data: appt } = await supabase
    .from('appointments')
    .select('*, users:user_id(email)')
    .eq('id', appointmentId)
    .single();

  if (!appt) return;
  // @ts-expect-error - join
  const userEmail = appt.users?.email;
  if (!userEmail) return;

  await sendEmail({
    to: userEmail,
    template: 'rating_request',
    data: {
      service: appt.service_type,
      id: appointmentId,
    },
  });
}

/**
 * إرسال إيميل عام (للاستخدام في server actions أخرى)
 */
export async function sendCustomEmail(
  to: string,
  template: EmailTemplate,
  data: Record<string, string | number>
): Promise<{ success: boolean; error?: string }> {
  return await sendEmail({ to, template, data });
}

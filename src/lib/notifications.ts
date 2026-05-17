import { createClient } from '@/lib/supabase/server';
import { renderTemplate } from '@/lib/whatsapp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type DB = SupabaseClient<Database>;

export interface EnqueueParams {
  recipientUserId?: string;
  recipientPhone: string;
  channel: 'whatsapp' | 'sms' | 'push';
  templateKey: string;
  variables: Record<string, string | number | undefined>;
  relatedType?: string;
  relatedId?: string;
  scheduledFor?: Date;
}

/**
 * إضافة رسالة لقائمة الإرسال
 * تستخدم قالب من DB وتبدله بالمتغيرات
 *
 * Returns:
 * - { ok: true, id } لو نجح
 * - { ok: false, error } لو فشل
 */
export async function enqueueNotification(
  params: EnqueueParams,
  client?: DB
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = client ?? createClient();

  // 1. اجلب القالب
  const { data: template, error: tplError } = await supabase
    .from('notification_templates')
    .select('body_ar, channel, is_active')
    .eq('key', params.templateKey)
    .single();

  if (tplError || !template) {
    return { ok: false, error: `Template not found: ${params.templateKey}` };
  }

  if (!template.is_active) {
    return { ok: false, error: `Template inactive: ${params.templateKey}` };
  }

  // 2. تأكد أن القالب متوافق مع القناة
  if (template.channel !== 'all' && template.channel !== params.channel) {
    return { ok: false, error: `Channel mismatch: template is for ${template.channel}` };
  }

  // 3. ابني نص الرسالة
  const body = renderTemplate(template.body_ar, params.variables);

  // 4. أدخل في الطابور
  const { data, error } = await supabase
    .from('notification_queue')
    .insert({
      recipient_user_id: params.recipientUserId ?? null,
      recipient_phone: params.recipientPhone,
      channel: params.channel,
      template_key: params.templateKey,
      body,
      scheduled_for: (params.scheduledFor ?? new Date()).toISOString(),
      related_type: params.relatedType ?? null,
      related_id: params.relatedId ?? null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

/**
 * إرسال مباشر بدون قالب — لرسائل مخصصة من admins
 */
export async function enqueueRawNotification(params: {
  recipientUserId?: string;
  recipientPhone: string;
  channel: 'whatsapp' | 'sms' | 'push';
  body: string;
  relatedType?: string;
  relatedId?: string;
  scheduledFor?: Date;
  createdBy?: string;
}, client?: DB): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase
    .from('notification_queue')
    .insert({
      recipient_user_id: params.recipientUserId ?? null,
      recipient_phone: params.recipientPhone,
      channel: params.channel,
      template_key: null,
      body: params.body,
      scheduled_for: (params.scheduledFor ?? new Date()).toISOString(),
      related_type: params.relatedType ?? null,
      related_id: params.relatedId ?? null,
      created_by: params.createdBy ?? null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

// ═══════════════════════════════════════════════════════════════════
// Helper Functions لإرسال إشعارات شائعة
// ═══════════════════════════════════════════════════════════════════

/**
 * إشعار: تم تأكيد الحجز
 */
export async function notifyAppointmentConfirmed(
  appointmentId: string,
  client?: DB
): Promise<void> {
  const supabase = client ?? createClient();

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, service_type, scheduled_at, address, user_id')
    .eq('id', appointmentId)
    .single();

  if (!appointment) return;

  const { data: patient } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', appointment.user_id)
    .single();

  if (!patient) return;

  await enqueueNotification({
    recipientUserId: appointment.user_id,
    recipientPhone: patient.phone,
    channel: 'whatsapp',
    templateKey: 'appointment_confirmed',
    variables: {
      patient_name: patient.full_name ?? 'عزيزي',
      service: appointment.service_type,
      date: new Date(appointment.scheduled_at).toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' }),
      address: appointment.address ?? '—',
    },
    relatedType: 'appointment',
    relatedId: appointmentId,
  }, supabase);
}

/**
 * إشعار: تم تعيين اختصاصي
 */
export async function notifyOrderAssigned(
  appointmentId: string,
  client?: DB
): Promise<void> {
  const supabase = client ?? createClient();

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, service_type, scheduled_at, user_id, assigned_specialist_id')
    .eq('id', appointmentId)
    .single();

  if (!appointment || !appointment.assigned_specialist_id) return;

  const [{ data: patient }, { data: specialist }] = await Promise.all([
    supabase.from('users').select('full_name, phone').eq('id', appointment.user_id).single(),
    supabase.from('users').select('full_name, phone').eq('id', appointment.assigned_specialist_id).single(),
  ]);

  if (!patient || !specialist) return;

  await enqueueNotification({
    recipientUserId: appointment.user_id,
    recipientPhone: patient.phone,
    channel: 'whatsapp',
    templateKey: 'order_assigned',
    variables: {
      patient_name: patient.full_name ?? 'عزيزي',
      specialist_name: specialist.full_name ?? 'الاختصاصي',
      specialist_phone: specialist.phone,
      service: appointment.service_type,
      date: new Date(appointment.scheduled_at).toLocaleString('ar-IQ', { dateStyle: 'full', timeStyle: 'short' }),
    },
    relatedType: 'appointment',
    relatedId: appointmentId,
  }, supabase);
}

/**
 * إشعار: ألغي الحجز
 */
export async function notifyOrderCancelled(
  appointmentId: string,
  reason: string,
  client?: DB
): Promise<void> {
  const supabase = client ?? createClient();

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, scheduled_at, user_id')
    .eq('id', appointmentId)
    .single();

  if (!appointment) return;

  const { data: patient } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', appointment.user_id)
    .single();

  if (!patient) return;

  await enqueueNotification({
    recipientUserId: appointment.user_id,
    recipientPhone: patient.phone,
    channel: 'whatsapp',
    templateKey: 'order_cancelled',
    variables: {
      patient_name: patient.full_name ?? 'عزيزي',
      date: new Date(appointment.scheduled_at).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' }),
      reason,
    },
    relatedType: 'appointment',
    relatedId: appointmentId,
  }, supabase);
}

/**
 * إشعار: تم اعتماد الاختصاصي
 */
export async function notifySpecialistApproved(
  specialistId: string,
  specialistType: string,
  client?: DB
): Promise<void> {
  const supabase = client ?? createClient();

  const { data: specialist } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', specialistId)
    .single();

  if (!specialist) return;

  const typeLabels: Record<string, string> = {
    lab_analyst: 'محلل مختبر',
    nurse: 'ممرض/ة',
    doctor: 'طبيب/ة',
    pharmacist: 'صيدلي/ة',
    physio: 'أخصائي علاج طبيعي',
    psychologist: 'أخصائي نفسي',
    nutritionist: 'أخصائي تغذية',
  };

  await enqueueNotification({
    recipientUserId: specialistId,
    recipientPhone: specialist.phone,
    channel: 'whatsapp',
    templateKey: 'specialist_approved',
    variables: {
      specialist_name: specialist.full_name ?? 'الاختصاصي',
      specialist_type: typeLabels[specialistType] ?? specialistType,
    },
    relatedType: 'user',
    relatedId: specialistId,
  }, supabase);
}

/**
 * إشعار: رفض الاختصاصي
 */
export async function notifySpecialistRejected(
  specialistId: string,
  reason: string,
  client?: DB
): Promise<void> {
  const supabase = client ?? createClient();

  const { data: specialist } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', specialistId)
    .single();

  if (!specialist) return;

  await enqueueNotification({
    recipientUserId: specialistId,
    recipientPhone: specialist.phone,
    channel: 'whatsapp',
    templateKey: 'specialist_rejected',
    variables: {
      specialist_name: specialist.full_name ?? 'الاختصاصي',
      reason,
    },
    relatedType: 'user',
    relatedId: specialistId,
  }, supabase);
}

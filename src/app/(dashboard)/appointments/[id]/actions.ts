'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

export async function cancelAppointment(appointmentId: string, reason: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  // Rate limit: ٥ إلغاءات / ساعة
  const limit = await checkRateLimit(`appointment:cancel:${user.id}`, {
    max: 5,
    windowSeconds: 3600,
  });

  if (!limit.allowed) {
    return {
      success: false,
      error: `محاولات كثيرة. حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`,
    };
  }

  // التحقق من ملكية الحجز
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !appointment) {
    return { success: false, error: 'الحجز غير موجود' };
  }

  // التحقق من إمكانية الإلغاء
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    return {
      success: false,
      error: appointment.status === 'cancelled'
        ? 'الحجز مُلغى بالفعل'
        : 'لا يمكن إلغاء حجز قيد التنفيذ أو مُكتمل',
    };
  }

  // تحديث الحالة
  const updateData: any = {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)
    .eq('user_id', user.id);

  if (updateError) {
    logger.error('Cancel appointment failed', {
      user_id: user.id,
      appointment_id: appointmentId,
      error: updateError.message,
    });
    return { success: false, error: 'فشل إلغاء الحجز' };
  }

  // Audit log
  const ip = headers().get('x-forwarded-for') ?? 'unknown';
  await logAuditEvent({
    action: 'appointment.cancel',
    user_id: user.id,
    entity_type: 'appointment',
    entity_id: appointmentId,
    metadata: { ip, reason },
  });

  logger.info('Appointment cancelled', {
    user_id: user.id,
    appointment_id: appointmentId,
    reason,
  });

  revalidatePath('/appointments');
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath('/dashboard');

  return { success: true };
}

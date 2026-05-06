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

export async function createAppointment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('يجب تسجيل الدخول أولاً'));
  }

  // Rate limit: 10 حجوزات / ساعة
  const limit = await checkRateLimit(`appointment:create:${user.id}`, {
    max: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    redirect(
      '/appointments/new?error=' +
        encodeURIComponent('عدد كبير من الحجوزات، حاول لاحقاً')
    );
  }

  // Validation
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

  // تشفير الملاحظات الطبية الحساسة قبل الحفظ
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

  // Audit log
  const ip = headers().get('x-forwarded-for') ?? 'unknown';
  await logAuditEvent({
    action: 'appointment.create',
    user_id: user.id,
    entity_type: 'appointment',
    entity_id: created.id,
    metadata: { ip, service_type: created.service_type },
  });

  logger.info('Appointment created', {
    user_id: user.id,
    appointment_id: created.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/appointments');
  redirect('/appointments');
}

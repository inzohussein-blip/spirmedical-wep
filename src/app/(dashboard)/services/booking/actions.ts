'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface BookingInput {
  service_type: 'dental' | 'optical' | 'mental-health' | 'nutrition';
  provider_id: string;
  provider_name: string;
  scheduled_at: string;  // ISO datetime
  user_phone: string;
  notes: string;
  package_type?: string;
  package_price?: number;
  address?: string;
}

export async function createServiceBooking(input: BookingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'يجب تسجيل الدخول' };
  }

  // نُجهّز بيانات الـ appointment
  const serviceMap = {
    dental:           { id: 'dental-visit',          name: '🦷 زيارة طبيب أسنان' },
    optical:          { id: 'optical-visit',         name: '👓 زيارة متجر نظارات' },
    'mental-health':  { id: 'mental-session',        name: '🧠 جلسة نفسية' },
    nutrition:        { id: 'nutrition-consult',     name: '🥗 استشارة تغذية' },
  };

  const serviceMeta = serviceMap[input.service_type];

  // نُنشئ ملاحظات منظّمة
  const noteParts: string[] = [
    '═══════ تفاصيل الحجز ═══════',
    `[الخدمة] ${serviceMeta.name}`,
    `[الموفّر] ${input.provider_name}`,
  ];

  if (input.package_type) {
    noteParts.push(`[الباقة] ${input.package_type}`);
  }
  if (input.package_price) {
    noteParts.push(`[السعر] ${input.package_price.toLocaleString('ar-IQ')} د.ع`);
  }
  if (input.notes) {
    noteParts.push(`[ملاحظات المريض] ${input.notes}`);
  }

  const combinedNotes = noteParts.join('\n\n');

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      service_type: serviceMeta.id,
      service_id: serviceMeta.id,
      scheduled_at: input.scheduled_at,
      address: input.address || `${input.service_type} - عبر سباير`,
      notes: combinedNotes,
      status: 'pending' as const,
      otp_channel: 'whatsapp' as const,
      estimated_price: input.package_price || null,
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/appointments');
  return { ok: true, appointmentId: data.id };
}

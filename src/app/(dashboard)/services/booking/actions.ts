'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { encrypt } from '@/lib/encryption';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📅 V25.47: Universal Service Booking (Hospital + Dental + Optical + ...)
 * ════════════════════════════════════════════════════════════════════
 * يحفظ في columns structured بدل notes text
 * ════════════════════════════════════════════════════════════════════
 */

export interface BookingInput {
  service_type: 'hospital' | 'dental' | 'optical' | 'mental-health' | 'nutrition';
  provider_id: string;
  provider_name: string;
  scheduled_at: string;  // ISO datetime
  user_phone: string;
  notes: string;
  package_type?: string;
  package_price?: number;
  address?: string;
  
  // ─── V25.47: Structured fields ───
  // Hospital
  hospital_department?: string;
  
  // Dental
  dental_procedure_type?: 'cleaning' | 'filling' | 'extraction' | 'root_canal' | 'crown' | 'orthodontics' | 'whitening' | 'consultation' | 'other';
  
  // Optical
  optical_service_type?: 'eye_exam' | 'prescription_lenses' | 'sunglasses' | 'contact_lenses' | 'frames_only' | 'consultation';
  
  // Family member
  family_member_id?: string | null;
}

export async function createServiceBooking(input: BookingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'يجب تسجيل الدخول' };
  }

  // service map
  const serviceMap: Record<string, { id: string; name: string; specialist?: string }> = {
    hospital:         { id: 'hospital-visit',        name: '🏥 موعد مستشفى' },
    dental:           { id: 'dental-visit',          name: '🦷 زيارة طبيب أسنان',     specialist: 'doctor' },
    optical:          { id: 'optical-visit',         name: '👓 زيارة متجر نظارات' },
    'mental-health':  { id: 'mental-session',        name: '🧠 جلسة نفسية',           specialist: 'psychologist' },
    nutrition:        { id: 'nutrition-consult',     name: '🥗 استشارة تغذية',        specialist: 'nutritionist' },
  };

  const serviceMeta = serviceMap[input.service_type];
  if (!serviceMeta) {
    return { ok: false, error: 'نوع الخدمة غير صالح' };
  }

  // notes اختياري - فقط ملاحظات المريض
  const encryptedNotes = input.notes ? encrypt(input.notes) : null;

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      insert: (d: object) => {
        select: (cols: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
      };
    };
  };

  // Build structured appointment data
  const appointmentData: Record<string, unknown> = {
    user_id: user.id,
    service_type: serviceMeta.name,
    service_id: serviceMeta.id,
    scheduled_at: input.scheduled_at,
    address: input.address || `${serviceMeta.name} - ${input.provider_name}`,
    notes_encrypted: encryptedNotes,
    status: 'pending',
    otp_channel: 'whatsapp',
    estimated_price: input.package_price || null,
    family_member_id: input.family_member_id || null,
  };

  if (serviceMeta.specialist) {
    appointmentData.required_specialist_type = serviceMeta.specialist;
  }

  // Structured columns حسب نوع الخدمة
  switch (input.service_type) {
    case 'hospital':
      appointmentData.hospital_id = input.provider_id;
      if (input.hospital_department) {
        appointmentData.hospital_department = input.hospital_department;
      }
      break;
    
    case 'dental':
      appointmentData.dental_clinic_id = input.provider_id;
      if (input.dental_procedure_type) {
        appointmentData.dental_procedure_type = input.dental_procedure_type;
      }
      break;
    
    case 'optical':
      appointmentData.optical_store_id = input.provider_id;
      if (input.optical_service_type) {
        appointmentData.optical_service_type = input.optical_service_type;
      }
      break;
  }

  const { data, error } = await supabaseAny
    .from('appointments')
    .insert(appointmentData)
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || 'فشل الحجز' };
  }

  revalidatePath('/appointments');
  revalidatePath('/dashboard');
  
  return { ok: true, appointmentId: data.id };
}

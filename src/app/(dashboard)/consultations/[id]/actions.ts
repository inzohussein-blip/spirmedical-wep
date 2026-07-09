'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyConsultationReply, notifyMedicalRecordShared } from '@/lib/services/push-templates';
import { sendConsultationReplyWA, isWhatsAppEnabled } from '@/lib/services/whatsapp';

interface SendMessageInput {
  consultationId: string;
  messageType: 'text' | 'image' | 'medical_record';
  content?: string;
  imageDataUrl?: string;
}

/**
 * إرسال رسالة في الاستشارة
 */
export async function sendMessage(input: SendMessageInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  // تحقّق من الاستشارة + الصلاحية
  const { data: consultation } = await supabase
    .from('consultations')
    .select('id, patient_user_id, doctor_user_id, status')
    .eq('id', input.consultationId)
    .single();

  if (!consultation) {
    return { success: false, error: 'الاستشارة غير موجودة' };
  }

  if (consultation.status === 'closed') {
    return { success: false, error: 'الاستشارة مغلقة' };
  }

  const isPatient = consultation.patient_user_id === user.id;
  const isDoctor = consultation.doctor_user_id === user.id;

  if (!isPatient && !isDoctor) {
    return { success: false, error: 'لست طرفاً في هذه الاستشارة' };
  }

  const senderRole: 'patient' | 'doctor' = isPatient ? 'patient' : 'doctor';

  // رفع الصورة لو موجودة
  let imageUrl: string | null = null;
  if (input.messageType === 'image' && input.imageDataUrl) {
    try {
      // استخراج base64
      const matches = input.imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) {
        return { success: false, error: 'صيغة صورة غير صالحة' };
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType.split('/')[1] || 'jpg';
      const fileName = `consultation-${input.consultationId}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('consultation-images')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        // فشل صريح بدل تخزين data URL كامل داخل صف DB (تضخيم/تجاوز حجم العمود).
        return { success: false, error: 'فشل رفع الصورة — حاول مجدداً' };
      }
      const { data: urlData } = supabase.storage
        .from('consultation-images')
        .getPublicUrl(uploadData.path);
      imageUrl = urlData.publicUrl;
    } catch {
      return { success: false, error: 'تعذّر رفع الصورة' };
    }
  }

  // إنشاء الرسالة
  const { data: message, error } = await supabase
    .from('consultation_messages')
    .insert({
      consultation_id: input.consultationId,
      sender_id: user.id,
      sender_role: senderRole,
      message_type: input.messageType,
      content: input.content || null,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error || !message) {
    return { success: false, error: error?.message || 'فشل الإرسال' };
  }

  // تحديث حالة الاستشارة
  const newStatus = isPatient ? 'awaiting_doctor' : 'awaiting_patient';
  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (isDoctor && !consultation.doctor_user_id) {
    // أول رد من الطبيب
    updates.responded_at = new Date().toISOString();
  }

  await supabase
    .from('consultations')
    .update(updates)
    .eq('id', input.consultationId);

  // ─── 🔔 Push notification للطرف الآخر ───
  const recipientUserId = isPatient
    ? consultation.doctor_user_id
    : consultation.patient_user_id;

  if (recipientUserId) {
    // جلب اسم المُرسل
    const { data: senderInfo } = isDoctor
      ? await supabase.from('doctors').select('full_name, title').eq('user_id', user.id).maybeSingle()
      : await supabase.from('users').select('full_name').eq('id', user.id).single();

    const senderName = senderInfo
      ? ('title' in senderInfo
          ? `${senderInfo.title} ${senderInfo.full_name}`
          : senderInfo.full_name) ?? (isDoctor ? 'الطبيب' : 'المريض')
      : (isDoctor ? 'الطبيب' : 'المريض');

    // محتوى المعاينة
    const preview =
      input.messageType === 'image' ? '📷 صورة'
      : input.messageType === 'medical_record' ? '📋 سجل طبي مُحوَّل'
      : input.content || '';

    await notifyConsultationReply(recipientUserId, {
      senderName,
      senderRole: senderRole,
      preview,
      consultationId: input.consultationId,
    });

    // 📱 WhatsApp إذا الطبيب رد + مفعّل
    if (isDoctor && isWhatsAppEnabled()) {
      // جلب رقم هاتف المريض
      const { data: patientData } = await supabase
        .from('users')
        .select('phone, full_name')
        .eq('id', recipientUserId)
        .single();

      if (patientData?.phone) {
        await sendConsultationReplyWA({
          phone: patientData.phone,
          patientName: patientData.full_name || 'عزيزي المريض',
          doctorName: senderName,
        });
      }
    }
  }

  revalidatePath(`/consultations/${input.consultationId}`);
  return { success: true, message };
}

/**
 * تحويل سجل طبي (موعد/تحليل/وصفة) للاستشارة
 */
export async function attachMedicalRecord(input: {
  consultationId: string;
  recordType: string;
  recordId: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  // تحقّق من الصلاحية
  const { data: consultation } = await supabase
    .from('consultations')
    .select('id, patient_user_id, doctor_user_id, status, shared_medical_data')
    .eq('id', input.consultationId)
    .single();

  if (!consultation || consultation.status === 'closed') {
    return { success: false, error: 'الاستشارة مغلقة أو غير موجودة' };
  }

  const isPatient = consultation.patient_user_id === user.id;
  if (!isPatient) {
    return { success: false, error: 'فقط المريض يستطيع مشاركة سجلاته' };
  }

  // عنوان السجل
  let title = '';
  switch (input.recordType) {
    case 'appointment': title = 'موعد سابق'; break;
    case 'lab_result': title = 'نتيجة تحليل'; break;
    case 'prescription': title = 'وصفة طبية'; break;
    case 'nursing_visit': title = 'زيارة تمريض'; break;
    default: title = 'سجل طبي';
  }

  // إنشاء رسالة من نوع medical_record
  const { data: message, error } = await supabase
    .from('consultation_messages')
    .insert({
      consultation_id: input.consultationId,
      sender_id: user.id,
      sender_role: 'patient',
      message_type: 'medical_record',
      content: `شارك ${title}`,
      attached_record_id: input.recordId,
      attached_record_type: input.recordType,
    })
    .select()
    .single();

  if (error || !message) {
    return { success: false, error: error?.message || 'فشل المشاركة' };
  }

  // تحديث shared_medical_data
  const sharedData = (consultation.shared_medical_data as Record<string, string[]>) || {};
  const key = `include_${input.recordType}s`;
  const existing = sharedData[key] || [];
  if (!existing.includes(input.recordId)) {
    existing.push(input.recordId);
  }
  sharedData[key] = existing;
  sharedData.shared_at = new Date().toISOString() as unknown as string[];

  await supabase
    .from('consultations')
    .update({
      shared_medical_data: sharedData,
      status: 'awaiting_doctor',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.consultationId);

  // 🔔 Push للطبيب
  if (consultation.doctor_user_id) {
    const { data: patientInfo } = await supabase
      .from('users').select('full_name').eq('id', user.id).single();

    await notifyMedicalRecordShared(consultation.doctor_user_id, {
      patientName: patientInfo?.full_name || 'مريض',
      recordType: input.recordType,
      consultationId: input.consultationId,
    });
  }

  revalidatePath(`/consultations/${input.consultationId}`);
  return { success: true, message };
}

/**
 * إغلاق الاستشارة
 */
export async function closeConsultation(consultationId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'غير مصرّح' };

  const { data: consultation } = await supabase
    .from('consultations')
    .select('patient_user_id, doctor_user_id')
    .eq('id', consultationId)
    .single();

  if (!consultation) return { success: false, error: 'الاستشارة غير موجودة' };

  const isParticipant =
    consultation.patient_user_id === user.id ||
    consultation.doctor_user_id === user.id;

  if (!isParticipant) {
    return { success: false, error: 'غير مصرّح' };
  }

  const { error } = await supabase
    .from('consultations')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultationId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/consultations/${consultationId}`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// 💬 صفحة الاستشارة المفصّلة (V25.9)
// ═══════════════════════════════════════════════════════════════
// شات نصي + رفع صور + تحويل التاريخ الطبي
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { toGender } from '@/lib/format/gender';
import { oneOfOr, jsonObject } from '@/lib/format/vocabulary';
import { redirect, notFound } from 'next/navigation';
import ConsultationClient from './ConsultationClient';

export const metadata = {
  title: 'تفاصيل الاستشارة · سباير ميديكال',
  description: 'استشارتي مع الطبيب',
};


export const dynamic = 'force-dynamic';

const CONSULTATION_STATUS = ['open', 'awaiting_doctor', 'awaiting_patient', 'closed'] as const;
const SENDER_ROLES = ['patient', 'doctor', 'system'] as const;
const MESSAGE_TYPES = ['text', 'image', 'medical_record', 'voice'] as const;

export default async function ConsultationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // جلب الاستشارة
  const { data: consultation } = await supabase
    .from('consultations')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!consultation) notFound();

  // تحقق أنه طرف في المحادثة
  if (consultation.patient_user_id !== user.id && consultation.doctor_user_id !== user.id) {
    notFound();
  }

  // جلب الرسائل
  const { data: messages } = await supabase
    .from('consultation_messages')
    .select('*')
    .eq('consultation_id', params.id)
    .order('created_at', { ascending: true });

  // جلب الطبيب
  const { data: doctor } = consultation.doctor_id
    ? await supabase
        .from('doctors')
        .select('id, full_name, title, specialty, avatar_url, gender')
        .eq('id', consultation.doctor_id)
        .single()
    : { data: null };

  // جلب المريض
  const { data: patient } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', consultation.patient_user_id)
    .single();

  // جلب فرد العائلة لو موجود
  const { data: familyMember } = consultation.family_member_id
    ? await supabase
        .from('family_members')
        .select('id, full_name, relation, avatar_emoji, date_of_birth, gender')
        .eq('id', consultation.family_member_id)
        .single()
    : { data: null };

  // المستخدم الحالي = طبيب أو مريض؟
  const userRole: 'patient' | 'doctor' =
    user.id === consultation.patient_user_id ? 'patient' : 'doctor';

  return (
    <ConsultationClient
      consultation={{
        ...consultation,
        // مفردات محروسة بقيود CHECK لا يقرأها مولّد الأنواع
        status: oneOfOr(CONSULTATION_STATUS, consultation.status, 'open'),
        created_at: consultation.created_at ?? '',
        shared_medical_data: jsonObject<Record<string, unknown>>(consultation.shared_medical_data),
      }}
      messages={(messages ?? []).map((m) => ({
        ...m,
        sender_role: oneOfOr(SENDER_ROLES, m.sender_role, 'system'),
        message_type: oneOfOr(MESSAGE_TYPES, m.message_type, 'text'),
        created_at: m.created_at ?? '',
      }))}
      doctor={doctor ? { ...doctor, title: doctor.title ?? '', gender: toGender(doctor.gender) } : null}
      patient={patient}
      familyMember={
        familyMember
          ? {
              ...familyMember,
              avatar_emoji: familyMember.avatar_emoji ?? '',
              gender: toGender(familyMember.gender),
            }
          : null
      }
      userRole={userRole}
      currentUserId={user.id}
    />
  );
}

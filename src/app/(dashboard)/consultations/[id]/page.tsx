// ═══════════════════════════════════════════════════════════════
// 💬 صفحة الاستشارة المفصّلة (V25.9)
// ═══════════════════════════════════════════════════════════════
// شات نصي + رفع صور + تحويل التاريخ الطبي
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ConsultationClient from './ConsultationClient';

export const metadata = {
  title: 'تفاصيل الاستشارة · سباير ميديكال',
  description: 'استشارتي مع الطبيب',
};


export const dynamic = 'force-dynamic';

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
      consultation={consultation}
      messages={messages || []}
      doctor={doctor}
      patient={patient}
      familyMember={familyMember}
      userRole={userRole}
      currentUserId={user.id}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import LiveStatusCard, { type LiveStatus } from './LiveStatusCard';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎯 ActiveAppointmentCard (V25.36)
 * ════════════════════════════════════════════════════════════════════
 *
 * Server component يجلب الطلب النشط الحالي للمريض
 * ويعرضه عبر LiveStatusCard
 *
 * يعرض فقط لو في طلب pending/confirmed/in_progress
 * ════════════════════════════════════════════════════════════════════
 */

const STATUS_MAP: Record<string, LiveStatus> = {
  pending: 'pending',
  confirmed: 'confirmed',
  on_the_way: 'on_the_way',
  in_progress: 'in_service',
  completed: 'completed',
};

const SERVICE_LABELS: Record<string, string> = {
  'blood-draw': 'سحب دم منزلي',
  'home-nursing': 'تمريض منزلي',
  'consultation': 'استشارة',
  'dental': 'طب أسنان',
  'optical': 'نظارات',
  'mental-health': 'صحة نفسية',
  'nutrition': 'تغذية',
};

export default async function ActiveAppointmentCard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // اجلب الطلب النشط الحالي
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, service_type, status, scheduled_at, specialist_id')
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed', 'on_the_way', 'in_progress'])
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!appt) return null;

  // اجلب معلومات المختص لو موجود
  let specialistName = 'بانتظار تعيين مختص';
  let specialistTitle: string | undefined;
  let specialistPhone: string | null = null;

  if (appt.specialist_id) {
    const { data: specialist } = await supabase
      .from('users')
      .select('full_name, specialist_type, phone')
      .eq('id', appt.specialist_id)
      .single();

    if (specialist) {
      specialistName = specialist.full_name || 'مختص';
      const type = specialist.specialist_type;
      specialistTitle =
        type === 'lab_analyst' ? 'مختبر طبي' :
        type === 'doctor' ? 'طبيب/ة' :
        type === 'pharmacist' ? 'صيدلي/ة' :
        type === 'physio' ? 'علاج فيزيائي' :
        type === 'psychologist' ? 'صحة نفسية' :
        type === 'nutritionist' ? 'تغذية' :
        'مختص/ة';
      specialistPhone = specialist.phone;
    }
  }

  const status = STATUS_MAP[appt.status] || 'pending';
  const serviceLabel = SERVICE_LABELS[appt.service_type || ''] || 'موعد';

  // حساب ETA بسيط (الفرق بالدقائق من الآن)
  let eta: string | undefined;
  if (appt.scheduled_at) {
    const scheduledDate = new Date(appt.scheduled_at);
    const now = new Date();
    const diffMin = Math.round((scheduledDate.getTime() - now.getTime()) / 60000);

    if (diffMin > 0 && diffMin < 60) {
      eta = `${diffMin} دقيقة`;
    } else if (diffMin >= 60 && diffMin < 1440) {
      eta = `${Math.round(diffMin / 60)} ساعة`;
    } else if (diffMin <= 0 && status === 'on_the_way') {
      eta = 'قريباً';
    }
  }

  return (
    <LiveStatusCard
      status={status}
      specialistName={specialistName}
      specialistTitle={specialistTitle ? `${specialistTitle} · ${serviceLabel}` : serviceLabel}
      specialistPhone={specialistPhone}
      eta={eta}
      appointmentId={appt.id}
    />
  );
}

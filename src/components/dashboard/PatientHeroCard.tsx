import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎨 PatientHeroCard (V25.34)
 * ════════════════════════════════════════════════════════════════════
 *
 * Hero card شخصي للمريض في dashboard
 *
 * يعرض:
 *   - تحية ذكية (حسب الوقت + الاسم)
 *   - Avatar مع أول حرف
 *   - Stats سريعة (الفحوصات + الوصفات)
 *   - الموعد القادم (لو موجود)
 *
 * Design:
 *   - Gradient emerald background
 *   - Glass effect على الـ pills
 *   - Decorative circles
 * ════════════════════════════════════════════════════════════════════
 */

interface Props {
  fullName: string;
  governorate?: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'مرحباً مساء';
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'مساء النور';
  if (hour < 21) return 'مساء الخير';
  return 'مرحباً مساء';
}

function getFirstChar(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'ح';
}

export default async function PatientHeroCard({ fullName, governorate }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let appointmentsCount = 0;
  let prescriptionsCount = 0;
  let nextAppointment: { service_type: string | null; scheduled_at: string | null } | null = null;

  if (user) {
    const now = new Date().toISOString();

    const [{ count: apptCount }, { count: presCount }, { data: nextAppt }] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['completed', 'confirmed']),
      supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('appointments')
        .select('service_type, scheduled_at')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    appointmentsCount = apptCount || 0;
    prescriptionsCount = presCount || 0;
    nextAppointment = nextAppt;
  }

  const greeting = getGreeting();
  const firstChar = getFirstChar(fullName);
  const firstName = fullName.split(' ')[0] || fullName;

  return (
    <div className="hero-card-container">
      <div className="hero-card-bg-decoration-1" aria-hidden="true" />
      <div className="hero-card-bg-decoration-2" aria-hidden="true" />

      <div className="hero-card-content">
        <div className="hero-card-greeting-row">
          <div className="hero-card-avatar" aria-hidden="true">
            {firstChar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hero-card-greeting">
              {greeting} {firstName} 👋
            </div>
            <div className="hero-card-subtitle">
              {governorate && (
                <>
                  <i className="hero-card-icon-location" aria-hidden="true" />
                  {governorate} ·{' '}
                </>
              )}
              كيف يمكننا مساعدتك اليوم؟
            </div>
          </div>
        </div>

        <div className="hero-card-pills-row">
          <Link href="/appointments" className="hero-card-pill">
            <span className="hero-card-pill-icon" aria-hidden="true">🩸</span>
            <span>{appointmentsCount} فحص</span>
          </Link>
          <Link href="/account/prescriptions" className="hero-card-pill">
            <span className="hero-card-pill-icon" aria-hidden="true">📋</span>
            <span>{prescriptionsCount} وصفات</span>
          </Link>
        </div>

        {nextAppointment && nextAppointment.scheduled_at && (
          <Link href="/appointments" className="hero-card-next-appt">
            <span className="hero-card-next-icon" aria-hidden="true">⏰</span>
            <div className="hero-card-next-content">
              <div className="hero-card-next-label">موعد قادم</div>
              <div className="hero-card-next-detail">
                {getServiceLabel(nextAppointment.service_type)} ·{' '}
                {formatScheduledAt(nextAppointment.scheduled_at)}
              </div>
            </div>
            <span className="hero-card-next-arrow" aria-hidden="true">←</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function getServiceLabel(serviceType: string | null): string {
  if (!serviceType) return 'موعد';
  const map: Record<string, string> = {
    'blood-draw': 'سحب دم',
    'home-nursing': 'تمريض منزلي',
    'consultation': 'استشارة',
    'dental': 'أسنان',
    'optical': 'نظارات',
    'mental-health': 'صحة نفسية',
    'nutrition': 'تغذية',
  };
  return map[serviceType] || serviceType;
}

function formatScheduledAt(scheduledAt: string): string {
  const apptDate = new Date(scheduledAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const apptDay = new Date(apptDate);
  apptDay.setHours(0, 0, 0, 0);

  let dateStr: string;
  if (apptDay.getTime() === today.getTime()) {
    dateStr = 'اليوم';
  } else if (apptDay.getTime() === tomorrow.getTime()) {
    dateStr = 'غداً';
  } else {
    dateStr = apptDate.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  const timeStr = apptDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  return `${dateStr} ${timeStr}`;
}

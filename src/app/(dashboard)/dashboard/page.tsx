import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SERVICE_ICONS: Record<string, string> = {
  'سحب دم منزلي': '🩸',
  'تمريض منزلي': '💉',
  'تركيب مغذي': '💧',
  'فحوصات مختبرية': '🧪',
  'فحص كورونا PCR': '🦠',
  'استشارة طبية مرئية': '💬',
  'استشارة هاتفية': '📞',
  'استشارة كتابية': '✉️',
  'توصيل أدوية': '💊',
  'حجز موعد مستشفى': '🏥',
  'طبيب الأسرة': '⌬',
};

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'بانتظار', bg: '#F0DBC2', color: '#B8540C' },
  confirmed: { label: 'مؤكّد', bg: '#D9E5DF', color: '#073B30' },
  in_progress: { label: 'قيد التنفيذ', bg: '#D9E5DF', color: '#073B30' },
  completed: { label: 'مُكتمل', bg: '#EDE6D3', color: '#1F2A2C' },
  cancelled: { label: 'مُلغى', bg: '#F0D7D8', color: '#A82E3D' },
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `اليوم · ${time}`;
  if (diffDays === 1) return `غداً · ${time}`;
  if (diffDays === 2) return `بعد غد · ${time}`;
  if (diffDays > 0 && diffDays < 7) return `بعد ${diffDays} أيام · ${time}`;

  return `${date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' })} · ${time}`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] || 'صديقنا';
  const initial = firstName.charAt(0);

  const now = new Date().toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count: totalCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const { count: upcomingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .in('status', ['pending', 'confirmed', 'in_progress'])
    .gte('scheduled_at', now);

  const { count: todayCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString());

  const { count: completedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'completed');

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user!.id)
    .in('status', ['pending', 'confirmed', 'in_progress'])
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(3);

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-greet">
          <div>
            <div className="scr-h1">مرحباً، {firstName}</div>
            <div className="scr-loc">📍 منصّة سباير ميديكال</div>
          </div>
          <div className="scr-avatar" aria-hidden="true">{initial}</div>
        </div>

        <div className="scr-search">
          <div className="scr-search-icon" aria-hidden="true">⌕</div>
          <input type="search" placeholder="ابحث عن خدمة، طبيب، أو فحص..." aria-label="البحث" />
          <span className="scr-search-shortcut">صوت</span>
        </div>

        <div className="scr-stats-grid">
          <div className="scr-stat">
            <div className="scr-stat-value emerald">{totalCount || 0}</div>
            <div className="scr-stat-label">إجمالي</div>
          </div>
          <div className="scr-stat">
            <div className="scr-stat-value amber">{upcomingCount || 0}</div>
            <div className="scr-stat-label">قادمة</div>
          </div>
          <div className="scr-stat">
            <div className="scr-stat-value rose">{todayCount || 0}</div>
            <div className="scr-stat-label">اليوم</div>
          </div>
          <div className="scr-stat">
            <div className="scr-stat-value ink">{completedCount || 0}</div>
            <div className="scr-stat-label">مُكتملة</div>
          </div>
        </div>

        <div className="scr-section-head">
          <div className="scr-section-title">إجراءات سريعة</div>
        </div>
        <div className="scr-quick-actions">
          <Link href="/appointments/new" className="scr-quick-action primary">
            <div className="scr-qa-icon" aria-hidden="true">+</div>
            <div className="scr-qa-text">
              <div className="scr-qa-title">حجز جديد</div>
              <div className="scr-qa-desc">احجز خدمتك</div>
            </div>
          </Link>
          <Link href="/appointments" className="scr-quick-action">
            <div className="scr-qa-icon" aria-hidden="true">▤</div>
            <div className="scr-qa-text">
              <div className="scr-qa-title">طلباتي</div>
              <div className="scr-qa-desc">{upcomingCount || 0} قادمة</div>
            </div>
          </Link>
        </div>

        <div className="scr-section-head">
          <div className="scr-section-title">الحجوزات القادمة</div>
          {(upcomingAppointments?.length ?? 0) > 0 && (
            <Link href="/appointments" className="scr-section-link">عرض الكل ›</Link>
          )}
        </div>

        {(upcomingAppointments?.length ?? 0) === 0 ? (
          <div className="scr-empty">
            <div className="scr-empty-icon" aria-hidden="true">📅</div>
            <h2 className="scr-empty-title">لا توجد حجوزات قادمة</h2>
            <p className="scr-empty-desc">ابدأ بحجز خدمتك الأولى الآن</p>
            <Link href="/appointments/new" className="scr-empty-cta">حجز جديد ←</Link>
          </div>
        ) : (
          <div>
            {upcomingAppointments!.map((appt) => {
              const status = STATUS_LABELS[appt.status] || STATUS_LABELS.pending;
              const icon = SERVICE_ICONS[appt.service_type] || '📋';
              return (
                <Link key={appt.id} href={`/appointments/${appt.id}`} className="appt-card">
                  <div className="appt-card-head">
                    <div className="appt-card-icon" aria-hidden="true">{icon}</div>
                    <div className="appt-card-info">
                      <div className="appt-card-title">{appt.service_type}</div>
                      <div className="appt-card-when">{formatRelative(appt.scheduled_at)}</div>
                    </div>
                    <span className="appt-card-status" style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  {appt.notes && (
                    <div className="appt-card-meta">
                      <span className="appt-card-meta-item">📝 {appt.notes.slice(0, 60)}{appt.notes.length > 60 ? '...' : ''}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { filter?: 'all' | 'pending' | 'confirmed' | 'completed' };
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'بانتظار', bg: '#F0DBC2', color: '#B8540C' },
  confirmed: { label: 'مؤكّد', bg: '#D9E5DF', color: '#073B30' },
  in_progress: { label: 'قيد التنفيذ', bg: '#D9E5DF', color: '#073B30' },
  completed: { label: 'مُكتمل', bg: '#EDE6D3', color: '#1F2A2C' },
  cancelled: { label: 'مُلغى', bg: '#F0D7D8', color: '#A82E3D' },
};

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

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'بانتظار' },
  { id: 'confirmed', label: 'مؤكّدة' },
  { id: 'completed', label: 'مُكتملة' },
];

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `اليوم · ${time}`;
  if (diffDays === 1) return `غداً · ${time}`;
  if (diffDays === -1) return `أمس · ${time}`;
  if (diffDays > 0 && diffDays < 7) return `بعد ${diffDays} أيام · ${time}`;

  return date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function SpecialistOrdersPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const filter = searchParams.filter || 'all';

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('specialist_id', user!.id);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: orders } = await query.order('scheduled_at', { ascending: false });

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">الطلبات</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-tabs" role="tablist" aria-label="فلتر الطلبات">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={f.id === 'all' ? '/specialist/orders' : `/specialist/orders?filter=${f.id}`}
              className={`scr-tab ${filter === f.id ? 'active' : ''}`}
              role="tab"
              aria-selected={filter === f.id}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {(orders?.length ?? 0) === 0 ? (
          <div className="scr-empty">
            <div className="scr-empty-icon" aria-hidden="true">📋</div>
            <h2 className="scr-empty-title">لا توجد طلبات</h2>
            <p className="scr-empty-desc">
              {filter === 'all'
                ? 'لم يتم تكليفك بأي طلب بعد. سنُعلمك فور توفّر طلبات جديدة.'
                : `لا توجد طلبات بفلتر "${FILTERS.find(f => f.id === filter)?.label}".`}
            </p>
            {filter !== 'all' && (
              <Link href="/specialist/orders" className="scr-empty-link">عرض كل الطلبات</Link>
            )}
          </div>
        ) : (
          <div>
            {orders!.map((appt) => {
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
                  {(appt.address || appt.notes) && (
                    <div className="appt-card-meta">
                      {appt.address && (
                        <span className="appt-card-meta-item">📍 {appt.address.slice(0, 35)}{appt.address.length > 35 ? '...' : ''}</span>
                      )}
                      {appt.notes && (
                        <span className="appt-card-meta-item">📝 {appt.notes.slice(0, 30)}{appt.notes.length > 30 ? '...' : ''}</span>
                      )}
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

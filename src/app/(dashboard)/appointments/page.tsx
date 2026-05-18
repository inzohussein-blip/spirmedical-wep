import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'مواعيدي · سباير ميديكال',
  description: 'إدارة مواعيدك الطبية وتتبع حالتها — قيد التنفيذ، مكتملة، ملغاة',
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { filter?: 'all' | 'upcoming' | 'completed' | 'cancelled' };
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'بانتظار', bg: 'var(--amber-soft)', color: 'var(--amber)' },
  confirmed: { label: 'مؤكّد', bg: 'var(--emerald-soft)', color: 'var(--emerald-deep)' },
  in_progress: { label: 'قيد التنفيذ', bg: 'var(--emerald-soft)', color: 'var(--emerald-deep)' },
  completed: { label: 'مُكتمل', bg: 'var(--paper-2)', color: 'var(--ink-2)' },
  cancelled: { label: 'مُلغى', bg: 'var(--rose-soft)', color: 'var(--rose)' },
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
  { id: 'upcoming', label: 'قادمة' },
  { id: 'completed', label: 'مُكتملة' },
  { id: 'cancelled', label: 'مُلغاة' },
];

function formatDateRelative(iso: string): string {
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
  if (diffDays < 0 && diffDays > -7) return `قبل ${Math.abs(diffDays)} أيام`;

  return date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const filter = searchParams.filter || 'all';
  const now = new Date().toISOString();

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user!.id);

  if (filter === 'upcoming') {
    query = query.in('status', ['pending', 'confirmed', 'in_progress']).gte('scheduled_at', now);
  } else if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'cancelled') {
    query = query.eq('status', 'cancelled');
  }

  const { data: appointments } = await query.order('scheduled_at', { ascending: false });

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">طلباتي</h1>
          <Link
            href="/appointments/new"
            className="scr-back-btn"
            aria-label="حجز جديد"
            style={{ background: 'var(--emerald)', color: 'var(--paper-3)', border: 0 }}
          >
            <span aria-hidden="true">+</span>
          </Link>
        </div>

        <div className="scr-tabs" role="tablist" aria-label="فلتر الطلبات">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={f.id === 'all' ? '/appointments' : `/appointments?filter=${f.id}`}
              className={`scr-tab ${filter === f.id ? 'active' : ''}`}
              role="tab"
              aria-selected={filter === f.id}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {(appointments?.length ?? 0) === 0 ? (
          <div className="scr-empty">
            <div className="scr-empty-icon" aria-hidden="true">📋</div>
            <h2 className="scr-empty-title">لا توجد طلبات</h2>
            <p className="scr-empty-desc">
              {filter === 'all'
                ? 'لم تحجز أي خدمة بعد. ابدأ بالحجز الأول.'
                : `لا توجد طلبات في فلتر "${FILTERS.find(f => f.id === filter)?.label}".`}
            </p>
            <Link href="/appointments/new" className="scr-empty-cta">حجز جديد ←</Link>
            {filter !== 'all' && (
              <Link href="/appointments" className="scr-empty-link">عرض كل الطلبات</Link>
            )}
          </div>
        ) : (
          <div>
            {appointments!.map((appt) => {
              const status = STATUS_LABELS[appt.status] || STATUS_LABELS.pending;
              const icon = SERVICE_ICONS[appt.service_type] || '📋';
              return (
                <Link key={appt.id} href={`/appointments/${appt.id}`} className="appt-card">
                  <div className="appt-card-head">
                    <div className="appt-card-icon" aria-hidden="true">{icon}</div>
                    <div className="appt-card-info">
                      <div className="appt-card-title">{appt.service_type}</div>
                      <div className="appt-card-when">{formatDateRelative(appt.scheduled_at)}</div>
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

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { filter?: 'all' | 'upcoming' | 'completed' | 'cancelled' };
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  pending: { label: 'بانتظار التأكيد', bg: '#F0DBC2', color: '#B8540C', emoji: '⏳' },
  confirmed: { label: 'مؤكّد', bg: '#D9E5DF', color: '#073B30', emoji: '✅' },
  in_progress: { label: 'قيد التنفيذ', bg: '#D9E5DF', color: '#073B30', emoji: '🚗' },
  completed: { label: 'مُكتمل', bg: '#EDE6D3', color: '#1F2A2C', emoji: '🎉' },
  cancelled: { label: 'مُلغى', bg: '#F0D7D8', color: '#A82E3D', emoji: '❌' },
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
  const filter = searchParams.filter || 'all';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user!.id)
    .order('scheduled_at', { ascending: false });

  const now = new Date().toISOString();

  if (filter === 'upcoming') {
    query = query.in('status', ['pending', 'confirmed', 'in_progress']).gte('scheduled_at', now);
  } else if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'cancelled') {
    query = query.eq('status', 'cancelled');
  }

  const { data: appointments } = await query;

  // إحصاءات
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

  const { count: completedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'completed');

  const { count: cancelledCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'cancelled');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper, #F4EFE2)' }}>
      <div style={{
        background: 'var(--white, #FFFFFF)',
        borderBottom: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
        padding: '20px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                حجوزاتي
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--ink-3, #6E7878)', margin: 0 }}>
                {totalCount ? `${totalCount} حجز إجمالي` : 'لا توجد حجوزات بعد'}
              </p>
            </div>
            <Link href="/appointments/new" style={{
              background: 'var(--emerald, #0E5C4D)',
              color: 'var(--paper-3, #FAF6EB)',
              padding: '11px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 6px 16px -4px rgba(14, 92, 77, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>+</span><span>حجز جديد</span>
            </Link>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { key: 'all', label: 'الكل', count: totalCount },
              { key: 'upcoming', label: 'القادمة', count: upcomingCount },
              { key: 'completed', label: 'المُكتملة', count: completedCount },
              { key: 'cancelled', label: 'المُلغاة', count: cancelledCount },
            ].map((f) => {
              const active = filter === f.key;
              return (
                <Link
                  key={f.key}
                  href={f.key === 'all' ? '/appointments' : `/appointments?filter=${f.key}`}
                  style={{
                    padding: '8px 16px',
                    background: active ? 'var(--emerald, #0E5C4D)' : 'var(--paper-3, #FAF6EB)',
                    color: active ? 'var(--paper-3, #FAF6EB)' : 'var(--ink-2, #1F2A2C)',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: active ? 'none' : '1px solid var(--line, rgba(15, 26, 28, 0.08))',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{f.label}</span>
                  {f.count !== null && f.count !== undefined && f.count > 0 && (
                    <span style={{
                      background: active ? 'rgba(255,255,255,0.2)' : 'var(--paper-2, #EDE6D3)',
                      padding: '1px 7px',
                      borderRadius: '100px',
                      fontSize: '10px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {f.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px' }}>
        {!appointments || appointments.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map((apt) => {
              const statusConfig = STATUS_LABELS[apt.status] || STATUS_LABELS.pending;
              const icon = SERVICE_ICONS[apt.service_type] || '📋';

              return (
                <Link
                  key={apt.id}
                  href={`/appointments/${apt.id}`}
                  style={{
                    background: 'var(--white, #FFFFFF)',
                    border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
                    borderRight: `4px solid ${statusConfig.color}`,
                    borderRadius: '14px',
                    padding: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: statusConfig.bg,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {apt.service_type}
                      </h3>
                      <span style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        padding: '3px 9px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {statusConfig.emoji} {statusConfig.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--ink-3, #6E7878)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>📅 {formatDateRelative(apt.scheduled_at)}</span>
                      {(apt as any).estimated_price && (
                        <span style={{ fontWeight: 700, color: 'var(--emerald, #0E5C4D)' }}>
                          {((apt as any).estimated_price as number).toLocaleString('ar-IQ')} د.ع
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ color: 'var(--ink-4, #A4ACAA)', fontSize: '18px', flexShrink: 0 }}>‹</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const messages: Record<string, { emoji: string; title: string; desc: string }> = {
    all: { emoji: '📋', title: 'لا توجد حجوزات بعد', desc: 'ابدأ بحجز خدمتك الأولى الآن' },
    upcoming: { emoji: '📅', title: 'لا توجد حجوزات قادمة', desc: 'احجز خدمة جديدة لمتابعتها هنا' },
    completed: { emoji: '🎉', title: 'لا توجد حجوزات مُكتملة', desc: 'الحجوزات المكتملة ستظهر هنا' },
    cancelled: { emoji: '❌', title: 'لا توجد حجوزات مُلغاة', desc: 'لم تُلغِ أي حجز - أحسنت!' },
  };

  const msg = messages[filter] || messages.all;

  return (
    <div style={{
      background: 'var(--white, #FFFFFF)',
      border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
      borderRadius: '16px',
      padding: '50px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--paper-3, #FAF6EB)',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        marginBottom: '16px',
      }}>
        {msg.emoji}
      </div>
      <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px' }}>{msg.title}</h2>
      <p style={{ fontSize: '12px', color: 'var(--ink-3, #6E7878)', margin: '0 0 18px' }}>{msg.desc}</p>

      {filter !== 'completed' && filter !== 'cancelled' && (
        <Link href="/appointments/new" style={{
          background: 'var(--emerald, #0E5C4D)',
          color: 'var(--paper-3, #FAF6EB)',
          padding: '11px 22px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 6px 16px -4px rgba(14, 92, 77, 0.4)',
          display: 'inline-block',
        }}>
          احجز الآن ←
        </Link>
      )}
    </div>
  );
}

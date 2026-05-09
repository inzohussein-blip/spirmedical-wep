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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'غداً';
  if (diffDays === 2) return 'بعد غد';
  if (diffDays > 0 && diffDays < 7) return `بعد ${diffDays} أيام`;

  return date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' });
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // معلومات المستخدم
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] || 'صديقنا';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير';

  const now = new Date().toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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

  // الحجوزات القادمة (٣)
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user!.id)
    .in('status', ['pending', 'confirmed', 'in_progress'])
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper, #F4EFE2)', paddingBottom: '40px' }}>
      {/* Greeting Header */}
      <div style={{
        background: 'linear-gradient(180deg, var(--white, #FFFFFF) 0%, var(--paper, #F4EFE2) 100%)',
        padding: '24px 20px 20px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--ink-3, #6E7878)', fontWeight: 600, letterSpacing: '0.05em' }}>
                {greeting}
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
                مرحباً، {firstName} 👋
              </h1>
            </div>
            <Link href="/profile" style={{
              width: '44px',
              height: '44px',
              background: 'var(--emerald, #0E5C4D)',
              color: 'var(--paper-3, #FAF6EB)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 12px -2px rgba(14, 92, 77, 0.4)',
            }}>
              {firstName.charAt(0)}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { label: 'إجمالي', value: totalCount || 0, color: '#0E5C4D' },
            { label: 'قادمة', value: upcomingCount || 0, color: '#B8540C' },
            { label: 'اليوم', value: todayCount || 0, color: '#A82E3D' },
            { label: 'مُكتملة', value: completedCount || 0, color: '#1F2A2C' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--white, #FFFFFF)',
              border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
              borderRadius: '14px',
              padding: '14px 8px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 900,
                color: stat.color,
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--ink-3, #6E7878)',
                marginTop: '5px',
                fontWeight: 600,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px' }}>⚡ إجراءات سريعة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Link href="/appointments/new" style={{
              background: 'var(--emerald, #0E5C4D)',
              color: 'var(--paper-3, #FAF6EB)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 8px 20px -6px rgba(14, 92, 77, 0.5)',
              minHeight: '110px',
              justifyContent: 'center',
            }}>
              <div style={{ fontSize: '32px' }}>+</div>
              <div style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center' }}>حجز جديد</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>اطلب الآن</div>
            </Link>

            <Link href="/appointments" style={{
              background: 'var(--white, #FFFFFF)',
              border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
              color: 'var(--ink, #0F1A1C)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              minHeight: '110px',
              justifyContent: 'center',
            }}>
              <div style={{ fontSize: '32px' }}>📋</div>
              <div style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center' }}>كل الحجوزات</div>
              <div style={{ fontSize: '10px', color: 'var(--ink-3, #6E7878)' }}>{totalCount || 0} حجز</div>
            </Link>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments && upcomingAppointments.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>🗓 حجوزاتي القادمة</h2>
              <Link href="/appointments" style={{
                fontSize: '11px',
                color: 'var(--emerald, #0E5C4D)',
                fontWeight: 700,
                textDecoration: 'none',
              }}>
                عرض الكل ←
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingAppointments.map((apt) => {
                const statusConfig = STATUS_LABELS[apt.status] || STATUS_LABELS.pending;
                const icon = SERVICE_ICONS[apt.service_type] || '📋';

                return (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} style={{
                    background: 'var(--white, #FFFFFF)',
                    border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
                    borderRight: `3px solid ${statusConfig.color}`,
                    borderRadius: '13px',
                    padding: '13px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: statusConfig.bg,
                      borderRadius: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '3px',
                      }}>
                        <h3 style={{
                          fontSize: '13px',
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
                          padding: '2px 8px',
                          borderRadius: '100px',
                          fontSize: '9px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-3, #6E7878)' }}>
                        ⏰ {formatRelative(apt.scheduled_at)} · {formatTime(apt.scheduled_at)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--white, #FFFFFF)',
            border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
            borderRadius: '16px',
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px' }}>لا توجد حجوزات قادمة</h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-3, #6E7878)', margin: '0 0 16px' }}>
              ابدأ بحجز خدمتك الأولى الآن
            </p>
            <Link href="/appointments/new" style={{
              background: 'var(--emerald, #0E5C4D)',
              color: 'var(--paper-3, #FAF6EB)',
              padding: '10px 20px',
              borderRadius: '11px',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-block',
            }}>
              احجز الآن ←
            </Link>
          </div>
        )}

        {/* Help/Tips Card */}
        <div style={{
          background: 'var(--ink, #0F1A1C)',
          color: 'var(--paper-3, #FAF6EB)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '36px' }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>
              هل تعلم؟
            </div>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0, lineHeight: 1.6 }}>
              يمكنك تتبّع حالة حجزك مباشرة عبر WhatsApp أو Telegram
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

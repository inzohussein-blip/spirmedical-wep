import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NotificationsClient from './NotificationsClient';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الإشعارات · إدارة',
};

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'var(--amber-deep, #6B3A08)', bg: 'var(--amber-soft, #F8E5C7)', label: 'بانتظار الإرسال' },
  sending: { color: 'var(--amber-deep, #6B3A08)', bg: 'var(--amber-soft, #F8E5C7)', label: 'يُرسل الآن' },
  sent: { color: 'var(--emerald-deep)', bg: 'var(--emerald-soft)', label: 'أُرسل' },
  failed: { color: 'var(--rose)', bg: 'var(--rose-soft)', label: 'فشل' },
  cancelled: { color: 'var(--ink-3)', bg: 'var(--paper-3)', label: 'ملغى' },
};

const CHANNEL_META: Record<string, { icon: string; color: string }> = {
  whatsapp: { icon: '💬', color: '#25D366' },
  sms: { icon: '📱', color: 'var(--emerald)' },
  push: { icon: '🔔', color: 'var(--amber)' },
};

export default async function NotificationsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();

  let query = supabase
    .from('notification_queue')
    .select('*', { count: 'exact' });

  if (searchParams.status) query = query.eq('status', searchParams.status);

  const { data: messages, count } = await query
    .order('created_at', { ascending: false })
    .limit(100);

  // إحصائيات سريعة
  const [
    { count: pendingCount },
    { count: sentCount },
    { count: failedCount },
    { count: todayCount },
  ] = await Promise.all([
    supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('notification_queue').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('notification_queue').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  // قائمة المزود الحالي (info فقط - من ENV variable)
  const provider = process.env.WHATSAPP_PROVIDER ?? 'mock';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>💬 الإشعارات</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            مزود WhatsApp: <strong>{provider === 'mock' ? '🔧 mock (development)' : provider}</strong>
          </p>
        </div>

        <NotificationsClient />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatBox label="اليوم" value={(todayCount ?? 0).toLocaleString('ar-IQ')} color="#0E5C4D" icon="📊" />
        <StatBox label="بانتظار الإرسال" value={(pendingCount ?? 0).toLocaleString('ar-IQ')} color="#B8540C" icon="⏳" />
        <StatBox label="أُرسلت" value={(sentCount ?? 0).toLocaleString('ar-IQ')} color="#0E5C4D" icon="✅" />
        <StatBox label="فشلت" value={(failedCount ?? 0).toLocaleString('ar-IQ')} color="#A82E3D" icon="❌" />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href="/admin44/notifications" style={tabStyle(!searchParams.status)}>الكل</Link>
        <Link href="/admin44/notifications?status=pending" style={tabStyle(searchParams.status === 'pending')}>⏳ معلّقة</Link>
        <Link href="/admin44/notifications?status=sent" style={tabStyle(searchParams.status === 'sent')}>✅ أُرسلت</Link>
        <Link href="/admin44/notifications?status=failed" style={tabStyle(searchParams.status === 'failed')}>❌ فشلت</Link>
        <Link href="/admin44/notifications?status=cancelled" style={tabStyle(searchParams.status === 'cancelled')}>🗑 ملغاة</Link>
      </div>

      {/* List */}
      {!messages || messages.length === 0 ? (
        <EmptyState
          icon="💬"
          title="لا توجد رسائل"
          description="ستظهر الرسائل والإشعارات هنا"
          size="lg"
        />
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--paper-3)' }}>
              <tr>
                <th style={th}>المستلم</th>
                <th style={th}>القناة</th>
                <th style={th}>المحتوى</th>
                <th style={th}>الحالة</th>
                <th style={th}>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => {
                const status = STATUS_META[m.status] ?? STATUS_META.pending;
                const channel = CHANNEL_META[m.channel] ?? CHANNEL_META.whatsapp;

                return (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700 }} dir="ltr">{m.recipient_phone}</div>
                      {m.template_key && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>📑 {m.template_key}</div>}
                    </td>
                    <td style={td}>
                      <span style={{ color: channel.color, fontWeight: 700 }}>{channel.icon} {m.channel}</span>
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: 12, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.body.substring(0, 80)}{m.body.length > 80 ? '...' : ''}
                      </div>
                      {m.error_message && (
                        <div style={{ fontSize: 10, color: 'var(--rose)', marginTop: 4 }}>
                          ⚠️ {m.error_message.substring(0, 100)}
                        </div>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 100,
                        background: status.bg, color: status.color, fontWeight: 800,
                      }}>{status.label}</span>
                      {m.attempts > 0 && (
                        <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 4 }}>
                          محاولات: {m.attempts}/{m.max_attempts}
                        </div>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: 11 }}>
                        {new Date(m.created_at).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      {m.sent_at && (
                        <div style={{ fontSize: 9, color: 'var(--emerald)', marginTop: 2 }}>
                          ✅ {new Date(m.sent_at).toLocaleTimeString('ar-IQ', { timeStyle: 'short' })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {count && count > 100 && (
            <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', background: 'var(--paper-3)' }}>
              يُعرض أحدث 100 من أصل {count}
            </div>
          )}
        </div>
      )}

      {/* Setup info */}
      {provider === 'mock' && (
        <div style={{
          marginTop: 20, background: 'var(--white)', borderRadius: 14, padding: 20,
          borderRight: '4px solid var(--amber)',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 8px', color: 'var(--amber-deep, #6B3A08)' }}>
            🔧 وضع التطوير: MOCK
          </h3>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.7 }}>
            حالياً الرسائل تُسجّل في console فقط ولا تُرسل فعلياً.
            لتفعيل الإرسال:
          </p>
          <pre style={{
            fontSize: 11, background: 'var(--paper-3)', padding: 12, borderRadius: 8,
            margin: 0, overflow: 'auto', lineHeight: 1.6,
          }}>{`# في Vercel Environment Variables أضف:

# للـ Meta Business API (الأرخص):
WHATSAPP_PROVIDER=meta
WHATSAPP_META_PHONE_ID=<phone-number-id>
WHATSAPP_META_TOKEN=<permanent-access-token>

# أو للـ Twilio:
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# للـ Cron الذي يُشغّل قائمة الانتظار:
CRON_SECRET=<random-string>`}</pre>
        </div>
      )}
    </>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 12, padding: 16, borderRight: `4px solid ${color}` }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: active ? 'var(--emerald-deep)' : 'var(--white)',
    color: active ? 'var(--white)' : 'var(--ink)',
    border: '1px solid var(--line)',
    borderRadius: 100,
    fontSize: 12, fontWeight: 700,
    textDecoration: 'none',
  };
}

const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--ink)', verticalAlign: 'top' };

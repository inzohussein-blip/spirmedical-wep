import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NotificationsClient from './NotificationsClient';
import NotificationRowActions from './NotificationRowActions';
import { EmptyState } from '@/components/ui';
import { baghdadDayWindow } from '@/lib/time/baghdad-day';

import EmojiIcon from '@/components/ui/EmojiIcon';
import { DataTable } from '@/components/admin-ui';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الإشعارات · إدارة',
};

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'var(--amber-deep, #6B3A08)', bg: 'var(--amber-soft, #FEF7E0)', label: 'بانتظار الإرسال' },
  sending: { color: 'var(--amber-deep, #6B3A08)', bg: 'var(--amber-soft, #FEF7E0)', label: 'يُرسل الآن' },
  sent: { color: 'var(--emerald-deep)', bg: 'var(--emerald-soft)', label: 'أُرسل' },
  failed: { color: 'var(--rose)', bg: 'var(--rose-soft)', label: 'فشل' },
  cancelled: { color: 'var(--ink-3)', bg: 'var(--paper-3)', label: 'ملغى' },
};

const CHANNEL_META: Record<string, { icon: string; color: string }> = {
  whatsapp: { icon: '💬', color: '#25D366' },
  sms: { icon: '📱', color: 'var(--emerald)' },
  push: { icon: '🔔', color: 'var(--amber)' },
};

export default async function NotificationsPage(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

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
      .gte('created_at', baghdadDayWindow().start.toISOString()),
  ]);

  // قائمة المزود الحالي (info فقط - من ENV variable)
  const provider = process.env.WHATSAPP_PROVIDER ?? 'mock';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}><EmojiIcon e="💬" /> الإشعارات</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            مزود WhatsApp: <strong>{provider === 'mock' ? 'mock (development)' : provider}</strong>
          </p>
        </div>

        <NotificationsClient />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatBox label="اليوم" value={(todayCount ?? 0).toLocaleString('ar-IQ-u-nu-latn')} color="#0E5C4D" icon="📊" />
        <StatBox label="بانتظار الإرسال" value={(pendingCount ?? 0).toLocaleString('ar-IQ-u-nu-latn')} color="#B8540C" icon="⏳" />
        <StatBox label="أُرسلت" value={(sentCount ?? 0).toLocaleString('ar-IQ-u-nu-latn')} color="#0E5C4D" icon="✅" />
        <StatBox label="فشلت" value={(failedCount ?? 0).toLocaleString('ar-IQ-u-nu-latn')} color="#A82E3D" icon="❌" />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href="/admin/notifications" style={tabStyle(!searchParams.status)}>الكل</Link>
        <Link href="/admin/notifications?status=pending" style={tabStyle(searchParams.status === 'pending')}><EmojiIcon e="⏳" /> معلّقة</Link>
        <Link href="/admin/notifications?status=sent" style={tabStyle(searchParams.status === 'sent')}><EmojiIcon e="✅" /> أُرسلت</Link>
        <Link href="/admin/notifications?status=failed" style={tabStyle(searchParams.status === 'failed')}><EmojiIcon e="❌" /> فشلت</Link>
        <Link href="/admin/notifications?status=cancelled" style={tabStyle(searchParams.status === 'cancelled')}><EmojiIcon e="🗑" /> ملغاة</Link>
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
        <div style={{ background: 'var(--white)', borderRadius: 14, overflowX: 'auto' }}>
          <DataTable
            rows={messages.map((m) => {
                const status = STATUS_META[m.status ?? ''] ?? STATUS_META.pending;
                const channel = CHANNEL_META[m.channel ?? ''] ?? CHANNEL_META.whatsapp;
              return { key: String(m.id), cells: [
                <><div style={{ fontFamily: 'monospace', fontWeight: 700 }} dir="ltr">{m.recipient_phone}</div>
                      {m.template_key && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}><EmojiIcon e="📑" /> {m.template_key}</div>}</>,
                <><span style={{ color: channel.color, fontWeight: 700 }}><EmojiIcon e={channel.icon} /> {m.channel}</span></>,
                <><div style={{ fontSize: 12, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.body.substring(0, 80)}{m.body.length > 80 ? '...' : ''}
                      </div>
                      {m.error_message && (
                        <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>
                          <EmojiIcon e="⚠️" /> {m.error_message.substring(0, 100)}
                        </div>
                      )}</>,
                <><span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 100,
                        background: status.bg, color: status.color, fontWeight: 800,
                      }}>{status.label}</span>
                      {m.attempts > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                          محاولات: {m.attempts}/{m.max_attempts}
                        </div>
                      )}</>,
                <><div style={{ fontSize: 11 }}>
                        {new Date(m.created_at ?? Date.now()).toLocaleString('ar-IQ-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      {m.sent_at && (
                        <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 2 }}>
                          <EmojiIcon e="✅" /> {new Date(m.sent_at).toLocaleTimeString('ar-IQ-u-nu-latn', { timeStyle: 'short' })}
                        </div>
                      )}</>,
                <><NotificationRowActions id={m.id} status={m.status ?? 'pending'} /></>,
              ] };
            })}
            rowKey={(r) => r.key}
            columns={[
              { key: 'c0', header: 'المستلم', primary: true, render: (r) => r.cells[0] },
              { key: 'c1', header: 'القناة', render: (r) => r.cells[1] },
              { key: 'c2', header: 'المحتوى', render: (r) => r.cells[2] },
              { key: 'c3', header: 'الحالة', render: (r) => r.cells[3] },
              { key: 'c4', header: 'الوقت', render: (r) => r.cells[4] },
              { key: 'c5', header: 'إجراءات', render: (r) => r.cells[5] },
            ]}
          />

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
            <EmojiIcon e="🔧" /> وضع التطوير: MOCK
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
      <div style={{ fontSize: 22, marginBottom: 4 }}><EmojiIcon e={icon} /></div>
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

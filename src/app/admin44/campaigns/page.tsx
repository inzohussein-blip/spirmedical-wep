import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الحملات · إدارة',
};

export default async function CampaignsPage() {
  const supabase = createClient();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
    whatsapp: { icon: '💬', color: '#25D366', label: 'WhatsApp' },
    sms: { icon: '📱', color: 'var(--emerald)', label: 'SMS' },
    push: { icon: '🔔', color: 'var(--amber)', label: 'إشعار' },
    email: { icon: '✉️', color: '#534AB7', label: 'بريد' },
  };

  const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
    draft: { color: 'var(--ink-3)', bg: 'var(--paper-3)', label: 'مسودة' },
    scheduled: { color: 'var(--amber-deep, #6B3A08)', bg: 'var(--amber-soft, #F8E5C7)', label: 'مجدول' },
    sending: { color: 'var(--amber-deep, #6B3A08)', bg: 'var(--amber-soft, #F8E5C7)', label: 'يُرسل' },
    sent: { color: 'var(--emerald-deep)', bg: 'var(--emerald-soft)', label: 'أُرسل' },
    failed: { color: 'var(--rose)', bg: 'var(--rose-soft)', label: 'فشل' },
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>📧 الحملات</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {campaigns?.length ?? 0} حملة
      </p>

      <div style={{
        background: 'var(--white)', borderRadius: 14, padding: 24,
        marginBottom: 16, borderRight: '4px solid var(--amber)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 6px', color: 'var(--amber-deep, #6B3A08)' }}>
          🚧 ميزة قيد التطوير
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.7 }}>
          إرسال الحملات يتطلب إعداد WhatsApp Business API / Twilio / FCM.<br />
          البنية التحتية جاهزة (الجدول + RLS)، ينقص ربط الـ providers الخارجية.
          عند الحاجة، أضف الـ env variables المناسبة وفعّل الإرسال من /api/campaigns/send.
        </p>
      </div>

      {/* List of past campaigns (if any) */}
      {campaigns && campaigns.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--paper-3)' }}>
              <tr>
                <th style={th}>الاسم</th>
                <th style={th}>النوع</th>
                <th style={th}>المستلمون</th>
                <th style={th}>الناجحة</th>
                <th style={th}>الحالة</th>
                <th style={th}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const tMeta = TYPE_META[c.type] ?? TYPE_META.email;
                const sMeta = STATUS_META[c.status] ?? STATUS_META.draft;
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      {c.description && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.description}</div>}
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: tMeta.color }}>
                        {tMeta.icon} {tMeta.label}
                      </span>
                    </td>
                    <td style={td}>{c.recipients_count.toLocaleString('ar-IQ')}</td>
                    <td style={td}>{c.success_count.toLocaleString('ar-IQ')}</td>
                    <td style={td}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 100,
                        background: sMeta.bg, color: sMeta.color, fontWeight: 800,
                      }}>{sMeta.label}</span>
                    </td>
                    <td style={td}>
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString('ar-IQ')
                                : new Date(c.created_at).toLocaleDateString('ar-IQ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--ink)' };

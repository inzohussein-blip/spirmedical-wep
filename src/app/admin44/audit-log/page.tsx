import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ACTION_TYPE_LABELS } from '@/lib/admin-types';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'سجل العمليات · إدارة',
};

interface SearchParams {
  type?: string;
  admin?: string;
  q?: string;
}

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from('admin_actions')
    .select('id, admin_id, action_type, target_type, target_id, details, ip_address, created_at', { count: 'exact' });

  if (searchParams.type) query = query.eq('action_type', searchParams.type);
  if (searchParams.admin) query = query.eq('admin_id', searchParams.admin);

  const { data: actions, count } = await query.order('created_at', { ascending: false }).limit(100);

  // أسماء المديرين
  const adminIds = Array.from(new Set((actions ?? []).map((a) => a.admin_id)));
  const { data: adminsData } = adminIds.length > 0
    ? await supabase.from('users').select('id, full_name, role').in('id', adminIds)
    : { data: [] };
  const adminsMap = new Map((adminsData ?? []).map((a) => [a.id, a]));

  // قائمة بكل أنواع الإجراءات
  const allTypes = Object.keys(ACTION_TYPE_LABELS);

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>📜 سجل العمليات</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {count ?? 0} عملية مسجلة
      </p>

      {/* Filters */}
      <form method="GET" style={{ background: 'var(--white)', padding: 16, borderRadius: 14, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>نوع العملية</label>
          <select name="type" defaultValue={searchParams.type ?? ''} style={inputStyle}>
            <option value="">كل العمليات</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{ACTION_TYPE_LABELS[t].icon} {ACTION_TYPE_LABELS[t].label}</option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ padding: '8px 20px', background: 'var(--emerald-deep)', color: 'var(--white)', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          🔍 تطبيق
        </button>
      </form>

      {/* Timeline */}
      {!actions || actions.length === 0 ? (
        <EmptyState
          icon="📜"
          title="لا توجد عمليات"
          description="ستظهر عمليات الإدارة هنا"
          size="lg"
        />
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--paper-3)' }}>
              <tr>
                <th style={th}>الوقت</th>
                <th style={th}>المدير</th>
                <th style={th}>العملية</th>
                <th style={th}>الهدف</th>
                <th style={th}>التفاصيل</th>
                <th style={th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => {
                const admin = adminsMap.get(a.admin_id);
                const meta = ACTION_TYPE_LABELS[a.action_type] ?? { label: a.action_type, icon: '⚙️' };

                return (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{admin?.full_name ?? '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{admin?.role ?? '—'}</div>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{meta.icon} {meta.label}</span>
                    </td>
                    <td style={td}>
                      {a.target_type && a.target_id ? (
                        a.target_type === 'user' ? (
                          <Link href={`/admin44/specialists/${a.target_id}`} style={{ fontSize: 11, color: 'var(--emerald)', textDecoration: 'none' }}>
                            👤 {a.target_id.slice(0, 8)}
                          </Link>
                        ) : a.target_type === 'appointment' ? (
                          <Link href={`/admin44/orders/${a.target_id}`} style={{ fontSize: 11, color: 'var(--emerald)', textDecoration: 'none' }}>
                            📋 {a.target_id.slice(0, 8)}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.target_type}: {a.target_id?.slice(0, 8)}</span>
                        )
                      ) : '—'}
                    </td>
                    <td style={td}>
                      {a.details ? (
                        <details>
                          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--ink-3)' }}>عرض</summary>
                          <pre style={{ fontSize: 10, background: 'var(--paper-3)', padding: 8, borderRadius: 6, marginTop: 4, maxWidth: 220, overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {JSON.stringify(a.details, null, 2)}
                          </pre>
                        </details>
                      ) : '—'}
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{a.ip_address ?? '—'}</td>
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

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', minWidth: 200 };
const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '10px 14px', fontSize: 12, color: 'var(--ink)', verticalAlign: 'top' };

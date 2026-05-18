import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SPECIALIST_META, SPECIALIST_TYPES, type SpecialistType } from '@/lib/specialist-types';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الطلبات · إدارة',
};

interface SearchParams {
  status?: string;
  type?: SpecialistType;
  governorate?: string;
  from?: string;
  to?: string;
  view?: 'list' | 'kanban';
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'جديد', bg: 'var(--amber-soft, #F8E5C7)', color: 'var(--amber-deep, #6B3A08)' },
  confirmed: { label: 'مؤكّد', bg: 'var(--emerald-soft)', color: 'var(--emerald-deep)' },
  in_progress: { label: 'جارٍ', bg: 'var(--amber-soft, #F8E5C7)', color: 'var(--amber-deep, #6B3A08)' },
  completed: { label: 'مكتمل', bg: 'var(--emerald-soft)', color: 'var(--emerald-deep)' },
  cancelled: { label: 'ملغى', bg: 'var(--rose-soft)', color: 'var(--rose)' },
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from('appointments')
    .select(`
      id, service_type, status, scheduled_at, user_id,
      required_specialist_type, assigned_specialist_id, address, created_at
    `, { count: 'exact' });

  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.type) query = query.eq('required_specialist_type', searchParams.type);

  if (searchParams.from) query = query.gte('scheduled_at', searchParams.from);
  if (searchParams.to) query = query.lte('scheduled_at', `${searchParams.to}T23:59:59`);

  const { data: orders, count } = await query.order('scheduled_at', { ascending: false }).limit(200);

  // اجلب أسماء المرضى والاختصاصيين
  const userIds = Array.from(new Set([
    ...(orders ?? []).map((o) => o.user_id),
    ...(orders ?? []).map((o) => o.assigned_specialist_id).filter(Boolean) as string[],
  ]));

  const { data: usersData } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name, phone, governorate').in('id', userIds)
    : { data: [] };

  const usersMap = new Map((usersData ?? []).map((u) => [u.id, u]));

  // فلتر إضافي للمحافظة (يتم بعد الجلب لأنه على المريض)
  let filteredOrders = orders ?? [];
  if (searchParams.governorate) {
    filteredOrders = filteredOrders.filter((o) => {
      const p = usersMap.get(o.user_id);
      return p?.governorate === searchParams.governorate;
    });
  }

  const view = searchParams.view ?? 'list';

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>📋 إدارة الطلبات</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {filteredOrders.length} من {count ?? 0} طلب
      </p>

      {/* Filters */}
      <form method="GET" style={{ background: 'var(--white)', padding: 16, borderRadius: 14, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={lblStyle}>الحالة</label>
          <select name="status" defaultValue={searchParams.status ?? ''} style={inputStyle}>
            <option value="">الكل</option>
            <option value="pending">جديد</option>
            <option value="confirmed">مؤكّد</option>
            <option value="in_progress">جارٍ</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>

        <div>
          <label style={lblStyle}>النوع</label>
          <select name="type" defaultValue={searchParams.type ?? ''} style={inputStyle}>
            <option value="">كل الأنواع</option>
            {SPECIALIST_TYPES.map((t) => (
              <option key={t} value={t}>{SPECIALIST_META[t].label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={lblStyle}>من تاريخ</label>
          <input type="date" name="from" defaultValue={searchParams.from ?? ''} style={inputStyle} />
        </div>

        <div>
          <label style={lblStyle}>إلى تاريخ</label>
          <input type="date" name="to" defaultValue={searchParams.to ?? ''} style={inputStyle} />
        </div>

        <button type="submit" style={{ padding: '8px 20px', background: 'var(--emerald-deep)', color: 'var(--white)', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          🔍 تطبيق
        </button>

        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
          <Link href={`/admin44/orders?${new URLSearchParams({ ...searchParams, view: 'list' } as Record<string, string>).toString()}`}
                style={{ padding: '8px 14px', background: view === 'list' ? 'var(--emerald-deep)' : 'transparent', color: view === 'list' ? 'var(--white)' : 'var(--ink-3)', textDecoration: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            📋 قائمة
          </Link>
          <Link href={`/admin44/orders?${new URLSearchParams({ ...searchParams, view: 'kanban' } as Record<string, string>).toString()}`}
                style={{ padding: '8px 14px', background: view === 'kanban' ? 'var(--emerald-deep)' : 'transparent', color: view === 'kanban' ? 'var(--white)' : 'var(--ink-3)', textDecoration: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            📊 Kanban
          </Link>
        </div>
      </form>

      {/* Display */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="📋"
          title="لا توجد طلبات"
          description="ستظهر الطلبات هنا عند إنشائها"
          size="lg"
        />
      ) : view === 'kanban' ? (
        <KanbanView orders={filteredOrders} usersMap={usersMap} />
      ) : (
        <ListView orders={filteredOrders} usersMap={usersMap} />
      )}
    </>
  );
}

function ListView({ orders, usersMap }: { orders: Array<Record<string, unknown>>; usersMap: Map<string, { full_name: string | null; phone: string }> }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 14, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ background: 'var(--paper-3)' }}>
          <tr>
            <th style={th}>المريض</th>
            <th style={th}>الخدمة</th>
            <th style={th}>التاريخ</th>
            <th style={th}>الاختصاصي</th>
            <th style={th}>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: any) => {
            const patient = usersMap.get(o.user_id);
            const specialist = o.assigned_specialist_id ? usersMap.get(o.assigned_specialist_id) : null;
            const status = STATUS_META[o.status] ?? STATUS_META.pending;
            const meta = o.required_specialist_type ? SPECIALIST_META[o.required_specialist_type as SpecialistType] : null;

            return (
              <tr key={o.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={td}>
                  <Link href={`/admin44/orders/${o.id}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>
                    {patient?.full_name ?? 'مريض'}
                  </Link>
                </td>
                <td style={td}>
                  {meta && <span style={{ marginInlineEnd: 4 }}>{meta.icon}</span>}
                  {o.service_type}
                </td>
                <td style={td}>
                  {new Date(o.scheduled_at).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td style={td}>{specialist?.full_name ?? <span style={{ color: 'var(--rose)', fontSize: 11 }}>غير معيّن</span>}</td>
                <td style={td}>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 100,
                    background: status.bg, color: status.color, fontWeight: 800,
                  }}>{status.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ orders, usersMap }: { orders: Array<Record<string, unknown>>; usersMap: Map<string, { full_name: string | null; phone: string }> }) {
  const columns = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
      {columns.map((col) => {
        const colOrders = orders.filter((o: any) => o.status === col);
        const meta = STATUS_META[col];

        return (
          <div key={col} style={{
            minWidth: 280,
            background: 'var(--paper-3)',
            borderRadius: 12,
            padding: 12,
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '2px solid var(--line)',
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: meta.color, margin: 0 }}>
                {meta.label}
              </h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: meta.bg, color: meta.color, fontWeight: 800 }}>
                {colOrders.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colOrders.slice(0, 20).map((o: any) => {
                const patient = usersMap.get(o.user_id);
                const specMeta = o.required_specialist_type ? SPECIALIST_META[o.required_specialist_type as SpecialistType] : null;

                return (
                  <Link key={o.id} href={`/admin44/orders/${o.id}`} style={{
                    background: 'var(--white)', borderRadius: 10, padding: 12,
                    textDecoration: 'none', color: 'var(--ink)', fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {specMeta && <span style={{ marginInlineEnd: 4 }}>{specMeta.icon}</span>}
                      {patient?.full_name ?? 'مريض'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{o.service_type}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                      📅 {new Date(o.scheduled_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}
                    </div>
                  </Link>
                );
              })}
              {colOrders.length > 20 && (
                <div style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', padding: 8 }}>
                  +{colOrders.length - 20} طلب آخر
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', minWidth: 130 };
const lblStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 };
const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--ink)' };

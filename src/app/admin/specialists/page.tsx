import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SPECIALIST_META, SPECIALIST_TYPES, type SpecialistType } from '@/lib/specialist-types';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الاختصاصيون · إدارة',
};

interface SearchParams {
  type?: SpecialistType;
  status?: 'approved' | 'rejected' | 'all';
  q?: string;
}

export default async function SpecialistsListPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from('users')
    .select('id, full_name, phone, governorate, specialist_type, approval_status, is_suspended, specialist_years_exp, created_at')
    .eq('role', 'specialist');

  // فلتر الحالة
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('approval_status', searchParams.status);
  } else if (!searchParams.status) {
    query = query.eq('approval_status', 'approved');
  }

  // فلتر النوع
  if (searchParams.type) {
    query = query.eq('specialist_type', searchParams.type);
  }

  // البحث
  if (searchParams.q) {
    query = query.or(`full_name.ilike.%${searchParams.q}%,phone.ilike.%${searchParams.q}%`);
  }

  const { data: specialists } = await query.order('created_at', { ascending: false }).limit(100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
          👨‍⚕️ الاختصاصيون
        </h1>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {specialists?.length ?? 0} نتيجة
      </p>

      {/* Filters */}
      <form method="GET" style={{ background: 'var(--white)', padding: 16, borderRadius: 14, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>بحث</label>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="الاسم أو الهاتف..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>النوع</label>
          <select name="type" defaultValue={searchParams.type ?? ''} style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
            <option value="">كل الأنواع</option>
            {SPECIALIST_TYPES.map((t) => (
              <option key={t} value={t}>{SPECIALIST_META[t].icon} {SPECIALIST_META[t].label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الحالة</label>
          <select name="status" defaultValue={searchParams.status ?? 'approved'} style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
            <option value="approved">✅ معتمد</option>
            <option value="rejected">❌ مرفوض</option>
            <option value="all">الكل</option>
          </select>
        </div>

        <button type="submit" style={{ padding: '8px 20px', background: 'var(--emerald-deep)', color: 'var(--white)', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          🔍 بحث
        </button>
      </form>

      {/* Table */}
      {!specialists || specialists.length === 0 ? (
        <EmptyState
          icon="👨‍⚕️"
          title="لا توجد نتائج"
          description="جرّب بحث آخر أو غيّر الفلتر"
          size="lg"
        />
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--paper-3)' }}>
              <tr>
                <th style={th}>الاسم</th>
                <th style={th}>الهاتف</th>
                <th style={th}>النوع</th>
                <th style={th}>المحافظة</th>
                <th style={th}>الخبرة</th>
                <th style={th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {specialists.map((s) => {
                const meta = s.specialist_type ? SPECIALIST_META[s.specialist_type] : null;
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>
                      <Link href={`/admin/specialists/${s.id}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>
                        {s.full_name ?? 'بدون اسم'}
                      </Link>
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace' }} dir="ltr">{s.phone}</td>
                    <td style={td}>{meta ? `${meta.icon} ${meta.label}` : '—'}</td>
                    <td style={td}>{s.governorate ?? '—'}</td>
                    <td style={td}>{s.specialist_years_exp ? `${s.specialist_years_exp} سنة` : '—'}</td>
                    <td style={td}>
                      {s.is_suspended ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--rose-soft)', color: 'var(--rose)', fontWeight: 800 }}>⛔ معلّق</span>
                      ) : s.approval_status === 'approved' ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', fontWeight: 800 }}>✅ نشط</span>
                      ) : s.approval_status === 'rejected' ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--rose-soft)', color: 'var(--rose)', fontWeight: 800 }}>❌ مرفوض</span>
                      ) : (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--amber-soft, #F8E5C7)', color: 'var(--amber-deep, #6B3A08)', fontWeight: 800 }}>⏳ معلّق</span>
                      )}
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

const th: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'right',
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--ink-3)',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: 'var(--ink)',
};

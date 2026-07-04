import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'المرضى · إدارة CRM',
};

interface SearchParams {
  q?: string;
  governorate?: string;
  has_tag?: string;
  sort?: 'recent' | 'oldest' | 'name';
}

const GOVERNORATES = [
  'بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف', 'كربلاء',
  'السليمانية', 'كركوك', 'دهوك', 'ديالى', 'الأنبار', 'صلاح الدين',
  'بابل', 'القادسية', 'واسط', 'المثنى', 'ميسان', 'ذي قار',
];

export default async function PatientsListPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from('users')
    .select('id, full_name, phone, governorate, email, created_at, is_suspended', { count: 'exact' })
    .eq('role', 'patient');

  if (searchParams.q) {
    query = query.or(`full_name.ilike.%${searchParams.q}%,phone.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  }
  if (searchParams.governorate) {
    query = query.eq('governorate', searchParams.governorate);
  }

  // Sort
  const sort = searchParams.sort ?? 'recent';
  if (sort === 'recent') query = query.order('created_at', { ascending: false });
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
  else if (sort === 'name') query = query.order('full_name', { ascending: true });

  const { data: patients, count } = await query.limit(100);

  // اجلب tags لكل مريض
  const patientIds = (patients ?? []).map((p) => p.id);
  const { data: tagsData } = patientIds.length > 0
    ? await supabase.from('patient_tags').select('patient_id, tag, color').in('patient_id', patientIds)
    : { data: [] };

  const tagsMap = new Map<string, Array<{ tag: string; color: string }>>();
  (tagsData ?? []).forEach((t) => {
    if (!tagsMap.has(t.patient_id)) tagsMap.set(t.patient_id, []);
    tagsMap.get(t.patient_id)!.push({ tag: t.tag, color: t.color });
  });

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>👤 المرضى</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {count ?? 0} مريض في النظام
      </p>

      {/* Filters */}
      <form method="GET" style={{ background: 'var(--white)', padding: 16, borderRadius: 14, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 250px' }}>
          <label style={lblStyle}>🔍 بحث</label>
          <input type="text" name="q" defaultValue={searchParams.q ?? ''} placeholder="الاسم أو الهاتف أو البريد..." style={inputStyle} />
        </div>

        <div>
          <label style={lblStyle}>📍 المحافظة</label>
          <select name="governorate" defaultValue={searchParams.governorate ?? ''} style={inputStyle}>
            <option value="">كل المحافظات</option>
            {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label style={lblStyle}>↕️ الترتيب</label>
          <select name="sort" defaultValue={searchParams.sort ?? 'recent'} style={inputStyle}>
            <option value="recent">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="name">الاسم</option>
          </select>
        </div>

        <button type="submit" style={{ padding: '8px 20px', background: 'var(--emerald-deep)', color: 'var(--white)', border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          🔍 بحث
        </button>
      </form>

      {/* List */}
      {!patients || patients.length === 0 ? (
        <EmptyState
          icon="👤"
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
                <th style={th}>المحافظة</th>
                <th style={th}>تاريخ التسجيل</th>
                <th style={th}>التصنيفات</th>
                <th style={th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const tags = tagsMap.get(p.id) ?? [];
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={td}>
                      <Link href={`/admin/patients/${p.id}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700 }}>
                        {p.full_name ?? 'بدون اسم'}
                      </Link>
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace' }} dir="ltr">
                      <a href={`tel:${p.phone}`} style={{ color: 'var(--emerald)', textDecoration: 'none' }}>{p.phone}</a>
                    </td>
                    <td style={td}>{p.governorate ?? '—'}</td>
                    <td style={td}>{new Date(p.created_at).toLocaleDateString('ar-IQ')}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {tags.length === 0 ? (
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>—</span>
                        ) : (
                          tags.slice(0, 3).map((t, i) => (
                            <span key={i} style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 100,
                              background: 'var(--paper-3)', color: 'var(--ink)', fontWeight: 700,
                            }}>{t.tag}</span>
                          ))
                        )}
                        {tags.length > 3 && (
                          <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>+{tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      {p.is_suspended ? (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--rose-soft)', color: 'var(--rose)', fontWeight: 800 }}>⛔ معلّق</span>
                      ) : (
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', fontWeight: 800 }}>✅ نشط</span>
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--line)',
  borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
};
const lblStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4,
};
const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--ink)' };

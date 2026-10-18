import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { DISPLAY_LOCALE } from '@/lib/format/locale';
import { DataTable, Icon, StatCard, StatGrid, StatusPill } from '@/components/admin-ui';
import { PROVIDER_META, PROVIDER_TYPES, isProviderType } from '@/lib/providers';
import ProviderActions from './ProviderActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'حسابات الخدمة · إدارة' };

/**
 * 🏥 /admin/providers — حساباتُ «الخدمة» (0060): مختبرات، صيدليات، عيادات، مستشفيات. المراجعةُ والاعتمادُ
 * وتصحيحُ النوع. (المختصّون — السحبُ والتمريض — في /admin/specialists.)
 */
const STATUS: Record<string, { label: string; tone: 'amber' | 'brand' | 'rose' }> = {
  pending: { label: 'قيد المراجعة', tone: 'amber' },
  approved: { label: 'معتمَد', tone: 'brand' },
  rejected: { label: 'مرفوض', tone: 'rose' },
};

export default async function ProvidersPage(props: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isAdminRole(me?.role)) redirect('/admin');

  const { status } = await props.searchParams;
  const filter = status === 'approved' || status === 'rejected' || status === 'all' ? status : 'pending';
  let q = supabase
    .from('users')
    .select('id, full_name, phone, provider_type, clinic_name, clinic_city, governorate, approval_status, created_at')
    .eq('role', 'provider')
    .order('created_at', { ascending: false })
    .limit(200);
  if (filter !== 'all') q = q.eq('approval_status', filter);
  const [{ data: rows }, { data: all }] = await Promise.all([
    q,
    supabase.from('users').select('approval_status, provider_type').eq('role', 'provider').limit(2000),
  ]);
  const count = (s: string) => (all ?? []).filter((r) => r.approval_status === s).length;
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(DISPLAY_LOCALE, { dateStyle: 'medium', timeZone: 'Asia/Baghdad' }).format(new Date(iso)) : '—';

  return (
    <div className="err-page">
      <h1 className="err-title"><Icon name="labs" size={24} /> حسابات الخدمة</h1>
      <p className="err-sub">مختبرات، صيدليات، عيادات، مستشفيات — تُراجَع قبل أن تظهر للمرضى. والمختصّون (سحبُ الدم والتمريض) في «الاختصاصيون».</p>

      <StatGrid min={150}>
        <StatCard icon="pending" label="قيد المراجعة" value={count('pending')} tone={count('pending') > 0 ? 'amber' : undefined} href="/admin/providers" />
        <StatCard icon="done" label="معتمَدة" value={count('approved')} href="/admin/providers?status=approved" />
        <StatCard icon="cancelled" label="مرفوضة" value={count('rejected')} href="/admin/providers?status=rejected" />
        {PROVIDER_TYPES.map((t) => (
          <StatCard key={t} icon={PROVIDER_META[t].icon} label={PROVIDER_META[t].label} value={(all ?? []).filter((r) => r.provider_type === t).length} />
        ))}
      </StatGrid>

      <nav className="err-chips" aria-label="تصفية">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
          <Link key={s} href={s === 'pending' ? '/admin/providers' : `/admin/providers?status=${s}`} className={`err-chip${filter === s ? ' err-chip-on' : ''}`}>
            {s === 'all' ? 'الكلّ' : STATUS[s].label}
          </Link>
        ))}
      </nav>

      <DataTable
        rows={rows ?? []}
        rowKey={(r) => r.id}
        empty={filter === 'pending' ? 'لا حسابَ بانتظار المراجعة ✓' : 'لا نتائج'}
        columns={[
          {
            key: 'name', header: 'المنشأة', primary: true,
            render: (r) => (
              <span className="err-msg-cell">
                <span className="err-message">{r.clinic_name || '—'}</span>
                <span className="err-first">{r.full_name} · <bdi dir="ltr">{r.phone}</bdi></span>
              </span>
            ),
          },
          { key: 'type', header: 'النوع', render: (r) => (isProviderType(r.provider_type) ? PROVIDER_META[r.provider_type].label : '—') },
          { key: 'city', header: 'المدينة', render: (r) => r.clinic_city || r.governorate || '—' },
          { key: 'status', header: 'الحالة', render: (r) => <StatusPill label={STATUS[r.approval_status ?? 'pending']?.label ?? '—'} tone={STATUS[r.approval_status ?? 'pending']?.tone} /> },
          { key: 'date', header: 'التسجيل', render: (r) => fmt(r.created_at) },
          {
            key: 'act', header: 'إجراءات',
            render: (r) => <ProviderActions id={r.id} status={r.approval_status ?? 'pending'} type={r.provider_type ?? 'lab'} />,
          },
        ]}
      />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';
import ReportsClient from './ReportsClient';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'التقارير · إدارة',
};

interface SearchParams {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  from?: string;
  to?: string;
}

function getDateRange(params: SearchParams): { from: string; to: string; label: string } {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));

  if (params.period === 'custom' && params.from && params.to) {
    return { from: params.from, to: params.to, label: `${params.from} → ${params.to}` };
  }

  const period = params.period ?? 'month';

  if (period === 'today') {
    return { from: today.toISOString(), to: new Date().toISOString(), label: 'اليوم' };
  }
  if (period === 'week') {
    return { from: new Date(today.getTime() - 7 * 86400000).toISOString(), to: new Date().toISOString(), label: 'آخر 7 أيام' };
  }
  if (period === 'year') {
    return { from: new Date(today.getTime() - 365 * 86400000).toISOString(), to: new Date().toISOString(), label: 'السنة الماضية' };
  }
  return { from: new Date(today.getTime() - 30 * 86400000).toISOString(), to: new Date().toISOString(), label: 'آخر 30 يوم' };
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const range = getDateRange(searchParams);

  // === جمع البيانات ===
  const [
    { count: newPatients },
    { count: newSpecialists },
    { count: totalOrders },
    { count: completedOrders },
    { count: cancelledOrders },
    { data: ordersByType },
    { data: ordersByGov },
    { data: topSpecialists },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'patient').gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'specialist').gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('status', 'completed').gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled').gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('appointments')
      .select('required_specialist_type')
      .gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('appointments')
      .select('user_id')
      .gte('created_at', range.from).lte('created_at', range.to),
    supabase.from('appointments')
      .select('assigned_specialist_id')
      .eq('status', 'completed')
      .gte('created_at', range.from).lte('created_at', range.to)
      .not('assigned_specialist_id', 'is', null),
  ]);

  // تجميع حسب النوع
  const typeStats: Record<string, number> = {};
  (ordersByType ?? []).forEach((o) => {
    if (o.required_specialist_type) {
      typeStats[o.required_specialist_type] = (typeStats[o.required_specialist_type] ?? 0) + 1;
    }
  });

  // تجميع حسب المحافظة (نحتاج جلب governorate من users)
  const patientIds = Array.from(new Set((ordersByGov ?? []).map((o) => o.user_id)));
  const { data: govData } = patientIds.length > 0
    ? await supabase.from('users').select('id, governorate').in('id', patientIds)
    : { data: [] };

  const govMap = new Map((govData ?? []).map((u) => [u.id, u.governorate]));
  const govStats: Record<string, number> = {};
  (ordersByGov ?? []).forEach((o) => {
    const g = govMap.get(o.user_id);
    if (g) govStats[g] = (govStats[g] ?? 0) + 1;
  });

  // top specialists by completed orders
  const specCounts: Record<string, number> = {};
  (topSpecialists ?? []).forEach((o) => {
    if (o.assigned_specialist_id) specCounts[o.assigned_specialist_id] = (specCounts[o.assigned_specialist_id] ?? 0) + 1;
  });
  const topSpecIds = Object.entries(specCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([id]) => id);
  const { data: topSpecData } = topSpecIds.length > 0
    ? await supabase.from('users').select('id, full_name, specialist_type').in('id', topSpecIds)
    : { data: [] };

  const topSpecList = topSpecIds.map((id) => {
    const spec = (topSpecData ?? []).find((s) => s.id === id);
    return {
      id,
      name: spec?.full_name ?? 'بدون اسم',
      type: spec?.specialist_type,
      count: specCounts[id],
    };
  });

  const completionRate = totalOrders && totalOrders > 0
    ? Math.round(((completedOrders ?? 0) / totalOrders) * 100)
    : 0;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>📈 التقارير</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            الفترة: <strong>{range.label}</strong>
          </p>
        </div>
        <ReportsClient fromDate={range.from.slice(0, 10)} toDate={range.to.slice(0, 10)} />
      </div>

      {/* Period selector */}
      <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { v: 'today', label: 'اليوم' },
          { v: 'week', label: 'أسبوع' },
          { v: 'month', label: 'شهر' },
          { v: 'year', label: 'سنة' },
        ].map((p) => (
          <button
            key={p.v}
            type="submit"
            name="period"
            value={p.v}
            style={{
              padding: '8px 16px',
              background: (searchParams.period ?? 'month') === p.v ? 'var(--emerald-deep)' : 'var(--white)',
              color: (searchParams.period ?? 'month') === p.v ? 'var(--white)' : 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {p.label}
          </button>
        ))}
      </form>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        <StatBox label="مرضى جدد" value={(newPatients ?? 0).toLocaleString('ar-IQ')} icon="👤" color="#534AB7" />
        <StatBox label="اختصاصيون جدد" value={(newSpecialists ?? 0).toLocaleString('ar-IQ')} icon="👨‍⚕️" color="#B8540C" />
        <StatBox label="إجمالي الطلبات" value={(totalOrders ?? 0).toLocaleString('ar-IQ')} icon="📋" color="#0E5C4D" />
        <StatBox label="مكتملة" value={(completedOrders ?? 0).toLocaleString('ar-IQ')} icon="✅" color="#0E5C4D" />
        <StatBox label="ملغاة" value={(cancelledOrders ?? 0).toLocaleString('ar-IQ')} icon="🚫" color="#A82E3D" />
        <StatBox label="معدل الإنجاز" value={`${completionRate}%`} icon="📊" color="#0E5C4D" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top types */}
        <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>📊 الطلبات حسب النوع</h2>
          {Object.keys(typeStats).length === 0 ? (
            <EmptyState icon="📊" title="لا توجد بيانات" size="sm" variant="plain" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(typeStats).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                const meta = SPECIALIST_META[type as SpecialistType];
                const max = Math.max(...Object.values(typeStats));
                const percent = max > 0 ? (count / max) * 100 : 0;
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{meta?.icon} {meta?.label ?? type}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--emerald-deep)' }}>{count}</span>
                    </div>
                    <div style={{ background: 'var(--paper-3)', height: 8, borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ background: meta?.gradient ?? 'var(--emerald-deep)', height: '100%', width: `${percent}%`, borderRadius: 100 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top governorates */}
        <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>📍 الطلبات حسب المحافظة</h2>
          {Object.keys(govStats).length === 0 ? (
            <EmptyState icon="📊" title="لا توجد بيانات" size="sm" variant="plain" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(govStats).sort(([, a], [, b]) => b - a).slice(0, 10).map(([gov, count]) => {
                const max = Math.max(...Object.values(govStats));
                const percent = max > 0 ? (count / max) * 100 : 0;
                return (
                  <div key={gov}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>📍 {gov}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--emerald-deep)' }}>{count}</span>
                    </div>
                    <div style={{ background: 'var(--paper-3)', height: 8, borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--emerald-deep)', height: '100%', width: `${percent}%`, borderRadius: 100 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top specialists */}
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginTop: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>🏆 أفضل الاختصاصيين أداءً</h2>
        {topSpecList.length === 0 ? (
          <EmptyState icon="📊" title="لا توجد بيانات" size="sm" variant="plain" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--paper-3)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', width: 60 }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' }}>الاسم</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' }}>الاختصاص</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' }}>المكتملة</th>
              </tr>
            </thead>
            <tbody>
              {topSpecList.map((s, i) => {
                const meta = s.type ? SPECIALIST_META[s.type as SpecialistType] : null;
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-3)' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700 }}>{s.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{meta ? `${meta.icon} ${meta.label}` : '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 800, color: 'var(--emerald-deep)' }}>{s.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 12, padding: 16, borderRight: `4px solid ${color}` }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

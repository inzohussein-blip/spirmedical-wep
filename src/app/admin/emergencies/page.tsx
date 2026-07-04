// ═══════════════════════════════════════════════════════════════
// 🚨 Admin Emergency Dashboard (V25.6)
// ═══════════════════════════════════════════════════════════════
// عرض كل تفعيلات زر الطوارئ من الكادر التمريضي
// مع فلاتر للحالة + إحصائيات + خريطة (مستقبلاً)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EmergenciesClient from './EmergenciesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الطوارئ الأمنية - Spir Medical' };

export default async function AdminEmergenciesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();

  // ─── تحقق من Admin ───
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // ─── جلب البيانات ───
  let query = supabase
    .from('nurse_emergency_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const status = searchParams.status;
  if (status && ['open', 'responding', 'resolved', 'false_alarm'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data: emergencies } = await query;

  // ─── جلب أسماء الممرضين ───
  const specialistIds = [...new Set((emergencies || []).map(e => e.specialist_id))];
  const { data: specialists } = specialistIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name, phone')
        .in('id', specialistIds)
    : { data: [] };

  const specialistsMap = new Map((specialists || []).map(s => [s.id, s]));

  // ─── إحصائيات سريعة ───
  const { data: stats } = await supabase
    .from('nurse_emergency_logs')
    .select('status, created_at');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats24h = (stats || []).filter(s =>
    new Date(s.created_at) >= today
  ).length;

  const openCount = (stats || []).filter(s => s.status === 'open').length;
  const respondingCount = (stats || []).filter(s => s.status === 'responding').length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            🚨 الطوارئ الأمنية
          </h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
            مراقبة وإدارة تفعيلات زر الطوارئ من الكادر التمريضي
          </p>
        </div>
        <Link
          href="/admin"
          style={{
            padding: '8px 16px',
            background: 'var(--paper-3)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--ink-2)',
            textDecoration: 'none',
          }}
        >
          ← العودة
        </Link>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        <StatCard
          label="حالات مفتوحة"
          value={openCount}
          color="var(--rose)"
          emoji="🆘"
          urgent={openCount > 0}
        />
        <StatCard
          label="تستجاب لها"
          value={respondingCount}
          color="var(--amber)"
          emoji="⏱️"
        />
        <StatCard
          label="آخر 24 ساعة"
          value={stats24h}
          color="var(--emerald)"
          emoji="📊"
        />
        <StatCard
          label="إجمالي"
          value={stats?.length ?? 0}
          color="var(--ink-2)"
          emoji="📋"
        />
      </div>

      <EmergenciesClient
        emergencies={emergencies || []}
        specialistsMap={Object.fromEntries(specialistsMap)}
        currentFilter={status}
      />
    </div>
  );
}

function StatCard({ label, value, color, emoji, urgent }: {
  label: string;
  value: number;
  color: string;
  emoji: string;
  urgent?: boolean;
}) {
  return (
    <div
      style={{
        background: urgent ? color : 'var(--white)',
        color: urgent ? 'var(--paper-3)' : 'var(--ink)',
        padding: 16,
        borderRadius: 14,
        border: '1px solid',
        borderColor: urgent ? color : 'var(--line)',
        animation: urgent ? 'pulse-emergency 2s ease-in-out infinite' : 'none',
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
    </div>
  );
}

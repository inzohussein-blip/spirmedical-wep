// ═══════════════════════════════════════════════════════════════
// 💉 V25.44: Admin - إدارة الممرضين
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NursesAdminClient from './NursesAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة الممرضين - Admin' };

export default async function AdminNursesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // جلب كل الـ specialists من نوع nurse
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  
  const nursesQuery = await supabaseAny
    .from('users')
    .select('id, full_name, phone, governorate, approval_status, created_at')
    .eq('specialist_type', 'nurse')
    .order('created_at', { ascending: false });

  const allNurses = (nursesQuery.data as Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    governorate: string | null;
    approval_status: string;
    created_at: string;
  }>) ?? [];

  // جلب الـ ratings + visit counts
  const ratingsRes = await supabaseAny
    .from('nurse_ratings')
    .select('specialist_id, rating');
  
  const ratings = (ratingsRes.data as Array<{ specialist_id: string; rating: number }>) ?? [];
  
  const visitsRes = await supabaseAny
    .from('nursing_visit_history')
    .select('specialist_id');
  
  const visits = (visitsRes.data as Array<{ specialist_id: string }>) ?? [];

  // حساب الإحصاءات لكل ممرض
  const stats = new Map<string, { ratingAvg: number; ratingCount: number; visits: number }>();
  
  ratings.forEach((r) => {
    const existing = stats.get(r.specialist_id) || { ratingAvg: 0, ratingCount: 0, visits: 0 };
    existing.ratingAvg = (existing.ratingAvg * existing.ratingCount + r.rating) / (existing.ratingCount + 1);
    existing.ratingCount += 1;
    stats.set(r.specialist_id, existing);
  });
  
  visits.forEach((v) => {
    if (!v.specialist_id) return;
    const existing = stats.get(v.specialist_id) || { ratingAvg: 0, ratingCount: 0, visits: 0 };
    existing.visits += 1;
    stats.set(v.specialist_id, existing);
  });

  const nursesWithStats = allNurses.map((n) => ({
    ...n,
    gender: null as string | null,
    ratingAvg: stats.get(n.id)?.ratingAvg || 0,
    ratingCount: stats.get(n.id)?.ratingCount || 0,
    totalVisits: stats.get(n.id)?.visits || 0,
  }));

  // إحصاءات عامّة
  const activeNurses = allNurses.filter(n => n.approval_status === 'approved').length;
  const pendingNurses = allNurses.filter(n => n.approval_status === 'pending').length;
  const totalVisits = visits.length;
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin44" style={{
          padding: '8px 12px',
          background: 'var(--paper-3)',
          color: 'var(--ink-2)',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 700,
        }}>← العودة</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>💉 إدارة الممرضين</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {allNurses.length} ممرض · {activeNurses} نشط · {pendingNurses} قيد المراجعة · {totalVisits} زيارة · ⭐ {avgRating.toFixed(1)}
          </p>
        </div>
      </div>

      <NursesAdminClient nurses={nursesWithStats} />
    </div>
  );
}

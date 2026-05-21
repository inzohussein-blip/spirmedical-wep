// ═══════════════════════════════════════════════════════════════
// 🧠 Admin: إدارة الأخصائيين النفسيين (V25.21)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MentalHealthAdminClient from './MentalHealthAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة الصحة النفسية - Admin' };

export default async function AdminMentalHealthPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: specialists } = await supabase
    .from('mental_health_specialists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin44" style={{
          padding: '8px 12px', background: 'var(--white)',
          border: '1px solid var(--line)', borderRadius: 8,
          textDecoration: 'none', color: 'var(--ink-2)', fontSize: 13,
        }}>← العودة</Link>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
          🧠 إدارة الأخصائيين النفسيين
        </h1>
      </div>
      <MentalHealthAdminClient initialSpecialists={specialists || []} />
    </div>
  );
}

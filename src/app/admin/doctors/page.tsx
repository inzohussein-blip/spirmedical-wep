// ═══════════════════════════════════════════════════════════════
// 👨‍⚕️ Admin: إدارة الأطباء (V25.10)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DoctorsAdminClient from './DoctorsAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة الأطباء - Admin' };

export default async function AdminDoctorsPage() {
  const supabase = createClient();
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

  const { data: doctors } = await supabase
    .from('doctors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link
          href="/admin"
          style={{
            padding: '8px 12px',
            background: 'var(--paper-3)',
            color: 'var(--ink-2)',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ← العودة
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            👨‍⚕️ إدارة الأطباء
          </h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {doctors?.length ?? 0} طبيب مسجّل
          </p>
        </div>
      </div>

      <DoctorsAdminClient doctors={doctors || []} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🏥 Admin: إدارة المستشفيات (V25.10)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import HospitalsAdminClient from './HospitalsAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة المستشفيات - Admin' };

export default async function AdminHospitalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('*')
    .order('city')
    .order('name')
    .limit(300);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin" style={{
          padding: '8px 12px',
          background: 'var(--paper-3)',
          color: 'var(--ink-2)',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 700,
        }}>← العودة</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>🏥 إدارة المستشفيات</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {hospitals?.length ?? 0} مستشفى
          </p>
        </div>
      </div>

      <HospitalsAdminClient hospitals={hospitals || []} />
    </div>
  );
}

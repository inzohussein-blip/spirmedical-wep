// ═══════════════════════════════════════════════════════════════
// 💊 Admin: كتالوج الأدوية الوطني (V25.10)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MedicationsAdminClient from './MedicationsAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'كتالوج الأدوية - Admin' };

export default async function AdminMedicationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .order('name_ar')
    .limit(500);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin44/pharmacies" style={{ padding: '8px 12px', background: 'var(--paper-3)', color: 'var(--ink-2)', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>← الصيدليات</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>📋 كتالوج الأدوية الوطني</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {medications?.length ?? 0} دواء · مرجع لكل الصيدليات
          </p>
        </div>
      </div>

      <MedicationsAdminClient medications={medications || []} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 💊 Admin: إدارة الصيدليات (V25.10)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PharmaciesAdminClient from './PharmaciesAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة الصيدليات - Admin' };

export default async function AdminPharmaciesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const { data: pharmacies } = await supabase
    .from('pharmacies')
    .select('*')
    .order('city')
    .order('name')
    .limit(300);

  // عدد الأدوية لكل صيدلية
  const pharmacyIds = (pharmacies || []).map(p => p.id);
  const { data: inventoryCounts } = pharmacyIds.length > 0 ? await supabase
    .from('pharmacy_inventory')
    .select('pharmacy_id, is_available')
    .in('pharmacy_id', pharmacyIds) : { data: [] };

  const countsMap: Record<string, { total: number; available: number }> = {};
  (inventoryCounts || []).forEach(i => {
    if (!countsMap[i.pharmacy_id]) countsMap[i.pharmacy_id] = { total: 0, available: 0 };
    countsMap[i.pharmacy_id].total++;
    if (i.is_available) countsMap[i.pharmacy_id].available++;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin" style={{ padding: '8px 12px', background: 'var(--paper-3)', color: 'var(--ink-2)', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>← العودة</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>💊 إدارة الصيدليات</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {pharmacies?.length ?? 0} صيدلية مسجّلة
          </p>
        </div>
        <Link href="/admin/medications" style={{
          padding: '8px 14px',
          background: 'var(--amber)',
          color: 'var(--paper-3)',
          borderRadius: 10,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 800,
        }}>
          📋 كتالوج الأدوية
        </Link>
      </div>

      <PharmaciesAdminClient pharmacies={pharmacies || []} inventoryCounts={countsMap} />
    </div>
  );
}

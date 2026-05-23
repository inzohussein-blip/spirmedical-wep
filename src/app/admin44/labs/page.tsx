// ═══════════════════════════════════════════════════════════════
// 🩸 Admin: إدارة المختبرات الشريكة (V25.43)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LabsAdminClient from './LabsAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة المختبرات - Admin' };

export default async function AdminLabsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  
  const supabaseAny = supabase as unknown as { 
    from: (table: string) => {
      
      select: (cols: string) => any;
    };
  };
  
  const result = await supabaseAny
    .from('partner_labs')
    .select('*')
    .order('city')
    .order('name_ar');
  
  const labs = (result.data as Array<{
    id: string;
    name_ar: string;
    name_en: string | null;
    city: string;
    governorate: string | null;
    phone: string | null;
    is_active: boolean;
    is_featured: boolean;
    total_orders: number;
    rating_avg: number;
    rating_count: number;
    specialties: string[] | null;
  }>) ?? [];

  // إحصاءات
  const activeLabs = labs.filter(l => l.is_active).length;
  const featuredLabs = labs.filter(l => l.is_featured).length;
  const totalOrders = labs.reduce((sum, l) => sum + (l.total_orders || 0), 0);

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
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>🩸 إدارة المختبرات الشريكة</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {labs.length} مختبر · {activeLabs} نشط · {featuredLabs} مميّز · {totalOrders} طلب
          </p>
        </div>
      </div>

      <LabsAdminClient labs={labs} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📧 Admin: إدارة الحملات (V25.11) - بناء كامل
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CampaignsClient from './CampaignsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الحملات · إدارة' };

export default async function CampaignsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // عدّ المستخدمين المستهدفين
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user');

  return (
    <>
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
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📧 الحملات</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {campaigns?.length ?? 0} حملة · جمهور محتمل: {totalUsers?.toLocaleString('ar-IQ') ?? 0} مستخدم
          </p>
        </div>
      </div>

      <CampaignsClient
        campaigns={campaigns || []}
        totalUsers={totalUsers ?? 0}
      />
    </>
  );
}

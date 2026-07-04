// ═══════════════════════════════════════════════════════════════
// 🐛 Admin: تقارير الأعطال (V25.14)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BugsClient from './BugsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الأعطال - Admin' };

export default async function BugsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const { data: bugs } = await supabase
    .from('bug_reports')
    .select('*')
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const userIds = [...new Set((bugs || []).map(b => b.user_id).filter(Boolean))] as string[];
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', userIds)
    : { data: [] };

  const usersMap = Object.fromEntries((users || []).map(u => [u.id, u]));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin44" style={{
          padding: '8px 12px', background: 'var(--paper-3)', color: 'var(--ink-2)',
          borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700,
        }}>← العودة</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>🐛 الأعطال</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {bugs?.length ?? 0} عطل مُبلَّغ
          </p>
        </div>
      </div>

      <BugsClient bugs={bugs || []} usersMap={usersMap} />
    </>
  );
}

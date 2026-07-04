// ═══════════════════════════════════════════════════════════════
// 💬 Admin: ملاحظات المستخدمين (V25.14)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FeedbackClient from './FeedbackClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الملاحظات - Admin' };

export default async function FeedbackPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard');

  const { data: feedbackList } = await supabase
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // جلب أسماء المستخدمين
  const userIds = [...new Set((feedbackList || []).map(f => f.user_id).filter(Boolean))] as string[];
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name, phone').in('id', userIds)
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
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>💬 الملاحظات</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {feedbackList?.length ?? 0} ملاحظة من المستخدمين
          </p>
        </div>
      </div>

      <FeedbackClient
        feedbackList={feedbackList || []}
        usersMap={usersMap}
      />
    </>
  );
}

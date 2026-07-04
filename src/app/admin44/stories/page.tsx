// ═══════════════════════════════════════════════════════════════
// 📸 Admin: إدارة القصص الترويجية (V25.11)
// ═══════════════════════════════════════════════════════════════
// كان فارغاً - تم بناؤه كاملاً
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import StoriesManager from './StoriesManager';
import type { Story } from '@/types/story';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'القصص الترويجية - Admin' };

export default async function AdminStoriesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // ─── السوبر أدمن أو الأدمن يمكنه إدارة القصص ───
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return (
      <div style={{
        background: 'var(--white)',
        borderRadius: 14,
        padding: 64,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>غير مصرّح</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          هذه الصفحة للمديرين فقط
        </p>
      </div>
    );
  }

  // ─── جلب كل القصص ───
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
          📸 القصص الترويجية
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          إدارة الـ stories التي تظهر في dashboard المستخدمين (مثل Instagram Stories)
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'var(--emerald-soft)',
        borderInlineStart: '4px solid var(--emerald)',
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>💡 كيف تظهر القصص؟</div>
        <div style={{ color: 'var(--ink-2)', lineHeight: 1.7 }}>
          القصص النشطة تظهر كصف من الـ circles في أعلى dashboard كل مستخدم.<br />
          يمكن جدولتها (تظهر من-إلى)، ترتيبها، أو إيقافها مؤقتاً.<br />
          الرابط (<code style={{ background: 'var(--white)', padding: '1px 4px', borderRadius: 3 }}>href</code>) يحدّد لأين تذهب عند الضغط.
        </div>
      </div>

      <StoriesManager initialStories={(stories as Story[]) || []} />
    </>
  );
}

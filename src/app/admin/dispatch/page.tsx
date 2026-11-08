import { redirect } from 'next/navigation';
import AutoRefresh from '@/components/admin/AutoRefresh';
import { isAdminRole } from '@/lib/admin-types';
import { createClient } from '@/lib/supabase/server';
import DispatchBoard, { type Board } from './DispatchBoard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'لوحة الإرسال الحيّة - Spir Medical' };

/**
 * 🛰️ لوحة الإرسال الحيّة (المرحلة 4) — الطلباتُ المفتوحة بعمرها، والجارية، والمختصّون
 * بحضورهم من تطبيق «سباير برو»، والإسنادُ اليدويّ. البياناتُ كلُّها من `get_dispatch_board` (0070).
 */
export default async function DispatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin-login');
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isAdminRole(me?.role)) redirect('/dashboard');

  const { data, error } = await supabase.rpc('get_dispatch_board');
  const board = data as (Board & { ok: boolean; error?: string }) | null;

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>لوحة الإرسال الحيّة</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            الطلباتُ التي تنتظر مختصّاً، ومن يعمل الآن، والإسنادُ اليدويّ.
          </p>
        </div>
        <AutoRefresh intervalSeconds={20} label="تحديث كلّ 20 ثانية" />
      </header>
      {error || !board?.ok ? (
        <div role="alert" style={{ background: 'var(--rose-soft)', color: 'var(--rose)', borderRadius: 12, padding: 16, fontSize: 14 }}>
          {board?.error ?? 'تعذّر تحميل اللوحة.'}
          {error ? ' — هل طُبّق الترحيل 0070؟' : ''}
        </div>
      ) : (
        <DispatchBoard board={board} />
      )}
    </main>
  );
}

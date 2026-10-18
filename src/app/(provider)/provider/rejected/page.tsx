import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../../../(auth)/login/actions';

export const metadata = { title: 'لم يُعتمد الحساب · سباير ميديكال' };
export const dynamic = 'force-dynamic';

export default async function ProviderRejected() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase
    .from('users').select('approval_status, rejection_reason').eq('id', user.id).single();
  if (p?.approval_status !== 'rejected') redirect('/provider');

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-empty" style={{ marginTop: 64 }}>
          <h1 className="scr-empty-title">لم يُعتمد الحساب</h1>
          <p className="scr-empty-desc">{p?.rejection_reason || 'راسلنا لمعرفة السبب وإكمال ما ينقص.'}</p>
          <a className="pv-btn" href="https://wa.me/9647803993585" target="_blank" rel="noopener noreferrer">راسل الإدارة</a>
          <form action={signOut}>
            <button type="submit" className="pv-btn pv-btn-ghost">تسجيل الخروج</button>
          </form>
        </div>
      </div>
    </main>
  );
}

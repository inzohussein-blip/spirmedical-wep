import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../../../(auth)/login/actions';
import { PROVIDER_META, isProviderType } from '@/lib/providers';

export const metadata = { title: 'قيد المراجعة · سباير ميديكال' };
export const dynamic = 'force-dynamic';

export default async function ProviderPending() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase
    .from('users').select('full_name, clinic_name, provider_type, approval_status').eq('id', user.id).single();
  if (p?.approval_status === 'approved') redirect('/provider');
  if (p?.approval_status === 'rejected') redirect('/provider/rejected');
  const label = isProviderType(p?.provider_type) ? PROVIDER_META[p.provider_type].label : 'خدمة';

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-empty" style={{ marginTop: 64 }}>
          <h1 className="scr-empty-title">حسابُك قيد المراجعة</h1>
          <p className="scr-empty-desc">
            استلمنا تسجيلَ {p?.clinic_name || p?.full_name || 'منشأتك'} ({label}). تراجعه إدارةُ سباير ميديكال، وتصلك
            رسالةٌ عند الاعتماد.
          </p>
          <form action={signOut}>
            <button type="submit" className="pv-btn">تسجيل الخروج</button>
          </form>
        </div>
      </div>
    </main>
  );
}

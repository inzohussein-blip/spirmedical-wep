import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PrescriptionsClient from './PrescriptionsClient';

export const metadata = {
  title: 'وصفاتي · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

export default async function PrescriptionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('prescribed_at', { ascending: false });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">وصفاتي</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">كل وصفاتك الطبية في مكان واحد</p>

        <PrescriptionsClient prescriptions={prescriptions ?? []} />
      </div>
    </main>
  );
}

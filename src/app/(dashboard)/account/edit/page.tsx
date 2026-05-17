import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileClient from './EditProfileClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تعديل المعلومات · سباير ميديكال',
};

export default async function EditProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, governorate, email')
    .eq('id', user.id)
    .single();

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">تعديل المعلومات</h1>
          <div className="scr-page-spacer" />
        </div>

        <EditProfileClient
          initialFullName={profile?.full_name || ''}
          initialPhone={profile?.phone || ''}
          initialGovernorate={profile?.governorate || 'بغداد'}
          initialEmail={profile?.email || ''}
        />
      </div>
    </main>
  );
}

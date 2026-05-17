import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditSpecialistClient from './EditSpecialistClient';

export const metadata = {
  title: 'تعديل الملف · لوحة الاختصاصي',
};

export const dynamic = 'force-dynamic';

export default async function EditSpecialistPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, email, governorate, specialist_bio, specialist_years_exp')
    .eq('id', user.id)
    .single();

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist/account" className="scr-back-btn"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">تعديل الملف</h1>
          <div className="scr-page-spacer" />
        </div>

        <EditSpecialistClient
          initialFullName={profile?.full_name ?? ''}
          initialPhone={profile?.phone ?? ''}
          initialEmail={profile?.email ?? ''}
          initialGovernorate={profile?.governorate ?? 'بغداد'}
          initialBio={profile?.specialist_bio ?? ''}
          initialYearsExp={profile?.specialist_years_exp ?? null}
        />
      </div>
    </main>
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/admin-types';
import SeedManagerClient from './SeedManagerClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إدارة البيانات الأولية · إدارة',
};

export default async function SeedDataPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!isSuperAdmin(profile?.role)) {
    redirect('/admin');
  }

  return <SeedManagerClient />;
}

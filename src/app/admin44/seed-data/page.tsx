import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SeedManagerClient from './SeedManagerClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إدارة البيانات الأولية · إدارة',
};

export default async function SeedDataPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin44');
  }

  return <SeedManagerClient />;
}

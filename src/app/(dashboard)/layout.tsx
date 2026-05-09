import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../(auth)/login/actions';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // إذا الدور admin → الوصول إلى /admin مرفوض في wep app
  // (لوحة الإدارة منفصلة في CRM)
  // الـ admin يستخدم patient interface عند دخوله wep app
  const role = (profile?.role === 'specialist' ? 'specialist' : 'patient') as
    | 'patient'
    | 'specialist';

  return (
    <AppShell
      userName={profile?.full_name ?? 'مستخدم'}
      userRole={role}
      signOutAction={signOut}
      isGuest={false}
    >
      {children}
    </AppShell>
  );
}

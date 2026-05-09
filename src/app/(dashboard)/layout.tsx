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

  return (
    <AppShell
      userName={profile?.full_name ?? 'مستخدم'}
      userRole={profile?.role ?? 'patient'}
      signOutAction={signOut}
      isGuest={false}
    >
      <div className="container">
        {children}
      </div>

      <style>{`
        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px;
        }
        @media (max-width: 767px) {
          .container { padding: 16px; }
        }
      `}</style>
    </AppShell>
  );
}

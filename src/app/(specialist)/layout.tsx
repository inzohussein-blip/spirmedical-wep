import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../(auth)/login/actions';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

/**
 * Specialist Layout — نافذة المختص
 * يحمي الـ routes ويفرض role=specialist فقط
 */
export default async function SpecialistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // إذا الدور ليس specialist → حوّل لـ dashboard
  if (profile?.role !== 'specialist') {
    redirect('/dashboard');
  }

  return (
    <AppShell
      userName={profile?.full_name ?? 'أخصائي'}
      userRole="specialist"
      signOutAction={signOut}
      isGuest={false}
    >
      {children}
    </AppShell>
  );
}

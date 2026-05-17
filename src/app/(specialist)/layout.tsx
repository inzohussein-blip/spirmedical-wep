import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../(auth)/login/actions';
import { AppShell } from '@/components/layout/AppShell';
import NotificationToast from '@/components/notifications/NotificationToast';
import PushPermissionPrompt from '@/components/notifications/PushPermissionPrompt';
import PinGate from '@/components/security/PinGate';
import type { UserSettings } from '@/lib/services/user-settings-types';

export const dynamic = 'force-dynamic';

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
    .select('full_name, role, approval_status, user_settings')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'specialist') {
    redirect('/dashboard');
  }

  const settings = (profile?.user_settings ?? {}) as UserSettings;
  const pinEnabled = settings.pin_enabled === true && !!settings.pin_hash;

  return (
    <PinGate pinEnabled={pinEnabled}>
      <AppShell
        userName={profile?.full_name ?? 'أخصائي'}
        userRole="specialist"
        signOutAction={signOut}
        isGuest={false}
      >
        {children}
      </AppShell>
      <NotificationToast userId={user.id} userRole="specialist" />
      <PushPermissionPrompt />
    </PinGate>
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DEFAULT_SETTINGS, type UserSettings } from '@/lib/services/user-settings-types';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الإعدادات · سباير ميديكال',
};

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('user_settings, full_name, phone')
    .eq('id', user.id)
    .single();

  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...((profile?.user_settings ?? {}) as UserSettings),
  };

  const pinEnabled = settings.pin_enabled === true && !!settings.pin_hash;

  return (
    <SettingsClient
      initial={settings}
      pinEnabled={pinEnabled}
      userId={user.id}
      userEmail={user.email || ''}
      userName={profile?.full_name || profile?.phone || 'مستخدم'}
    />
  );
}

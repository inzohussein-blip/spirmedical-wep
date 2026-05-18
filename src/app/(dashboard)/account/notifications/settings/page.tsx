import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationSettingsClient from './NotificationSettingsClient';
import { getActiveSubscriptions, getNotificationPreferences } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إعدادات الإشعارات · Spir Medical',
};

export default async function NotificationSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/notifications/settings');
  }

  const [subscriptions, preferences] = await Promise.all([
    getActiveSubscriptions(),
    getNotificationPreferences(),
  ]);

  return (
    <NotificationSettingsClient
      initialSubscriptions={subscriptions}
      initialPreferences={preferences}
    />
  );
}

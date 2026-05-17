import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DEFAULT_SETTINGS, type UserSettings } from '@/lib/services/user-settings-types';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إعدادات الإشعارات · سباير ميديكال',
};

export default async function NotificationsSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('user_settings')
    .eq('id', user.id)
    .single();

  const settings = (profile?.user_settings ?? {}) as UserSettings;
  const initial = {
    ...DEFAULT_SETTINGS.notifications!,
    ...(settings.notifications ?? {}),
  };

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">إعدادات الإشعارات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">تحكّم بما يصلك من تنبيهات</p>

        <NotificationsClient initial={initial} />
      </div>
    </main>
  );
}

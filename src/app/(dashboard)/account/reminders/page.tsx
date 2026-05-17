import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RemindersClient from './RemindersClient';

export const metadata = {
  title: 'التنبيهات والمواعيد · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

export default async function RemindersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">التنبيهات والمواعيد</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">لا تنسَ دوائك ومواعيدك</p>

        <RemindersClient reminders={reminders ?? []} />
      </div>
    </main>
  );
}

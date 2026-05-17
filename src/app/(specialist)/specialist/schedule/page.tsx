import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ScheduleClient from './ScheduleClient';

export const metadata = {
  title: 'جدول الدوام · لوحة الاختصاصي',
};

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: schedules }] = await Promise.all([
    supabase.from('users').select('auto_reply_message').eq('id', user.id).single(),
    supabase.from('specialist_schedules').select('*').eq('specialist_id', user.id).order('day_of_week'),
  ]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">جدول الدوام</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">حدّد أوقات استقبال الطلبات</p>

        <ScheduleClient
          initialSchedules={schedules ?? []}
          initialAutoReply={profile?.auto_reply_message ?? ''}
        />
      </div>
    </main>
  );
}

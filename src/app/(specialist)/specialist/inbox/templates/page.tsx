import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TemplatesClient from './TemplatesClient';

export const metadata = {
  title: 'قوالب الردود · لوحة الاختصاصي',
};

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: templates } = await supabase
    .from('quick_replies')
    .select('id, shortcut, content, category, use_count')
    .eq('specialist_id', user.id)
    .eq('is_active', true)
    .order('use_count', { ascending: false });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist/inbox" className="scr-back-btn"><span aria-hidden="true">→</span></Link>
          <h1 className="scr-page-title">قوالب الردود</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">ردود سريعة لتسريع المحادثات</p>

        <TemplatesClient templates={templates ?? []} />
      </div>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MarkRead from './MarkRead';

export const metadata = {
  title: 'الإشعارات · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

/**
 * 🔔 صندوقُ الإشعارات داخل التطبيق.
 *
 * كان جدولُ `notifications` يُكتب ولا يُعرض: الجرسُ يذهب إلى الإعدادات.
 * وهو القناةُ التي لا تتعطّل حين يُرفض توكنُ واتساب أو يغيب اشتراكُ الدفع —
 * إشعارُ إلغاء الطلب و«الخدمة متاحةٌ الآن» يصلان هنا دائماً.
 */
export default async function InboxPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('notifications')
    .select('id, title, body, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const items = data ?? [];
  const hasUnread = items.some((n) => !n.is_read);
  const fmt = new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">الإشعارات</h1>
          <Link href="/account/notifications" className="scr-back-btn" aria-label="إعدادات الإشعارات">
            <span aria-hidden="true">⚙</span>
          </Link>
        </div>

        <MarkRead hasUnread={hasUnread} />

        {items.length === 0 ? (
          <div className="scr-empty">
            <div className="scr-empty-icon" aria-hidden="true">🔔</div>
            <p className="scr-empty-title">لا إشعاراتَ بعد</p>
            <p className="scr-empty-desc">ستجد هنا تحديثاتِ طلباتك وتنبيهاتِ الخدمات.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 10 }}>
            {items.map((n) => {
              const inner = (
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{n.title}</div>
                  {n.body && (
                    <p style={{ margin: '2px 0 6px', fontSize: 13, lineHeight: 1.7, color: 'var(--ink-2)' }}>{n.body}</p>
                  )}
                  <time dateTime={n.created_at} style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {fmt.format(new Date(n.created_at))}
                  </time>
                </div>
              );
              const cls = `scr-list-item${n.is_read ? '' : ' scr-list-item-unread'}`;
              return (
                <li key={n.id}>
                  {n.link && /^\/(?!\/)/.test(n.link) ? (
                    <Link href={n.link} className={`${cls} scr-list-item-clickable`}>{inner}</Link>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

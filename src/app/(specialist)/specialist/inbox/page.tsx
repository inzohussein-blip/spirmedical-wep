import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ChatList, { type ChatPreview } from '@/components/chat/ChatList';
import { Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الـ Inbox · لوحة الأخصائي',
};

export default async function SpecialistInboxPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // جلب المحادثات
  const { data: chatsRaw } = await supabase
    .from('chats')
    .select('*')
    .eq('specialist_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('last_message_at', { ascending: false });

  // جلب معلومات المرضى
  const patientIds = (chatsRaw || []).map((c) => c.patient_id);
  const { data: patients } = patientIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name, governorate')
        .in('id', patientIds)
    : { data: [] };

  const patientsMap = new Map((patients || []).map((p) => [p.id, p]));

  const chats: ChatPreview[] = (chatsRaw || []).map((c) => {
    const patient = patientsMap.get(c.patient_id);
    const name = patient?.full_name || 'مريض';
    return {
      id: c.id,
      participantName: name,
      participantInitial: name.charAt(0),
      participantRole: patient?.governorate || 'مريض',
      lastMessage: c.last_message || 'لا رسائل بعد',
      lastMessageAt: c.last_message_at || c.created_at,
      unreadCount: c.specialist_unread_count || 0,
      status: c.status,
      priority: c.priority || 'normal',
      tags: c.tags || [],
      isPinned: c.is_pinned || false,
      isOnline: false, // سيُحدّث realtime
    };
  });

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);
  const urgentCount = chats.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
  const pendingCount = chats.filter(c => c.status === 'pending').length;

  return (
    <main className="app-screen">
      <div className="scr-content inbox-container">

        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">
            الـ Inbox
            {totalUnread > 0 && (
              <span className="inbox-header-badge">{totalUnread}</span>
            )}
          </h1>
          <Link
            href="/specialist/inbox/templates"
            className="scr-back-btn"
            aria-label="القوالب"
            style={{ background: 'transparent' }}
          >
            <Zap size={18} strokeWidth={2.2} aria-hidden />
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="inbox-stats-bar">
          <div className="inbox-stat">
            <div className="inbox-stat-value">{chats.length}</div>
            <div className="inbox-stat-label">إجمالي</div>
          </div>
          <div className="inbox-stat">
            <div className="inbox-stat-value emerald">{totalUnread}</div>
            <div className="inbox-stat-label">غير مقروء</div>
          </div>
          <div className="inbox-stat">
            <div className="inbox-stat-value rose">{urgentCount}</div>
            <div className="inbox-stat-label">عاجل</div>
          </div>
          <div className="inbox-stat">
            <div className="inbox-stat-value amber">{pendingCount}</div>
            <div className="inbox-stat-label">بانتظار</div>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">✉</div>
            <h2 className="scr-empty-title">ابدأ محادثاتك</h2>
            <p className="scr-empty-desc">
              عند قبول طلب من مريض، ستظهر المحادثة هنا.
              يمكنك الرد على الاستفسارات وإرسال صور وملفات.
            </p>
            <Link href="/specialist/orders?filter=pending" className="scr-empty-cta">
              عرض الطلبات الجديدة ←
            </Link>
          </div>
        ) : (
          <ChatList
            initialChats={chats}
            basePath="/specialist/inbox"
            viewerRole="specialist"
            viewerId={user.id}
          />
        )}

      </div>
    </main>
  );
}

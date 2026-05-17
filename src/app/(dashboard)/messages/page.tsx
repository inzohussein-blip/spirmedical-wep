import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ChatList, { type ChatPreview } from '@/components/chat/ChatList';
import { MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الرسائل · سباير ميديكال',
};

export default async function PatientMessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // جلب المحادثات
  const { data: chatsRaw } = await supabase
    .from('chats')
    .select('*')
    .eq('patient_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('last_message_at', { ascending: false });

  // جلب معلومات الأخصائيين
  const specialistIds = (chatsRaw || []).map((c) => c.specialist_id);
  const { data: specialists } = specialistIds.length > 0
    ? await supabase
        .from('users')
        .select('id, full_name')
        .in('id', specialistIds)
    : { data: [] };

  const specsMap = new Map((specialists || []).map((s) => [s.id, s]));

  const chats: ChatPreview[] = (chatsRaw || []).map((c) => {
    const spec = specsMap.get(c.specialist_id);
    const name = spec ? `د. ${spec.full_name}` : 'طبيب';
    return {
      id: c.id,
      participantName: name,
      participantInitial: name.replace('د. ', '').charAt(0),
      participantRole: 'أخصائي',
      lastMessage: c.last_message || 'لا رسائل بعد',
      lastMessageAt: c.last_message_at || c.created_at,
      unreadCount: c.patient_unread_count || 0,
      status: c.status,
      priority: c.priority || 'normal',
      tags: c.tags || [],
      isPinned: c.is_pinned || false,
      isOnline: false,
    };
  });

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <main className="app-screen">
      <div className="scr-content inbox-container">

        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">
            رسائلي
            {totalUnread > 0 && <span className="inbox-header-badge">{totalUnread}</span>}
          </h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          محادثاتك مع الأطباء · رسائل مشفّرة
        </p>

        {chats.length === 0 ? (
          <div className="scr-empty">
            <div className="scr-empty-icon" aria-hidden="true">
              <MessageCircle size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد محادثات</h2>
            <p className="scr-empty-desc">احجز موعداً وابدأ محادثة مع طبيبك</p>
            <Link href="/services/consultation" className="scr-empty-cta">
              ابحث عن طبيب ←
            </Link>
          </div>
        ) : (
          <ChatList
            initialChats={chats}
            basePath="/messages"
            viewerRole="patient"
            viewerId={user.id}
          />
        )}

      </div>
    </main>
  );
}

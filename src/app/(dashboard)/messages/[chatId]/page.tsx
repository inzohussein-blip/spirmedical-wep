import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ChatWindow, { type Message, type ChatParticipant } from '@/components/chat/ChatWindow';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'محادثة · سباير ميديكال',
};

export default async function PatientChatDetailPage({ params }: { params: { chatId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('id', params.chatId)
    .eq('patient_id', user.id)
    .single();

  if (!chat) {
    notFound();
  }

  // معلومات الأخصائي
  const { data: specialist } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', chat.specialist_id)
    .single();

  // الرسائل
  const { data: messagesRaw } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', params.chatId)
    .order('created_at', { ascending: true })
    .limit(100);

  const specName = specialist ? `د. ${specialist.full_name}` : 'الطبيب';
  const participant: ChatParticipant = {
    id: chat.specialist_id,
    name: specName,
    initial: specName.replace('د. ', '').charAt(0),
    role: 'أخصائي',
    isOnline: false,
  };

  const messages: Message[] = (messagesRaw || []).map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    type: m.type,
    content: m.content,
    attachmentUrl: m.attachment_url,
    attachmentName: m.attachment_name,
    isRead: m.is_read,
    createdAt: m.created_at,
    isEdited: m.is_edited,
  }));

  return (
    <main className="app-screen">
      <ChatWindow
        chatId={params.chatId}
        participant={participant}
        initialMessages={messages}
        viewerId={user.id}
        viewerRole="patient"
        backUrl="/messages"
      />
    </main>
  );
}

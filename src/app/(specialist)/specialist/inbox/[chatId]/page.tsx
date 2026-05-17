import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ChatWindow, { type Message, type ChatParticipant } from '@/components/chat/ChatWindow';
import {
  Phone, MapPin, Tag, Calendar, ClipboardList, FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'محادثة · لوحة الأخصائي',
};

export default async function SpecialistChatDetailPage({ params }: { params: { chatId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // جلب المحادثة
  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('id', params.chatId)
    .eq('specialist_id', user.id)
    .single();

  if (!chat) {
    notFound();
  }

  // جلب معلومات المريض
  const { data: patient } = await supabase
    .from('users')
    .select('id, full_name, phone, governorate')
    .eq('id', chat.patient_id)
    .single();

  // جلب الرسائل
  const { data: messagesRaw } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', params.chatId)
    .order('created_at', { ascending: true })
    .limit(100);

  // جلب القوالب الجاهزة
  const { data: quickRepliesRaw } = await supabase
    .from('quick_replies')
    .select('id, content')
    .eq('specialist_id', user.id)
    .eq('is_active', true)
    .order('use_count', { ascending: false })
    .limit(10);

  const patientName = patient?.full_name || 'مريض';
  const participant: ChatParticipant = {
    id: chat.patient_id,
    name: patientName,
    initial: patientName.charAt(0),
    role: patient?.governorate || 'مريض',
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

  const quickReplies = (quickRepliesRaw || []).map((q) => ({
    id: q.id,
    content: q.content,
  }));

  return (
    <main className="app-screen">
      <div className="chat-page-wrap">
        <ChatWindow
          chatId={params.chatId}
          participant={participant}
          initialMessages={messages}
          viewerId={user.id}
          viewerRole="specialist"
          backUrl="/specialist/inbox"
          quickReplies={quickReplies}
        />

        {/* Patient Info Side Panel */}
        <aside className="chat-patient-panel">
          <div className="chat-patient-header">
            <div className="chat-patient-avatar-big">{patientName.charAt(0)}</div>
            <div className="chat-patient-name">{patientName}</div>
            <div className="chat-patient-meta">
              مريض
            </div>
          </div>

          <div className="chat-patient-section">
            <div className="chat-patient-section-title">معلومات الاتصال</div>
            <div className="chat-patient-row">
              <Phone size={14} strokeWidth={2.2} aria-hidden />
              <span>{patient?.phone || 'غير متوفر'}</span>
            </div>
            {patient?.governorate && (
              <div className="chat-patient-row">
                <MapPin size={14} strokeWidth={2.2} aria-hidden />
                <span>{patient.governorate}</span>
              </div>
            )}
          </div>

          {chat.tags && chat.tags.length > 0 && (
            <div className="chat-patient-section">
              <div className="chat-patient-section-title">التصنيف</div>
              {chat.tags.map((tag, i) => (
                <div key={i} className="chat-patient-tag emerald">
                  <Tag size={12} strokeWidth={2.2} aria-hidden />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          )}

          <div className="chat-patient-actions">
            <button type="button" className="chat-patient-action primary">
              <Calendar size={14} strokeWidth={2.2} aria-hidden />
              <span>حجز موعد</span>
            </button>
            <button type="button" className="chat-patient-action">
              <ClipboardList size={14} strokeWidth={2.2} aria-hidden />
              <span>السجل الطبي</span>
            </button>
            <button type="button" className="chat-patient-action">
              <FileText size={14} strokeWidth={2.2} aria-hidden />
              <span>إضافة ملاحظة</span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

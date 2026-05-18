'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, markChatAsRead } from '@/app/(specialist)/specialist/inbox/actions';
import { toast } from '@/components/ui/Toaster';
import {
  Phone, Video, MoreVertical, MessageCircle, Image as ImageIcon,
  Paperclip, Mic, MapPin, Plus, X, FileText, Send, Loader2, Zap,
} from 'lucide-react';

export interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  content: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isRead: boolean;
  createdAt: string;
  isEdited?: boolean;
  replyToId?: string | null;
}

export interface ChatParticipant {
  id: string;
  name: string;
  initial: string;
  role?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatWindowProps {
  chatId: string;
  participant: ChatParticipant;
  initialMessages: Message[];
  viewerId: string;
  viewerRole: 'patient' | 'specialist';
  backUrl: string;
  quickReplies?: { id: string; content: string }[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'اليوم';
  if (date.toDateString() === yesterday.toDateString()) return 'أمس';
  return date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChatWindow({
  chatId,
  participant,
  initialMessages,
  viewerId,
  viewerRole,
  backUrl,
  quickReplies = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read on mount
  useEffect(() => {
    markChatAsRead(chatId);
  }, [chatId]);

  // 🔴 Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string;
            sender_id: string;
            type: string;
            content: string;
            attachment_url?: string;
            attachment_name?: string;
            is_read: boolean;
            created_at: string;
          };
          // تجاهل رسائل المرسل نفسه (تم إضافتها optimistically)
          if (newMsg.sender_id === viewerId) return;

          setMessages(prev => [...prev, {
            id: newMsg.id,
            senderId: newMsg.sender_id,
            type: newMsg.type as Message['type'],
            content: newMsg.content,
            attachmentUrl: newMsg.attachment_url,
            attachmentName: newMsg.attachment_name,
            isRead: newMsg.is_read,
            createdAt: newMsg.created_at,
          }]);

          // مارك as read فوراً
          markChatAsRead(chatId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, viewerId]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: viewerId,
      type: 'text',
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputValue('');

    startTransition(async () => {
      const result = await sendMessage(chatId, text);
      if (result.error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        toast.error(`خطأ: ${result.error}`);
      } else if (result.message) {
        // Replace optimistic with real message
        setMessages(prev => prev.map(m =>
          m.id === optimisticMsg.id
            ? {
                id: result.message!.id,
                senderId: result.message!.sender_id,
                type: 'text',
                content: result.message!.content,
                isRead: result.message!.is_read,
                createdAt: result.message!.created_at,
              }
            : m
        ));
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyQuickReply = (content: string) => {
    setInputValue(content);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  // تجميع حسب التاريخ
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  messages.forEach(msg => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <Link href={backUrl} className="chat-back-btn" aria-label="العودة">
          <span aria-hidden="true">→</span>
        </Link>

        <div className="chat-header-avatar">
          {participant.initial}
          {participant.isOnline && <span className="chat-online-dot" aria-hidden="true"></span>}
        </div>

        <div className="chat-header-info">
          <div className="chat-header-name">{participant.name}</div>
          <div className="chat-header-status">
            {participant.isOnline ? (
              <>
                <span className="chat-status-online">●</span> متصل الآن
              </>
            ) : participant.lastSeen ? (
              `آخر ظهور: ${participant.lastSeen}`
            ) : (
              participant.role || ''
            )}
          </div>
        </div>

        <div className="chat-header-actions">
          <button type="button" className="chat-icon-btn" aria-label="اتصال">
            <Phone size={18} strokeWidth={2.2} aria-hidden />
          </button>
          <button type="button" className="chat-icon-btn" aria-label="فيديو">
            <Video size={18} strokeWidth={2.2} aria-hidden />
          </button>
          <button type="button" className="chat-icon-btn" aria-label="المزيد">
            <MoreVertical size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">
              <MessageCircle size={42} strokeWidth={1.5} />
            </div>
            <h3>ابدأ المحادثة</h3>
            <p>أرسل رسالة لـ {participant.name}</p>
          </div>
        ) : (
          groupedMessages.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="chat-date-divider">
                <span>{group.date}</span>
              </div>
              {group.messages.map(msg => {
                const isMine = msg.senderId === viewerId;
                const isSystem = msg.type === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="chat-system-msg">
                      <span>{msg.content}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`chat-msg-wrap ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && (
                      <div className="chat-msg-avatar">{participant.initial}</div>
                    )}
                    <div className="chat-msg-bubble-wrap">
                      <div className={`chat-msg-bubble ${msg.type}`}>
                        {msg.type === 'image' && msg.attachmentUrl && (
                          <div className="chat-msg-image" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ImageIcon size={14} strokeWidth={2.2} aria-hidden />
                            <span>صورة</span>
                          </div>
                        )}
                        {msg.type === 'file' && (
                          <div className="chat-msg-file">
                            <FileText size={14} strokeWidth={2.2} aria-hidden />
                            <span>{msg.attachmentName || 'ملف'}</span>
                          </div>
                        )}
                        {msg.type === 'audio' && (
                          <div className="chat-msg-audio">
                            <Mic size={14} strokeWidth={2.2} aria-hidden />
                            <span>رسالة صوتية</span>
                          </div>
                        )}
                        {msg.content && <div className="chat-msg-text">{msg.content}</div>}
                        <div className="chat-msg-meta">
                          <span>{formatTime(msg.createdAt)}</span>
                          {msg.isEdited && <span className="chat-msg-edited">معدّلة</span>}
                          {isMine && (
                            <span className={`chat-msg-read ${msg.isRead ? 'read' : ''}`}>
                              {msg.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {viewerRole === 'specialist' && showQuickReplies && quickReplies.length > 0 && (
        <div className="chat-quick-replies">
          <div className="chat-quick-replies-head">
            <span>قوالب جاهزة</span>
            <button type="button" onClick={() => setShowQuickReplies(false)} aria-label="إغلاق">×</button>
          </div>
          <div className="chat-quick-replies-list">
            {quickReplies.map(qr => (
              <button
                key={qr.id}
                type="button"
                onClick={() => applyQuickReply(qr.content)}
                className="chat-quick-reply"
              >
                {qr.content}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attach Menu */}
      {showAttachMenu && (
        <div className="chat-attach-menu">
          <button type="button" className="chat-attach-option" onClick={() => toast.info('رفع صورة قيد التطوير')}>
            <ImageIcon size={18} strokeWidth={2.2} aria-hidden />
            <span>صورة</span>
          </button>
          <button type="button" className="chat-attach-option" onClick={() => toast.info('رفع ملف قيد التطوير')}>
            <Paperclip size={18} strokeWidth={2.2} aria-hidden />
            <span>ملف</span>
          </button>
          <button type="button" className="chat-attach-option" onClick={() => toast.info('تسجيل صوتي قيد التطوير')}>
            <Mic size={18} strokeWidth={2.2} aria-hidden />
            <span>صوت</span>
          </button>
          <button type="button" className="chat-attach-option" onClick={() => toast.info('الموقع قيد التطوير')}>
            <MapPin size={18} strokeWidth={2.2} aria-hidden />
            <span>الموقع</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-bar">
        <button
          type="button"
          className="chat-icon-btn"
          aria-label="إرفاق"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
        >
          {showAttachMenu ? <X size={18} strokeWidth={2.2} /> : <Plus size={18} strokeWidth={2.2} />}
        </button>

        {viewerRole === 'specialist' && quickReplies.length > 0 && (
          <button
            type="button"
            className="chat-icon-btn"
            aria-label="قوالب"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <Zap size={18} strokeWidth={2.2} aria-hidden />
          </button>
        )}

        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="اكتب رسالة..."
          className="chat-input"
          rows={1}
          disabled={isPending}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim() || isPending}
          className="chat-send-btn"
          aria-label="إرسال"
        >
          {isPending ? (
            <Loader2 size={18} strokeWidth={2.2} style={{ animation: 'spin-smooth 1s linear infinite' }} />
          ) : inputValue.trim() ? (
            <Send size={18} strokeWidth={2.2} />
          ) : (
            <Mic size={18} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </div>
  );
}

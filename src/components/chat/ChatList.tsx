'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LucideIcon } from 'lucide-react';
import {
  Inbox, Circle, MessageCircle, Clock, CheckCircle2, AlertTriangle, Pin,
} from 'lucide-react';

export interface ChatPreview {
  id: string;
  participantName: string;
  participantInitial: string;
  participantRole?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'open' | 'pending' | 'resolved' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  isPinned: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
}

interface ChatListProps {
  initialChats: ChatPreview[];
  currentChatId?: string;
  basePath: string;
  viewerRole: 'patient' | 'specialist';
  viewerId: string;
}

type FilterId = 'all' | 'unread' | 'open' | 'pending' | 'resolved' | 'urgent';

const FILTERS: Array<{ id: FilterId; label: string; icon: LucideIcon }> = [
  { id: 'all',      label: 'الكل',        icon: Inbox },
  { id: 'unread',   label: 'غير مقروء',   icon: Circle },
  { id: 'open',     label: 'مفتوحة',      icon: MessageCircle },
  { id: 'pending',  label: 'بانتظار رد',  icon: Clock },
  { id: 'resolved', label: 'محلولة',      icon: CheckCircle2 },
  { id: 'urgent',   label: 'عاجل',        icon: AlertTriangle },
];

const STATUS_COLORS: Record<string, string> = {
  open: '#0E5C4D',
  pending: '#B8540C',
  resolved: '#888780',
  archived: '#444441',
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `${diffMin}د`;
  if (diffHour < 24) return `${diffHour}س`;
  if (diffDay < 7) return `${diffDay}ي`;
  return date.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' });
}

export default function ChatList({ initialChats, currentChatId, basePath, viewerRole, viewerId }: ChatListProps) {
  const [chats, setChats] = useState<ChatPreview[]>(initialChats);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  // 🔴 Realtime - استمع لتحديثات chats
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('chats-list')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            last_message?: string;
            last_message_at?: string;
            patient_unread_count?: number;
            specialist_unread_count?: number;
            status?: string;
            is_pinned?: boolean;
            priority?: string;
          };

          setChats(prev => prev.map(c =>
            c.id === updated.id
              ? {
                  ...c,
                  lastMessage: updated.last_message || c.lastMessage,
                  lastMessageAt: updated.last_message_at || c.lastMessageAt,
                  unreadCount: viewerRole === 'patient'
                    ? (updated.patient_unread_count ?? c.unreadCount)
                    : (updated.specialist_unread_count ?? c.unreadCount),
                  status: (updated.status as ChatPreview['status']) || c.status,
                  isPinned: updated.is_pinned ?? c.isPinned,
                  priority: (updated.priority as ChatPreview['priority']) || c.priority,
                }
              : c
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerRole, viewerId]);

  const filteredChats = useMemo(() => {
    let filtered = chats;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter !== 'all') {
      if (activeFilter === 'unread') {
        filtered = filtered.filter(c => c.unreadCount > 0);
      } else if (activeFilter === 'urgent') {
        filtered = filtered.filter(c => c.priority === 'urgent' || c.priority === 'high');
      } else {
        filtered = filtered.filter(c => c.status === activeFilter);
      }
    }

    return [...filtered].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [chats, searchQuery, activeFilter]);

  const counts = useMemo(() => ({
    all: chats.length,
    unread: chats.filter(c => c.unreadCount > 0).length,
    open: chats.filter(c => c.status === 'open').length,
    pending: chats.filter(c => c.status === 'pending').length,
    resolved: chats.filter(c => c.status === 'resolved').length,
    urgent: chats.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
  }), [chats]);

  return (
    <div className="inbox-list">
      {/* Search */}
      <div className="inbox-search">
        <span className="inbox-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="ابحث في المحادثات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inbox-search-clear"
            aria-label="مسح"
          >
            ×
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="inbox-filters">
        {FILTERS.map(f => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`inbox-filter ${activeFilter === f.id ? 'active' : ''}`}
            >
              <Icon size={13} strokeWidth={2.2} aria-hidden />
              <span>{f.label}</span>
              {counts[f.id] > 0 && (
                <span className="inbox-filter-count">{counts[f.id]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chats list */}
      <div className="inbox-chats">
        {filteredChats.length === 0 ? (
          <div className="inbox-empty">
            <div className="inbox-empty-icon" aria-hidden="true">
              <MessageCircle size={42} strokeWidth={1.5} />
            </div>
            <p>{searchQuery ? 'لا نتائج' : 'لا توجد محادثات'}</p>
          </div>
        ) : (
          filteredChats.map(chat => (
            <Link
              key={chat.id}
              href={`${basePath}/${chat.id}`}
              className={`inbox-chat ${currentChatId === chat.id ? 'active' : ''} ${chat.unreadCount > 0 ? 'unread' : ''}`}
            >
              <div className="inbox-chat-avatar">
                <div className="inbox-chat-avatar-circle">
                  {chat.participantInitial}
                </div>
                {chat.isOnline && <span className="inbox-chat-online" aria-hidden="true"></span>}
              </div>

              <div className="inbox-chat-content">
                <div className="inbox-chat-top">
                  <div className="inbox-chat-name">
                    {chat.isPinned && (
                      <span className="inbox-chat-pin" aria-hidden="true" style={{ display: 'inline-flex', verticalAlign: '-2px', marginLeft: 2 }}>
                        <Pin size={12} strokeWidth={2.4} fill="currentColor" />
                      </span>
                    )}
                    {chat.participantName}
                  </div>
                  <div className="inbox-chat-time">
                    {formatRelativeTime(chat.lastMessageAt)}
                  </div>
                </div>

                {chat.participantRole && viewerRole === 'specialist' && (
                  <div className="inbox-chat-role">{chat.participantRole}</div>
                )}

                <div className="inbox-chat-middle">
                  <div className="inbox-chat-preview">
                    {chat.isTyping ? (
                      <span className="inbox-chat-typing">يكتب الآن<span>.</span><span>.</span><span>.</span></span>
                    ) : (
                      chat.lastMessage
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="inbox-chat-unread">{chat.unreadCount}</span>
                  )}
                </div>

                {(chat.tags.length > 0 || chat.priority !== 'normal') && (
                  <div className="inbox-chat-tags">
                    {chat.priority === 'urgent' && (
                      <span className="inbox-tag urgent">
                        <AlertTriangle size={11} strokeWidth={2.4} aria-hidden />
                        <span>عاجل</span>
                      </span>
                    )}
                    {chat.priority === 'high' && (
                      <span className="inbox-tag high">
                        <AlertTriangle size={11} strokeWidth={2.4} aria-hidden />
                        <span>مهم</span>
                      </span>
                    )}
                    {chat.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="inbox-tag">{tag}</span>
                    ))}
                    {chat.tags.length > 2 && (
                      <span className="inbox-tag">+{chat.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>

              <div
                className="inbox-chat-status"
                style={{ background: STATUS_COLORS[chat.status] }}
                aria-label={`الحالة: ${chat.status}`}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

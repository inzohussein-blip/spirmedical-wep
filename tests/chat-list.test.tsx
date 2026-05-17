/**
 * Tests for ChatList component (Inbox)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ChatList, { type ChatPreview } from '@/components/chat/ChatList';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: jest.fn(),
  }),
}));

const mockChats: ChatPreview[] = [
  {
    id: 'chat1',
    participantName: 'أحمد محمد',
    participantInitial: 'أ',
    lastMessage: 'مرحباً دكتور',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
    status: 'open',
    priority: 'normal',
    tags: [],
    isPinned: false,
  },
  {
    id: 'chat2',
    participantName: 'فاطمة علي',
    participantInitial: 'ف',
    lastMessage: 'شكراً',
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
    status: 'resolved',
    priority: 'normal',
    tags: [],
    isPinned: false,
  },
  {
    id: 'chat3',
    participantName: 'علي حسن',
    participantInitial: 'ع',
    lastMessage: 'حالة عاجلة',
    lastMessageAt: new Date(Date.now() - 60000).toISOString(),
    unreadCount: 5,
    status: 'open',
    priority: 'urgent',
    tags: ['عاجل'],
    isPinned: true,
  },
];

describe('ChatList', () => {
  it('renders all chats', () => {
    render(
      <ChatList
        initialChats={mockChats}
        basePath="/specialist/inbox"
        viewerRole="specialist"
        viewerId="user1"
      />
    );

    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
    expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
    expect(screen.getByText('علي حسن')).toBeInTheDocument();
  });

  it('shows unread count', () => {
    render(
      <ChatList
        initialChats={mockChats}
        basePath="/specialist/inbox"
        viewerRole="specialist"
        viewerId="user1"
      />
    );

    // قد تظهر العداد في filter pill أيضاً، لذا نستخدم getAllByText
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  it('shows urgent priority tag', () => {
    render(
      <ChatList
        initialChats={mockChats}
        basePath="/specialist/inbox"
        viewerRole="specialist"
        viewerId="user1"
      />
    );

    expect(screen.getAllByText(/عاجل/).length).toBeGreaterThan(0);
  });

  it('filters chats by search query', () => {
    render(
      <ChatList
        initialChats={mockChats}
        basePath="/specialist/inbox"
        viewerRole="specialist"
        viewerId="user1"
      />
    );

    const searchInput = screen.getByPlaceholderText(/ابحث/);
    fireEvent.change(searchInput, { target: { value: 'فاطمة' } });

    expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
    expect(screen.queryByText('أحمد محمد')).not.toBeInTheDocument();
  });

  it('shows empty state when no chats', () => {
    render(
      <ChatList
        initialChats={[]}
        basePath="/messages"
        viewerRole="patient"
        viewerId="user1"
      />
    );

    expect(screen.getByText(/لا توجد محادثات/)).toBeInTheDocument();
  });

  it('pinned chats come first', () => {
    render(
      <ChatList
        initialChats={mockChats}
        basePath="/specialist/inbox"
        viewerRole="specialist"
        viewerId="user1"
      />
    );

    const links = screen.getAllByRole('link');
    // علي حسن (pinned) يجب أن يكون أولاً
    expect(links[0].textContent).toContain('علي حسن');
  });

  it('shows filter pills', () => {
    render(
      <ChatList
        initialChats={mockChats}
        basePath="/specialist/inbox"
        viewerRole="specialist"
        viewerId="user1"
      />
    );

    expect(screen.getByText(/^الكل$/)).toBeInTheDocument();
    expect(screen.getByText(/غير مقروء/)).toBeInTheDocument();
    expect(screen.getByText(/مفتوحة/)).toBeInTheDocument();
  });
});

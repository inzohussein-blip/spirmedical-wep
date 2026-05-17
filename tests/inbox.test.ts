/**
 * Tests for Inbox business logic
 */

describe('Inbox', () => {
  describe('Chat sorting', () => {
    interface Chat {
      id: string;
      isPinned: boolean;
      lastMessageAt: string;
    }

    const sortChats = (chats: Chat[]): Chat[] => {
      return [...chats].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    };

    it('pinned chats come first', () => {
      const chats: Chat[] = [
        { id: '1', isPinned: false, lastMessageAt: '2026-05-11T12:00:00Z' },
        { id: '2', isPinned: true, lastMessageAt: '2026-05-11T10:00:00Z' },
        { id: '3', isPinned: false, lastMessageAt: '2026-05-11T11:00:00Z' },
      ];

      const sorted = sortChats(chats);
      expect(sorted[0].id).toBe('2'); // pinned أولاً
    });

    it('sorts by latest message within same pin status', () => {
      const chats: Chat[] = [
        { id: '1', isPinned: false, lastMessageAt: '2026-05-11T10:00:00Z' },
        { id: '2', isPinned: false, lastMessageAt: '2026-05-11T12:00:00Z' },
        { id: '3', isPinned: false, lastMessageAt: '2026-05-11T11:00:00Z' },
      ];

      const sorted = sortChats(chats);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('Time formatting', () => {
    const formatRelativeTime = (iso: string): string => {
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
    };

    it('returns "الآن" for recent', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('الآن');
    });

    it('returns minutes for less than hour', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(formatRelativeTime(fiveMinAgo)).toBe('5د');
    });

    it('returns hours for less than day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe('3س');
    });

    it('returns days for less than week', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(formatRelativeTime(twoDaysAgo)).toBe('2ي');
    });
  });

  describe('Filter logic', () => {
    interface Chat {
      status: 'open' | 'pending' | 'resolved' | 'archived';
      unreadCount: number;
      priority: 'low' | 'normal' | 'high' | 'urgent';
    }

    const filterChats = (chats: Chat[], filter: string): Chat[] => {
      if (filter === 'all') return chats;
      if (filter === 'unread') return chats.filter(c => c.unreadCount > 0);
      if (filter === 'urgent') return chats.filter(c => c.priority === 'urgent' || c.priority === 'high');
      return chats.filter(c => c.status === filter);
    };

    const sampleChats: Chat[] = [
      { status: 'open', unreadCount: 2, priority: 'normal' },
      { status: 'resolved', unreadCount: 0, priority: 'normal' },
      { status: 'open', unreadCount: 0, priority: 'urgent' },
      { status: 'pending', unreadCount: 1, priority: 'high' },
    ];

    it('returns all chats for "all" filter', () => {
      expect(filterChats(sampleChats, 'all')).toHaveLength(4);
    });

    it('filters unread chats', () => {
      const result = filterChats(sampleChats, 'unread');
      expect(result).toHaveLength(2);
      expect(result.every(c => c.unreadCount > 0)).toBe(true);
    });

    it('filters by status', () => {
      const open = filterChats(sampleChats, 'open');
      expect(open).toHaveLength(2);
      expect(open.every(c => c.status === 'open')).toBe(true);
    });

    it('filters urgent (urgent + high)', () => {
      const urgent = filterChats(sampleChats, 'urgent');
      expect(urgent).toHaveLength(2);
    });
  });

  describe('Counts calculation', () => {
    interface Chat {
      status: 'open' | 'pending' | 'resolved' | 'archived';
      unreadCount: number;
      priority: 'low' | 'normal' | 'high' | 'urgent';
    }

    const getCounts = (chats: Chat[]) => ({
      all: chats.length,
      unread: chats.filter(c => c.unreadCount > 0).length,
      open: chats.filter(c => c.status === 'open').length,
      urgent: chats.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
    });

    it('calculates accurate counts', () => {
      const chats: Chat[] = [
        { status: 'open', unreadCount: 1, priority: 'normal' },
        { status: 'open', unreadCount: 0, priority: 'urgent' },
        { status: 'resolved', unreadCount: 2, priority: 'normal' },
      ];

      const counts = getCounts(chats);
      expect(counts.all).toBe(3);
      expect(counts.unread).toBe(2);
      expect(counts.open).toBe(2);
      expect(counts.urgent).toBe(1);
    });
  });
});

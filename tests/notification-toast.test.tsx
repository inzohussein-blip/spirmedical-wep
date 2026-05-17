/**
 * Tests for NotificationToast component
 */

import { render, waitFor } from '@testing-library/react';
import NotificationToast from '@/components/notifications/NotificationToast';

// Mock supabase
const mockChannel = {
  on: jest.fn(() => mockChannel),
  subscribe: jest.fn(() => mockChannel),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  }),
}));

describe('NotificationToast', () => {
  beforeEach(() => {
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
  });

  it('renders without crashing', () => {
    const { container } = render(<NotificationToast userId="user1" userRole="patient" />);
    expect(container).toBeInTheDocument();
  });

  it('subscribes to message channel for patient', async () => {
    render(<NotificationToast userId="patient1" userRole="patient" />);
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  it('subscribes for specialist', async () => {
    render(<NotificationToast userId="spec1" userRole="specialist" />);
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  it('returns null when no toasts', () => {
    const { container } = render(<NotificationToast userId="user1" userRole="patient" />);
    // ابتداءً لا تظهر toasts
    expect(container.querySelector('.toast-stack')).not.toBeInTheDocument();
  });
});

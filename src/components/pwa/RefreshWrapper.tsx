'use client';

import { useRouter } from 'next/navigation';
import PullToRefresh from '@/components/pwa/PullToRefresh';
import { type ReactNode } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔄 Refresh Wrapper (V25.18)
 * ═══════════════════════════════════════════════════════════════
 *
 * Wrapper بسيط يُضيف pull-to-refresh لأي صفحة (حتى server pages)
 * يستخدم router.refresh() لإعادة تحميل الـ server data
 *
 * Usage في server page:
 *   <RefreshWrapper>
 *     {/* server content *\/}
 *   </RefreshWrapper>
 * ═══════════════════════════════════════════════════════════════
 */

export default function RefreshWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleRefresh = async () => {
    router.refresh();
    // delay صغير لإظهار الـ animation
    await new Promise((r) => setTimeout(r, 500));
  };

  return <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>;
}

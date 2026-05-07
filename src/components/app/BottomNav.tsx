'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface BottomNavProps {
  isGuest?: boolean;
  hasActiveChat?: boolean;
}

const NAV_ITEMS = [
  { id: 'home', icon: '🏠', label: 'الرئيسية', href: '/guest' },
  { id: 'orders', icon: '📋', label: 'الطلبات', href: '/guest/orders' },
  { id: 'favorites', icon: '⭐', label: 'المفضلة', href: '/guest/favorites' },
  { id: 'account', icon: '👤', label: 'حسابي', href: '/guest/account' },
];

export function BottomNav({ isGuest = false, hasActiveChat = false }: BottomNavProps) {
  const pathname = usePathname();

  const activeId =
    NAV_ITEMS.find((item) => {
      if (item.href === '/guest' && pathname === '/guest') return true;
      return pathname.startsWith(item.href) && item.href !== '/guest';
    })?.id || 'home';

  return (
    <>
      {hasActiveChat && (
        <Link href="/chat" className="floating-chat-btn" aria-label="فتح المحادثات">
          <span className="floating-chat-icon" aria-hidden="true">💬</span>
          <span className="floating-chat-badge">٢</span>
        </Link>
      )}

      <nav className="bottom-nav" role="navigation" aria-label="التنقّل الرئيسي">
        <div className="bottom-nav-inner">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`bottom-nav-item ${activeId === item.id ? 'active' : ''}`}
              aria-current={activeId === item.id ? 'page' : undefined}
            >
              <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {isGuest && <GuestBanner />}
      </nav>
    </>
  );
}

function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="guest-banner" role="status">
      <span className="guest-banner-icon" aria-hidden="true">👁</span>
      <span className="guest-banner-text">أنت تتصفح كضيف · بعض الميزات مقفلة</span>
      <Link href="/register" className="guest-banner-cta">سجّل الآن</Link>
      <button
        onClick={() => setDismissed(true)}
        className="guest-banner-close"
        aria-label="إغلاق التنبيه"
        type="button"
      >×</button>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface BottomNavProps {
  isGuest?: boolean;
}

const NAV_ITEMS = [
  { id: 'home', icon: '⌂', label: 'الرئيسية', href: '/guest', guestLabel: 'الرئيسية' },
  { id: 'orders', icon: '▤', label: 'الطلبات', href: '/guest/orders', guestLabel: 'سجّل' },
  { id: 'favorites', icon: '♡', label: 'المفضلة', href: '/guest/favorites', guestLabel: 'سجّل' },
  { id: 'account', icon: '◔', label: 'حسابي', href: '/guest/account', guestLabel: 'سجّل' },
];

export function BottomNav({ isGuest = false }: BottomNavProps) {
  const pathname = usePathname();

  const activeId =
    NAV_ITEMS.find((item) => {
      if (item.href === '/guest' && pathname === '/guest') return true;
      return pathname.startsWith(item.href) && item.href !== '/guest';
    })?.id || 'home';

  return (
    <nav className="phone-bottom-nav" role="navigation" aria-label="التنقّل الرئيسي">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`nav-item ${activeId === item.id ? 'active' : ''}`}
          aria-current={activeId === item.id ? 'page' : undefined}
        >
          <span className="ic" aria-hidden="true">{item.icon}</span>
          <span>{isGuest ? item.guestLabel : item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

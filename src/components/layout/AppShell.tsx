'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  IconHome, IconHome2, IconLayoutGrid, IconClipboardList,
  IconMessageCircle, IconUser, IconHeart, IconMessages,
} from '@tabler/icons-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: 'patient' | 'specialist' | 'guest';
  signOutAction?: () => Promise<void>;
  isGuest?: boolean;
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: TablerIcon;
  ariaLabel: string;
}

/**
 * AppShell - تطبيق ويب بعرض هاتف ثابت (480px)
 *
 * المميزات:
 * - عرض ثابت 480px على كل الشاشات (شكل تطبيق هاتف)
 * - بدون إطار خارجي
 * - Header sticky + Bottom Nav + Footer
 * - دعم RTL كامل
 * - A11y compliant
 *
 * ⚠️ ملاحظة: لا يحتوي على روابط /admin
 *    لأن لوحة الإدارة (CRM) منفصلة تماماً.
 */
export function AppShell({
  children,
  userName,
  userRole = 'guest',
  signOutAction,
  isGuest = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // إغلاق المنيو عند تغيير المسار
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Escape لإغلاق المنيو
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // 🎯 V26.0: Tabler Icons (Design System V3)
  const navItems: NavItem[] = isGuest
    ? [
        { id: 'home', href: '/guest', label: 'الرئيسية', icon: IconHome, ariaLabel: 'الصفحة الرئيسية' },
        { id: 'services', href: '/guest/services', label: 'الخدمات', icon: IconLayoutGrid, ariaLabel: 'الخدمات' },
        { id: 'orders', href: '/guest/orders', label: 'الطلبات', icon: IconClipboardList, ariaLabel: 'الطلبات' },
        { id: 'favorites', href: '/guest/favorites', label: 'المفضلة', icon: IconHeart, ariaLabel: 'المفضلة' },
        { id: 'account', href: '/guest/account', label: 'حسابي', icon: IconUser, ariaLabel: 'حسابي' },
      ]
    : userRole === 'specialist'
    ? [
        { id: 'home', href: '/specialist', label: 'الرئيسية', icon: IconHome, ariaLabel: 'الصفحة الرئيسية' },
        { id: 'orders', href: '/specialist/orders', label: 'الطلبات', icon: IconClipboardList, ariaLabel: 'الطلبات' },
        { id: 'chats', href: '/specialist/chats', label: 'المحادثات', icon: IconMessages, ariaLabel: 'المحادثات' },
        { id: 'account', href: '/specialist/account', label: 'حسابي', icon: IconUser, ariaLabel: 'حسابي' },
      ]
    : [
        { id: 'home', href: '/dashboard', label: 'الرئيسية', icon: IconHome, ariaLabel: 'الصفحة الرئيسية' },
        { id: 'services', href: '/services', label: 'الخدمات', icon: IconLayoutGrid, ariaLabel: 'كل الخدمات' },
        { id: 'orders', href: '/appointments', label: 'طلباتي', icon: IconClipboardList, ariaLabel: 'طلباتي' },
        { id: 'messages', href: '/messages', label: 'الرسائل', icon: IconMessageCircle, ariaLabel: 'الرسائل' },
        { id: 'account', href: '/account', label: 'حسابي', icon: IconUser, ariaLabel: 'حسابي' },
      ];

  // suppress unused
  void IconHome2;

  function isActive(href: string): boolean {
    if (href === '/guest' || href === '/dashboard' || href === '/specialist') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  const homeHref = isGuest ? '/guest' : userRole === 'specialist' ? '/specialist' : '/dashboard';

  // إخفاء الـ header العام عند الصفحات اللي عندها header خاصة فيها
  const PAGES_WITHOUT_APPSHELL_HEADER = ['/dashboard', '/guest', '/specialist'];
  const hideAppShellHeader = PAGES_WITHOUT_APPSHELL_HEADER.includes(pathname);

  return (
    <div className="app-viewport">
      <a href="#main-content" className="skip-link">
        الانتقال للمحتوى الرئيسي
      </a>

      {/* 🖥️ V30: Sidebar للديسكتوب (CSS يتحكّم بالإظهار/الإخفاء) */}
      <aside
        className="app-sidebar"
        style={{ display: 'none' }}
        role="navigation"
        aria-label="القائمة الجانبية"
      >
        <Link href={homeHref} className="app-sidebar-brand">
          <div className="app-sidebar-brand-mark" aria-hidden="true">س</div>
          <div className="app-sidebar-brand-text">
            <div className="app-sidebar-brand-name">Spir Medical</div>
            <div className="app-sidebar-brand-sub">سباير ميديكال</div>
          </div>
        </Link>

        <div className="app-sidebar-section-label">القائمة</div>
        {navItems.map((item) => {
          const SidebarIcon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`app-sidebar-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="app-sidebar-icon" aria-hidden="true">
                <SidebarIcon size={20} stroke={active ? 2.2 : 1.8} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="app-sidebar-footer">
          {userName && (
            <div className="app-sidebar-item" style={{ background: '#F8F9FA', cursor: 'default' }}>
              <span className="app-sidebar-icon" aria-hidden="true">
                <IconUser size={20} stroke={1.8} />
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
            </div>
          )}
          {!isGuest && signOutAction && (
            <form action={signOutAction}>
              <button
                type="submit"
                className="app-sidebar-item"
                style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'inherit' }}
              >
                <span className="app-sidebar-icon" aria-hidden="true">⎋</span>
                <span>تسجيل الخروج</span>
              </button>
            </form>
          )}
          {isGuest && (
            <Link
              href="/login"
              className="app-sidebar-item"
              style={{ background: '#01875F', color: '#fff', justifyContent: 'center' }}
            >
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </div>
      </aside>

      {/* الإطار الفعلي للتطبيق - بعرض هاتف في الموبايل، كامل في الديسكتوب */}
      <div className="app-shell">
        {/* === HEADER (مخفي في الصفحات اللي عندها header مخصّصة) === */}
        {!hideAppShellHeader && (
        <header className="app-header" role="banner">
          <div className="app-header-content">
            <Link
              href={homeHref}
              className="app-logo"
              aria-label="Spir Medical - الصفحة الرئيسية"
            >
              <div className="app-logo-mark" aria-hidden="true">س</div>
              <div className="app-logo-text">
                <div className="app-logo-name">Spir Medical</div>
                <div className="app-logo-sub">سباير ميديكال</div>
              </div>
            </Link>

            <div className="app-header-actions">
              <button
                type="button"
                className="app-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="app-drawer"
                aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              >
                <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            </div>
          </div>

          {/* القائمة المنسدلة */}
          {mobileMenuOpen && (
            <nav
              id="app-drawer"
              className="app-drawer"
              role="navigation"
              aria-label="القائمة الرئيسية"
            >
              {userName && (
                <div className="app-drawer-user">
                  <div className="app-drawer-avatar" aria-hidden="true">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <div className="app-drawer-name">{userName}</div>
                    <div className="app-drawer-role">
                      {userRole === 'specialist' ? 'أخصائي' : userRole === 'patient' ? 'مراجع' : 'ضيف'}
                    </div>
                  </div>
                </div>
              )}

              {navItems.map((item) => {
                const DrawerIcon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`app-drawer-link ${isActive(item.href) ? 'active' : ''}`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span className="app-drawer-icon" aria-hidden="true">
                      <DrawerIcon size={20} stroke={1.8} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="app-drawer-divider" />

              {!isGuest && signOutAction && (
                <form action={signOutAction}>
                  <button type="submit" className="app-drawer-link signout">
                    <span aria-hidden="true">⎋</span>
                    <span>تسجيل الخروج</span>
                  </button>
                </form>
              )}

              {isGuest && (
                <Link href="/login" className="app-drawer-link primary">
                  <span aria-hidden="true">⊕</span>
                  <span>تسجيل الدخول</span>
                </Link>
              )}
            </nav>
          )}
        </header>
        )}

        {/* === MAIN === */}
        <main id="main-content" className="app-main" role="main">
          {children}
        </main>

        {/* === BOTTOM NAV === */}
        <nav
          className="app-bottom-nav"
          role="navigation"
          aria-label="التنقّل الرئيسي"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`app-bottom-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.ariaLabel}
              >
                <span className="app-bottom-icon" aria-hidden="true">
                  <Icon size={22} stroke={active ? 2.2 : 1.8} />
                </span>
                <span className="app-bottom-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

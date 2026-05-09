'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

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
  icon: string;
  ariaLabel: string;
}

/**
 * AppShell - تطبيق ويب بعرض هاتف ثابت (480px)
 *
 * المميزات:
 * - عرض ثابت 480px على كل الشاشات (شكل تطبيق هاتف)
 * - بدون إطار خارجي
 * - Header sticky + Bottom Nav + Footer
 * - Dark Mode toggle
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // تحميل Theme من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spir_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = (saved as 'light' | 'dark') || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

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

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('spir_theme', next);
  }

  // ٤ نوافذ أساسية (مطابقة لمواصفاتك)
  const navItems: NavItem[] = isGuest
    ? [
        { id: 'home', href: '/guest', label: 'الرئيسية', icon: '⌂', ariaLabel: 'الصفحة الرئيسية' },
        { id: 'orders', href: '/guest/orders', label: 'الطلبات', icon: '▤', ariaLabel: 'الطلبات' },
        { id: 'favorites', href: '/guest/favorites', label: 'المفضلة', icon: '♡', ariaLabel: 'المفضلة' },
        { id: 'account', href: '/guest/account', label: 'حسابي', icon: '◔', ariaLabel: 'حسابي' },
      ]
    : userRole === 'specialist'
    ? [
        { id: 'home', href: '/specialist', label: 'الرئيسية', icon: '⌂', ariaLabel: 'الصفحة الرئيسية' },
        { id: 'orders', href: '/specialist/orders', label: 'الطلبات', icon: '▤', ariaLabel: 'الطلبات' },
        { id: 'chats', href: '/specialist/chats', label: 'المحادثات', icon: '✉', ariaLabel: 'المحادثات' },
        { id: 'account', href: '/specialist/account', label: 'حسابي', icon: '◔', ariaLabel: 'حسابي' },
      ]
    : [
        { id: 'home', href: '/dashboard', label: 'الرئيسية', icon: '⌂', ariaLabel: 'الصفحة الرئيسية' },
        { id: 'orders', href: '/appointments', label: 'الطلبات', icon: '▤', ariaLabel: 'طلباتي' },
        { id: 'favorites', href: '/favorites', label: 'المفضلة', icon: '♡', ariaLabel: 'المفضلة' },
        { id: 'account', href: '/account', label: 'حسابي', icon: '◔', ariaLabel: 'حسابي' },
      ];

  function isActive(href: string): boolean {
    if (href === '/guest' || href === '/dashboard' || href === '/specialist') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  const homeHref = isGuest ? '/guest' : userRole === 'specialist' ? '/specialist' : '/dashboard';

  return (
    <div className="app-viewport">
      <a href="#main-content" className="skip-link">
        الانتقال للمحتوى الرئيسي
      </a>

      {/* الإطار الفعلي للتطبيق - بعرض هاتف */}
      <div className="app-shell">
        {/* === HEADER === */}
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
                className="app-icon-btn"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
                title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
              >
                <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀'}</span>
              </button>

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

              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`app-drawer-link ${isActive(item.href) ? 'active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span className="app-drawer-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

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
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`app-bottom-item ${isActive(item.href) ? 'active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
              aria-label={item.ariaLabel}
            >
              <span className="app-bottom-icon" aria-hidden="true">{item.icon}</span>
              <span className="app-bottom-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

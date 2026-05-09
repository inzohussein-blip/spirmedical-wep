'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface AppShellProps {
  children: React.ReactNode;
  /** اسم المستخدم للعرض في الـ header */
  userName?: string;
  /** دور المستخدم لإظهار/إخفاء روابط الإدارة */
  userRole?: 'patient' | 'specialist' | 'admin' | 'guest';
  /** زر تسجيل الخروج (server action) */
  signOutAction?: () => Promise<void>;
  /** هل المستخدم ضيف؟ */
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
 * AppShell - الحاوية الموحّدة لكل صفحات التطبيق
 *
 * يوفّر:
 * - Header sticky ثابت (موبايل + ديسكتوب)
 * - Bottom Navigation (موبايل فقط)
 * - Footer
 * - Skip-to-content link (a11y)
 * - دعم RTL كامل
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

  // عناصر التنقّل حسب نوع المستخدم
  const navItems: NavItem[] = isGuest
    ? [
        { id: 'home', href: '/guest', label: 'الرئيسية', icon: '⌂', ariaLabel: 'الصفحة الرئيسية' },
        { id: 'orders', href: '/guest/orders', label: 'الطلبات', icon: '▤', ariaLabel: 'طلباتي' },
        { id: 'favorites', href: '/guest/favorites', label: 'المفضلة', icon: '♡', ariaLabel: 'المفضلة' },
        { id: 'account', href: '/guest/account', label: 'حسابي', icon: '◔', ariaLabel: 'حسابي' },
      ]
    : [
        { id: 'home', href: '/dashboard', label: 'الرئيسية', icon: '⌂', ariaLabel: 'لوحة التحكم' },
        { id: 'appointments', href: '/appointments', label: 'الحجوزات', icon: '📋', ariaLabel: 'حجوزاتي' },
        { id: 'new', href: '/appointments/new', label: 'حجز جديد', icon: '+', ariaLabel: 'إنشاء حجز جديد' },
        { id: 'account', href: '/profile', label: 'حسابي', icon: '◔', ariaLabel: 'الملف الشخصي' },
      ];

  function isActive(href: string): boolean {
    if (href === '/guest' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="app-shell">
      {/* === HEADER === */}
      <header className="app-header" role="banner">
        <div className="app-header-content">
          {/* Logo */}
          <Link href={isGuest ? '/guest' : '/dashboard'} className="app-logo" aria-label="Spir Medical - الصفحة الرئيسية">
            <div className="app-logo-mark" aria-hidden="true">س</div>
            <div className="app-logo-text">
              <div className="app-logo-name">Spir Medical</div>
              <div className="app-logo-sub">سباير ميديكال</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="app-nav-desktop" role="navigation" aria-label="القائمة الرئيسية">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`app-nav-link ${isActive(item.href) ? 'active' : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {userRole === 'admin' && (
              <Link
                href="/admin"
                className={`app-nav-link admin ${pathname.startsWith('/admin') ? 'active' : ''}`}
                aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              >
                <span aria-hidden="true">🛡</span>
                <span>الإدارة</span>
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="app-header-user">
            {userName && (
              <span className="app-username" aria-label={`المستخدم: ${userName}`}>
                {userName}
              </span>
            )}
            {!isGuest && signOutAction && (
              <form action={signOutAction}>
                <button type="submit" className="app-signout-btn" aria-label="تسجيل الخروج">
                  خروج
                </button>
              </form>
            )}
            {isGuest && (
              <Link href="/login" className="app-signin-btn">
                دخول
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="app-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="فتح القائمة"
            >
              <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="app-mobile-menu"
            role="navigation"
            aria-label="القائمة الرئيسية للموبايل"
          >
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`app-mobile-link ${isActive(item.href) ? 'active' : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* === MAIN === */}
      <main id="main-content" className="app-main" role="main">
        {children}
      </main>

      {/* === BOTTOM NAV (Mobile only) === */}
      <nav
        className="app-bottom-nav"
        role="navigation"
        aria-label="التنقّل السفلي"
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

      {/* === FOOTER === */}
      <footer className="app-footer" role="contentinfo">
        <div className="app-footer-content">
          <div className="app-footer-brand">
            <span>© ٢٠٢٦ Spir Medical · سباير ميديكال</span>
          </div>
          <nav className="app-footer-nav" aria-label="روابط قانونية">
            <Link href="/legal/terms">الشروط</Link>
            <span aria-hidden="true">·</span>
            <Link href="/legal/privacy">الخصوصية</Link>
            <span aria-hidden="true">·</span>
            <Link href="/guest/sos" className="emergency">🚨 طوارئ</Link>
          </nav>
        </div>
      </footer>

      <style jsx>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--paper, #F4EFE2);
        }

        /* ─── HEADER ─── */
        .app-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(244, 239, 226, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line, rgba(15, 26, 28, 0.08));
        }
        .app-header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .app-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--ink, #0F1A1C);
          flex-shrink: 0;
        }
        .app-logo-mark {
          width: 38px;
          height: 38px;
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .app-logo-name {
          font-size: 14px;
          font-weight: 800;
          line-height: 1.1;
        }
        .app-logo-sub {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
          margin-top: 2px;
        }

        /* ─── DESKTOP NAV ─── */
        .app-nav-desktop {
          display: none;
          gap: 4px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .app-nav-desktop { display: flex; }
        }
        .app-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          color: var(--ink-2, #1F2A2C);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.15s;
        }
        .app-nav-link:hover {
          background: var(--paper-2, #EDE6D3);
        }
        .app-nav-link.active {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
        }
        .app-nav-link.admin {
          color: var(--amber, #B8540C);
        }
        .app-nav-link.admin.active {
          background: var(--amber, #B8540C);
          color: var(--paper-3, #FAF6EB);
        }

        /* ─── USER SECTION ─── */
        .app-header-user {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .app-username {
          display: none;
          font-size: 13px;
          color: var(--ink-3, #6E7878);
          font-weight: 600;
        }
        @media (min-width: 768px) {
          .app-username { display: inline-block; }
        }
        .app-signout-btn,
        .app-signin-btn {
          padding: 7px 14px;
          border-radius: 10px;
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          color: var(--ink, #0F1A1C);
          text-decoration: none;
          transition: all 0.15s;
        }
        .app-signout-btn:hover,
        .app-signin-btn:hover {
          background: var(--paper-2, #EDE6D3);
        }
        .app-signin-btn {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
        }

        /* ─── MOBILE MENU TOGGLE ─── */
        .app-menu-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--paper-2, #EDE6D3);
          border: 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
        }
        @media (min-width: 768px) {
          .app-menu-toggle { display: none; }
        }
        .app-menu-toggle:focus-visible {
          outline: 2px solid var(--emerald, #0E5C4D);
          outline-offset: 2px;
        }

        /* ─── MOBILE DRAWER ─── */
        .app-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 20px 16px;
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          background: var(--paper, #F4EFE2);
        }
        @media (min-width: 768px) {
          .app-mobile-menu { display: none; }
        }
        .app-mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          color: var(--ink-2, #1F2A2C);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }
        .app-mobile-link.active {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
        }

        /* ─── MAIN ─── */
        .app-main {
          flex: 1;
          padding-bottom: 80px; /* مساحة للـ bottom nav */
        }
        @media (min-width: 768px) {
          .app-main { padding-bottom: 0; }
        }

        /* ─── BOTTOM NAV (Mobile) ─── */
        .app-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          background: var(--paper-3, #FAF6EB);
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }
        @media (min-width: 768px) {
          .app-bottom-nav { display: none; }
        }
        .app-bottom-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 8px 4px;
          border-radius: 10px;
          color: var(--ink-3, #6E7878);
          text-decoration: none;
          font-size: 10px;
          font-weight: 600;
          min-height: 48px; /* a11y target size */
        }
        .app-bottom-item.active {
          color: var(--emerald, #0E5C4D);
          background: var(--emerald-soft, #D9E5DF);
        }
        .app-bottom-item:focus-visible {
          outline: 2px solid var(--emerald, #0E5C4D);
          outline-offset: -2px;
        }
        .app-bottom-icon {
          font-size: 18px;
          line-height: 1;
        }
        .app-bottom-label {
          font-size: 10px;
          line-height: 1;
        }

        /* ─── FOOTER ─── */
        .app-footer {
          background: var(--ink, #0F1A1C);
          color: var(--paper-3, #FAF6EB);
          padding: 24px 20px;
          margin-bottom: 64px; /* مساحة للـ bottom nav */
        }
        @media (min-width: 768px) {
          .app-footer { margin-bottom: 0; }
        }
        .app-footer-content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }
        @media (min-width: 768px) {
          .app-footer-content {
            flex-direction: row;
            justify-content: space-between;
            text-align: right;
          }
        }
        .app-footer-brand {
          font-size: 12px;
          opacity: 0.7;
        }
        .app-footer-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }
        .app-footer-nav a {
          color: var(--paper-3, #FAF6EB);
          text-decoration: none;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .app-footer-nav a:hover {
          opacity: 1;
        }
        .app-footer-nav .emergency {
          color: var(--rose-soft, #F0D7D8);
          font-weight: 700;
        }

        /* ─── A11Y: focus-visible ─── */
        .app-logo:focus-visible,
        .app-nav-link:focus-visible,
        .app-mobile-link:focus-visible,
        .app-signout-btn:focus-visible,
        .app-signin-btn:focus-visible,
        .app-footer-nav a:focus-visible {
          outline: 2px solid var(--emerald, #0E5C4D);
          outline-offset: 2px;
          border-radius: 6px;
        }

        /* ─── Reduce motion ─── */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

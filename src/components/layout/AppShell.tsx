'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: 'patient' | 'specialist' | 'admin' | 'guest';
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
 * AppShell - حاوية ويب آب موحّدة (بدون phone frame)
 *
 * المميزات:
 * - Header sticky responsive
 * - Bottom navigation (موبايل فقط)
 * - Footer دائم
 * - Dark mode toggle
 * - دعم RTL كامل
 * - A11y compliant
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
        { id: 'new', href: '/appointments/new', label: 'حجز جديد', icon: '+', ariaLabel: 'حجز جديد' },
        { id: 'account', href: '/profile', label: 'حسابي', icon: '◔', ariaLabel: 'الملف الشخصي' },
      ];

  function isActive(href: string): boolean {
    if (href === '/guest' || href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="app-shell">
      {/* Skip to content */}
      <a href="#main-content" className="skip-link">
        الانتقال للمحتوى الرئيسي
      </a>

      {/* === HEADER === */}
      <header className="app-header" role="banner">
        <div className="app-header-content">
          <Link
            href={isGuest ? '/guest' : '/dashboard'}
            className="app-logo"
            aria-label="Spir Medical - الصفحة الرئيسية"
          >
            <div className="app-logo-mark" aria-hidden="true">س</div>
            <div className="app-logo-text">
              <div className="app-logo-name">Spir Medical</div>
              <div className="app-logo-sub">سباير ميديكال</div>
            </div>
          </Link>

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

          <div className="app-header-actions">
            {/* Dark mode toggle */}
            <button
              type="button"
              className="app-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
              title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
            >
              <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀'}</span>
            </button>

            {userName && (
              <span className="app-username" aria-label={`المستخدم: ${userName}`}>
                {userName}
              </span>
            )}

            {!isGuest && signOutAction && (
              <form action={signOutAction}>
                <button type="submit" className="app-btn-secondary" aria-label="تسجيل الخروج">
                  خروج
                </button>
              </form>
            )}

            {isGuest && (
              <Link href="/login" className="app-btn-primary">
                دخول
              </Link>
            )}

            <button
              type="button"
              className="app-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="app-mobile-menu"
            role="navigation"
            aria-label="قائمة الموبايل"
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
            {userRole === 'admin' && (
              <Link
                href="/admin"
                className={`app-mobile-link admin ${pathname.startsWith('/admin') ? 'active' : ''}`}
              >
                <span aria-hidden="true">🛡</span>
                <span>لوحة الإدارة</span>
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* === MAIN === */}
      <main id="main-content" className="app-main" role="main">
        {children}
      </main>

      {/* === BOTTOM NAV (Mobile) === */}
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
          <div className="app-footer-section">
            <div className="app-footer-brand">
              <div className="app-footer-logo" aria-hidden="true">س</div>
              <div>
                <div className="app-footer-name">Spir Medical</div>
                <div className="app-footer-tagline">صحة العراق، رقمياً</div>
              </div>
            </div>
          </div>

          <nav className="app-footer-nav" aria-label="روابط قانونية">
            <Link href="/legal/terms">الشروط والأحكام</Link>
            <Link href="/legal/privacy">سياسة الخصوصية</Link>
            <Link href="/guest/sos" className="emergency">🚨 طوارئ</Link>
          </nav>

          <div className="app-footer-bottom">
            <span>© ٢٠٢٦ Spir Medical · جميع الحقوق محفوظة</span>
            <span className="app-footer-iraq">صنع في العراق 🇮🇶</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

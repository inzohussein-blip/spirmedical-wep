'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/app/BottomNav';

const ACCOUNT_SECTIONS = [
  { id: 'history', icon: '📜', title: 'الطلبات السابقة', desc: 'سجل التحاليل والوصفات', locked: true },
  { id: 'family', icon: '👨‍👩‍👧', title: 'حسابي وعائلتي', desc: 'إدارة حسابات الأقارب', locked: true },
  { id: 'subscription', icon: '💎', title: 'العضوية والاشتراكات', desc: 'باقات مميزة', locked: true },
  { id: 'settings', icon: '⚙', title: 'الإعدادات', desc: 'تخصيص التطبيق', locked: false },
  { id: 'help', icon: '💬', title: 'مساعدة والدعم', desc: 'تواصل معنا', locked: false },
  { id: 'about', icon: 'ℹ', title: 'حول التطبيق', desc: 'بنود الخدمة والخصوصية', locked: false },
];

export default function GuestAccountPage() {
  return (
    <main className="app-screen">
      <header className="app-page-header">
        <Link href="/guest" className="app-back-btn" aria-label="العودة">
          <span aria-hidden="true">→</span>
        </Link>
        <h1 className="app-page-title">حسابي</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="app-guest-card">
        <div className="app-avatar guest large" aria-hidden="true">👁</div>
        <div className="app-guest-info">
          <h2>زائر</h2>
          <p>أنت تتصفح كضيف · لا يوجد حساب مرتبط</p>
        </div>
        <Link href="/register" className="app-guest-card-cta">إنشاء حساب</Link>
      </div>

      <section className="app-account-sections">
        {ACCOUNT_SECTIONS.map((section) => {
          if (section.locked) {
            return (
              <Link
                key={section.id}
                href="/register"
                className="app-account-row locked"
                aria-label={`${section.title} - مقفل، اضغط للتسجيل`}
              >
                <span className="app-account-icon" aria-hidden="true">{section.icon}</span>
                <div className="app-account-text">
                  <div className="app-account-title">{section.title}</div>
                  <div className="app-account-desc">{section.desc}</div>
                </div>
                <span className="app-account-lock" aria-hidden="true">🔒</span>
              </Link>
            );
          }

          return (
            <Link
              key={section.id}
              href={`/guest/account/${section.id}`}
              className="app-account-row"
            >
              <span className="app-account-icon" aria-hidden="true">{section.icon}</span>
              <div className="app-account-text">
                <div className="app-account-title">{section.title}</div>
                <div className="app-account-desc">{section.desc}</div>
              </div>
              <span className="app-account-arrow" aria-hidden="true">‹</span>
            </Link>
          );
        })}
      </section>

      <div className="app-legal-links">
        <Link href="/legal/terms">الشروط</Link>
        <span aria-hidden="true">·</span>
        <Link href="/legal/privacy">الخصوصية</Link>
      </div>

      <div className="app-switch-account">
        <Link href="/login" className="app-switch-link">← الدخول لحساب موجود</Link>
      </div>

      <div className="app-bottom-spacer" />
      <BottomNav isGuest={true} hasActiveChat={false} />
    </main>
  );
}

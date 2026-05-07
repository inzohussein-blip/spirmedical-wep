'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/app/BottomNav';

const ACCOUNT_SECTIONS = [
  { id: 'history', icon: '📜', title: 'الطلبات السابقة', desc: 'سجل التحاليل', locked: true },
  { id: 'family', icon: '👨‍👩‍👧', title: 'حسابي وعائلتي', desc: 'إدارة الأقارب', locked: true },
  { id: 'subscription', icon: '💎', title: 'العضوية', desc: 'باقات مميزة', locked: true },
  { id: 'settings', icon: '⚙', title: 'الإعدادات', desc: 'تخصيص التطبيق', locked: false },
  { id: 'help', icon: '💬', title: 'مساعدة والدعم', desc: 'تواصل معنا', locked: false },
  { id: 'about', icon: 'ℹ', title: 'حول التطبيق', desc: 'الشروط والخصوصية', locked: false },
];

export default function GuestAccountPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">حسابي</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-account-card">
          <div className="scr-avatar guest" style={{ width: 44, height: 44, fontSize: 16 }} aria-hidden="true">ض</div>
          <div className="scr-account-info">
            <h2>زائر</h2>
            <p>أنت تتصفح كضيف · لا يوجد حساب مرتبط</p>
          </div>
          <Link href="/register" className="scr-account-cta">إنشاء حساب</Link>
        </div>

        <div className="scr-account-list">
          {ACCOUNT_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={section.locked ? '/register' : `/guest/account/${section.id}`}
              className={`scr-account-row ${section.locked ? 'locked' : ''}`}
              aria-label={section.locked ? `${section.title} - مقفل، اضغط للتسجيل` : section.title}
            >
              <span className="scr-account-icon" aria-hidden="true">{section.icon}</span>
              <div className="scr-account-text">
                <div className="scr-account-title">{section.title}</div>
                <div className="scr-account-desc">{section.desc}</div>
              </div>
              <span className={section.locked ? 'scr-account-lock' : 'scr-account-arrow'} aria-hidden="true">
                {section.locked ? '🔒' : '‹'}
              </span>
            </Link>
          ))}
        </div>

        <div style={{
          padding: '20px 18px 8px',
          fontSize: 11,
          color: 'var(--ink-3)',
          textAlign: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'center'
        }}>
          <Link href="/legal/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>الشروط</Link>
          <span aria-hidden="true">·</span>
          <Link href="/legal/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>الخصوصية</Link>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 18px 20px' }}>
          <Link href="/login" style={{ color: 'var(--emerald)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            ← الدخول لحساب موجود
          </Link>
        </div>
      </div>

      <BottomNav isGuest={true} />
    </main>
  );
}

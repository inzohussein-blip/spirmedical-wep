'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/app/BottomNav';

export default function GuestOrdersPage() {
  return (
    <main className="app-screen">
      <header className="app-page-header">
        <Link href="/guest" className="app-back-btn" aria-label="العودة">
          <span aria-hidden="true">→</span>
        </Link>
        <h1 className="app-page-title">طلباتي</h1>
        <button className="app-icon-btn" aria-label="السلة" type="button">
          <span aria-hidden="true">🛒</span>
          <span className="app-badge">٠</span>
        </button>
      </header>

      <div className="app-empty-state">
        <div className="app-empty-icon" aria-hidden="true">📋</div>
        <h2 className="app-empty-title">لا توجد طلبات</h2>
        <p className="app-empty-desc">
          الضيف لا يستطيع إنشاء طلبات.
          <br />
          سجّل الآن لتجربة جميع الخدمات.
        </p>
        <Link href="/register" className="app-empty-cta">إنشاء حساب جديد ←</Link>
        <Link href="/guest" className="app-empty-link">العودة لتصفّح الخدمات</Link>
      </div>

      <div className="app-bottom-spacer" />
      <BottomNav isGuest={true} hasActiveChat={false} />
    </main>
  );
}

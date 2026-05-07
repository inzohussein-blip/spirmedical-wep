'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/app/BottomNav';

export default function GuestOrdersPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">طلباتي</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-empty">
          <div className="scr-empty-icon" aria-hidden="true">📋</div>
          <h2 className="scr-empty-title">لا توجد طلبات</h2>
          <p className="scr-empty-desc">
            الضيف لا يستطيع إنشاء طلبات.
            <br />
            سجّل الآن لتجربة جميع الخدمات.
          </p>
          <Link href="/register" className="scr-empty-cta">إنشاء حساب جديد ←</Link>
          <Link href="/guest" className="scr-empty-link">العودة لتصفّح الخدمات</Link>
        </div>
      </div>

      <BottomNav isGuest={true} />
    </main>
  );
}

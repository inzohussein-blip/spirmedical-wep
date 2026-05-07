'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BottomNav } from '@/components/app/BottomNav';

const TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'doctors', label: 'الأطباء' },
  { id: 'pharmacy', label: 'الصيدلية' },
  { id: 'tests', label: 'الفحوصات' },
];

export default function GuestFavoritesPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <main className="app-screen">
      <header className="app-page-header">
        <Link href="/guest" className="app-back-btn" aria-label="العودة">
          <span aria-hidden="true">→</span>
        </Link>
        <h1 className="app-page-title">المفضلة</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="app-tabs" role="tablist" aria-label="تصنيفات المفضلة">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`app-tab ${activeTab === tab.id ? 'active' : ''}`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="app-empty-state">
        <div className="app-empty-icon" aria-hidden="true">⭐</div>
        <h2 className="app-empty-title">قائمة المفضلة فارغة</h2>
        <p className="app-empty-desc">
          الضيف لا يستطيع حفظ المفضلة.
          <br />
          سجّل الآن لحفظ أطبائك المفضّلين والخدمات.
        </p>
        <Link href="/register" className="app-empty-cta">إنشاء حساب جديد ←</Link>
      </div>

      <div className="app-bottom-spacer" />
      <BottomNav isGuest={true} hasActiveChat={false} />
    </main>
  );
}

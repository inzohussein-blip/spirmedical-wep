'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BottomNav } from '@/components/app/BottomNav';

const TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'doctors', label: 'الأطباء' },
  { id: 'pharmacy', label: 'صيدليات' },
  { id: 'tests', label: 'فحوصات' },
];

export default function GuestFavoritesPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">المفضلة</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-tabs" role="tablist" aria-label="تصنيفات المفضلة">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`scr-tab ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="scr-empty">
          <div className="scr-empty-icon" aria-hidden="true">⭐</div>
          <h2 className="scr-empty-title">قائمة المفضلة فارغة</h2>
          <p className="scr-empty-desc">
            الضيف لا يستطيع حفظ المفضلة.
            <br />
            سجّل الآن لحفظ أطبائك المفضّلين.
          </p>
          <Link href="/register" className="scr-empty-cta">إنشاء حساب جديد ←</Link>
        </div>
      </div>

      <BottomNav isGuest={true} />
    </main>
  );
}

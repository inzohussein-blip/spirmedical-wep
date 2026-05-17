'use client';

import Link from 'next/link';
import { useState } from 'react';

const TABS = [
  { id: 'all', label: 'الكل', icon: '⭐' },
  { id: 'doctors', label: 'الأطباء', icon: '⌬' },
  { id: 'hospitals', label: 'المستشفيات', icon: '🏥' },
  { id: 'pharmacies', label: 'صيدليات', icon: '💊' },
  { id: 'tests', label: 'فحوصات', icon: '🧪' },
];

// بيانات تجريبية (ستُجلب من DB لاحقاً)
const MOCK_FAVORITES = {
  doctors: [],
  hospitals: [],
  pharmacies: [],
  tests: [],
};

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('all');

  // محتوى كل تاب (فارغ حالياً)
  const isEmpty = true;

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'doctors':
        return { icon: '⌬', title: 'لا أطباء مفضّلين', desc: 'اعثر على طبيبك واحفظه هنا' };
      case 'hospitals':
        return { icon: '🏥', title: 'لا مستشفيات مفضّلة', desc: 'تصفح المستشفيات واحفظ المفضّلة' };
      case 'pharmacies':
        return { icon: '💊', title: 'لا صيدليات مفضّلة', desc: 'احفظ الصيدليات القريبة منك' };
      case 'tests':
        return { icon: '🧪', title: 'لا فحوصات مفضّلة', desc: 'احفظ الفحوصات التي تكررها' };
      default:
        return { icon: '⭐', title: 'لا مفضّلات بعد', desc: 'احفظ خدماتك المفضّلة للوصول السريع' };
    }
  };

  const empty = getEmptyMessage();

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">المفضلة</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Tabs - scrollable */}
        <div
          className="scr-tabs"
          role="tablist"
          aria-label="تصنيفات المفضلة"
          style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`scr-tab ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
            >
              <span style={{ marginInlineEnd: 6 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isEmpty ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon" aria-hidden="true">{empty.icon}</div>
            <h2 className="scr-empty-title">{empty.title}</h2>
            <p className="scr-empty-desc">{empty.desc}</p>
            <Link href="/dashboard" className="scr-empty-cta">
              تصفح الخدمات ←
            </Link>
          </div>
        ) : (
          <div>{/* قائمة المفضّلات هنا */}</div>
        )}

        {/* اقتراحات */}
        <div className="scr-section-head" style={{ marginTop: 32 }}>
          <div className="scr-section-title">قد يعجبك</div>
        </div>
        <div className="scr-suggestions">
          <Link href="/services/clinics" className="scr-suggestion-card">
            <div className="scr-suggestion-icon" aria-hidden="true">🏛️</div>
            <div className="scr-suggestion-content">
              <div className="scr-suggestion-title">عيادات قريبة منك</div>
              <div className="scr-suggestion-sub">اكتشف العيادات في منطقتك</div>
            </div>
            <div className="scr-suggestion-arrow" aria-hidden="true">←</div>
          </Link>
          <Link href="/services/consultation" className="scr-suggestion-card">
            <div className="scr-suggestion-icon" aria-hidden="true">💬</div>
            <div className="scr-suggestion-content">
              <div className="scr-suggestion-title">استشارة طبية فورية</div>
              <div className="scr-suggestion-sub">+١٢ طبيب متاح الآن</div>
            </div>
            <div className="scr-suggestion-arrow" aria-hidden="true">←</div>
          </Link>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

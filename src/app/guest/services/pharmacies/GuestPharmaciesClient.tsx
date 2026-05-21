'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  phone: string;
  open24: boolean;
}

const PHARMACIES: Pharmacy[] = [
  { id: 'p1', name: 'صيدلية الشفاء', city: 'بغداد', district: 'الكرادة', phone: '07811000001', open24: true },
  { id: 'p2', name: 'صيدلية الرحمة', city: 'بغداد', district: 'المنصور', phone: '07811000002', open24: false },
  { id: 'p3', name: 'صيدلية النور', city: 'النجف', district: 'الكوفة', phone: '07811000003', open24: true },
  { id: 'p4', name: 'صيدلية الأمل', city: 'البصرة', district: 'العشار', phone: '07811000004', open24: false },
  { id: 'p5', name: 'صيدلية الحكمة', city: 'بغداد', district: 'الأعظمية', phone: '07811000005', open24: true },
  { id: 'p6', name: 'صيدلية ابن البيطار', city: 'الموصل', district: 'الجامعة', phone: '07811000006', open24: false },
];

export default function GuestPharmaciesClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'open24'>('all');

  const filtered = PHARMACIES.filter((p) => {
    if (searchQuery && !p.name.includes(searchQuery) && !p.city.includes(searchQuery)) {
      return false;
    }
    if (filter === 'open24') return p.open24;
    return true;
  });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">دليل الصيدليات</h1>
          <div className="scr-page-spacer" />
        </div>

        <div style={{ padding: '0 18px' }}>
          <div className="scr-search" style={{ margin: '0 0 12px 0' }}>
            <div className="scr-search-icon" aria-hidden="true">⌕</div>
            <input
              type="search"
              placeholder="ابحث عن صيدلية أو مدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="البحث"
            />
          </div>

          <div className="scr-tabs" style={{ padding: '4px 0 12px 0' }}>
            <button
              className={`scr-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              type="button"
            >الكل ({PHARMACIES.length})</button>
            <button
              className={`scr-tab ${filter === 'open24' ? 'active' : ''}`}
              onClick={() => setFilter('open24')}
              type="button"
            >مفتوح ٢٤ ساعة</button>
          </div>

          <div className="pharmacy-info-banner">
            <span aria-hidden="true">💡</span>
            <span>هذا دليل إرشادي · لا نبيع الأدوية مباشرة</span>
          </div>

          <div className="hospitals-list">
            {filtered.length === 0 ? (
              <div className="scr-empty">
                <div className="scr-empty-icon" aria-hidden="true">💊</div>
                <h2 className="scr-empty-title">لا توجد نتائج</h2>
              </div>
            ) : (
              filtered.map((pharmacy) => (
                <div key={pharmacy.id} className="hospital-card">
                  <div className="hospital-card-header">
                    <div className="hospital-icon" aria-hidden="true" style={{ background: 'var(--amber-soft)' }}>💊</div>
                    <div className="hospital-info">
                      <div className="hospital-name">{pharmacy.name}</div>
                      <div className="hospital-meta">
                        {pharmacy.open24 && (
                          <span className="hospital-emergency-badge" style={{ background: 'var(--emerald)', color: 'var(--paper-3)' }}>
                            ٢٤ ساعة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hospital-location">
                    <span aria-hidden="true">📍</span>
                    <span>{pharmacy.city} - {pharmacy.district}</span>
                  </div>
                  <div className="hospital-actions">
                    <a href={`tel:${pharmacy.phone}`} className="hospital-action-btn">
                      <span aria-hidden="true">📞</span>
                      <span>اتصال</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </main>
  );
}

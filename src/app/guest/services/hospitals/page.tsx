'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Hospital {
  id: string;
  name: string;
  type: 'حكومي' | 'خاص';
  city: string;
  district: string;
  phone: string;
  emergency: boolean;
}

const HOSPITALS: Hospital[] = [
  { id: 'h1', name: 'مستشفى بغداد التعليمي', type: 'حكومي', city: 'بغداد', district: 'باب المعظم', phone: '07811111111', emergency: true },
  { id: 'h2', name: 'مستشفى الإمام علي', type: 'حكومي', city: 'النجف', district: 'الكوفة', phone: '07822222222', emergency: true },
  { id: 'h3', name: 'مستشفى الكندي العام', type: 'حكومي', city: 'بغداد', district: 'الكرادة', phone: '07833333333', emergency: true },
  { id: 'h4', name: 'مستشفى دار السلام', type: 'خاص', city: 'بغداد', district: 'الأعظمية', phone: '07844444444', emergency: false },
  { id: 'h5', name: 'مستشفى ابن سينا', type: 'خاص', city: 'البصرة', district: 'العشار', phone: '07855555555', emergency: true },
  { id: 'h6', name: 'مستشفى الموصل العام', type: 'حكومي', city: 'الموصل', district: 'الجامعة', phone: '07866666666', emergency: true },
];

export default function HospitalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'emergency'>('all');

  const filtered = HOSPITALS.filter((h) => {
    if (searchQuery && !h.name.includes(searchQuery) && !h.city.includes(searchQuery)) {
      return false;
    }
    if (filter === 'public') return h.type === 'حكومي';
    if (filter === 'private') return h.type === 'خاص';
    if (filter === 'emergency') return h.emergency;
    return true;
  });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">المستشفيات</h1>
          <div className="scr-page-spacer" />
        </div>

        <div style={{ padding: '0 18px' }}>
          <div className="scr-search" style={{ margin: '0 0 12px 0' }}>
            <div className="scr-search-icon" aria-hidden="true">⌕</div>
            <input
              type="search"
              placeholder="ابحث عن مستشفى أو مدينة..."
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
            >الكل ({HOSPITALS.length})</button>
            <button
              className={`scr-tab ${filter === 'public' ? 'active' : ''}`}
              onClick={() => setFilter('public')}
              type="button"
            >حكومي</button>
            <button
              className={`scr-tab ${filter === 'private' ? 'active' : ''}`}
              onClick={() => setFilter('private')}
              type="button"
            >خاص</button>
            <button
              className={`scr-tab ${filter === 'emergency' ? 'active' : ''}`}
              onClick={() => setFilter('emergency')}
              type="button"
            >طوارئ ٢٤/٧</button>
          </div>

          <div className="hospitals-list">
            {filtered.length === 0 ? (
              <div className="scr-empty">
                <div className="scr-empty-icon" aria-hidden="true">🏥</div>
                <h2 className="scr-empty-title">لا توجد نتائج</h2>
                <p className="scr-empty-desc">جرّب بحثاً آخر</p>
              </div>
            ) : (
              filtered.map((hospital) => (
                <div key={hospital.id} className="hospital-card">
                  <div className="hospital-card-header">
                    <div className="hospital-icon" aria-hidden="true">🏥</div>
                    <div className="hospital-info">
                      <div className="hospital-name">{hospital.name}</div>
                      <div className="hospital-meta">
                        <span className={`hospital-type type-${hospital.type === 'حكومي' ? 'public' : 'private'}`}>
                          {hospital.type}
                        </span>
                        {hospital.emergency && (
                          <span className="hospital-emergency-badge">طوارئ ٢٤/٧</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hospital-location">
                    <span aria-hidden="true">📍</span>
                    <span>{hospital.city} - {hospital.district}</span>
                  </div>
                  <div className="hospital-actions">
                    <a href={`tel:${hospital.phone}`} className="hospital-action-btn">
                      <span aria-hidden="true">📞</span>
                      <span>اتصال</span>
                    </a>
                    <button
                      className="hospital-action-btn locked"
                      type="button"
                      onClick={() => window.location.href = '/register'}
                    >
                      <span aria-hidden="true">🔒</span>
                      <span>حجز موعد</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="tool-disclaimer">
            💡 الحجز يتطلب التسجيل. سجّل الآن للوصول الكامل.
          </div>
        </div>
      </div>

    </main>
  );
}

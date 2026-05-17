'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Phone, Star, Pill, Clock, Map, Info,
} from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  phone: string;
  hours: string;
  has_delivery: boolean;
  is_24h: boolean;
  rating: number;
}

const PHARMACIES: Pharmacy[] = [
  { id: 'p1', name: 'صيدلية الحياة', city: 'بغداد', district: 'الكرادة', phone: '07712345678', hours: '8:00 - 23:00', has_delivery: true, is_24h: false, rating: 4.6 },
  { id: 'p2', name: 'صيدلية النور', city: 'بغداد', district: 'المنصور', phone: '07812345678', hours: '24 ساعة', has_delivery: true, is_24h: true, rating: 4.8 },
  { id: 'p3', name: 'صيدلية ابن سينا', city: 'بغداد', district: 'الجادرية', phone: '07912345678', hours: '7:00 - 24:00', has_delivery: true, is_24h: false, rating: 4.5 },
  { id: 'p4', name: 'صيدلية الكرخ', city: 'بغداد', district: 'الكرخ', phone: '07701234567', hours: '8:00 - 22:00', has_delivery: false, is_24h: false, rating: 4.2 },
  { id: 'p5', name: 'صيدلية الصدر', city: 'بغداد', district: 'مدينة الصدر', phone: '07701234568', hours: '24 ساعة', has_delivery: false, is_24h: true, rating: 4.0 },
  { id: 'p6', name: 'صيدلية البصرة', city: 'البصرة', district: 'البصرة', phone: '07701111222', hours: '8:00 - 23:00', has_delivery: true, is_24h: false, rating: 4.3 },
  { id: 'p7', name: 'صيدلية أربيل', city: 'أربيل', district: 'وسط أربيل', phone: '07501234567', hours: '24 ساعة', has_delivery: true, is_24h: true, rating: 4.7 },
  { id: 'p8', name: 'صيدلية النجف', city: 'النجف', district: 'النجف', phone: '07701234570', hours: '8:00 - 22:00', has_delivery: false, is_24h: false, rating: 4.1 },
];

const CITIES = ['الكل', 'بغداد', 'البصرة', 'أربيل', 'النجف'];

export default function PharmaciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [filter, setFilter] = useState<'all' | 'delivery' | '24h'>('all');

  const filtered = useMemo(() => {
    return PHARMACIES.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'الكل' || p.city === selectedCity;
      const matchesFilter = filter === 'all' || (filter === 'delivery' && p.has_delivery) || (filter === '24h' && p.is_24h);
      return matchesSearch && matchesCity && matchesFilter;
    });
  }, [searchQuery, selectedCity, filter]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">دليل الصيدليات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{PHARMACIES.length} صيدلية · إرشاد فقط (لا بيع)</p>

        <div className="scr-info-banner">
          <Info size={14} strokeWidth={2.2} aria-hidden />
          <span>التطبيق يقدم دليلاً إرشادياً للصيدليات. لا نوفر خدمة بيع مباشر.</span>
        </div>

        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input type="search" placeholder="ابحث عن صيدلية..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="scr-filter-pills">
          {CITIES.map((city) => (
            <button key={city} type="button" onClick={() => setSelectedCity(city)} className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}>{city}</button>
          ))}
        </div>

        <div className="scr-filter-tabs">
          {([
            { id: 'all', label: 'الكل' },
            { id: 'delivery', label: 'توصيل' },
            { id: '24h', label: '٢٤ ساعة' },
          ] as const).map((tab) => (
            <button key={tab.id} type="button" onClick={() => setFilter(tab.id)} className={`scr-filter-tab ${filter === tab.id ? 'active' : ''}`}>{tab.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Search size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد نتائج</h2>
          </div>
        ) : (
          <div className="scr-list-stack">
            {filtered.map((p) => (
              <article key={p.id} className="scr-list-item">
                <div className="scr-list-item-icon" aria-hidden="true">
                  <Pill size={22} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{p.name}</div>
                  <div className="scr-list-item-meta">
                    <MapPin size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                    {p.city} · {p.district}
                  </div>
                  <div className="scr-list-item-meta">
                    <Clock size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                    {p.hours}
                  </div>
                  <div className="scr-list-item-tags">
                    {p.is_24h && <span className="scr-tag scr-tag-success">٢٤ ساعة</span>}
                    {p.has_delivery && <span className="scr-tag">توصيل</span>}
                  </div>
                  <div className="scr-list-item-actions">
                    <a href={`tel:${p.phone}`} className="scr-action-btn">
                      <Phone size={14} strokeWidth={2.2} aria-hidden />
                      <span>اتصال</span>
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(p.name + ' ' + p.district + ' ' + p.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="scr-action-btn"
                    >
                      <Map size={14} strokeWidth={2.2} aria-hidden />
                      <span>الموقع</span>
                    </a>
                    <span className="scr-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}>
                      <Star size={12} strokeWidth={2.4} fill="currentColor" aria-hidden />
                      <span>{p.rating}</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

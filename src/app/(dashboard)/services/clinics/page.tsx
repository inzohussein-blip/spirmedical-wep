'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Phone, Star, Stethoscope, Calendar,
} from 'lucide-react';

interface Clinic {
  id: string;
  doctor_name: string;
  specialty: string;
  city: string;
  district: string;
  phone: string;
  price: number;
  available_today: boolean;
  rating: number;
  experience_years: number;
}

const SPECIALTIES = ['الكل', 'باطنية', 'أطفال', 'نسائية', 'قلب', 'أعصاب', 'جلدية', 'أسنان', 'عيون'];

const CLINICS: Clinic[] = [
  { id: 'c1', doctor_name: 'د. أحمد الكاظمي', specialty: 'باطنية', city: 'بغداد', district: 'الكرادة', phone: '07712345678', price: 25000, available_today: true, rating: 4.8, experience_years: 15 },
  { id: 'c2', doctor_name: 'د. سارة الموسوي', specialty: 'أطفال', city: 'بغداد', district: 'المنصور', phone: '07812345678', price: 20000, available_today: true, rating: 4.9, experience_years: 12 },
  { id: 'c3', doctor_name: 'د. علي الحسيني', specialty: 'قلب', city: 'بغداد', district: 'الجادرية', phone: '07912345678', price: 50000, available_today: false, rating: 4.7, experience_years: 20 },
  { id: 'c4', doctor_name: 'د. زينب العبيدي', specialty: 'نسائية', city: 'بغداد', district: 'الكاظمية', phone: '07701234567', price: 30000, available_today: true, rating: 4.6, experience_years: 18 },
  { id: 'c5', doctor_name: 'د. حسن الجبوري', specialty: 'أعصاب', city: 'بغداد', district: 'الأعظمية', phone: '07701234568', price: 40000, available_today: false, rating: 4.5, experience_years: 22 },
  { id: 'c6', doctor_name: 'د. مريم الكربلائي', specialty: 'جلدية', city: 'بغداد', district: 'الكرخ', phone: '07701234569', price: 35000, available_today: true, rating: 4.7, experience_years: 10 },
  { id: 'c7', doctor_name: 'د. محمد الناصري', specialty: 'أسنان', city: 'البصرة', district: 'البصرة', phone: '07701111222', price: 25000, available_today: true, rating: 4.6, experience_years: 14 },
  { id: 'c8', doctor_name: 'د. فاطمة الأربيلي', specialty: 'عيون', city: 'أربيل', district: 'وسط أربيل', phone: '07501234567', price: 40000, available_today: true, rating: 4.8, experience_years: 16 },
];

export default function ClinicsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('الكل');
  const [filter, setFilter] = useState<'all' | 'available'>('all');

  const filtered = useMemo(() => {
    return CLINICS.filter((c) => {
      const matchesSearch = !searchQuery || c.doctor_name.includes(searchQuery) || c.specialty.includes(searchQuery);
      const matchesSpecialty = selectedSpecialty === 'الكل' || c.specialty === selectedSpecialty;
      const matchesFilter = filter === 'all' || (filter === 'available' && c.available_today);
      return matchesSearch && matchesSpecialty && matchesFilter;
    });
  }, [searchQuery, selectedSpecialty, filter]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">العيادات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{CLINICS.length} طبيب · حجز فوري</p>

        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input type="search" placeholder="ابحث عن طبيب أو اختصاص..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="scr-filter-pills">
          {SPECIALTIES.map((s) => (
            <button key={s} type="button" onClick={() => setSelectedSpecialty(s)} className={`scr-filter-pill ${selectedSpecialty === s ? 'active' : ''}`}>{s}</button>
          ))}
        </div>

        <div className="scr-filter-tabs">
          {([
            { id: 'all', label: 'الكل' },
            { id: 'available', label: 'متاح اليوم' },
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
            {filtered.map((c) => (
              <article key={c.id} className="scr-list-item">
                <div className="scr-list-item-icon" aria-hidden="true">
                  <Stethoscope size={22} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{c.doctor_name}</div>
                  <div className="scr-list-item-subtitle">{c.specialty} · خبرة {c.experience_years} سنة</div>
                  <div className="scr-list-item-meta">
                    <MapPin size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                    {c.city} · {c.district}
                  </div>
                  <div className="scr-list-item-tags">
                    {c.available_today ? <span className="scr-tag scr-tag-success">متاح اليوم</span> : <span className="scr-tag scr-tag-muted">غير متاح اليوم</span>}
                    <span className="scr-tag">
                      <Star size={11} strokeWidth={2.4} fill="currentColor" aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                      {c.rating}
                    </span>
                  </div>
                  <div className="scr-list-item-actions">
                    <Link href={`/appointments/new?clinic=${c.id}`} className="scr-action-btn scr-action-btn-primary">
                      <Calendar size={14} strokeWidth={2.2} aria-hidden />
                      <span>حجز موعد</span>
                    </Link>
                    <a href={`tel:${c.phone}`} className="scr-action-btn">
                      <Phone size={14} strokeWidth={2.2} aria-hidden />
                      <span>اتصال</span>
                    </a>
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

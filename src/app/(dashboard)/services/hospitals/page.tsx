'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, Search, MapPin, Phone, Map, Star,
  Building2, Hospital, Ribbon,
} from 'lucide-react';

type HospitalKind = 'gov' | 'private' | 'cancer';

interface Hospital {
  id: string;
  name: string;
  type: 'government' | 'private' | 'specialty';
  city: string;
  district: string;
  phone: string;
  specialties: string[];
  has_emergency: boolean;
  rating: number;
  iconKind: HospitalKind;
}

const ICON_MAP: Record<HospitalKind, LucideIcon> = {
  gov: Hospital,
  private: Building2,
  cancer: Ribbon,
};

const HOSPITALS: Hospital[] = [
  { id: 'h1',  name: 'مستشفى مدينة الطب',     type: 'government', city: 'بغداد',  district: 'الباب المعظم',   phone: '07901234567', specialties: ['عام', 'جراحة', 'قلب', 'طوارئ'],         has_emergency: true,  rating: 4.2, iconKind: 'gov' },
  { id: 'h2',  name: 'مستشفى ابن البلدي',     type: 'government', city: 'بغداد',  district: 'الباب الشرقي',    phone: '07901234568', specialties: ['عام', 'أطفال', 'نسائية'],              has_emergency: true,  rating: 4.0, iconKind: 'gov' },
  { id: 'h3',  name: 'المستشفى التركي',       type: 'private',    city: 'بغداد',  district: 'الكرادة',         phone: '07712345678', specialties: ['عام', 'جراحة تجميل', 'قلب'],           has_emergency: true,  rating: 4.7, iconKind: 'private' },
  { id: 'h4',  name: 'مستشفى الكندي',         type: 'private',    city: 'بغداد',  district: 'المنصور',          phone: '07812345678', specialties: ['عام', 'أطفال', 'نسائية', 'أعصاب'],     has_emergency: true,  rating: 4.5, iconKind: 'private' },
  { id: 'h5',  name: 'مستشفى ابن سينا',       type: 'private',    city: 'بغداد',  district: 'الجادرية',         phone: '07912345678', specialties: ['عام', 'قلب', 'كلى', 'سرطان'],          has_emergency: true,  rating: 4.6, iconKind: 'private' },
  { id: 'h6',  name: 'مركز الشهيد الصدر',     type: 'government', city: 'بغداد',  district: 'مدينة الصدر',      phone: '07701234567', specialties: ['عام', 'طوارئ'],                        has_emergency: true,  rating: 3.8, iconKind: 'gov' },
  { id: 'h7',  name: 'مستشفى البصرة التعليمي', type: 'government', city: 'البصرة', district: 'البصرة',           phone: '07901111222', specialties: ['عام', 'جراحة', 'سرطان'],               has_emergency: true,  rating: 4.1, iconKind: 'gov' },
  { id: 'h8',  name: 'مستشفى أربيل الأهلي',   type: 'private',    city: 'أربيل',  district: 'وسط أربيل',        phone: '07501234567', specialties: ['عام', 'قلب', 'أعصاب'],                 has_emergency: true,  rating: 4.4, iconKind: 'private' },
  { id: 'h9',  name: 'مستشفى الكاظمية التعليمي', type: 'government', city: 'بغداد', district: 'الكاظمية',         phone: '07701234568', specialties: ['عام', 'جراحة'],                        has_emergency: true,  rating: 3.9, iconKind: 'gov' },
  { id: 'h10', name: 'مستشفى الموصل العام',   type: 'government', city: 'الموصل', district: 'الموصل',           phone: '07701234569', specialties: ['عام', 'طوارئ', 'جراحة'],               has_emergency: true,  rating: 3.7, iconKind: 'gov' },
  { id: 'h11', name: 'مركز السرطان النخبة',   type: 'specialty',  city: 'بغداد',  district: 'الكرخ',            phone: '07712345679', specialties: ['سرطان', 'علاج كيميائي'],               has_emergency: false, rating: 4.8, iconKind: 'cancer' },
  { id: 'h12', name: 'مستشفى النجف العام',    type: 'government', city: 'النجف',  district: 'النجف',            phone: '07701234570', specialties: ['عام', 'أطفال', 'نسائية'],              has_emergency: true,  rating: 4.0, iconKind: 'gov' },
];

const CITIES = ['الكل', 'بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف'];

export default function HospitalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedType, setSelectedType] = useState<'all' | 'government' | 'private' | 'specialty'>('all');

  const filtered = useMemo(() => {
    return HOSPITALS.filter((h) => {
      const matchesSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.specialties.some((s) => s.includes(searchQuery));
      const matchesCity = selectedCity === 'الكل' || h.city === selectedCity;
      const matchesType = selectedType === 'all' || h.type === selectedType;
      return matchesSearch && matchesCity && matchesType;
    });
  }, [searchQuery, selectedCity, selectedType]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">المستشفيات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{HOSPITALS.length} مستشفى · دليل ومعلومات</p>

        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input type="search" placeholder="ابحث عن مستشفى أو اختصاص..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="scr-filter-pills">
          {CITIES.map((city) => (
            <button key={city} type="button" onClick={() => setSelectedCity(city)} className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}>{city}</button>
          ))}
        </div>

        <div className="scr-filter-tabs">
          {([
            { id: 'all', label: 'الكل' },
            { id: 'government', label: 'حكومي' },
            { id: 'private', label: 'أهلي' },
            { id: 'specialty', label: 'تخصصي' },
          ] as const).map((tab) => (
            <button key={tab.id} type="button" onClick={() => setSelectedType(tab.id)} className={`scr-filter-tab ${selectedType === tab.id ? 'active' : ''}`}>{tab.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Search size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد نتائج</h2>
            <p className="scr-empty-desc">جرّب كلمات بحث مختلفة</p>
          </div>
        ) : (
          <div className="scr-list-stack">
            {filtered.map((h) => {
              const Icon = ICON_MAP[h.iconKind];
              return (
                <article key={h.id} className="scr-list-item">
                  <div className="scr-list-item-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">{h.name}</div>
                    <div className="scr-list-item-meta">
                      <MapPin size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                      {h.city} · {h.district}
                    </div>
                    <div className="scr-list-item-tags">
                      {h.specialties.slice(0, 3).map((s) => (<span key={s} className="scr-tag">{s}</span>))}
                      {h.has_emergency && <span className="scr-tag scr-tag-emergency">طوارئ ٢٤/٧</span>}
                    </div>
                    <div className="scr-list-item-actions">
                      <a href={`tel:${h.phone}`} className="scr-action-btn">
                        <Phone size={14} strokeWidth={2.2} aria-hidden />
                        <span>اتصال</span>
                      </a>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(h.name + ' ' + h.district + ' ' + h.city)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="scr-action-btn"
                      >
                        <Map size={14} strokeWidth={2.2} aria-hidden />
                        <span>الموقع</span>
                      </a>
                      <span className="scr-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}>
                        <Star size={12} strokeWidth={2.4} fill="currentColor" aria-hidden />
                        <span>{h.rating}</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

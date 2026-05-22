'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Phone, Star, Pill, Clock, Info,
  ChevronLeft, Package,
} from 'lucide-react';
import ExternalMapButton from '@/components/maps/ExternalMapButton';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  phone: string;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
  has_delivery: boolean;
  has_emergency_section: boolean;
  rating_avg: number;
  rating_count: number;
  is_verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface Props {
  pharmacies: Pharmacy[];
}

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function PharmaciesClient({ pharmacies }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [filter, setFilter] = useState<'all' | 'emergency' | '24h'>('all');

  const filtered = useMemo(() => {
    return pharmacies.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'الكل' || p.city === selectedCity;
      const matchesFilter =
        filter === 'all' ||
        (filter === '24h' && p.is_24h) ||
        (filter === 'emergency' && p.has_emergency_section);
      return matchesSearch && matchesCity && matchesFilter;
    });
  }, [pharmacies, searchQuery, selectedCity, filter]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">دليل الصيدليات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {pharmacies.length} صيدلية · إرشاد فقط (لا بيع)
        </p>

        {/* Info banner */}
        <div className="scr-info-banner">
          <Info size={14} strokeWidth={2.2} aria-hidden />
          <span>اضغط على الصيدلية للبحث عن دواء معيّن وتأكد من توفّره</span>
        </div>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن صيدلية أو منطقة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* City filters */}
        <div className="scr-filter-pills">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="scr-filter-tabs">
          {(
            [
              { id: 'all', label: 'الكل' },
              { id: '24h', label: '٢٤ ساعة' },
              { id: 'emergency', label: 'قسم طوارئ' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`scr-filter-tab ${filter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick "search by medication" CTA */}
        <Link
          href="/services/pharmacies/search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            background: 'linear-gradient(135deg, var(--emerald) 0%, var(--emerald-deep) 100%)',
            color: 'var(--paper-3)',
            borderRadius: 14,
            textDecoration: 'none',
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(15, 107, 88, 0.2)',
          }}
        >
          <Package size={22} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>
              بحث عن دواء معيّن
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              ابحث وستظهر لك الصيدليات التي يتوفر فيها
            </div>
          </div>
          <ChevronLeft size={20} />
        </Link>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Search size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد نتائج</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              {pharmacies.length === 0
                ? 'لم تُسجّل صيدليات بعد'
                : 'جرّب تغيير الفلاتر'}
            </p>
          </div>
        ) : (
          <div className="scr-list-stack">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/services/pharmacies/${p.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  className="scr-list-item"
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="scr-list-item-icon" aria-hidden="true">
                    <Pill size={22} strokeWidth={2} />
                  </div>
                  <div className="scr-list-item-content">
                    <div
                      className="scr-list-item-title"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{p.name}</span>
                      {p.is_verified && (
                        <span
                          title="موثّقة"
                          style={{
                            fontSize: 10,
                            background: 'var(--emerald-soft)',
                            color: 'var(--emerald)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 800,
                          }}
                        >
                          ✓ موثّقة
                        </span>
                      )}
                    </div>
                    <div className="scr-list-item-meta">
                      <MapPin
                        size={12}
                        strokeWidth={2.2}
                        aria-hidden
                        style={{ verticalAlign: '-2px', marginLeft: 2 }}
                      />
                      {p.city} · {p.district}
                    </div>
                    <div className="scr-list-item-meta">
                      <Clock
                        size={12}
                        strokeWidth={2.2}
                        aria-hidden
                        style={{ verticalAlign: '-2px', marginLeft: 2 }}
                      />
                      {p.is_24h
                        ? '٢٤ ساعة'
                        : p.opens_at && p.closes_at
                          ? `${p.opens_at.slice(0, 5)} - ${p.closes_at.slice(0, 5)}`
                          : 'ساعات العمل غير محددة'}
                    </div>
                    <div className="scr-list-item-tags">
                      {p.is_24h && (
                        <span className="scr-tag scr-tag-success">٢٤ ساعة</span>
                      )}
                      {p.has_emergency_section && (
                        <span className="scr-tag">قسم طوارئ</span>
                      )}
                    </div>
                    <div
                      className="scr-list-item-actions"
                      onClick={(e) => e.preventDefault()}
                    >
                      <a
                        href={`tel:${p.phone}`}
                        className="scr-action-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={14} strokeWidth={2.2} aria-hidden />
                        <span>اتصال</span>
                      </a>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ExternalMapButton
                          lat={p.latitude}
                          lng={p.longitude}
                          label={p.name}
                          description={`${p.city} · ${p.district}`}
                          variant="compact"
                        />
                      </div>
                      {p.rating_count > 0 && (
                        <span
                          className="scr-tag"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 10px',
                          }}
                        >
                          <Star
                            size={12}
                            strokeWidth={2.4}
                            fill="currentColor"
                            aria-hidden
                          />
                          <span>{p.rating_avg.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

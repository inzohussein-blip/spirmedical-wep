'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Search, MapPin, Phone, Star,
  CheckCircle2, Eye,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import ExternalMapButton from '@/components/maps/ExternalMapButton';

interface Store {
  id: string;
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  brands: string[];
  exam_price: number;
  offers_eye_exam: boolean;
  offers_contact_lenses: boolean;
  frame_price_min: number;
  frame_price_max: number;
  lens_price_min: number;
  lens_price_max: number;
  rating_avg: number;
  rating_count: number;
  is_verified: boolean;
  is_featured: boolean;
  working_hours: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function OpticalClient({ stores }: { stores: Store[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [examOnly, setExamOnly] = useState(false);
  const [contactLensesOnly, setContactLensesOnly] = useState(false);

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'الكل' || s.city === selectedCity;
      const matchesExam = !examOnly || s.offers_eye_exam;
      const matchesLenses = !contactLensesOnly || s.offers_contact_lenses;
      return matchesSearch && matchesCity && matchesExam && matchesLenses;
    });
  }, [stores, searchQuery, selectedCity, examOnly, contactLensesOnly]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">النظارات الطبية</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{stores.length} متجر متخصّص</p>

        <div className="scr-search">
          <div className="scr-search-icon"><Search size={16} strokeWidth={2.4} /></div>
          <input
            type="search"
            placeholder="ابحث عن متجر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="scr-filter-pills">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => { haptic.selection(); setSelectedCity(city); }}
              className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Quick filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => { haptic.selection(); setExamOnly(!examOnly); }}
            style={pillStyle(examOnly)}
          >
            👁️ يقدّم فحص نظر
          </button>
          <button
            type="button"
            onClick={() => { haptic.selection(); setContactLensesOnly(!contactLensesOnly); }}
            style={pillStyle(contactLensesOnly)}
          >
            👁️‍🗨️ عدسات لاصقة
          </button>
        </div>

        <div style={{
          background: 'var(--amber-soft)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
        }}>
          💡 <strong>اختر بحكمة:</strong> الإطار الجيد يدوم 3+ سنوات. الفحص الدوري كل سنتين موصى به.
        </div>

        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">👓</div>
            <h2 className="scr-empty-title">لا توجد متاجر</h2>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function StoreCard({ store }: { store: Store }) {
  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 14,
        position: 'relative',
        borderInlineStartWidth: store.is_featured ? 4 : 1,
        borderInlineStartStyle: 'solid',
        borderInlineStartColor: store.is_featured ? 'var(--amber)' : 'var(--line)',
      }}
    >
      {store.is_featured && (
        <div style={{
          position: 'absolute',
          top: 10,
          insetInlineEnd: 10,
          background: 'var(--amber)',
          color: 'var(--paper-3)',
          padding: '2px 8px',
          borderRadius: 100,
          fontSize: 9,
          fontWeight: 900,
        }}>
          ⭐ مميّز
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'var(--amber-soft)',
          fontSize: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          👓
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{store.name}</h3>
            {store.is_verified && <CheckCircle2 size={13} color="var(--emerald)" />}
          </div>

          {store.description && (
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 4px', lineHeight: 1.5 }}>
              {store.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MapPin size={10} />
              {store.city}{store.district ? ` · ${store.district}` : ''}
            </span>
            {store.rating_count > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={10} fill="var(--amber)" color="var(--amber)" />
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{store.rating_avg.toFixed(1)}</span>
                  ({store.rating_count})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Brands */}
      {store.brands.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {store.brands.slice(0, 5).map((b, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                padding: '3px 8px',
                background: 'var(--paper-3)',
                borderRadius: 100,
                color: 'var(--ink-2)',
                fontWeight: 700,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Pricing */}
      <div style={{
        background: 'var(--paper-3)',
        borderRadius: 8,
        padding: '8px 10px',
        marginBottom: 10,
        fontSize: 10,
        color: 'var(--ink-2)',
        lineHeight: 1.7,
      }}>
        {store.offers_eye_exam && (
          <>👁️ <strong>فحص نظر:</strong> {store.exam_price.toLocaleString('ar-IQ')} د.ع<br /></>
        )}
        🖼️ <strong>إطارات:</strong> {store.frame_price_min.toLocaleString('ar-IQ')} - {store.frame_price_max.toLocaleString('ar-IQ')} د.ع
        <br />
        🔍 <strong>عدسات:</strong> {store.lens_price_min.toLocaleString('ar-IQ')} - {store.lens_price_max.toLocaleString('ar-IQ')} د.ع
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Primary CTA: Book via Spir */}
        <Link
          href={`/services/booking?service=optical&id=${store.id}`}
          onClick={() => haptic.medium()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '10px 14px',
            background: 'var(--amber)',
            color: 'var(--paper-3)',
            borderRadius: 10,
            textDecoration: 'none',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          📅 احجز زيارة عبر سباير
        </Link>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              onClick={() => haptic.light()}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--white)',
                color: 'var(--amber)',
                border: '1px solid var(--amber)',
                borderRadius: 10,
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Phone size={12} />
              اتصل
            </a>
          )}
          {store.phone && (
            <a
              href={`https://wa.me/${store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم - أود الاستفسار عبر Spir Medical')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.light()}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--white)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              💬 WhatsApp
            </a>
          )}
          <ExternalMapButton
            lat={store.latitude}
            lng={store.longitude}
            label={store.name}
            description={`${store.city}${store.district ? ' · ' + store.district : ''}`}
            variant="compact"
          />
        </div>
      </div>
    </article>
  );
}

function pillStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: isActive ? 'var(--amber)' : 'var(--white)',
    color: isActive ? 'var(--paper-3)' : 'var(--ink-2)',
    border: '1px solid',
    borderColor: isActive ? 'var(--amber)' : 'var(--line)',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flex: 1,
  };
}

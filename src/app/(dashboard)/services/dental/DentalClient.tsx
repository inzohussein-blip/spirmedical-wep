'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Search, MapPin, Phone, Star,
  CheckCircle2, Sparkles, Award, Users,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import ExternalMapButton from '@/components/maps/ExternalMapButton';

interface DentalClinic {
  id: string;
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  specialties: string[];
  doctor_count: number;
  cleaning_price_min: number;
  cleaning_price_max: number;
  implant_price_min: number;
  implant_price_max: number;
  offers_implants: boolean;
  offers_orthodontics: boolean;
  offers_whitening: boolean;
  offers_pediatric: boolean;
  offers_emergency: boolean;
  rating_avg: number;
  rating_count: number;
  is_verified: boolean;
  is_featured: boolean;
  working_hours: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Props {
  clinics: DentalClinic[];
}

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

const SERVICE_FILTERS = [
  { id: 'all', label: 'الكل', icon: '🦷' },
  { id: 'implants', label: 'زراعة', icon: '🔩' },
  { id: 'orthodontics', label: 'تقويم', icon: '🦷' },
  { id: 'whitening', label: 'تبييض', icon: '✨' },
  { id: 'pediatric', label: 'أطفال', icon: '👶' },
  { id: 'emergency', label: 'طوارئ', icon: '🚨' },
];

export default function DentalClient({ clinics }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedService, setSelectedService] = useState('all');

  const filtered = useMemo(() => {
    return clinics.filter((c) => {
      const matchesSearch = !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = selectedCity === 'الكل' || c.city === selectedCity;

      const matchesService =
        selectedService === 'all' ||
        (selectedService === 'implants' && c.offers_implants) ||
        (selectedService === 'orthodontics' && c.offers_orthodontics) ||
        (selectedService === 'whitening' && c.offers_whitening) ||
        (selectedService === 'pediatric' && c.offers_pediatric) ||
        (selectedService === 'emergency' && c.offers_emergency);

      return matchesSearch && matchesCity && matchesService;
    });
  }, [clinics, searchQuery, selectedCity, selectedService]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">طب الأسنان</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {clinics.length} عيادة في 6 محافظات
        </p>

        {/* Search */}
        <div className="scr-search">
          <div className="scr-search-icon">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن عيادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Cities */}
        <div className="scr-filter-pills">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                haptic.selection();
                setSelectedCity(city);
              }}
              className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Service filters */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginBottom: 14,
          paddingBottom: 4,
        }}>
          {SERVICE_FILTERS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                haptic.selection();
                setSelectedService(s.id);
              }}
              style={{
                padding: '8px 14px',
                background: selectedService === s.id ? 'var(--emerald)' : 'var(--white)',
                color: selectedService === s.id ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: selectedService === s.id ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
        }}>
          💡 <strong>نصيحة:</strong> الأسعار قابلة للنقاش - تواصل مع العيادة مباشرة.
          الحجز عبر سباير يضمن لك تقييمات حقيقية + خصومات أحياناً 🎁
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">🦷</div>
            <h2 className="scr-empty-title">لا توجد عيادات</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              جرّب فلتر آخر
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((c) => (
              <ClinicCard key={c.id} clinic={c} />
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function ClinicCard({ clinic }: { clinic: DentalClinic }) {
  const services = [
    clinic.offers_implants && { label: 'زراعة', icon: '🔩' },
    clinic.offers_orthodontics && { label: 'تقويم', icon: '🦷' },
    clinic.offers_whitening && { label: 'تبييض', icon: '✨' },
    clinic.offers_pediatric && { label: 'أطفال', icon: '👶' },
    clinic.offers_emergency && { label: 'طوارئ', icon: '🚨' },
  ].filter(Boolean) as { label: string; icon: string }[];

  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 14,
        position: 'relative',
        borderInlineStartWidth: clinic.is_featured ? 4 : 1,
        borderInlineStartStyle: 'solid',
        borderInlineStartColor: clinic.is_featured ? 'var(--amber)' : 'var(--line)',
      }}
    >
      {clinic.is_featured && (
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
          background: 'var(--emerald-soft)',
          fontSize: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          🦷
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              {clinic.name}
            </h3>
            {clinic.is_verified && <CheckCircle2 size={13} color="var(--emerald)" />}
          </div>

          {clinic.description && (
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 4px', lineHeight: 1.5 }}>
              {clinic.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MapPin size={10} />
              {clinic.city}{clinic.district ? ` · ${clinic.district}` : ''}
            </span>
            {clinic.doctor_count > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Users size={10} />
                  {clinic.doctor_count} طبيب
                </span>
              </>
            )}
            {clinic.rating_count > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={10} fill="var(--amber)" color="var(--amber)" />
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                    {clinic.rating_avg.toFixed(1)}
                  </span>
                  ({clinic.rating_count})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {services.map((s, i) => (
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
              {s.icon} {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Pricing summary */}
      <div style={{
        background: 'var(--paper-3)',
        borderRadius: 8,
        padding: '8px 10px',
        marginBottom: 10,
        fontSize: 10,
        color: 'var(--ink-2)',
        lineHeight: 1.6,
      }}>
        💰 <strong>تنظيف:</strong> {clinic.cleaning_price_min.toLocaleString('ar-IQ')} - {clinic.cleaning_price_max.toLocaleString('ar-IQ')} د.ع
        {clinic.offers_implants && (
          <>
            <br />
            🔩 <strong>زراعة:</strong> {clinic.implant_price_min.toLocaleString('ar-IQ')} - {clinic.implant_price_max.toLocaleString('ar-IQ')} د.ع
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Primary CTA: Book via Spir */}
        <Link
          href={`/services/booking?service=dental&id=${clinic.id}`}
          onClick={() => haptic.medium()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '10px 14px',
            background: 'var(--emerald)',
            color: 'var(--paper-3)',
            borderRadius: 10,
            textDecoration: 'none',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          📅 احجز موعد عبر سباير
        </Link>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              onClick={() => haptic.light()}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--white)',
                color: 'var(--emerald)',
                border: '1px solid var(--emerald)',
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
          {clinic.phone && (
            <a
              href={`https://wa.me/${clinic.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم - أود حجز موعد عبر Spir Medical')}`}
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
            lat={clinic.latitude}
            lng={clinic.longitude}
            label={clinic.name}
            description={`${clinic.city}${clinic.district ? ' · ' + clinic.district : ''}`}
            variant="compact"
          />
        </div>
      </div>
    </article>
  );
}

'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Phone, Star, Stethoscope,
  Building2, Calendar, CheckCircle2, Clock, Languages,
} from 'lucide-react';
import ExternalMapButton from '@/components/maps/ExternalMapButton';

interface Doctor {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  specialty: string;
  sub_specialty: string | null;
  years_experience: number;
  available_for_clinic: boolean;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_city: string | null;
  clinic_phone: string | null;
  home_visit_price: number;
  languages: string[];
  rating_avg: number;
  rating_count: number;
  is_verified: boolean;
  // 🔧 V31: أسماء الأعمدة الفعلية في جدول doctors (clinic_lat/clinic_lng)
  clinic_lat?: number | null;
  clinic_lng?: number | null;
}

interface Props {
  doctors: Doctor[];
}

const SPECIALTIES_FILTER = [
  { id: '',                 label: 'الكل', emoji: '⚕️' },
  { id: 'family_medicine',  label: 'طب عائلة', emoji: '👨‍👩‍👧‍👦' },
  { id: 'pediatrics',       label: 'أطفال', emoji: '👶' },
  { id: 'internal',         label: 'باطنية', emoji: '🩺' },
  { id: 'cardiology',       label: 'قلبية', emoji: '❤️' },
  { id: 'gynecology',       label: 'نسائية', emoji: '👩' },
  { id: 'orthopedics',      label: 'عظام', emoji: '🦴' },
  { id: 'dermatology',      label: 'جلدية', emoji: '🧴' },
  { id: 'psychiatry',       label: 'نفسية', emoji: '🧠' },
];

const SPECIALTY_LABELS: Record<string, string> = {
  family_medicine: 'طب عائلة',
  pediatrics: 'أطفال',
  internal: 'باطنية',
  cardiology: 'قلبية',
  gynecology: 'نسائية',
  orthopedics: 'عظام',
  dermatology: 'جلدية',
  psychiatry: 'نفسية',
  general: 'طب عام',
};

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function ClinicsClient({ doctors }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch = !searchQuery ||
        d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpec = !selectedSpec || d.specialty === selectedSpec;
      const matchesCity = selectedCity === 'الكل' || d.clinic_city === selectedCity;
      return matchesSearch && matchesSpec && matchesCity;
    });
  }, [doctors, searchQuery, selectedSpec, selectedCity]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">العيادات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {doctors.length} عيادة · حجز موعد بسيط
        </p>

        {/* Info banner */}
        <div
          style={{
            background: 'var(--amber-soft)',
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
            fontSize: 11,
            color: 'var(--ink-2)',
            display: 'flex',
            gap: 8,
          }}
        >
          <Stethoscope size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            هذه العيادات تستقبل المرضى مباشرة. للزيارة المنزلية أو الاشتراك، تفضّل بـ
            <Link href="/services/doctors" style={{ color: 'var(--amber)', fontWeight: 800, marginInlineStart: 4 }}>
              طبيب العائلة
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن طبيب أو عيادة..."
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
              onClick={() => setSelectedCity(city)}
              className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Specialties */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginBottom: 14,
            paddingBottom: 4,
          }}
        >
          {SPECIALTIES_FILTER.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedSpec(spec.id)}
              style={{
                padding: '8px 14px',
                background: selectedSpec === spec.id ? 'var(--emerald)' : 'var(--white)',
                color: selectedSpec === spec.id ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: selectedSpec === spec.id ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {spec.emoji} {spec.label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Building2 size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">
              {doctors.length === 0 ? 'لم تُسجّل عيادات بعد' : 'لا توجد نتائج'}
            </h2>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((d) => (
              <Link
                key={d.id}
                href={`/services/doctors/${d.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        background: 'var(--emerald-soft)',
                        color: 'var(--emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        flexShrink: 0,
                      }}
                    >
                      🏛️
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {d.clinic_name && (
                        <div style={{
                          fontSize: 13,
                          fontWeight: 900,
                          marginBottom: 2,
                        }}>
                          {d.clinic_name}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
                          {d.title} {d.full_name}
                        </span>
                        {d.is_verified && (
                          <CheckCircle2 size={11} color="var(--emerald)" />
                        )}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {SPECIALTY_LABELS[d.specialty] || d.specialty}
                        {d.years_experience > 0 && ` · ${d.years_experience} سنة خبرة`}
                      </div>

                      {d.clinic_address && (
                        <div style={{
                          fontSize: 10,
                          color: 'var(--ink-3)',
                          marginTop: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          <MapPin size={10} />
                          {d.clinic_address}
                        </div>
                      )}

                      {d.rating_count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          <Star size={11} fill="var(--amber)" color="var(--amber)" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--amber)' }}>
                            {d.rating_avg.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                            ({d.rating_count})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    {d.clinic_phone && (
                      <a
                        href={`tel:${d.clinic_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          padding: 8,
                          background: 'var(--paper-3)',
                          color: 'var(--emerald)',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <Phone size={12} />
                        اتصال
                      </a>
                    )}
                    {d.clinic_lat && d.clinic_lng && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <ExternalMapButton
                          lat={d.clinic_lat}
                          lng={d.clinic_lng}
                          label={d.clinic_name || d.full_name}
                          description={d.clinic_address || d.clinic_city || ''}
                          variant="compact"
                        />
                      </div>
                    )}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: 8,
                        background: 'var(--emerald)',
                        color: 'var(--paper-3)',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      <Calendar size={12} />
                      حجز موعد
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

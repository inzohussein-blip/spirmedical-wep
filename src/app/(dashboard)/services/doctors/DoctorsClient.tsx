'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Star, Stethoscope, Video,
  Home, Building2, Languages, Award, CheckCircle2, Clock,
} from 'lucide-react';

interface Doctor {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  specialty: string;
  sub_specialty: string | null;
  years_experience: number;
  available_for_home_visit: boolean;
  available_for_video: boolean;
  available_for_clinic: boolean;
  home_visit_price: number;
  video_consult_price: number;
  monthly_subscription_price: number | null;
  clinic_city: string | null;
  languages: string[];
  rating_avg: number;
  rating_count: number;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface Props {
  doctors: Doctor[];
}

const SPECIALTIES: Record<string, { label: string; emoji: string }> = {
  family_medicine: { label: 'طب عائلة', emoji: '👨‍👩‍👧‍👦' },
  pediatrics: { label: 'أطفال', emoji: '👶' },
  internal: { label: 'باطنية', emoji: '🩺' },
  cardiology: { label: 'قلبية', emoji: '❤️' },
  gynecology: { label: 'نسائية', emoji: '👩' },
  orthopedics: { label: 'عظام', emoji: '🦴' },
  dermatology: { label: 'جلدية', emoji: '🧴' },
  psychiatry: { label: 'نفسية', emoji: '🧠' },
  general: { label: 'طب عام', emoji: '⚕️' },
};

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function DoctorsClient({ doctors }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState('الكل');

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch = !searchQuery ||
        d.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpec = !selectedSpecialty || d.specialty === selectedSpecialty;
      const matchesCity = selectedCity === 'الكل' || d.clinic_city === selectedCity;
      return matchesSearch && matchesSpec && matchesCity;
    });
  }, [doctors, searchQuery, selectedSpecialty, selectedCity]);

  const presentSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach(d => set.add(d.specialty));
    return Array.from(set);
  }, [doctors]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">أطباء العائلة</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {doctors.length} طبيب · زيارات منزلية + فيديو
        </p>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن طبيب..."
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
        {presentSpecialties.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              marginBottom: 14,
              paddingBottom: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedSpecialty('')}
              style={{
                padding: '8px 14px',
                background: !selectedSpecialty ? 'var(--emerald)' : 'var(--white)',
                color: !selectedSpecialty ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: !selectedSpecialty ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              كل التخصصات
            </button>
            {presentSpecialties.map(spec => {
              const meta = SPECIALTIES[spec] || { label: spec, emoji: '⚕️' };
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  style={{
                    padding: '8px 14px',
                    background: selectedSpecialty === spec ? 'var(--emerald)' : 'var(--white)',
                    color: selectedSpecialty === spec ? 'var(--paper-3)' : 'var(--ink-2)',
                    border: '1px solid',
                    borderColor: selectedSpecialty === spec ? 'var(--emerald)' : 'var(--line)',
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Stethoscope size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">
              {doctors.length === 0 ? 'لم يُسجّل أطباء بعد' : 'لا توجد نتائج'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              {doctors.length === 0 ? 'سنُضيف أطباء قريباً' : 'جرّب فلتراً مختلفاً'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((d) => {
              const specMeta = SPECIALTIES[d.specialty];
              return (
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
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: d.gender === 'female' ? '#FDE7E9' : 'var(--emerald-soft)',
                          color: d.gender === 'female' ? '#C2185B' : 'var(--emerald)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {d.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          d.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>
                            {d.title} {d.full_name}
                          </h3>
                          {d.is_verified && (
                            <CheckCircle2 size={14} color="var(--emerald)" fill="var(--emerald-soft)" />
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                          {specMeta?.emoji} {specMeta?.label || d.specialty}
                          {d.sub_specialty && ` · ${d.sub_specialty}`}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 4,
                            marginTop: 6,
                            fontSize: 10,
                          }}
                        >
                          {d.years_experience > 0 && (
                            <span style={tagStyle()}>
                              <Award size={10} style={{ display: 'inline', verticalAlign: -1 }} />
                              {' '}{d.years_experience} سنة خبرة
                            </span>
                          )}
                          {d.clinic_city && (
                            <span style={tagStyle()}>
                              <MapPin size={10} style={{ display: 'inline', verticalAlign: -1 }} />
                              {' '}{d.clinic_city}
                            </span>
                          )}
                          {d.languages.length > 0 && (
                            <span style={tagStyle()}>
                              <Languages size={10} style={{ display: 'inline', verticalAlign: -1 }} />
                              {' '}{d.languages.join('/')}
                            </span>
                          )}
                        </div>

                        {/* Rating */}
                        {d.rating_count > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 6,
                            }}
                          >
                            <Star size={12} fill="var(--amber)" color="var(--amber)" />
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--amber)' }}>
                              {d.rating_avg.toFixed(1)}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                              ({d.rating_count} تقييم)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Services available */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      {d.available_for_home_visit && (
                        <div style={serviceTag()}>
                          <Home size={12} />
                          <span>{d.home_visit_price.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                      )}
                      {d.available_for_video && (
                        <div style={serviceTag()}>
                          <Video size={12} />
                          <span>{d.video_consult_price.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                      )}
                      {d.monthly_subscription_price && (
                        <div
                          style={{
                            ...serviceTag(),
                            background: 'var(--emerald-soft)',
                            color: 'var(--emerald)',
                          }}
                        >
                          <Star size={12} fill="currentColor" />
                          <span>اشتراك {d.monthly_subscription_price.toLocaleString('ar-IQ')}/شهر</span>
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function tagStyle(): React.CSSProperties {
  return {
    fontSize: 10,
    padding: '3px 8px',
    background: 'var(--paper-3)',
    color: 'var(--ink-3)',
    borderRadius: 6,
    fontWeight: 700,
  };
}

function serviceTag(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    background: 'var(--paper-3)',
    color: 'var(--ink-2)',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
  };
}

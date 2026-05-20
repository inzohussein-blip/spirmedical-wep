'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Search, MapPin, Star, Activity,
  Clock, CheckCircle2, Award, Home, Building2, Phone,
} from 'lucide-react';

interface ServiceType {
  id: string;
  slug: string;
  name_ar: string;
  description: string | null;
  icon: string;
  base_price: number;
  session_duration_minutes: number;
  recommended_sessions: number;
  conditions: string[];
}

interface Specialist {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  bio: string | null;
  years_experience: number;
  specialties: string[];
  certifications: string[];
  languages: string[];
  cities: string[];
  home_visit_price: number;
  clinic_visit_price: number;
  rating_avg: number;
  rating_count: number;
  total_sessions: number;
  is_verified: boolean;
  available_for_home: boolean;
  available_for_clinic: boolean;
  clinic_name: string | null;
  clinic_city: string | null;
}

interface Props {
  serviceTypes: ServiceType[];
  specialists: Specialist[];
}

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function PhysioClient({ serviceTypes, specialists }: Props) {
  const [view, setView] = useState<'types' | 'specialists'>('types');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((s) => {
      const matchesType = selectedType === 'all' || s.specialties.includes(selectedType);
      const matchesSearch = !searchQuery ||
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'الكل' || s.cities.includes(selectedCity);
      return matchesType && matchesSearch && matchesCity;
    });
  }, [specialists, selectedType, searchQuery, selectedCity]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">العلاج الفيزيائي</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {serviceTypes.length} نوع · {specialists.length} أخصائي
        </p>

        {/* View toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--paper-3)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 14,
        }}>
          <button
            type="button"
            onClick={() => setView('types')}
            style={toggleStyle(view === 'types')}
          >
            🦾 الخدمات
          </button>
          <button
            type="button"
            onClick={() => setView('specialists')}
            style={toggleStyle(view === 'specialists')}
          >
            👨‍⚕️ الأخصائيون
          </button>
        </div>

        {view === 'types' ? (
          <ServiceTypesView
            types={serviceTypes}
            onSelectType={(slug) => {
              setSelectedType(slug);
              setView('specialists');
            }}
          />
        ) : (
          <SpecialistsView
            specialists={filteredSpecialists}
            serviceTypes={serviceTypes}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
          />
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '10px 16px',
    background: active ? 'var(--white)' : 'transparent',
    color: active ? 'var(--emerald)' : 'var(--ink-3)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 800,
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  };
}

function ServiceTypesView({
  types, onSelectType,
}: {
  types: ServiceType[];
  onSelectType: (slug: string) => void;
}) {
  return (
    <>
      {/* Info banner */}
      <div
        style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
        }}
      >
        💡 <strong>زيارة منزلية:</strong> الأخصائي يأتي لبيتك.
        الجلسة من 45-60 دقيقة. الدفع كاش للأخصائي بعد الجلسة.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {types.map((t) => (
          <article
            key={t.id}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--emerald-soft)',
                fontSize: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {t.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>
                  {t.name_ar}
                </h3>
                {t.description && (
                  <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                    {t.description}
                  </p>
                )}
              </div>
            </div>

            {/* Conditions */}
            {t.conditions.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 4 }}>
                  يُعالج:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {t.conditions.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        background: 'var(--paper-3)',
                        borderRadius: 100,
                        color: 'var(--ink-2)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div style={{
              display: 'flex',
              gap: 10,
              fontSize: 10,
              color: 'var(--ink-3)',
              marginBottom: 10,
              flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={11} />
                {t.session_duration_minutes} دقيقة
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Activity size={11} />
                ~{t.recommended_sessions} جلسات موصى بها
              </span>
              <span>·</span>
              <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                من {t.base_price.toLocaleString('ar-IQ')} د.ع
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectType(t.slug)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              عرض الأخصائيين →
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function SpecialistsView({
  specialists, serviceTypes, selectedType, setSelectedType,
  searchQuery, setSearchQuery, selectedCity, setSelectedCity,
}: {
  specialists: Specialist[];
  serviceTypes: ServiceType[];
  selectedType: string;
  setSelectedType: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
}) {
  return (
    <>
      {/* Search */}
      <div className="scr-search" style={{ marginBottom: 12 }}>
        <div className="scr-search-icon">
          <Search size={16} strokeWidth={2.4} />
        </div>
        <input
          type="search"
          placeholder="ابحث عن أخصائي..."
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

      {/* Service type filter */}
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
          onClick={() => setSelectedType('all')}
          style={pillStyle(selectedType === 'all')}
        >
          🦾 الكل
        </button>
        {serviceTypes.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setSelectedType(t.slug)}
            style={pillStyle(selectedType === t.slug)}
          >
            {t.icon} {t.name_ar}
          </button>
        ))}
      </div>

      {/* List */}
      {specialists.length === 0 ? (
        <div className="scr-empty" style={{ marginTop: 32 }}>
          <div className="scr-empty-icon">
            <Activity size={42} strokeWidth={1.5} />
          </div>
          <h2 className="scr-empty-title">لا يوجد أخصائيون</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
            لم نجد أخصائيين بهذا الفلتر
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {specialists.map((s) => (
            <SpecialistCard key={s.id} specialist={s} />
          ))}
        </div>
      )}
    </>
  );
}

function SpecialistCard({ specialist }: { specialist: Specialist }) {
  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--emerald-soft)',
          color: 'var(--emerald)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}>
          🦾
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              {specialist.title} {specialist.full_name}
            </h3>
            {specialist.is_verified && (
              <CheckCircle2 size={13} color="var(--emerald)" />
            )}
          </div>

          {specialist.bio && (
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 4px', lineHeight: 1.5 }}>
              {specialist.bio}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Award size={10} />
              {specialist.years_experience} سنة خبرة
            </span>
            <span>·</span>
            <span>{specialist.total_sessions.toLocaleString('ar-IQ')} جلسة</span>
            {specialist.rating_count > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={10} fill="var(--amber)" color="var(--amber)" />
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                    {specialist.rating_avg.toFixed(1)}
                  </span>
                  ({specialist.rating_count})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cities */}
      {specialist.cities.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          color: 'var(--ink-3)',
          marginBottom: 10,
        }}>
          <MapPin size={10} />
          {specialist.cities.join('، ')}
        </div>
      )}

      {/* Prices */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {specialist.available_for_home && (
          <div style={{
            flex: 1,
            padding: '8px 10px',
            background: 'var(--emerald-soft)',
            borderRadius: 8,
            border: '1px solid var(--emerald)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Home size={10} />
              زيارة منزلية
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--emerald)' }}>
              {specialist.home_visit_price.toLocaleString('ar-IQ')} د.ع
            </div>
          </div>
        )}
        {specialist.available_for_clinic && (
          <div style={{
            flex: 1,
            padding: '8px 10px',
            background: 'var(--amber-soft)',
            borderRadius: 8,
            border: '1px solid var(--amber)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Building2 size={10} />
              عيادة
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--amber)' }}>
              {specialist.clinic_visit_price.toLocaleString('ar-IQ')} د.ع
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      <Link
        href={`/appointments/new?service=physio&specialist=${specialist.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 14px',
          background: 'var(--emerald)',
          color: 'var(--paper-3)',
          borderRadius: 10,
          textDecoration: 'none',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        احجز جلسة
      </Link>
    </article>
  );
}

function pillStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: isActive ? 'var(--emerald)' : 'var(--white)',
    color: isActive ? 'var(--paper-3)' : 'var(--ink-2)',
    border: '1px solid',
    borderColor: isActive ? 'var(--emerald)' : 'var(--line)',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

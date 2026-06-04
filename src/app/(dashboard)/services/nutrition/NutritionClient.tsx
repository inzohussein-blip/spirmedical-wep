'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Search, MapPin, Star,
  CheckCircle2, Award, TrendingUp,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';

interface Nutritionist {
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
  available_online: boolean;
  available_in_clinic: boolean;
  initial_consultation_price: number;
  follow_up_price: number;
  monthly_plan_price: number;
  rating_avg: number;
  rating_count: number;
  total_clients: number;
  success_rate: number;
  is_verified: boolean;
}

const SPECIALTY_LABELS: Record<string, { label: string; icon: string }> = {
  weight_loss:      { label: 'إنقاص وزن',      icon: '⚖️' },
  weight_gain:      { label: 'زيادة وزن',     icon: '💪' },
  sports_nutrition: { label: 'رياضية',          icon: '🏋️' },
  diabetes:         { label: 'السكري',         icon: '🩺' },
  pcos:             { label: 'PCOS',            icon: '🌸' },
  pregnancy:        { label: 'حمل',             icon: '🤰' },
  pediatric:        { label: 'أطفال',           icon: '👶' },
  eating_disorders: { label: 'اضطرابات أكل',   icon: '🍽️' },
  muscle_building:  { label: 'بناء عضلات',     icon: '💪' },
  cardiovascular:   { label: 'قلب',             icon: '❤️' },
  breastfeeding:    { label: 'رضاعة',          icon: '🤱' },
  women_health:     { label: 'صحة المرأة',     icon: '👩' },
};

const CITIES = ['الكل', 'بغداد', 'البصرة', 'كربلاء', 'أربيل'];

export default function NutritionClient({ nutritionists }: { nutritionists: Nutritionist[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState('الكل');

  const filtered = useMemo(() => {
    return nutritionists.filter((n) => {
      const matchesSearch = !searchQuery || n.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'all' || n.specialties.includes(selectedSpecialty);
      const matchesCity = selectedCity === 'الكل' || n.cities.includes(selectedCity);
      return matchesSearch && matchesSpecialty && matchesCity;
    });
  }, [nutritionists, searchQuery, selectedSpecialty, selectedCity]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">التغذية والحمية</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{nutritionists.length} أخصائي معتمد</p>

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
          🥗 <strong>3 باقات لكل أخصائي:</strong> استشارة أولى · متابعة دورية · خطة شهرية كاملة
        </div>

        <div className="scr-search">
          <div className="scr-search-icon"><Search size={16} strokeWidth={2.4} /></div>
          <input
            type="search"
            placeholder="ابحث عن أخصائي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Specialty filter */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginBottom: 12,
          paddingBottom: 4,
        }}>
          <button
            type="button"
            onClick={() => { haptic.selection(); setSelectedSpecialty('all'); }}
            style={pillStyle(selectedSpecialty === 'all')}
          >
            🥗 الكل
          </button>
          {Object.entries(SPECIALTY_LABELS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => { haptic.selection(); setSelectedSpecialty(key); }}
              style={pillStyle(selectedSpecialty === key)}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {/* Cities */}
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

        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">🥗</div>
            <h2 className="scr-empty-title">لا يوجد أخصائيون</h2>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((n) => (
              <NutritionistCard key={n.id} nutritionist={n} />
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function NutritionistCard({ nutritionist }: { nutritionist: Nutritionist }) {
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
          fontSize: 26,
          flexShrink: 0,
        }}>
          🥗
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              {nutritionist.title} {nutritionist.full_name}
            </h3>
            {nutritionist.is_verified && <CheckCircle2 size={13} color="var(--emerald)" />}
          </div>

          {nutritionist.bio && (
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 4px', lineHeight: 1.5 }}>
              {nutritionist.bio}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Award size={10} />
              {nutritionist.years_experience} سنة
            </span>
            <span>·</span>
            <span>{nutritionist.total_clients.toLocaleString('ar-IQ')} عميل</span>
            {nutritionist.success_rate > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--emerald)', fontWeight: 700 }}>
                  <TrendingUp size={10} />
                  {nutritionist.success_rate}% نجاح
                </span>
              </>
            )}
            {nutritionist.rating_count > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={10} fill="var(--amber)" color="var(--amber)" />
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                    {nutritionist.rating_avg.toFixed(1)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Specialties */}
      {nutritionist.specialties.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {nutritionist.specialties.slice(0, 4).map((s, i) => {
            const meta = SPECIALTY_LABELS[s];
            return (
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
                {meta?.icon || '✓'} {meta?.label || s}
              </span>
            );
          })}
        </div>
      )}

      {/* Cities */}
      {nutritionist.cities.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          color: 'var(--ink-3)',
          marginBottom: 10,
        }}>
          <MapPin size={10} />
          {nutritionist.cities.join('، ')}
        </div>
      )}

      {/* 3 packages */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
        marginBottom: 10,
      }}>
        <PackageCard
          icon="💬"
          title="استشارة"
          price={nutritionist.initial_consultation_price}
          color="var(--ink-2)"
        />
        <PackageCard
          icon="🔄"
          title="متابعة"
          price={nutritionist.follow_up_price}
          color="var(--amber)"
        />
        <PackageCard
          icon="📅"
          title="شهرية"
          price={nutritionist.monthly_plan_price}
          color="var(--emerald)"
          highlight
        />
      </div>

      <Link
        href={`/services/booking?service=nutrition&id=${nutritionist.id}&package=initial`}
        onClick={() => haptic.medium()}
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
        احجز استشارة
      </Link>
    </article>
  );
}

function PackageCard({ icon, title, price, color, highlight }: {
  icon: string; title: string; price: number; color: string; highlight?: boolean;
}) {
  return (
    <div style={{
      padding: '8px 6px',
      background: highlight ? 'var(--emerald-soft)' : 'var(--paper-3)',
      borderRadius: 8,
      border: highlight ? '2px solid var(--emerald)' : '1px solid var(--line)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 2, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 11, fontWeight: 900, color }}>
        {price.toLocaleString('ar-IQ')}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع</div>
    </div>
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

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Search, MapPin, Star, Brain,
  CheckCircle2, Award, Home, Building2, Heart,
  AlertCircle,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';

interface Specialist {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  bio: string | null;
  years_experience: number;
  specialist_type: 'psychiatrist' | 'psychologist' | 'therapist' | 'counselor' | 'family_therapist';
  specialties: string[];
  certifications: string[];
  languages: string[];
  cities: string[];
  available_online: boolean;
  available_in_clinic: boolean;
  online_session_price: number;
  clinic_session_price: number;
  session_duration_minutes: number;
  rating_avg: number;
  rating_count: number;
  total_sessions: number;
  is_verified: boolean;
  accepts_emergency: boolean;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  psychiatrist:     { label: 'طبيب نفسي',    icon: '⚕️', desc: 'يصف أدوية + علاج' },
  psychologist:     { label: 'أخصائي نفسي',  icon: '🧠', desc: 'علاج معرفي سلوكي' },
  therapist:        { label: 'معالج نفسي',    icon: '💭', desc: 'جلسات علاجية' },
  counselor:        { label: 'مرشد نفسي',     icon: '🤝', desc: 'استشارات وتوجيه' },
  family_therapist: { label: 'معالج عائلي',   icon: '👨‍👩‍👧', desc: 'علاقات وزواج' },
};

const SPECIALTY_LABELS: Record<string, string> = {
  anxiety: 'القلق',
  depression: 'الاكتئاب',
  ocd: 'الوسواس القهري',
  trauma: 'الصدمات',
  bipolar: 'ثنائي القطب',
  couples: 'العلاقات',
  family: 'العائلة',
  children: 'الأطفال',
  adolescents: 'المراهقين',
  addiction: 'الإدمان',
  eating_disorders: 'اضطرابات الأكل',
  women_health: 'صحة المرأة',
  adhd: 'فرط الحركة',
  parenting: 'التربية',
};

const CITIES = ['الكل', 'بغداد', 'البصرة', 'النجف', 'كربلاء', 'أربيل'];

export default function MentalHealthClient({ specialists }: { specialists: Specialist[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const filtered = useMemo(() => {
    return specialists.filter((s) => {
      const matchesSearch = !searchQuery || s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || s.specialist_type === selectedType;
      const matchesCity = selectedCity === 'الكل' || s.cities.includes(selectedCity);
      const matchesOnline = !onlineOnly || s.available_online;
      return matchesSearch && matchesType && matchesCity && matchesOnline;
    });
  }, [specialists, searchQuery, selectedType, selectedCity, onlineOnly]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">الصحة النفسية</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">{specialists.length} أخصائي معتمد</p>

        {/* Privacy banner */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <Heart size={14} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>طلب الدعم النفسي شجاعة، لا ضعف.</strong>
            <br />
            كل الجلسات سرية 100% · بدون أي وصمة · بدون تشخيص بدون موافقتك
          </div>
        </div>

        {/* Crisis warning */}
        <div style={{
          background: 'var(--rose-soft)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.7,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <AlertCircle size={14} color="var(--rose)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>في حالة طوارئ نفسية شديدة:</strong> اتصل بـ <strong>122</strong> أو توجّه لأقرب طوارئ. هذه الخدمة للعلاج المستمر.
          </div>
        </div>

        {/* Search */}
        <div className="scr-search">
          <div className="scr-search-icon"><Search size={16} strokeWidth={2.4} /></div>
          <input
            type="search"
            placeholder="ابحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type filter */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginBottom: 12,
          paddingBottom: 4,
        }}>
          <button
            type="button"
            onClick={() => { haptic.selection(); setSelectedType('all'); }}
            style={typePillStyle(selectedType === 'all')}
          >
            🧠 الكل
          </button>
          {Object.entries(TYPE_LABELS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => { haptic.selection(); setSelectedType(key); }}
              style={typePillStyle(selectedType === key)}
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

        {/* Online filter */}
        <button
          type="button"
          onClick={() => { haptic.selection(); setOnlineOnly(!onlineOnly); }}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: onlineOnly ? 'var(--emerald)' : 'var(--white)',
            color: onlineOnly ? 'var(--paper-3)' : 'var(--ink-2)',
            border: '1px solid',
            borderColor: onlineOnly ? 'var(--emerald)' : 'var(--line)',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          💻 جلسات أونلاين فقط
        </button>

        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">🧠</div>
            <h2 className="scr-empty-title">لا يوجد أخصائيون</h2>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((s) => (
              <SpecialistCard key={s.id} specialist={s} />
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function SpecialistCard({ specialist }: { specialist: Specialist }) {
  const typeMeta = TYPE_LABELS[specialist.specialist_type];

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
          {typeMeta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              {specialist.title} {specialist.full_name}
            </h3>
            {specialist.is_verified && <CheckCircle2 size={13} color="var(--emerald)" />}
          </div>

          <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700, marginBottom: 2 }}>
            {typeMeta.label} · {typeMeta.desc}
          </div>

          {specialist.bio && (
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 4px', lineHeight: 1.5 }}>
              {specialist.bio}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

      {/* Specialties */}
      {specialist.specialties.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {specialist.specialties.slice(0, 5).map((s, i) => (
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
              {SPECIALTY_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}

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
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {specialist.available_online && (
          <div style={{
            flex: 1,
            padding: '8px 10px',
            background: 'var(--emerald-soft)',
            borderRadius: 8,
            border: '1px solid var(--emerald)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
              💻 أونلاين
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--emerald)' }}>
              {specialist.online_session_price.toLocaleString('ar-IQ')} د.ع
            </div>
          </div>
        )}
        {specialist.available_in_clinic && (
          <div style={{
            flex: 1,
            padding: '8px 10px',
            background: 'var(--amber-soft)',
            borderRadius: 8,
            border: '1px solid var(--amber)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
              🏢 عيادة
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--amber)' }}>
              {specialist.clinic_session_price.toLocaleString('ar-IQ')} د.ع
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 9, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 8 }}>
        مدة الجلسة: {specialist.session_duration_minutes} دقيقة
      </div>

      <Link
        href={`/services/booking?service=mental-health&id=${specialist.id}${specialist.available_online ? '&package=online' : ''}`}
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
        احجز جلسة
      </Link>
    </article>
  );
}

function typePillStyle(isActive: boolean): React.CSSProperties {
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

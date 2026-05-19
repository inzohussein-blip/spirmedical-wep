'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Phone, Star, Building2,
  Map as MapIcon, List, Hospital as HospitalIcon, AlertTriangle,
  CheckCircle2, Activity, BedDouble,
} from 'lucide-react';
import { FreeMedicalMapWrapper } from '@/components/ui/FreeMedicalMapWrapper';
import type { MapMarker } from '@/types/location';

interface Hospital {
  id: string;
  name: string;
  type: 'government' | 'private' | 'health_center' | 'specialized';
  city: string;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  phone_emergency: string | null;
  is_24h: boolean;
  has_emergency: boolean;
  has_ambulance: boolean;
  has_lab: boolean;
  has_radiology: boolean;
  departments: string[] | null;
  beds_count: number | null;
  rating_avg: number;
  rating_count: number;
  cover_image_url: string | null;
  is_verified: boolean;
}

interface Props {
  hospitals: Hospital[];
}

const TYPE_META: Record<Hospital['type'], { label: string; color: string; emoji: string }> = {
  government: { label: 'حكومي', color: 'var(--emerald)', emoji: '🏛️' },
  private: { label: 'أهلي', color: 'var(--amber)', emoji: '🏥' },
  health_center: { label: 'مركز صحي', color: 'var(--ink-3)', emoji: '🏪' },
  specialized: { label: 'تخصصي', color: 'var(--rose)', emoji: '🔬' },
};

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function HospitalsClient({ hospitals }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedType, setSelectedType] = useState<Hospital['type'] | ''>('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const filtered = useMemo(() => {
    return hospitals.filter((h) => {
      const matchesSearch = !searchQuery ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.district?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'الكل' || h.city === selectedCity;
      const matchesType = !selectedType || h.type === selectedType;
      const matchesEmergency = !emergencyOnly || h.has_emergency;
      return matchesSearch && matchesCity && matchesType && matchesEmergency;
    });
  }, [hospitals, searchQuery, selectedCity, selectedType, emergencyOnly]);

  // Markers للخريطة
  const markers: MapMarker[] = useMemo(() => {
    return filtered
      .filter((h) => h.latitude && h.longitude)
      .map((h) => ({
        id: h.id,
        lat: h.latitude!,
        lng: h.longitude!,
        title: h.name,
        subtitle: `${TYPE_META[h.type].label} · ${h.district || h.city}`,
        variant: h.type === 'government' ? 'specialist' : 'pharmacy',
      }));
  }, [filtered]);

  const stats = useMemo(() => ({
    total: hospitals.length,
    government: hospitals.filter(h => h.type === 'government').length,
    private: hospitals.filter(h => h.type === 'private').length,
    emergency: hospitals.filter(h => h.has_emergency).length,
  }), [hospitals]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">المستشفيات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {stats.total} مستشفى · {stats.government} حكومي · {stats.private} أهلي
        </p>

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            background: 'var(--paper-3)',
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              flex: 1,
              padding: '10px',
              background: viewMode === 'list' ? 'var(--white)' : 'transparent',
              color: viewMode === 'list' ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <List size={14} />
            قائمة
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            style={{
              flex: 1,
              padding: '10px',
              background: viewMode === 'map' ? 'var(--white)' : 'transparent',
              color: viewMode === 'map' ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: viewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <MapIcon size={14} />
            خريطة
          </button>
        </div>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن مستشفى أو منطقة..."
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

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedType('')}
            style={typeButtonStyle(!selectedType)}
          >
            الكل ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('government')}
            style={typeButtonStyle(selectedType === 'government', 'var(--emerald)')}
          >
            🏛️ حكومي ({stats.government})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('private')}
            style={typeButtonStyle(selectedType === 'private', 'var(--amber)')}
          >
            🏥 أهلي ({stats.private})
          </button>
          <button
            type="button"
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            style={{
              ...typeButtonStyle(emergencyOnly, 'var(--rose)'),
              ...(emergencyOnly && { background: 'var(--rose)', color: 'var(--paper-3)' }),
            }}
          >
            🚨 طوارئ ({stats.emergency})
          </button>
        </div>

        {/* Map or List */}
        {viewMode === 'map' ? (
          <div style={{ marginBottom: 16 }}>
            {markers.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  background: 'var(--white)',
                  borderRadius: 14,
                  border: '1px solid var(--line)',
                }}
              >
                <MapPin size={42} color="var(--ink-3)" style={{ opacity: 0.5, marginBottom: 8 }} />
                <h3 style={{ fontSize: 14, fontWeight: 800 }}>لا توجد إحداثيات</h3>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                  {filtered.length} مستشفى موجود لكن بدون موقع جغرافي
                </p>
              </div>
            ) : (
              <FreeMedicalMapWrapper
                markers={markers}
                center={{ lat: 33.3152, lng: 44.3661 }}
                zoom={11}
                height={400}
                showDirections={true}
              />
            )}
          </div>
        ) : null}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <HospitalIcon size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">
              {hospitals.length === 0 ? 'لم تُسجّل مستشفيات بعد' : 'لا توجد نتائج'}
            </h2>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((h) => {
              const typeMeta = TYPE_META[h.type];
              return (
                <Link
                  key={h.id}
                  href={`/services/hospitals/${h.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article
                    style={{
                      background: 'var(--white)',
                      border: '1px solid var(--line)',
                      borderRadius: 14,
                      padding: 14,
                      cursor: 'pointer',
                      borderLeftWidth: 4,
                      borderLeftStyle: 'solid',
                      borderLeftColor: typeMeta.color,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: `${typeMeta.color}15`,
                          color: typeMeta.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          flexShrink: 0,
                        }}
                      >
                        {typeMeta.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                            {h.name}
                          </h3>
                          {h.is_verified && (
                            <CheckCircle2 size={13} color="var(--emerald)" />
                          )}
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                          <span
                            style={{
                              padding: '1px 6px',
                              background: `${typeMeta.color}15`,
                              color: typeMeta.color,
                              borderRadius: 4,
                              fontWeight: 700,
                              fontSize: 10,
                            }}
                          >
                            {typeMeta.label}
                          </span>
                          <span style={{ marginInlineStart: 6 }}>
                            <MapPin size={10} style={{ display: 'inline', verticalAlign: -1 }} />
                            {' '}{h.city}
                            {h.district && ` · ${h.district}`}
                          </span>
                        </div>

                        {/* Features */}
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 4,
                            marginTop: 6,
                            fontSize: 10,
                          }}
                        >
                          {h.has_emergency && (
                            <span style={{ ...tagStyle(), background: 'var(--rose-soft)', color: 'var(--rose)' }}>
                              <AlertTriangle size={9} style={{ display: 'inline', verticalAlign: -1 }} /> طوارئ
                            </span>
                          )}
                          {h.is_24h && (
                            <span style={{ ...tagStyle(), background: 'var(--emerald-soft)', color: 'var(--emerald)' }}>
                              ٢٤/٧
                            </span>
                          )}
                          {h.has_ambulance && (
                            <span style={tagStyle()}>إسعاف</span>
                          )}
                          {h.has_lab && (
                            <span style={tagStyle()}>مختبر</span>
                          )}
                          {h.has_radiology && (
                            <span style={tagStyle()}>أشعة</span>
                          )}
                          {h.beds_count && (
                            <span style={tagStyle()}>
                              <BedDouble size={9} style={{ display: 'inline', verticalAlign: -1 }} /> {h.beds_count}
                            </span>
                          )}
                        </div>

                        {/* Rating + Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: '1px solid var(--line)',
                          }}
                        >
                          {h.rating_count > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Star size={12} fill="var(--amber)" color="var(--amber)" />
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--amber)' }}>
                                {h.rating_avg.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>لا تقييمات بعد</span>
                          )}

                          <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.preventDefault()}>
                            {h.phone && (
                              <a
                                href={`tel:${h.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                style={actionBtnStyle()}
                              >
                                <Phone size={12} />
                              </a>
                            )}
                            {h.latitude && h.longitude && (
                              <a
                                href={`https://maps.google.com/?q=${h.latitude},${h.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={actionBtnStyle()}
                              >
                                <MapPin size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
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

function typeButtonStyle(active: boolean, color = 'var(--emerald)'): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: active ? color : 'var(--white)',
    color: active ? 'var(--paper-3)' : 'var(--ink-2)',
    border: '1px solid',
    borderColor: active ? color : 'var(--line)',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

function tagStyle(): React.CSSProperties {
  return {
    padding: '2px 6px',
    background: 'var(--paper-3)',
    color: 'var(--ink-3)',
    borderRadius: 4,
    fontWeight: 700,
  };
}

function actionBtnStyle(): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    background: 'var(--paper-3)',
    color: 'var(--ink-2)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  };
}

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapMarker } from '@/types/location';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ LandingCoverageMap (V25.41)
 * ════════════════════════════════════════════════════════════════════
 *
 * خريطة محسّنة لـ /landing page coverage section
 *
 * المزايا:
 *   ✓ Lazy loading - تحميل فقط عند الظهور (IntersectionObserver)
 *   ✓ Skeleton أنيق أثناء التحميل
 *   ✓ Pulse animation على بغداد
 *   ✓ Mobile: full-width + bottom-sheet للتفاصيل
 *   ✓ Smooth pan/zoom للـ markers
 *   ✓ Hover effects + Custom tooltips
 *   ✓ Click → focus على المدينة + info card
 *
 * Performance:
 *   • التحميل: ~100KB (Leaflet) فقط عند الحاجة
 *   • Initial render: <50ms (skeleton فقط)
 * ════════════════════════════════════════════════════════════════════
 */

interface CityData {
  name: string;
  doctors: number;
  labs: number;
  lat: number;
  lng: number;
}

interface Props {
  cities: CityData[];
  height?: number;
}

// Dynamic import للـ map (لا يُحمّل في SSR)
const InteractiveMap = dynamic(() => import('./LandingCoverageMapInner'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div className="landing-map-skeleton" aria-label="جاري تحميل الخريطة">
      <div className="landing-map-skeleton-shimmer"></div>
      <div className="landing-map-skeleton-pin">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="landing-map-skeleton-text">جاري تحميل الخريطة...</div>
    </div>
  );
}

export default function LandingCoverageMap({ cities, height = 420 }: Props) {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);

  // تحويل cities لـ markers
  const markers: MapMarker[] = cities.map((c, i) => ({
    id: `city-${i}`,
    lat: c.lat,
    lng: c.lng,
    title: c.name,
    subtitle: `${c.doctors} طبيب · ${c.labs} مختبر`,
    type: i === 0 ? 'hospital' : 'doctor',
  }));

  return (
    <div className="landing-coverage-map-container" style={{ position: 'relative', width: '100%' }}>
      {/* 🔧 V32: تحميل مباشر عبر dynamic import (ssr:false) — أزلنا
          IntersectionObserver لأنّه كان قد يُهيّئ الخريطة قبل اكتمال
          الـ layout → tiles في الزاوية. الـ dynamic import يضمن التحميل
          بعد mount مع أبعاد صحيحة. */}
      <InteractiveMap
        markers={markers}
        cities={cities}
        height={height}
        onSelectCity={setSelectedCity}
      />

      {/* City Info Card - للموبايل bottom sheet */}
      {selectedCity && (
        <div className="landing-map-city-card" role="dialog" aria-label={`معلومات ${selectedCity.name}`}>
          <button
            type="button"
            className="landing-map-city-close"
            onClick={() => setSelectedCity(null)}
            aria-label="إغلاق"
          >
            ×
          </button>
          <div className="landing-map-city-name">
            <span aria-hidden="true">📍</span>
            <strong>{selectedCity.name}</strong>
          </div>
          <div className="landing-map-city-stats">
            <div className="landing-map-city-stat">
              <span className="landing-map-city-stat-num">{selectedCity.doctors}</span>
              <span className="landing-map-city-stat-label">طبيب</span>
            </div>
            <div className="landing-map-city-stat">
              <span className="landing-map-city-stat-num">{selectedCity.labs}</span>
              <span className="landing-map-city-stat-label">مختبر</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

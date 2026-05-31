'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { MapMarker } from '@/components/maps/SpirMapView';
import type { ServiceMarkerType } from '@/lib/maps/markers';
import type { UnifiedLocation } from '@/app/admin44/locations/types';

const SpirMapView = dynamic(() => import('@/components/maps/SpirMapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 380,
        background: '#E8EEF1',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5F5E5A',
        fontSize: 13,
      }}
    >
      تحميل الخريطة...
    </div>
  ),
});

interface Props {
  locations: UnifiedLocation[];
  height?: number;
}

/**
 * 🗺️ UnifiedLocationsMap (V31)
 *
 * تعرض كل مقدّمي الخدمات (من الجداول السبعة) على خريطة واحدة،
 * كل نوع بأيقونة ولون مختلف (عبر markerType).
 * المواقع المخفية (is_active=false) تظهر بشفافية أقل في الـ subtitle.
 */
export default function UnifiedLocationsMap({ locations, height = 380 }: Props) {
  const markers: MapMarker[] = useMemo(() => {
    return locations
      .filter((l) => l.latitude != null && l.longitude != null)
      .map((l) => ({
        id: `${l.source}-${l.id}`,
        lat: l.latitude as number,
        lng: l.longitude as number,
        title: `${l.emoji} ${l.name}`,
        subtitle: l.is_active ? `${l.label}${l.city ? ` · ${l.city}` : ''}` : `${l.label} · مخفي 🚫`,
        type: l.markerType as ServiceMarkerType,
      }));
  }, [locations]);

  return <SpirMapView markers={markers} height={height} showDirections />;
}

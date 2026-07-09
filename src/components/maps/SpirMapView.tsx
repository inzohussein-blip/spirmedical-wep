'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import type { Map as MlMap, Marker as MlMarker } from 'maplibre-gl';
import { buildMarkerSvg, type ServiceMarkerType } from '@/lib/maps/markers';
import {
  IRAQ_CENTER,
  MAP_STYLE_STREETS,
  loadMapLibre,
  markerElement,
  attachResizeFix,
} from '@/lib/maps/maplibre-config';
import ExternalMapButton from './ExternalMapButton';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ SpirMapView (V33 — MapLibre + OpenFreeMap)
 * ════════════════════════════════════════════════════════════════════
 *
 * خريطة عرض فقط (view-only) — مؤشّر واحد أو متعدّد + بطاقة تفاصيل + زر توسيط.
 * تحافظ على نفس واجهة MapMarker للتوافق مع الكود الحالي.
 * ════════════════════════════════════════════════════════════════════
 */

// متوافق مع types/location.ts الموجود
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  description?: string;
  type?: ServiceMarkerType;
}

interface Props {
  markers?: MapMarker[];
  marker?: MapMarker; // single marker convenience
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  showDirections?: boolean;
  className?: string;
}

function isValidCoords(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' &&
         !isNaN(lat) && !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
}

export default function SpirMapView({
  markers,
  marker,
  center,
  zoom = 12,
  height = 400,
  showDirections = true,
  className = '',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<MlMarker[]>([]);
  const cleanupResizeRef = useRef<(() => void) | null>(null);

  const [selected, setSelected] = useState<MapMarker | null>(null);

  // Normalize markers: combine `marker` (single) + `markers` (array)
  const allMarkers: MapMarker[] = [
    ...(marker && isValidCoords(marker.lat, marker.lng) ? [marker] : []),
    ...(markers || []).filter((m) => isValidCoords(m.lat, m.lng)),
  ];

  const hasValidLocation = allMarkers.length > 0;

  // Compute initial center
  const initialCenter: [number, number] = center
    ? [center.lng, center.lat]
    : hasValidLocation
    ? [allMarkers[0].lng, allMarkers[0].lat]
    : [IRAQ_CENTER.lng, IRAQ_CENTER.lat];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_STREETS,
        center: initialCenter,
        zoom: hasValidLocation ? zoom : 6,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right',
      );
      mapRef.current = map;

      cleanupResizeRef.current = attachResizeFix(map, mapContainerRef.current);

      // Add markers
      allMarkers.forEach((m) => {
        const el = markerElement(buildMarkerSvg(m.type || 'hospital', 40), 'spir-map-marker');
        if (m.title) el.title = m.title;
        el.addEventListener('click', () => setSelected(m));

        const mlMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.lng, m.lat])
          .addTo(map);

        markersRef.current.push(mlMarker);
      });

      // Fit to bounds if multiple markers
      if (allMarkers.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        allMarkers.forEach((m) => bounds.extend([m.lng, m.lat]));
        map.once('load', () =>
          map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 }),
        );
      }
    })();

    return () => {
      cancelled = true;
      if (cleanupResizeRef.current) {
        cleanupResizeRef.current();
        cleanupResizeRef.current = null;
      }
      markersRef.current.forEach((mk) => mk.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMarkers.length]);

  const handleRecenter = () => {
    if (!mapRef.current || !hasValidLocation) return;
    mapRef.current.flyTo({ center: [allMarkers[0].lng, allMarkers[0].lat], zoom, duration: 600 });
  };

  if (!hasValidLocation) {
    return (
      <div
        className={`spir-map-empty ${className}`}
        style={{
          height,
          background: '#E8EEF1',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: '#5F5E5A',
        }}
      >
        <MapPin size={32} aria-hidden />
        <div style={{ fontSize: 13, fontWeight: 500 }}>الموقع غير محدّد</div>
      </div>
    );
  }

  return (
    <div className={`spir-map-view ${className}`} style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          // ارتفاع متجاوب — لا يتجاوز القيمة المطلوبة، يتقلّص على الشاشات الصغيرة
          height: `clamp(280px, 45vh, ${height}px)`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#E8EEF1' }}
        />

        {/* Recenter button */}
        {allMarkers.length === 1 && (
          <button
            type="button"
            onClick={handleRecenter}
            className="spir-map-view-recenter"
            aria-label="توسيط الخريطة"
          >
            <Crosshair size={16} aria-hidden style={{ color: '#0F6E56' }} />
          </button>
        )}

        {/* Selected marker card */}
        {selected && (
          <div className="spir-map-view-card">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="spir-map-view-card-close"
              aria-label="إغلاق"
            >
              ×
            </button>

            <div className="spir-map-view-card-header">
              <MapPin size={16} aria-hidden style={{ color: '#0F6E56' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {selected.title && (
                  <div className="spir-map-view-card-title">{selected.title}</div>
                )}
                {selected.subtitle && (
                  <div className="spir-map-view-card-subtitle">{selected.subtitle}</div>
                )}
              </div>
            </div>

            {selected.description && (
              <div className="spir-map-view-card-desc">{selected.description}</div>
            )}

            {showDirections && (
              <ExternalMapButton
                lat={selected.lat}
                lng={selected.lng}
                label={selected.title}
                description={selected.subtitle}
                variant="full"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

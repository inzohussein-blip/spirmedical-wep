'use client';

// أنماط Leaflet مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/leaflet-styles';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Crosshair, MapPin } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { buildMarkerSvg, type ServiceMarkerType } from '@/lib/maps/markers';
import ExternalMapButton from './ExternalMapButton';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ SpirMapView (V25.39)
 * ════════════════════════════════════════════════════════════════════
 *
 * View-only map component
 * Drop-in replacement لـ FreeMedicalMap القديم
 *
 * يستخدم نفس الـ MapMarker interface للتوافق مع الكود الحالي
 *
 * Features:
 *   ✓ marker واحد أو متعدّد
 *   ✓ Popup قابل للتخصيص
 *   ✓ زر "افتح الموقع" مع 4 providers
 *   ✓ زر "توسيط" لتركيز الخريطة
 * ════════════════════════════════════════════════════════════════════
 */

const IRAQ_CENTER = { lat: 33.3152, lng: 44.3661 };

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
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [selected, setSelected] = useState<MapMarker | null>(null);

  // Normalize markers: combine `marker` (single) + `markers` (array)
  const allMarkers: MapMarker[] = [
    ...(marker && isValidCoords(marker.lat, marker.lng) ? [marker] : []),
    ...(markers || []).filter((m) => isValidCoords(m.lat, m.lng)),
  ];

  const hasValidLocation = allMarkers.length > 0;

  // Compute initial center
  const initialCenter: [number, number] = center
    ? [center.lat, center.lng]
    : hasValidLocation
    ? [allMarkers[0].lat, allMarkers[0].lng]
    : [IRAQ_CENTER.lat, IRAQ_CENTER.lng];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: hasValidLocation ? zoom : 6,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      mapRef.current = map;

      // 🔧 V31 FIX: إجبار Leaflet على إعادة حساب الأبعاد بعد رسم الـ DOM.
      // بدون هذا، الخريطة تُحمّل tiles جزئية وتنزاح (المشكلة المعروفة).
      const fixSize = () => {
        if (mapRef.current) mapRef.current.invalidateSize();
      };
      // عدّة محاولات لتغطية animations / flex layout / dynamic import
      setTimeout(fixSize, 0);
      setTimeout(fixSize, 150);
      setTimeout(fixSize, 400);
      requestAnimationFrame(fixSize);

      // ResizeObserver: يُصلح الحجم عند أيّ تغيير في أبعاد الـ container
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => fixSize());
        resizeObserverRef.current.observe(mapContainerRef.current);
      }

      // Add markers
      allMarkers.forEach((m) => {
        const divIcon = L.divIcon({
          html: buildMarkerSvg(m.type || 'hospital', 40),
          className: 'spir-map-marker',
          iconSize: [40, 46],
          iconAnchor: [20, 46],
        });

        const leafletMarker = L.marker([m.lat, m.lng], { icon: divIcon })
          .addTo(map)
          .on('click', () => setSelected(m));

        if (m.title) {
          leafletMarker.bindTooltip(m.title, { direction: 'top', offset: [0, -40] });
        }

        markersRef.current.push(leafletMarker);
      });

      // Fit to bounds if multiple markers
      if (allMarkers.length > 1) {
        const bounds = L.latLngBounds(allMarkers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    })();

    return () => {
      cancelled = true;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMarkers.length]);

  const handleRecenter = () => {
    if (!mapRef.current || !hasValidLocation) return;
    mapRef.current.setView([allMarkers[0].lat, allMarkers[0].lng], zoom);
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
          // 🔧 V31: ارتفاع متجاوب — لا يتجاوز القيمة المطلوبة، يتقلّص على الشاشات الصغيرة
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

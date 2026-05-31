'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { MapMarker } from '@/types/location';

interface CityData {
  name: string;
  doctors: number;
  labs: number;
  lat: number;
  lng: number;
}

interface Props {
  markers: MapMarker[];
  cities: CityData[];
  height: number;
  onSelectCity: (city: CityData) => void;
}

/**
 * Inner Leaflet map - يُحمّل فقط عند ظهور الخريطة (lazy)
 *
 * Features:
 *   ✓ Pulse animation على بغداد (الأكبر)
 *   ✓ Custom markers احترافية (SVG)
 *   ✓ Smooth zoom/pan
 *   ✓ Click → focus + emit event
 *   ✓ Mobile-friendly (no popups, uses bottom sheet)
 */
export default function LandingCoverageMapInner({
  markers,
  cities,
  height,
  onSelectCity,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [33.3152, 44.3661],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false, // disable scroll zoom (يتداخل مع scroll الصفحة)
        dragging: true,
      });

      // OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 12,
        minZoom: 5,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      // Custom zoom control (top-right)
      L.control.zoom({ position: 'topright' }).addTo(map);

      // إضافة markers
      markers.forEach((marker, i) => {
        const isBaghdad = i === 0;
        const city = cities[i];

        // Custom SVG marker
        const markerHtml = isBaghdad
          ? `
            <div class="landing-map-marker landing-map-marker-primary">
              <span class="landing-map-marker-pulse"></span>
              <span class="landing-map-marker-dot"></span>
            </div>
          `
          : `
            <div class="landing-map-marker landing-map-marker-secondary">
              <span class="landing-map-marker-dot"></span>
            </div>
          `;

        const icon = L.divIcon({
          html: markerHtml,
          className: '',
          iconSize: isBaghdad ? [32, 32] : [20, 20],
          iconAnchor: isBaghdad ? [16, 16] : [10, 10],
        });

        const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).addTo(map);

        // Tooltip أنيق
        leafletMarker.bindTooltip(
          `
          <div class="landing-map-tooltip">
            <div class="landing-map-tooltip-name">${marker.title}</div>
            <div class="landing-map-tooltip-stats">${marker.subtitle}</div>
          </div>
          `,
          {
            direction: 'top',
            offset: [0, isBaghdad ? -16 : -10],
            className: 'landing-map-tooltip-wrapper',
            opacity: 1,
          }
        );

        // Click → smooth pan + open info card
        leafletMarker.on('click', () => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
          map.flyTo([marker.lat, marker.lng], 9, {
            duration: 0.8,
          });
          onSelectCity(city);
        });

        // Hover effect
        leafletMarker.on('mouseover', (e) => {
          const target = e.target as { _icon?: HTMLElement };
          if (target._icon) {
            target._icon.style.zIndex = '1000';
          }
        });
      });

      // Fit bounds مع padding
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });

      mapRef.current = map;

      // 🔧 V31 FIX: إعادة حساب أبعاد الخريطة بعد الرسم
      const fixSize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
      setTimeout(fixSize, 0);
      setTimeout(fixSize, 150);
      setTimeout(fixSize, 400);
      requestAnimationFrame(fixSize);
      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => fixSize());
        resizeObserverRef.current.observe(containerRef.current);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="landing-map-inner"
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#E8EEF1',
      }}
    />
  );
}

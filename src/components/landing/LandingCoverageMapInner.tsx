'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef } from 'react';
import type { Map as MlMap, Marker as MlMarker, Popup as MlPopup } from 'maplibre-gl';
import type { MapMarker } from '@/types/location';
import {
  MAP_STYLE_STREETS,
  loadMapLibre,
  markerElement,
  attachResizeFix,
} from '@/lib/maps/maplibre-config';

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
 * Inner MapLibre map (V33) — يُحمّل فقط عند ظهور الخريطة (dynamic ssr:false).
 *
 * Features:
 *   ✓ Pulse animation على بغداد (الأكبر)
 *   ✓ Custom markers احترافية (CSS)
 *   ✓ Smooth zoom/pan (flyTo)
 *   ✓ Hover → tooltip · Click → focus + emit event
 */
export default function LandingCoverageMapInner({
  markers,
  cities,
  height,
  onSelectCity,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<MlMarker[]>([]);
  const cleanupResizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_STREETS,
        center: [44.3661, 33.3152],
        zoom: 6,
        attributionControl: false,
        scrollZoom: false, // لا يتداخل مع scroll الصفحة
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      // Tooltip واحد نعيد استخدامه (hover)
      const tooltip: MlPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        className: 'landing-map-tooltip-wrapper',
      });

      // إضافة markers
      markers.forEach((marker, i) => {
        const isBaghdad = i === 0;
        const city = cities[i];

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

        const el = markerElement(markerHtml);

        const mlMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map);
        markersRef.current.push(mlMarker);

        const tooltipHtml = `
          <div class="landing-map-tooltip">
            <div class="landing-map-tooltip-name">${marker.title ?? ''}</div>
            <div class="landing-map-tooltip-stats">${marker.subtitle ?? ''}</div>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          el.style.zIndex = '1000';
          tooltip.setLngLat([marker.lng, marker.lat]).setHTML(tooltipHtml).addTo(map);
        });
        el.addEventListener('mouseleave', () => {
          el.style.zIndex = '';
          tooltip.remove();
        });

        el.addEventListener('click', () => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
          map.flyTo({ center: [marker.lng, marker.lat], zoom: 9, duration: 800 });
          onSelectCity(city);
        });
      });

      mapRef.current = map;

      // توسيط على كل المدن بعد التحميل
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.once('load', () =>
        map.fitBounds(bounds, { padding: 48, maxZoom: 7, duration: 0 }),
      );

      cleanupResizeRef.current = attachResizeFix(map, containerRef.current);
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

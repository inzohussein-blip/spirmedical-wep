'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Check } from 'lucide-react';
import type { Map as MlMap, Marker as MlMarker } from 'maplibre-gl';
import { buildMarkerSvg, type ServiceMarkerType } from '@/lib/maps/markers';
import {
  IRAQ_CENTER,
  MAP_STYLE_LIGHT,
  loadMapLibre,
  markerElement,
  attachResizeFix,
} from '@/lib/maps/maplibre-config';
import { reverseGeocode } from '@/lib/services/geocoding';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ AdminLocationPicker (V33 — MapLibre + OpenFreeMap)
 * ════════════════════════════════════════════════════════════════════
 *
 * يسمح للأدمن باختيار موقع مقدّم خدمة (مستشفى/عيادة/صيدلية...) من خريطة
 * بدل كتابة الإحداثيات يدوياً.
 *
 * يدعم: النقر على الخريطة · GPS · reverse geocoding · عرض الإحداثيات.
 * ════════════════════════════════════════════════════════════════════
 */

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  markerType?: ServiceMarkerType;
  height?: number;
  onChange: (lat: number, lng: number) => void;
  /** يُستدعى مع العنوان المكتشف (اختياري) */
  onAddressDetected?: (address: string, governorate: string | null) => void;
}

export default function AdminLocationPicker({
  initialLat,
  initialLng,
  markerType = 'hospital',
  height = 260,
  onChange,
  onAddressDetected,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<MlMarker | null>(null);
  const cleanupResizeRef = useRef<(() => void) | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : null
  );
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fillAddress(lat: number, lng: number) {
    setGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result) {
        const parts = [result.road, result.suburb, result.city].filter(Boolean);
        const addr = parts.join(' · ') || result.display_name || '';
        setDetectedAddress(addr);
        onAddressDetected?.(addr, result.governorate);
      }
    } catch {
      // fire-and-forget
    } finally {
      setGeocoding(false);
    }
  }

  function placeMarker(
    maplibregl: Awaited<ReturnType<typeof loadMapLibre>>,
    c: { lat: number; lng: number }
  ) {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([c.lng, c.lat]);
    } else {
      const el = markerElement(buildMarkerSvg(markerType, 38), 'admin-location-marker');
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([c.lng, c.lat])
        .addTo(mapRef.current);
    }
    mapRef.current.panTo([c.lng, c.lat]);
  }

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current) return;

      const center: [number, number] = coords
        ? [coords.lng, coords.lat]
        : [IRAQ_CENTER.lng, IRAQ_CENTER.lat];
      const zoom = coords ? 14 : 6;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_LIGHT,
        center,
        zoom,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('click', (e) => {
        const c = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setCoords(c);
        onChange(c.lat, c.lng);
        placeMarker(maplibregl, c);
        void fillAddress(c.lat, c.lng);
      });

      mapRef.current = map;
      if (coords) placeMarker(maplibregl, coords);

      cleanupResizeRef.current = attachResizeFix(map, mapContainerRef.current);
    })();

    return () => {
      cancelled = true;
      if (cleanupResizeRef.current) {
        cleanupResizeRef.current();
        cleanupResizeRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('GPS غير متوفّر في هذا المتصفّح');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        onChange(c.lat, c.lng);
        const maplibregl = await loadMapLibre();
        placeMarker(maplibregl, c);
        mapRef.current?.flyTo({ center: [c.lng, c.lat], zoom: 16 });
        setLocating(false);
        void fillAddress(c.lat, c.lng);
      },
      () => {
        setLocating(false);
        setError('تعذّر تحديد الموقع. تأكّد من صلاحية GPS');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div>
      <div
        style={{
          position: 'relative',
          height,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 8,
          border: '1px solid #E8EAED',
        }}
      >
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#E8EEF1' }} />

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          style={{
            position: 'absolute',
            top: 10,
            insetInlineEnd: 10,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#fff',
            border: '1px solid #E8EAED',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: '#185FA5',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {locating ? (
            <Loader2 size={14} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Crosshair size={14} aria-hidden />
          )}
          {locating ? 'جارٍ التحديد...' : 'موقعي الحالي'}
        </button>

        <div
          style={{
            position: 'absolute',
            bottom: 10,
            insetInlineStart: 10,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            borderRadius: 8,
            fontSize: 11,
          }}
        >
          <MapPin size={11} aria-hidden />
          انقر على الخريطة لتحديد الموقع
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#C71C56', marginBottom: 6 }}>⚠️ {error}</div>
      )}

      {coords && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: '#E6F3EF',
            border: '1px solid #9BD9C0',
            borderRadius: 10,
            fontSize: 12,
            color: '#085041',
          }}
        >
          <Check size={14} aria-hidden style={{ color: '#0F6E56', flexShrink: 0 }} />
          <span style={{ fontWeight: 700 }}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          {geocoding ? (
            <span style={{ opacity: 0.7 }}>· جارٍ تحديد العنوان...</span>
          ) : detectedAddress ? (
            <span style={{ opacity: 0.85 }}>· {detectedAddress}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

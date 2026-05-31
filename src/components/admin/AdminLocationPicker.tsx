'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Check } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { buildMarkerSvg, type ServiceMarkerType } from '@/lib/maps/markers';
import { reverseGeocode } from '@/lib/services/geocoding';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ AdminLocationPicker (V31)
 * ════════════════════════════════════════════════════════════════════
 *
 * يسمح للأدمن باختيار موقع مقدّم خدمة (مستشفى/عيادة/صيدلية...) من خريطة
 * بدل كتابة الإحداثيات يدوياً.
 *
 * يدعم:
 *   - النقر على الخريطة لوضع الـ marker
 *   - زر "موقعي الحالي" (GPS)
 *   - reverse geocoding (يعرض العنوان المكتشف)
 *   - عرض الإحداثيات الحالية (قابلة للنسخ)
 *
 * الاستخدام في admin clients:
 *   <AdminLocationPicker
 *     initialLat={lat} initialLng={lng}
 *     markerType="hospital"
 *     onChange={(la, ln) => { setLat(String(la)); setLng(String(ln)); }}
 *   />
 * ════════════════════════════════════════════════════════════════════
 */

const IRAQ_CENTER: [number, number] = [33.3152, 44.3661];

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
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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

  const placeMarker = async (
    L: typeof import('leaflet'),
    c: { lat: number; lng: number }
  ) => {
    if (!mapRef.current) return;
    if (markerRef.current) markerRef.current.remove();

    const icon = L.divIcon({
      html: buildMarkerSvg(markerType, 38),
      className: 'admin-location-marker',
      iconSize: [38, 44],
      iconAnchor: [19, 44],
    });
    markerRef.current = L.marker([c.lat, c.lng], { icon }).addTo(mapRef.current);
    mapRef.current.panTo([c.lat, c.lng]);
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainerRef.current) return;

      const center = coords ? [coords.lat, coords.lng] as [number, number] : IRAQ_CENTER;
      const zoom = coords ? 14 : 6;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      map.on('click', (e) => {
        const c = { lat: e.latlng.lat, lng: e.latlng.lng };
        setCoords(c);
        onChange(c.lat, c.lng);
        void placeMarker(L, c);
        void fillAddress(c.lat, c.lng);
      });

      mapRef.current = map;
      if (coords) void placeMarker(L, coords);

      // 🔧 V31 FIX: إعادة حساب أبعاد الخريطة بعد الرسم (داخل modal خصوصاً)
      const fixSize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
      setTimeout(fixSize, 0);
      setTimeout(fixSize, 150);
      setTimeout(fixSize, 400);
      requestAnimationFrame(fixSize);
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => fixSize());
        resizeObserverRef.current.observe(mapContainerRef.current);
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
        const L = (await import('leaflet')).default;
        await placeMarker(L, c);
        mapRef.current?.setView([c.lat, c.lng], 16);
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
            zIndex: 1000,
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
            zIndex: 1000,
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

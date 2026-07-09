'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, Check, Info } from 'lucide-react';
import type { Map as MlMap, Marker as MlMarker } from 'maplibre-gl';
import { buildMarkerSvg } from '@/lib/maps/markers';
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
 * 📍 UserLocationPicker (V33 — MapLibre + OpenFreeMap)
 * ════════════════════════════════════════════════════════════════════
 *
 * نظام موحّد لتحديد موقع المستخدم (حجز موعد · إعدادات · عناوين محفوظة).
 * يدعم: GPS · الضغط على الخريطة · إدخال يدوي + reverse geocoding تلقائي.
 * ════════════════════════════════════════════════════════════════════
 */

const GOVERNORATES = [
  'بغداد', 'البصرة', 'النجف', 'كربلاء', 'بابل', 'الأنبار', 'ديالى',
  'واسط', 'المثنى', 'القادسية', 'ميسان', 'ذي قار', 'صلاح الدين',
  'كركوك', 'نينوى', 'أربيل', 'السليمانية', 'دهوك',
];

export interface LocationData {
  latitude: number;
  longitude: number;
  governorate: string;
  address: string;
}

interface Props {
  initialLocation?: Partial<LocationData>;
  onLocationChange: (location: LocationData) => void;
  height?: number;
  showGovernorate?: boolean;
  showAddress?: boolean;
  label?: string;
  description?: string;
}

export default function UserLocationPicker({
  initialLocation,
  onLocationChange,
  height = 280,
  showGovernorate = true,
  showAddress = true,
  label = 'موقعك',
  description,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<MlMarker | null>(null);
  const cleanupResizeRef = useRef<(() => void) | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  );
  const [governorate, setGovernorate] = useState(initialLocation?.governorate || 'بغداد');
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // reverse geocoding (إحداثيات → عنوان تلقائياً)
  const [geocoding, setGeocoding] = useState(false);

  // يملأ المحافظة + العنوان تلقائياً من الإحداثيات
  async function fillFromCoords(lat: number, lng: number) {
    setGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result) {
        if (result.governorate) {
          const matched = GOVERNORATES.find(
            (g) => result.governorate?.includes(g) || g.includes(result.governorate ?? '')
          );
          if (matched) setGovernorate(matched);
        }
        // املأ العنوان فقط لو فارغ (لا نطمس ما كتبه المستخدم)
        if (!address.trim()) {
          const parts = [result.road, result.suburb, result.city].filter(Boolean);
          if (parts.length > 0) setAddress(parts.join(' · '));
        }
      }
    } catch {
      // fire-and-forget — لا نُفشل تحديد الموقع لو فشل العنوان
    } finally {
      setGeocoding(false);
    }
  }

  // MapLibre marker باستخدام عنصر DOM (نفس أيقونة buildMarkerSvg)
  function placeMarker(
    maplibregl: Awaited<ReturnType<typeof loadMapLibre>>,
    c: { lat: number; lng: number }
  ) {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([c.lng, c.lat]);
    } else {
      const el = markerElement(buildMarkerSvg('user', 32), 'spir-user-location-marker');
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
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

      const initialCenter: [number, number] = coords
        ? [coords.lng, coords.lat]
        : [IRAQ_CENTER.lng, IRAQ_CENTER.lat];
      const initialZoom = coords ? 14 : 6;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_LIGHT,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      // الضغط على الخريطة → موقع جديد
      map.on('click', (e) => {
        const newCoords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setCoords(newCoords);
        placeMarker(maplibregl, newCoords);
        void fillFromCoords(newCoords.lat, newCoords.lng);
      });

      mapRef.current = map;
      cleanupResizeRef.current = attachResizeFix(map, mapContainerRef.current);

      // marker مبدئي لو موجود
      if (coords) placeMarker(maplibregl, coords);
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

  // تحديث الـ callback عند تغيير أي قيمة
  useEffect(() => {
    if (!coords) return;
    onLocationChange({
      latitude: coords.lat,
      longitude: coords.lng,
      governorate,
      address,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lng, governorate, address]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('GPS غير متوفّر في هذا المتصفّح');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);

        const maplibregl = await loadMapLibre();
        placeMarker(maplibregl, newCoords);
        mapRef.current?.flyTo({ center: [newCoords.lng, newCoords.lat], zoom: 16 });
        setLocating(false);
        // املأ العنوان + المحافظة تلقائياً من GPS
        void fillFromCoords(newCoords.lat, newCoords.lng);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setError('يجب السماح للموقع من إعدادات المتصفّح');
        else if (err.code === 2) setError('تعذّر تحديد موقعك. تأكّد من GPS');
        else setError('انتهت مهلة تحديد الموقع');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="user-location-picker">
      <div className="user-location-header">
        <div className="user-location-title">{label}</div>
        {description && <div className="user-location-desc">{description}</div>}
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#E8EEF1' }} />

        {/* "موقعي الحالي" button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="user-location-gps-btn"
        >
          {locating ? (
            <Loader2 size={14} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Crosshair size={14} aria-hidden style={{ color: '#185FA5' }} />
          )}
          {locating ? 'جاري التحديد...' : 'موقعي الحالي'}
        </button>

        {/* Hint */}
        <div className="user-location-hint">
          <Info size={12} aria-hidden />
          اضغط على الخريطة لتعديل الموقع
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="user-location-error">
          ⚠️ {error}
        </div>
      )}

      {/* Status */}
      {coords && (
        <div className="user-location-status">
          {geocoding ? (
            <>
              <Loader2 size={14} aria-hidden style={{ animation: 'spin 1s linear infinite', color: '#185FA5' }} />
              جارٍ تحديد العنوان...
            </>
          ) : (
            <>
              <Check size={14} aria-hidden style={{ color: '#0F6E56' }} />
              الموقع محدّد
            </>
          )}
        </div>
      )}

      {/* Governorate */}
      {showGovernorate && (
        <div className="user-location-field">
          <label className="user-location-label">المحافظة</label>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="user-location-input"
          >
            {GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      {/* Address */}
      {showAddress && (
        <div className="user-location-field">
          <label className="user-location-label">العنوان التفصيلي</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="حي · شارع · رقم البيت"
            className="user-location-input"
          />
        </div>
      )}
    </div>
  );
}

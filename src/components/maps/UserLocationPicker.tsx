'use client';

// أنماط Leaflet مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/leaflet-styles';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2, Check, Info } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { buildMarkerSvg } from '@/lib/maps/markers';
import { reverseGeocode } from '@/lib/services/geocoding';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📍 UserLocationPicker (V25.37)
 * ════════════════════════════════════════════════════════════════════
 *
 * نظام موحّد لتحديد موقع المستخدم
 *
 * يُستخدم في:
 *   - Booking flow (حجز موعد)
 *   - Profile settings (إعدادات الحساب)
 *   - Saved addresses
 *
 * يدعم:
 *   - GPS (موقعي الحالي)
 *   - الضغط على الخريطة
 *   - إدخال يدوي للعنوان
 * ════════════════════════════════════════════════════════════════════
 */

const GOVERNORATES = [
  'بغداد', 'البصرة', 'النجف', 'كربلاء', 'بابل', 'الأنبار', 'ديالى',
  'واسط', 'المثنى', 'القادسية', 'ميسان', 'ذي قار', 'صلاح الدين',
  'كركوك', 'نينوى', 'أربيل', 'السليمانية', 'دهوك',
];

const IRAQ_CENTER: [number, number] = [33.3152, 44.3661];

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
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  );
  const [governorate, setGovernorate] = useState(initialLocation?.governorate || 'بغداد');
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 🆕 V31: reverse geocoding (إحداثيات → عنوان تلقائياً)
  const [geocoding, setGeocoding] = useState(false);

  // 🆕 V31: يملأ المحافظة + العنوان تلقائياً من الإحداثيات
  async function fillFromCoords(lat: number, lng: number) {
    setGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      if (result) {
        // طابِق المحافظة مع قائمتنا (Nominatim قد يُرجع صيغة مختلفة)
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

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainerRef.current) return;

      const initialCenter: [number, number] = coords
        ? [coords.lat, coords.lng]
        : IRAQ_CENTER;
      const initialZoom = coords ? 14 : 6;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      // الضغط على الخريطة → موقع جديد
      map.on('click', (e) => {
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setCoords(newCoords);
        updateMarker(L, newCoords);
        void fillFromCoords(newCoords.lat, newCoords.lng);
      });

      mapRef.current = map;

      // 🔧 V31 FIX: إعادة حساب أبعاد الخريطة بعد الرسم (يمنع tiles الجزئية)
      const fixSize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
      setTimeout(fixSize, 0);
      setTimeout(fixSize, 150);
      setTimeout(fixSize, 400);
      requestAnimationFrame(fixSize);
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => fixSize());
        resizeObserverRef.current.observe(mapContainerRef.current);
      }

      // marker مبدئي لو موجود
      if (coords) {
        updateMarker(L, coords);
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

  const updateMarker = async (L: typeof import('leaflet'), c: { lat: number; lng: number }) => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const icon = L.divIcon({
      html: buildMarkerSvg('user', 32),
      className: 'spir-user-location-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    markerRef.current = L.marker([c.lat, c.lng], { icon }).addTo(mapRef.current);
    mapRef.current.panTo([c.lat, c.lng]);
  };

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

        const L = (await import('leaflet')).default;
        await updateMarker(L, newCoords);
        mapRef.current?.setView([newCoords.lat, newCoords.lng], 16);
        setLocating(false);
        // 🆕 V31: املأ العنوان + المحافظة تلقائياً من GPS
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

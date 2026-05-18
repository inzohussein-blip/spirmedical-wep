'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Loader2, Check } from 'lucide-react';
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  LatLngExpression,
} from 'leaflet';
import type { GpsCoordinates } from '@/types/location';
import { IRAQ_CENTER, isValidCoordinates } from '@/types/location';

/**
 * ═══════════════════════════════════════════════════════════════
 * MapPicker — منتقي موقع تفاعلي
 * ═══════════════════════════════════════════════════════════════
 *
 * يسمح للمستخدم بـ:
 *   - الضغط على الخريطة لتحديد موقع
 *   - استخدام GPS تلقائياً
 *   - تحريك الخريطة لتعديل الموقع
 *
 * استخدام:
 *   <MapPicker
 *     initialLocation={{ lat: 33.3152, lng: 44.3661 }}
 *     onChange={(coords) => console.log(coords)}
 *   />
 *
 * مهم: لا تستورد مباشرة! استخدم MapPickerWrapper
 * ═══════════════════════════════════════════════════════════════
 */

export interface MapPickerProps {
  /** الموقع الأولي (افتراضي: بغداد) */
  initialLocation?: GpsCoordinates | null;
  /** callback عند تغيير الموقع */
  onChange: (coords: GpsCoordinates, accuracy?: number) => void;
  /** ارتفاع الخريطة */
  height?: number;
  /** هل نظهر زر "استخدم موقعي الحالي"؟ */
  showGpsButton?: boolean;
  /** هل تظهر رسالة تعليمات؟ */
  showInstructions?: boolean;
}

function patchLeafletIcons(L: typeof import('leaflet')) {
  if ((L.Icon.Default.prototype as unknown as { _patched?: boolean })._patched) {
    return;
  }
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  (L.Icon.Default.prototype as unknown as { _patched: boolean })._patched = true;
}

function createPickerIcon(L: typeof import('leaflet')) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path
        d="M18 0C8.06 0 0 8.06 0 18c0 12.83 18 26 18 26s18-13.17 18-26C36 8.06 27.94 0 18 0z"
        fill="#0E5C4D"
        stroke="white"
        stroke-width="2.5"
      />
      <circle cx="18" cy="18" r="7" fill="white"/>
      <circle cx="18" cy="18" r="3" fill="#0E5C4D"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'map-picker-marker',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  });
}

export default function MapPicker({
  initialLocation,
  onChange,
  height = 380,
  showGpsButton = true,
  showInstructions = true,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<GpsCoordinates | null>(
    initialLocation && isValidCoordinates(initialLocation.lat, initialLocation.lng)
      ? initialLocation
      : null
  );

  /* ─── تهيئة الخريطة ──────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const L = await import('leaflet');
        if (cancelled || !mapContainerRef.current) return;
        if (mapRef.current) {
          setIsReady(true);
          return;
        }

        patchLeafletIcons(L);

        const startCenter =
          currentCoords && isValidCoordinates(currentCoords.lat, currentCoords.lng)
            ? currentCoords
            : IRAQ_CENTER;

        const map = L.map(mapContainerRef.current, {
          center: [startCenter.lat, startCenter.lng] as LatLngExpression,
          zoom: currentCoords ? 16 : 6,
          scrollWheelZoom: true,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          minZoom: 5,
        }).addTo(map);

        // إذا فيه initial location، نضع marker
        if (currentCoords && isValidCoordinates(currentCoords.lat, currentCoords.lng)) {
          const marker = L.marker(
            [currentCoords.lat, currentCoords.lng] as LatLngExpression,
            {
              icon: createPickerIcon(L),
              draggable: true,
            }
          ).addTo(map);

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const coords = { lat: pos.lat, lng: pos.lng };
            setCurrentCoords(coords);
            onChange(coords);
          });

          markerRef.current = marker;
        }

        // ─── Click event على الخريطة ───
        map.on('click', (e) => {
          const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

          // أزل الـ marker القديم
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // أضف marker جديد
          import('leaflet').then((L2) => {
            const newMarker = L2.marker([coords.lat, coords.lng] as LatLngExpression, {
              icon: createPickerIcon(L2),
              draggable: true,
            }).addTo(map);

            newMarker.on('dragend', () => {
              const pos = newMarker.getLatLng();
              const newCoords = { lat: pos.lat, lng: pos.lng };
              setCurrentCoords(newCoords);
              onChange(newCoords);
            });

            markerRef.current = newMarker;
          });

          setCurrentCoords(coords);
          onChange(coords);
        });

        mapRef.current = map;
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setError('فشل تحميل الخريطة');
          // eslint-disable-next-line no-console
          console.error('[MapPicker] init failed:', err);
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── GPS Handler ───────────────────────────────────── */

  const handleGetGps = async () => {
    if (!navigator.geolocation) {
      setError('متصفحك لا يدعم تحديد الموقع');
      return;
    }

    setIsGettingGps(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const accuracy = Math.round(pos.coords.accuracy);

        // تحديث الـ marker و الخريطة
        if (mapRef.current) {
          mapRef.current.setView([coords.lat, coords.lng], 17);

          if (markerRef.current) {
            markerRef.current.remove();
          }

          const L = await import('leaflet');
          const newMarker = L.marker([coords.lat, coords.lng] as LatLngExpression, {
            icon: createPickerIcon(L),
            draggable: true,
          }).addTo(mapRef.current);

          newMarker.on('dragend', () => {
            const p = newMarker.getLatLng();
            const c = { lat: p.lat, lng: p.lng };
            setCurrentCoords(c);
            onChange(c);
          });

          markerRef.current = newMarker;
        }

        setCurrentCoords(coords);
        onChange(coords, accuracy);
        setIsGettingGps(false);
      },
      (err) => {
        setIsGettingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('رفضت السماح بالوصول للموقع. اضغط على الخريطة لتحديد موقعك يدوياً.');
        } else {
          setError('فشل تحديد الموقع. حاول مرة أخرى أو اضغط على الخريطة.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="mp-wrap">
      {/* ─── الخريطة ─── */}
      <div
        ref={mapContainerRef}
        className="mp-map"
        style={{ height: `${height}px` }}
        aria-label="خريطة لتحديد الموقع"
      />

      {/* ─── شريط أزرار ─── */}
      <div className="mp-toolbar">
        {showGpsButton && (
          <button
            type="button"
            onClick={handleGetGps}
            disabled={isGettingGps}
            className="mp-btn mp-btn-primary"
          >
            {isGettingGps ? (
              <>
                <Loader2 size={14} className="mp-spin" strokeWidth={2.4} />
                <span>جارٍ التحديد...</span>
              </>
            ) : (
              <>
                <Crosshair size={14} strokeWidth={2.4} />
                <span>استخدم موقعي الحالي</span>
              </>
            )}
          </button>
        )}

        {currentCoords && (
          <div className="mp-coords">
            <Check size={12} strokeWidth={2.4} />
            <span className="mp-coords-text">
              {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      {/* ─── تعليمات ─── */}
      {showInstructions && !currentCoords && (
        <div className="mp-instructions">
          <MapPin size={14} strokeWidth={2.4} />
          <span>اضغط على الخريطة لتحديد موقعك، أو استخدم زر GPS أعلاه</span>
        </div>
      )}

      {/* ─── خطأ ─── */}
      {error && (
        <div className="mp-error" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <style jsx>{`
        .mp-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .mp-map {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: var(--paper-3);
          cursor: crosshair;
        }
        .mp-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mp-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid var(--line);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          background: var(--white);
          color: var(--ink);
        }
        .mp-btn:hover:not(:disabled) {
          background: var(--paper-2);
          transform: translateY(-1px);
        }
        .mp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .mp-btn-primary {
          background: var(--emerald);
          color: var(--paper-3);
          border-color: var(--emerald);
        }
        .mp-btn-primary:hover:not(:disabled) {
          background: var(--emerald-deep);
        }
        .mp-coords {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--emerald-soft);
          color: var(--emerald-deep);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          margin-right: auto;
        }
        .mp-coords-text {
          direction: ltr;
        }
        .mp-instructions {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--amber-soft);
          color: var(--amber);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }
        .mp-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--rose-soft);
          color: var(--rose);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }
        .mp-spin {
          animation: mp-spin 0.7s linear infinite;
        }
        @keyframes mp-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

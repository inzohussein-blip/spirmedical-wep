'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Crosshair, MapPin } from 'lucide-react';
import type { MapMarker, GpsCoordinates } from '@/types/location';
import { IRAQ_CENTER, isValidCoordinates, formatCoords } from '@/types/location';

// ⚠️ Leaflet types - imported normally
import type { Map as LeafletMap, Marker as LeafletMarker, LatLngExpression } from 'leaflet';

/**
 * ═══════════════════════════════════════════════════════════════
 * FreeMedicalMap — مكوّن الخريطة الموحّد
 * ═══════════════════════════════════════════════════════════════
 *
 * مهم: لا تستورد هذا المكوّن مباشرة!
 *      استخدم FreeMedicalMapWrapper.tsx الذي يطبّق dynamic import
 *      مع ssr: false
 *
 * يستخدم:
 *   - Leaflet 1.9.4 (مفتوح المصدر)
 *   - OpenStreetMap tiles (مجاني تماماً)
 *   - بدون أي API key
 *
 * مزايا:
 *   ✓ Marker واحد أو متعدد
 *   ✓ Popup قابل للتخصيص
 *   ✓ زر "افتح في خرائط Google" للاتجاهات
 *   ✓ زر "توسيط" لتركيز الخريطة على الـ marker الأول
 *   ✓ نموذج "موقع غير محدّد" بشكل أنيق
 *   ✓ Icon fix تلقائي لـ Next.js
 * ═══════════════════════════════════════════════════════════════
 */

export interface FreeMedicalMapProps {
  /** الـ marker الواحد (الحالة الشائعة) */
  marker?: MapMarker | null;
  /** عدة markers (للخرائط الجماعية) */
  markers?: MapMarker[];
  /** مركز الخريطة (default: العراق) */
  center?: GpsCoordinates;
  /** zoom level (1-18) */
  zoom?: number;
  /** الارتفاع (default: 320px) */
  height?: number | string;
  /** className إضافي على الـ container */
  className?: string;
  /** هل نظهر زر الاتجاهات؟ */
  showDirections?: boolean;
  /** هل نظهر معلومات الإحداثيات؟ */
  showCoords?: boolean;
}

/* ─── Icon Fix لـ Next.js ─────────────────────────────────────
 * مشكلة: Leaflet يبحث عن marker icons في مسار خاطئ في Next.js
 * الحل: نوفّر الـ paths يدوياً من CDN موثوق (unpkg)
 */
function patchLeafletIcons(L: typeof import('leaflet')) {
  // تجنّب التعديل المتكرر
  if ((L.Icon.Default.prototype as unknown as { _patched?: boolean })._patched) {
    return;
  }

  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  (L.Icon.Default.prototype as unknown as { _patched: boolean })._patched = true;
}

/* ─── Custom Icons حسب variant ───────────────────────────── */

const VARIANT_COLORS: Record<NonNullable<MapMarker['variant']>, string> = {
  patient: '#A82E3D', // rose
  specialist: '#0E5C4D', // emerald
  lab: '#B8540C', // amber
  pharmacy: '#073B30', // emerald-deep
  default: '#0F1A1C', // ink
};

function createColoredIcon(L: typeof import('leaflet'), color: string) {
  // SVG marker مخصص باللون المطلوب
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path
        d="M16 0C7.16 0 0 7.16 0 16c0 11.42 16 24 16 24s16-12.58 16-24c0-8.84-7.16-16-16-16z"
        fill="${color}"
        stroke="white"
        stroke-width="2"
      />
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'free-medical-map-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

/* ─── المكوّن الرئيسي ──────────────────────────────────────── */

export default function FreeMedicalMap({
  marker,
  markers,
  center,
  zoom = 14,
  height = 320,
  className = '',
  showDirections = true,
  showCoords = false,
}: FreeMedicalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // توحيد الـ markers: marker واحد أو array
  const allMarkers: MapMarker[] = markers ?? (marker ? [marker] : []);
  const validMarkers = allMarkers.filter((m) =>
    isValidCoordinates(m.lat, m.lng)
  );

  const firstValidMarker = validMarkers[0];
  const effectiveCenter: GpsCoordinates =
    center && isValidCoordinates(center.lat, center.lng)
      ? center
      : firstValidMarker
        ? { lat: firstValidMarker.lat, lng: firstValidMarker.lng }
        : IRAQ_CENTER;

  /* ─── تهيئة الخريطة ──────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        // dynamic import داخل effect (آمن SSR-wise)
        const L = await import('leaflet');

        if (cancelled || !mapContainerRef.current) return;

        // إذا الخريطة موجودة، لا نعيد إنشاءها
        if (mapRef.current) {
          setIsReady(true);
          return;
        }

        // إصلاح الأيقونات
        patchLeafletIcons(L);

        // إنشاء الخريطة
        const map = L.map(mapContainerRef.current, {
          center: [effectiveCenter.lat, effectiveCenter.lng] as LatLngExpression,
          zoom,
          scrollWheelZoom: true,
          zoomControl: true,
          attributionControl: true,
        });

        // OpenStreetMap tile layer (مجاني، بدون API key)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          minZoom: 5,
        }).addTo(map);

        mapRef.current = map;
        setIsReady(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FreeMedicalMap] Failed to init map:', err);
        if (!cancelled) {
          setError('فشل تحميل الخريطة. تحقّق من الاتصال بالإنترنت.');
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      // تنظيف الخريطة عند unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── تحديث الـ Markers ───────────────────────────────── */

  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    let cancelled = false;

    async function updateMarkers() {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current) return;

      // إزالة الـ markers القديمة
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // إضافة الـ markers الجديدة
      const bounds = L.latLngBounds([]);

      validMarkers.forEach((m) => {
        const color = VARIANT_COLORS[m.variant ?? 'default'];
        const icon = createColoredIcon(L, color);

        const leafletMarker = L.marker([m.lat, m.lng] as LatLngExpression, {
          icon,
          title: m.title,
        }).addTo(mapRef.current!);

        // Popup
        const popupHtml = `
          <div style="text-align: right; direction: rtl; font-family: Tajawal, sans-serif;">
            <strong style="font-size: 14px; color: #0F1A1C;">${escapeHtml(m.title)}</strong>
            ${m.subtitle ? `<div style="font-size: 12px; color: #6E7878; margin-top: 4px;">${escapeHtml(m.subtitle)}</div>` : ''}
            ${m.popup ? `<div style="font-size: 11px; color: #1F2A2C; margin-top: 6px;">${escapeHtml(m.popup)}</div>` : ''}
          </div>
        `;
        leafletMarker.bindPopup(popupHtml);

        markersRef.current.push(leafletMarker);
        bounds.extend([m.lat, m.lng]);
      });

      // ضبط الـ view
      if (validMarkers.length === 1) {
        mapRef.current.setView(
          [validMarkers[0].lat, validMarkers[0].lng],
          zoom
        );
      } else if (validMarkers.length > 1 && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }

      // افتح popup أول marker تلقائياً
      if (markersRef.current.length === 1) {
        markersRef.current[0].openPopup();
      }
    }

    updateMarkers();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, JSON.stringify(validMarkers), zoom]);

  /* ─── Handlers ────────────────────────────────────────── */

  const handleCenter = () => {
    if (!mapRef.current || !firstValidMarker) return;
    mapRef.current.setView(
      [firstValidMarker.lat, firstValidMarker.lng],
      zoom
    );
  };

  const handleOpenInGoogleMaps = () => {
    if (!firstValidMarker) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${firstValidMarker.lat},${firstValidMarker.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /* ─── Render: لا توجد إحداثيات صالحة ───────────────────── */

  if (validMarkers.length === 0 && !error) {
    return (
      <div
        className={`fm-empty ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <MapPin size={28} strokeWidth={1.8} />
        <div className="fm-empty-title">الموقع غير محدّد</div>
        <div className="fm-empty-desc">
          لم يتم تسجيل إحداثيات GPS لهذا الطلب
        </div>

        <style jsx>{`
          .fm-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: var(--paper-3, #FAF6EB);
            border: 1px dashed var(--line-2, rgba(15, 26, 28, 0.18));
            border-radius: 12px;
            color: var(--ink-3, #6E7878);
            padding: 24px;
          }
          .fm-empty-title {
            font-size: 13px;
            font-weight: 800;
            color: var(--ink-2, #1F2A2C);
            margin-top: 4px;
          }
          .fm-empty-desc {
            font-size: 11px;
            color: var(--ink-3, #6E7878);
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  /* ─── Render: خطأ تحميل ───────────────────────────────── */

  if (error) {
    return (
      <div
        className={`fm-error ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="fm-error-icon">⚠️</div>
        <div className="fm-error-text">{error}</div>

        <style jsx>{`
          .fm-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: var(--rose-soft, #F0D7D8);
            border-radius: 12px;
            color: var(--rose, #A82E3D);
            padding: 24px;
            text-align: center;
          }
          .fm-error-icon { font-size: 32px; }
          .fm-error-text { font-size: 13px; font-weight: 700; }
        `}</style>
      </div>
    );
  }

  /* ─── Render: الخريطة ─────────────────────────────────── */

  return (
    <div className={`fm-wrap ${className}`}>
      <div
        ref={mapContainerRef}
        className="fm-map"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />

      {/* Controls bar */}
      {(showDirections || showCoords) && firstValidMarker && (
        <div className="fm-controls">
          {showCoords && (
            <div className="fm-coords">
              <MapPin size={12} strokeWidth={2.2} />
              <span>
                {formatCoords(
                  { lat: firstValidMarker.lat, lng: firstValidMarker.lng },
                  5
                )}
              </span>
            </div>
          )}

          <div className="fm-controls-actions">
            <button
              type="button"
              onClick={handleCenter}
              className="fm-control-btn"
              title="توسيط الخريطة"
            >
              <Crosshair size={14} strokeWidth={2.2} />
              <span>توسيط</span>
            </button>

            {showDirections && (
              <button
                type="button"
                onClick={handleOpenInGoogleMaps}
                className="fm-control-btn fm-control-btn-primary"
                title="افتح للاتجاهات"
              >
                <ExternalLink size={14} strokeWidth={2.2} />
                <span>الاتجاهات</span>
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .fm-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .fm-map {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          background: var(--paper-3, #FAF6EB);
        }
        .fm-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fm-coords {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: var(--paper-3, #FAF6EB);
          border-radius: 8px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--ink-3, #6E7878);
        }
        .fm-controls-actions {
          display: flex;
          gap: 6px;
          margin-right: auto;
        }
        .fm-control-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 7px 12px;
          background: var(--paper, #F4EFE2);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink, #0F1A1C);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .fm-control-btn:hover {
          background: var(--paper-2, #EDE6D3);
          transform: translateY(-1px);
        }
        .fm-control-btn-primary {
          background: var(--btn-primary-bg, #0E5C4D);
          border-color: var(--btn-primary-bg, #0E5C4D);
          color: var(--btn-primary-fg, #FAF6EB);
        }
        .fm-control-btn-primary:hover {
          background: var(--btn-primary-bg-hover, #073B30);
        }
      `}</style>
    </div>
  );
}

/* ─── Helper: escape HTML للـ popup ──────────────────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

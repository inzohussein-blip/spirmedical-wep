'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Loader2, Check, Edit3, Sparkles } from 'lucide-react';
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  LatLngExpression,
} from 'leaflet';
import type { GpsCoordinates } from '@/types/location';
import {
  IRAQ_CENTER,
  isValidCoordinates,
  GOVERNORATE_OPTIONS,
} from '@/types/location';
import { reverseGeocodeShort } from '@/lib/services/geocoding';

/**
 * ═══════════════════════════════════════════════════════════════
 * MapPicker — منتقي موقع تفاعلي مع Reverse Geocoding
 * ═══════════════════════════════════════════════════════════════
 *
 * يسمح للمستخدم بـ:
 *   ✓ الضغط على الخريطة لتحديد موقع
 *   ✓ استخدام GPS تلقائياً
 *   ✓ تحريك الخريطة لتعديل الموقع
 *   ✓ ✨ V25.2: عرض العنوان النصي تلقائياً (Reverse Geocoding)
 *   ✓ ✨ V25.2: تعديل العنوان يدوياً للدقة
 *
 * استخدام:
 *   <MapPicker
 *     initialLocation={{ lat: 33.3152, lng: 44.3661 }}
 *     onChange={(coords, accuracy) => ...}
 *     onAddressChange={(address) => ...}  // ✨ جديد
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

export interface MapPickerProps {
  /** الموقع الأولي (افتراضي: بغداد) */
  initialLocation?: GpsCoordinates | null;
  /** العنوان النصي الأولي */
  initialAddress?: string;
  /** callback عند تغيير الموقع */
  onChange: (coords: GpsCoordinates, accuracy?: number) => void;
  /** ✨ V25.2: callback عند تغيير العنوان النصي */
  onAddressChange?: (address: string) => void;
  /** ارتفاع الخريطة */
  height?: number;
  /** هل نظهر زر "استخدم موقعي الحالي"؟ */
  showGpsButton?: boolean;
  /** هل تظهر رسالة تعليمات؟ */
  showInstructions?: boolean;
  /** هل نظهر chips للمحافظات (تنقل سريع)؟ */
  showGovernorateChips?: boolean;
  /** ✨ V25.2: هل نظهر حقل العنوان النصي + Reverse Geocoding؟ */
  showAddressField?: boolean;
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
  initialAddress = '',
  onChange,
  onAddressChange,
  height = 380,
  showGpsButton = true,
  showInstructions = true,
  showGovernorateChips = true,
  showAddressField = true,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [selectedGovId, setSelectedGovId] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<GpsCoordinates | null>(
    initialLocation && isValidCoordinates(initialLocation.lat, initialLocation.lng)
      ? initialLocation
      : null
  );

  // ✨ V25.2: Reverse Geocoding state
  const [addressText, setAddressText] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [autoFilledAddress, setAutoFilledAddress] = useState(false);
  const [userEditedAddress, setUserEditedAddress] = useState(false);

  /* ─── ✨ V25.2: Reverse Geocoding ─── */

  const fetchAddressForCoords = async (coords: GpsCoordinates) => {
    // لا نُحضر العنوان إذا المستخدم عدّله يدوياً
    if (userEditedAddress) return;

    setIsGeocoding(true);
    try {
      const address = await reverseGeocodeShort(coords.lat, coords.lng);
      if (address) {
        setAddressText(address);
        setAutoFilledAddress(true);
        if (onAddressChange) onAddressChange(address);
      }
    } catch {
      // فشل صامت - المستخدم يكتب يدوياً
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressEdit = (newAddress: string) => {
    setAddressText(newAddress);
    setUserEditedAddress(true);
    setAutoFilledAddress(false);
    if (onAddressChange) onAddressChange(newAddress);
  };

  const handleResetAddress = () => {
    setUserEditedAddress(false);
    if (currentCoords) {
      fetchAddressForCoords(currentCoords);
    }
  };

  /* ─── Handler: ضغط على محافظة ───────────────────────── */

  const handleGovernorateClick = async (gov: typeof GOVERNORATE_OPTIONS[0]) => {
    if (!mapRef.current) return;

    setSelectedGovId(gov.id);
    setError(null);

    // ✨ نحرّك الخريطة للمحافظة مع zoom مناسب لرؤية المدينة
    mapRef.current.flyTo([gov.lat, gov.lng], 12, {
      duration: 0.8,
      easeLinearity: 0.5,
    });

    // أزل الـ marker القديم
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // أضف marker في مركز المحافظة (المستخدم يستطيع تحريكه)
    const L = await import('leaflet');
    const coords = { lat: gov.lat, lng: gov.lng };
    const newMarker = L.marker([coords.lat, coords.lng] as LatLngExpression, {
      icon: createPickerIcon(L),
      draggable: true,
    }).addTo(mapRef.current);

    newMarker.on('dragend', () => {
      const pos = newMarker.getLatLng();
      const c = { lat: pos.lat, lng: pos.lng };
      setCurrentCoords(c);
      onChange(c);
      // ✨ V25.2: استدعاء reverse geocoding بعد drag
      fetchAddressForCoords(c);
    });

    markerRef.current = newMarker;
    setCurrentCoords(coords);
    onChange(coords);
    // ✨ V25.2: استدعاء reverse geocoding عند اختيار محافظة
    fetchAddressForCoords(coords);
  };

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
            // ✨ V25.2: reverse geocoding بعد drag
            fetchAddressForCoords(coords);
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
              // ✨ V25.2: reverse geocoding بعد drag
              fetchAddressForCoords(newCoords);
            });

            markerRef.current = newMarker;
          });

          setCurrentCoords(coords);
          onChange(coords);
          // ✨ V25.2: reverse geocoding بعد click
          fetchAddressForCoords(coords);
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

    // ✨ V25.1: تحقّق proactive من حالة الإذن قبل الاستدعاء
    // هذا يكشف الـ "denied permanently" قبل ما نضيع وقت بالـ popup
    if ('permissions' in navigator) {
      try {
        const permStatus = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });

        if (permStatus.state === 'denied') {
          setIsGettingGps(false);
          setError(
            'الموقع محظور للموقع. لتفعيله: اضغط على 🔒 يسار شريط العنوان → "أذونات الموقع" → "السماح" → أعد تحميل الصفحة.'
          );
          return;
        }
      } catch {
        // بعض المتصفحات لا تدعم Permissions API - نُكمل عادياً
      }
    }

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
            // ✨ V25.2: reverse geocoding بعد drag
            fetchAddressForCoords(c);
          });

          markerRef.current = newMarker;
        }

        setCurrentCoords(coords);
        onChange(coords, accuracy);
        setIsGettingGps(false);
        // ✨ V25.2: reverse geocoding بعد GPS capture
        fetchAddressForCoords(coords);
      },
      (err) => {
        setIsGettingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          // رسالة مفصّلة تشرح كيف يُفعّل الإذن
          setError(
            'الموقع محظور. لتفعيله: اضغط على 🔒 (يسار العنوان) → "أذونات الموقع" → "السماح" → أعد تحميل الصفحة. أو اضغط على الخريطة لتحديد موقعك يدوياً.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError(
            'تعذّر تحديد موقعك. تأكّد من تشغيل GPS على جهازك، أو اضغط على الخريطة لتحديد موقعك يدوياً.'
          );
        } else if (err.code === err.TIMEOUT) {
          setError(
            'استغرق تحديد الموقع وقتاً طويلاً. حاول مرة أخرى في مكان بإشارة أفضل، أو اضغط على الخريطة.'
          );
        } else {
          setError('فشل تحديد الموقع. اضغط على الخريطة لتحديد موقعك يدوياً.');
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
      {/* ─── ✨ V25.1: Governorate Chips (التنقّل السريع) ─── */}
      {showGovernorateChips && (
        <div className="mp-gov-section">
          <div className="mp-gov-label">
            <MapPin size={12} strokeWidth={2.4} />
            <span>تنقّل سريع للمحافظات:</span>
          </div>
          <div className="mp-gov-chips">
            {GOVERNORATE_OPTIONS.map((gov) => (
              <button
                key={gov.id}
                type="button"
                onClick={() => handleGovernorateClick(gov)}
                className={`mp-gov-chip ${selectedGovId === gov.id ? 'mp-gov-chip-active' : ''}`}
                title={`الانتقال إلى ${gov.nameAr}`}
              >
                {gov.nameAr}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* ─── ✨ V25.2: حقل العنوان النصي (Reverse Geocoding) ─── */}
      {showAddressField && currentCoords && (
        <div className="mp-address-section">
          <div className="mp-address-header">
            <label htmlFor="mp-address-input" className="mp-address-label">
              <MapPin size={12} strokeWidth={2.4} />
              <span>العنوان النصي</span>
              {isGeocoding && (
                <Loader2
                  size={11}
                  className="mp-spin"
                  strokeWidth={2.4}
                  aria-label="جارٍ تحديد العنوان"
                />
              )}
              {autoFilledAddress && !userEditedAddress && !isGeocoding && (
                <span className="mp-address-badge">
                  <Sparkles size={9} strokeWidth={2.5} />
                  <span>تعبئة تلقائية</span>
                </span>
              )}
              {userEditedAddress && (
                <span className="mp-address-badge mp-address-badge-edited">
                  <Edit3 size={9} strokeWidth={2.5} />
                  <span>تعديل يدوي</span>
                </span>
              )}
            </label>

            {userEditedAddress && (
              <button
                type="button"
                onClick={handleResetAddress}
                className="mp-address-reset"
                title="إعادة التعبئة التلقائية"
              >
                <Sparkles size={11} strokeWidth={2.4} />
                <span>إعادة تعبئة تلقائية</span>
              </button>
            )}
          </div>

          <input
            id="mp-address-input"
            type="text"
            value={addressText}
            onChange={(e) => handleAddressEdit(e.target.value)}
            placeholder={
              isGeocoding
                ? 'جارٍ تحديد العنوان...'
                : 'العنوان النصي (محافظة، حي، شارع، علامة مميزة)'
            }
            className="mp-address-input"
            dir="rtl"
          />

          <p className="mp-address-hint">
            💡 يمكنك التعديل لإضافة تفاصيل (رقم البيت، علامة مميزة، إلخ)
          </p>
        </div>
      )}

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
        /* ✨ V25.1: Governorate Chips */
        .mp-gov-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          background: var(--paper-3);
          border-radius: 10px;
          border: 1px solid var(--line);
        }
        .mp-gov-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          color: var(--ink-3);
        }
        .mp-gov-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .mp-gov-chip {
          padding: 6px 12px;
          border: 1px solid var(--line);
          border-radius: 100px;
          background: var(--white);
          color: var(--ink);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          white-space: nowrap;
        }
        .mp-gov-chip:hover {
          border-color: var(--emerald);
          background: var(--emerald-soft);
          color: var(--emerald-deep);
          transform: translateY(-1px);
        }
        .mp-gov-chip-active {
          background: var(--emerald);
          color: var(--paper-3);
          border-color: var(--emerald);
        }
        .mp-gov-chip-active:hover {
          background: var(--emerald-deep);
          color: var(--paper-3);
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
        /* ✨ V25.2: Address field (Reverse Geocoding) */
        .mp-address-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
          background: var(--white);
          border-radius: 10px;
          border: 1px solid var(--line);
          animation: mp-fade-in 0.25s ease-out;
        }
        .mp-address-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mp-address-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          color: var(--ink-2);
        }
        .mp-address-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          background: var(--emerald-soft);
          color: var(--emerald-deep);
          border-radius: 100px;
          font-size: 9px;
          font-weight: 800;
          margin-inline-start: 4px;
        }
        .mp-address-badge-edited {
          background: var(--amber-soft);
          color: var(--amber);
        }
        .mp-address-reset {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--emerald-soft);
          color: var(--emerald-deep);
          border: 1px solid var(--emerald);
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .mp-address-reset:hover {
          background: var(--emerald);
          color: var(--paper-3);
        }
        .mp-address-input {
          width: 100%;
          padding: 10px 12px;
          background: var(--paper-3);
          border: 1px solid var(--line);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          font-family: inherit;
          transition: all 0.15s;
          outline: none;
        }
        .mp-address-input:focus {
          border-color: var(--emerald);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(14, 92, 77, 0.1);
        }
        .mp-address-input::placeholder {
          color: var(--ink-4);
          font-weight: 500;
        }
        .mp-address-hint {
          font-size: 10px;
          color: var(--ink-3);
          margin: 0;
          font-weight: 500;
        }
        @keyframes mp-fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

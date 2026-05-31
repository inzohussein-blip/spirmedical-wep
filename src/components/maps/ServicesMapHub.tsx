'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Filter, Crosshair, ChevronUp, X } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker, MarkerClusterGroup } from 'leaflet';
import { MARKER_STYLES, buildMarkerSvg, buildClusterSvg, type ServiceMarkerType } from '@/lib/maps/markers';
import { distanceKm } from '@/types/location';
import ExternalMapButton from './ExternalMapButton';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ ServicesMapHub (V25.37)
 * ════════════════════════════════════════════════════════════════════
 *
 * الخريطة المركزية في /services
 *
 * Features:
 *   - عرض كل المواقع (288 موقع · 18 محافظة)
 *   - Filters: نوع الخدمة + المحافظة
 *   - Markers مخصّصة حسب الخدمة
 *   - Bottom card عند الضغط على marker
 *   - "موقعي الحالي" زرّ
 * ════════════════════════════════════════════════════════════════════
 */

export interface ServiceLocation {
  id: string;
  type: ServiceMarkerType;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  governorate?: string | null;
  rating?: number | null;
  href?: string; // لتفاصيل الخدمة
}

interface Props {
  locations: ServiceLocation[];
  height?: number;
  defaultFilter?: ServiceMarkerType | 'all';
}

const SERVICE_FILTERS: Array<{ id: ServiceMarkerType | 'all'; label: string; tablerIcon: string }> = [
  { id: 'all',           label: 'الكل',         tablerIcon: '◉' },
  { id: 'blood-draw',    label: 'سحب دم',       tablerIcon: '💉' },
  { id: 'home-nursing',  label: 'تمريض',        tablerIcon: '+' },
  { id: 'pharmacy',      label: 'صيدلية',       tablerIcon: 'Rx' },
  { id: 'dental',        label: 'أسنان',        tablerIcon: '🦷' },
  { id: 'optical',       label: 'نظارات',       tablerIcon: '👓' },
  { id: 'mental-health', label: 'صحة نفسية',   tablerIcon: '🧠' },
  { id: 'nutrition',     label: 'تغذية',        tablerIcon: '🥗' },
  { id: 'hospital',      label: 'مستشفى',       tablerIcon: '+' },
  { id: 'clinic',        label: 'عيادة',        tablerIcon: '🏥' },
  { id: 'doctor',        label: 'طبيب',         tablerIcon: '👨‍⚕️' },
];

const IRAQ_CENTER: [number, number] = [33.3152, 44.3661]; // بغداد
const DEFAULT_ZOOM = 6;

export default function ServicesMapHub({
  locations,
  height = 500,
  defaultFilter = 'all',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterGroupRef = useRef<MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<ServiceMarkerType | 'all'>(defaultFilter);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const governorates = Array.from(
    new Set(locations.map((l) => l.governorate).filter(Boolean))
  ) as string[];

  // فلترة المواقع
  const filteredLocations = locations.filter((loc) => {
    if (selectedFilter !== 'all' && loc.type !== selectedFilter) return false;
    if (selectedGovernorate !== 'all' && loc.governorate !== selectedGovernorate) return false;
    return true;
  });

  // 🆕 V31: أقرب 3 مواقع لموقع المستخدم (ضمن الفلتر الحالي)
  const nearestLocations = userLocation
    ? [...filteredLocations]
        .map((loc) => ({
          loc,
          dist: distanceKm(
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: loc.latitude, lng: loc.longitude }
          ),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
    : [];

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      // تحميل markercluster
      await import('leaflet.markercluster');
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: IRAQ_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      // إنشاء cluster group
      const LWithCluster = L as typeof L & {
        markerClusterGroup: (options: Record<string, unknown>) => MarkerClusterGroup;
      };

      const clusterGroup = LWithCluster.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 60,
        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: buildClusterSvg(count),
            className: 'spir-map-cluster',
            iconSize: [count >= 100 ? 52 : count >= 50 ? 46 : count >= 20 ? 42 : 36, count >= 100 ? 52 : count >= 50 ? 46 : count >= 20 ? 42 : 36],
          });
        },
      });

      clusterGroup.addTo(map);
      clusterGroupRef.current = clusterGroup;

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // إضافة/تحديث الـ markers عند تغيير الـ filter
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current || !clusterGroupRef.current) return;

      // حذف الـ markers القديمة من الـ cluster group
      clusterGroupRef.current.clearLayers();

      // إضافة الـ markers الجديدة
      filteredLocations.forEach((loc) => {
        const divIcon = L.divIcon({
          html: buildMarkerSvg(loc.type, 40),
          className: 'spir-map-marker',
          iconSize: [40, 46],
          iconAnchor: [20, 46],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon: divIcon })
          .on('click', () => {
            setSelectedLocation(loc);
            mapRef.current?.panTo([loc.latitude, loc.longitude]);
          });

        clusterGroupRef.current!.addLayer(marker);
      });

      // لو في markers، fit الخريطة عليها
      if (filteredLocations.length > 0) {
        const bounds = L.latLngBounds(filteredLocations.map((l) => [l.latitude, l.longitude]));
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations.length, selectedFilter, selectedGovernorate]);

  // زر "موقعي الحالي"
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setUserLocation(newLoc);

        const L = (await import('leaflet')).default;

        // حذف الـ marker القديم
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        const userIcon = L.divIcon({
          html: buildMarkerSvg('user', 32),
          className: 'spir-map-user-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current!);
        mapRef.current?.setView([latitude, longitude], 14);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  // 🆕 V31: ركّز الخريطة على موقع محدّد (من شريط "الأقرب إليك")
  const focusLocation = (loc: ServiceLocation) => {
    setSelectedLocation(loc);
    mapRef.current?.setView([loc.latitude, loc.longitude], 15);
  };

  return (
    <div className="services-map-hub" style={{ position: 'relative' }}>
      {/* Filters row */}
      <div className="services-map-filters">
        {SERVICE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFilter(f.id)}
            className={`services-map-filter-btn ${selectedFilter === f.id ? 'active' : ''}`}
          >
            <span className="services-map-filter-symbol" aria-hidden="true">{f.tablerIcon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Governorate selector */}
      <div className="services-map-controls">
        <select
          value={selectedGovernorate}
          onChange={(e) => setSelectedGovernorate(e.target.value)}
          className="services-map-gov-select"
          aria-label="المحافظة"
        >
          <option value="all">كل المحافظات</option>
          {governorates.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <div className="services-map-count">
          <Filter size={12} aria-hidden />
          <strong>{filteredLocations.length}</strong> موقع
        </div>
      </div>

      {/* 🆕 V31: شريط "الأقرب إليك" — يظهر بعد تحديد الموقع */}
      {nearestLocations.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            overflowX: 'auto',
            padding: '4px 0 10px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#185FA5',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            📍 الأقرب إليك:
          </span>
          {nearestLocations.map(({ loc, dist }) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => focusLocation(loc)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: '#E8F0FE',
                border: '1px solid #B4D2F5',
                borderRadius: 100,
                fontSize: 12,
                color: '#0C447C',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {loc.name}
              </span>
              <span style={{ opacity: 0.7, fontSize: 11 }}>
                {dist < 1 ? `${Math.round(dist * 1000)} م` : `${dist.toFixed(1)} كم`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Map container */}
      <div style={{ position: 'relative', height, borderRadius: 12, overflow: 'hidden' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', background: '#E8EEF1' }}
        />

        {/* Floating controls */}
        <div className="services-map-floating-controls">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="services-map-fab"
            aria-label="موقعي الحالي"
          >
            <Crosshair size={18} aria-hidden style={{ color: locating ? '#888' : '#185FA5' }} />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="services-map-fab"
            aria-label="تكبير"
          >
            <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>+</span>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="services-map-fab"
            aria-label="تصغير"
          >
            <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>−</span>
          </button>
        </div>

        {/* Selected location card */}
        {selectedLocation && (
          <div className="services-map-selected-card">
            <button
              type="button"
              onClick={() => setSelectedLocation(null)}
              className="services-map-selected-close"
              aria-label="إغلاق"
            >
              <X size={16} aria-hidden />
            </button>

            <div className="services-map-selected-header">
              <div
                className="services-map-selected-icon"
                style={{
                  background: MARKER_STYLES[selectedLocation.type].bgColor,
                  color: MARKER_STYLES[selectedLocation.type].color,
                }}
                aria-hidden="true"
              >
                {MARKER_STYLES[selectedLocation.type].symbol}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="services-map-selected-name">{selectedLocation.name}</div>
                {(selectedLocation.governorate || selectedLocation.description) && (
                  <div className="services-map-selected-meta">
                    <MapPin size={11} aria-hidden />
                    {selectedLocation.governorate}
                    {selectedLocation.description && ` · ${selectedLocation.description}`}
                  </div>
                )}
              </div>
              {selectedLocation.rating != null && (
                <div className="services-map-selected-rating">
                  ★ {selectedLocation.rating.toFixed(1)}
                </div>
              )}
            </div>

            <div className="services-map-selected-actions">
              {selectedLocation.href && (
                <a
                  href={selectedLocation.href}
                  className="services-map-selected-primary"
                >
                  عرض التفاصيل ←
                </a>
              )}
              <ExternalMapButton
                lat={selectedLocation.latitude}
                lng={selectedLocation.longitude}
                label={selectedLocation.name}
                variant="compact"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

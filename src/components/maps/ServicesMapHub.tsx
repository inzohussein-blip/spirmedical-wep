'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Filter, Crosshair, X } from 'lucide-react';
import type {
  Map as MlMap,
  Marker as MlMarker,
  GeoJSONSource,
  MapGeoJSONFeature,
  ExpressionSpecification,
} from 'maplibre-gl';
import { MARKER_STYLES, buildMarkerSvg, type ServiceMarkerType } from '@/lib/maps/markers';
import { distanceKm } from '@/types/location';
import {
  IRAQ_CENTER,
  MAP_STYLE_STREETS,
  loadMapLibre,
  markerElement,
  attachResizeFix,
} from '@/lib/maps/maplibre-config';
import ExternalMapButton from './ExternalMapButton';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ ServicesMapHub (V33 — MapLibre + OpenFreeMap)
 * ════════════════════════════════════════════════════════════════════
 *
 * الخريطة المركزية في /services — كل المواقع (288 موقع · 18 محافظة).
 *
 * Features:
 *   - تجميع (clustering) أصلي على GPU يمنع ازدحام المؤشّرات
 *   - نقاط ملوّنة حسب نوع الخدمة (data-driven)
 *   - Filters: نوع الخدمة + المحافظة
 *   - Bottom card عند الضغط على نقطة
 *   - "موقعي الحالي" + شريط "الأقرب إليك"
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

const SOURCE_ID = 'spir-locations';
const CLUSTER_LAYER = 'spir-clusters';
const CLUSTER_COUNT_LAYER = 'spir-cluster-count';
const POINT_LAYER = 'spir-unclustered';

// تعبير لون النقطة حسب النوع (data-driven) — يُبنى من MARKER_STYLES
function buildColorMatch(): ExpressionSpecification {
  const pairs: string[] = [];
  (Object.keys(MARKER_STYLES) as ServiceMarkerType[]).forEach((t) => {
    pairs.push(t, MARKER_STYLES[t].color);
  });
  return ['match', ['get', 'type'], ...pairs, '#185FA5'] as unknown as ExpressionSpecification;
}

function toGeoJSON(locs: ServiceLocation[]) {
  return {
    type: 'FeatureCollection' as const,
    features: locs.map((l) => ({
      type: 'Feature' as const,
      properties: { id: l.id, type: l.type },
      geometry: { type: 'Point' as const, coordinates: [l.longitude, l.latitude] },
    })),
  };
}

export default function ServicesMapHub({
  locations,
  height = 500,
  defaultFilter = 'all',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const cleanupResizeRef = useRef<(() => void) | null>(null);
  const userMarkerRef = useRef<MlMarker | null>(null);
  const loadedRef = useRef(false);
  const locationsByIdRef = useRef<Map<string, ServiceLocation>>(new Map());

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

  // أقرب 3 مواقع لموقع المستخدم (ضمن الفلتر الحالي)
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

  // حدّث lookup النقاط لمعالج النقر (يعمل مع الفلتر الحالي)
  locationsByIdRef.current = new Map(filteredLocations.map((l) => [l.id, l]));

  // تهيئة الخريطة (مرّة واحدة)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_STREETS,
        center: [IRAQ_CENTER.lng, IRAQ_CENTER.lat],
        zoom: 6,
        attributionControl: false,
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        if (cancelled) return;

        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: toGeoJSON([]),
          cluster: true,
          clusterRadius: 55,
          clusterMaxZoom: 14,
        });

        // طبقة التجميع (دوائر خضراء متدرّجة الحجم)
        map.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#0F6E56',
            'circle-opacity': 0.9,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-radius': [
              'step', ['get', 'point_count'],
              18, 20, 24, 50, 30, 100, 38,
            ] as unknown as ExpressionSpecification,
          },
        });

        // عدّاد التجميع
        map.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'] as unknown as ExpressionSpecification,
            'text-font': ['Noto Sans Regular'],
            'text-size': 13,
          },
          paint: { 'text-color': '#ffffff' },
        });

        // النقاط المفردة (ملوّنة حسب النوع)
        map.addLayer({
          id: POINT_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': buildColorMatch(),
            'circle-radius': 8,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        });

        // نقر على تجميع → تقريب
        map.on('click', CLUSTER_LAYER, async (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
          const clusterId = features[0]?.properties?.cluster_id;
          if (clusterId == null) return;
          const src = map.getSource(SOURCE_ID) as GeoJSONSource;
          try {
            const zoom = await src.getClusterExpansionZoom(clusterId);
            const geom = features[0].geometry as unknown as { coordinates: [number, number] };
            map.easeTo({ center: geom.coordinates, zoom });
          } catch {
            /* ignore */
          }
        });

        // نقر على نقطة → بطاقة التفاصيل
        map.on('click', POINT_LAYER, (e) => {
          const f = e.features?.[0] as MapGeoJSONFeature | undefined;
          const id = f?.properties?.id as string | undefined;
          if (!id) return;
          const loc = locationsByIdRef.current.get(id);
          if (loc) {
            setSelectedLocation(loc);
            map.flyTo({ center: [loc.longitude, loc.latitude], zoom: Math.max(map.getZoom(), 13) });
          }
        });

        // مؤشّر اليد فوق العناصر القابلة للنقر
        [CLUSTER_LAYER, POINT_LAYER].forEach((layer) => {
          map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
        });

        loadedRef.current = true;
        // تحميل أول دفعة بيانات
        syncData();
      });

      mapRef.current = map;
      cleanupResizeRef.current = attachResizeFix(map, mapContainerRef.current);
    })();

    return () => {
      cancelled = true;
      if (cleanupResizeRef.current) {
        cleanupResizeRef.current();
        cleanupResizeRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      loadedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // مزامنة بيانات المصدر + ضبط الحدود
  function syncData() {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!src) return;
    src.setData(toGeoJSON(filteredLocations));

    if (filteredLocations.length > 0) {
      (async () => {
        const maplibregl = await loadMapLibre();
        if (!mapRef.current) return;
        const bounds = new maplibregl.LngLatBounds();
        filteredLocations.forEach((l) => bounds.extend([l.longitude, l.latitude]));
        mapRef.current.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 400 });
      })();
    }
  }

  // إعادة المزامنة عند تغيّر الفلتر
  useEffect(() => {
    syncData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations.length, selectedFilter, selectedGovernorate]);

  // زر "موقعي الحالي"
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        const maplibregl = await loadMapLibre();
        if (!mapRef.current) return;

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        } else {
          const el = markerElement(buildMarkerSvg('user', 32), 'spir-map-user-marker');
          userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        }
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
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

  // ركّز الخريطة على موقع محدّد (من شريط "الأقرب إليك")
  const focusLocation = (loc: ServiceLocation) => {
    setSelectedLocation(loc);
    mapRef.current?.flyTo({ center: [loc.longitude, loc.latitude], zoom: 15 });
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

      {/* شريط "الأقرب إليك" — يظهر بعد تحديد الموقع */}
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
      <div style={{ position: 'relative', height: `clamp(300px, 50vh, ${height}px)`, borderRadius: 12, overflow: 'hidden' }}>
        <div
          ref={mapContainerRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#E8EEF1' }}
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

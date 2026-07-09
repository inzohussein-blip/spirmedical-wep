'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة فقط.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef, useState } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import { IRAQ_CENTER } from '@/types/location';
import {
  MAP_STYLE_LIGHT,
  loadMapLibre,
  attachResizeFix,
} from '@/lib/maps/maplibre-config';

/**
 * ═══════════════════════════════════════════════════════════════
 * MapHeatmap (V33 — MapLibre heatmap layer)
 * ═══════════════════════════════════════════════════════════════
 *
 * يعرض كثافة الطلبات — المناطق الأكثر طلباً = أحمر.
 * يستخدم طبقة heatmap الأصلية في MapLibre (GPU) بدل leaflet.heat.
 *
 * مهم: لا تستورد مباشرة! استخدم MapHeatmapWrapper (ssr:false).
 * ═══════════════════════════════════════════════════════════════
 */

export interface HeatmapPoint {
  lat: number;
  lng: number;
  /** الكثافة (1-10، اختياري) */
  intensity?: number;
}

export interface MapHeatmapProps {
  points: HeatmapPoint[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  /** نصف قطر النقاط (افتراضي 25) */
  radius?: number;
  /** أقصى كثافة (للتدرّج اللوني) */
  maxIntensity?: number;
}

const SOURCE_ID = 'spir-heat-src';
const LAYER_ID = 'spir-heat-layer';

export default function MapHeatmap({
  points,
  center,
  zoom = 7,
  height = 500,
  radius = 25,
  maxIntensity,
}: MapHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const cleanupResizeRef = useRef<(() => void) | null>(null);
  const loadedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const maplibregl = await loadMapLibre();
        if (cancelled || !mapContainerRef.current || mapRef.current) return;

        const startCenter = center ?? IRAQ_CENTER;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE_LIGHT,
          center: [startCenter.lng, startCenter.lat],
          zoom,
          attributionControl: false,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        map.on('load', () => {
          loadedRef.current = true;
          if (!cancelled) setIsReady(true);
        });

        mapRef.current = map;
        cleanupResizeRef.current = attachResizeFix(map, mapContainerRef.current);
      } catch (err) {
        if (!cancelled) {
          setError('فشل تحميل الخريطة');
          // eslint-disable-next-line no-console
          console.error('[MapHeatmap] init failed:', err);
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (cleanupResizeRef.current) {
        cleanupResizeRef.current();
        cleanupResizeRef.current = null;
      }
      loadedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── تحديث الـ heatmap عند تغيير points ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !loadedRef.current || points.length === 0) return;

    const max = maxIntensity ?? 1.0;
    const geojson = {
      type: 'FeatureCollection' as const,
      features: points.map((p) => ({
        type: 'Feature' as const,
        properties: { intensity: p.intensity ?? 0.5 },
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      })),
    };

    const existing = map.getSource(SOURCE_ID) as
      | { setData: (d: typeof geojson) => void }
      | undefined;

    if (existing) {
      existing.setData(geojson);
    } else {
      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });
      map.addLayer({
        id: LAYER_ID,
        type: 'heatmap',
        source: SOURCE_ID,
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0, 0, max, 1,
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            5, 1, 15, 3,
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0.0, 'rgba(33,102,172,0)',
            0.2, 'rgb(0,120,255)',
            0.4, 'rgb(0,220,220)',
            0.6, 'rgb(120,220,0)',
            0.8, 'rgb(255,210,0)',
            1.0, 'rgb(220,30,30)',
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            5, radius, 15, radius * 2.5,
          ],
          'heatmap-opacity': 0.75,
        },
      });
    }

    // ضبط حدود الخريطة لتغطي كل النقاط
    if (points.length > 1) {
      (async () => {
        const maplibregl = await loadMapLibre();
        if (!mapRef.current) return;
        const bounds = new maplibregl.LngLatBounds();
        points.forEach((p) => bounds.extend([p.lng, p.lat]));
        mapRef.current.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 });
      })();
    }
  }, [isReady, points, radius, maxIntensity]);

  /* ─── Render ─── */

  if (error) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--rose-soft)',
          color: 'var(--rose)',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        ⚠️ {error}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper-3)',
          border: '1px dashed var(--line-2)',
          borderRadius: 12,
          color: 'var(--ink-3)',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 32 }}>🌡️</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>لا توجد بيانات لعرضها</span>
        <span style={{ fontSize: 11 }}>لا توجد طلبات بإحداثيات GPS بعد</span>
      </div>
    );
  }

  return (
    <div className="mh-wrap">
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: `clamp(300px, 50vh, ${height}px)`,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}
        aria-label="خريطة حرارة الطلبات"
      />
      {/* legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 12px',
          background: 'var(--paper-3)',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          marginTop: 8,
        }}
      >
        <span style={{ color: 'var(--ink-3)' }}>الكثافة:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgb(0,120,255)' }} />
          <span>قليل</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgb(120,220,0)' }} />
          <span>متوسط</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgb(220,30,30)' }} />
          <span>كثيف</span>
        </div>
        <span style={{ marginInlineStart: 'auto', color: 'var(--ink-3)' }}>
          {points.length} طلب
        </span>
      </div>
    </div>
  );
}

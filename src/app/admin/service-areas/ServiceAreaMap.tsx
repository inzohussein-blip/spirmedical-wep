'use client';

// أنماط MapLibre مفصولة (route-scoped) — تُحمَّل مع chunk الخريطة وحدها.
import '@/components/maps/maplibre-styles';
import { useEffect, useRef, useCallback } from 'react';
import type { Map as MlMap, MapMouseEvent } from 'maplibre-gl';
import {
  IRAQ_CENTER,
  MAP_STYLE_LIGHT,
  loadMapLibre,
  attachResizeFix,
} from '@/lib/maps/maplibre-config';
import { ringToFeature, type Ring, type ServiceArea } from '@/lib/service-areas';

interface Props {
  /** المضلَّع قيد الرسم — يُحدَّث بالنقر على الخريطة */
  draft: Ring;
  onDraftChange: (ring: Ring) => void;
  /** المناطق المحفوظة، تُرسم خلف المسوّدة للسياق */
  saved: ServiceArea[];
  /** لون المسوّدة */
  color: string;
  height?: number;
}

const SRC_SAVED = 'sa-saved';
const SRC_DRAFT = 'sa-draft';
const SRC_POINTS = 'sa-points';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ محرّر مضلَّعات مناطق الخدمة
 * ════════════════════════════════════════════════════════════════════
 *
 * الرسم بالنقر: كلّ نقرةٍ رأس. النقر على رأسٍ قائم يحذفه. لا مكتبة رسمٍ
 * إضافية (mapbox-gl-draw وأخواتها) — الحاجة هنا حلقةٌ واحدةٌ بسيطة،
 * وإضافة اعتماديةٍ لها تُثقل الحزمة بلا مقابل.
 *
 * الحالة كلّها في الأب (`draft`)، والخريطة تعرضها فقط. فزرّ «تراجع» و
 * «مسح» و«تعديل منطقة قائمة» كلّها تعمل بلا حالةٍ مزدوجة هنا.
 */
export default function ServiceAreaMap({
  draft,
  onDraftChange,
  saved,
  color,
  height = 460,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const cleanupResizeRef = useRef<(() => void) | null>(null);

  // النقر يقرأ أحدث مسوّدة: نحفظها في ref كي لا يُعاد تركيب المستمع مع كل رأس
  const draftRef = useRef<Ring>(draft);
  draftRef.current = draft;
  const onChangeRef = useRef(onDraftChange);
  onChangeRef.current = onDraftChange;

  /** مسافةٌ بالبكسل تُعدّ «نقرةً على الرأس» لا رأساً جديداً */
  const HIT_PX = 12;

  const handleClick = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;

    const ring = draftRef.current;
    const { lng, lat } = e.lngLat;

    // أقرب رأسٍ إلى النقرة — بالبكسل لا بالدرجات، فالحساسية ثابتةٌ مع التقريب
    let hitIndex = -1;
    let best = Infinity;
    for (let i = 0; i < ring.length; i++) {
      const p = map.project(ring[i] as [number, number]);
      const d = Math.hypot(p.x - e.point.x, p.y - e.point.y);
      if (d < HIT_PX && d < best) {
        best = d;
        hitIndex = i;
      }
    }

    if (hitIndex >= 0) {
      onChangeRef.current(ring.filter((_, i) => i !== hitIndex));
    } else {
      onChangeRef.current([...ring, [lng, lat]]);
    }
  }, []);

  // ─── إنشاء الخريطة مرّة واحدة ───
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_LIGHT,
        center: [IRAQ_CENTER.lng, IRAQ_CENTER.lat],
        zoom: 10,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        if (cancelled) return;

        const empty = { type: 'FeatureCollection' as const, features: [] };
        map.addSource(SRC_SAVED, { type: 'geojson', data: empty });
        map.addSource(SRC_DRAFT, { type: 'geojson', data: empty });
        map.addSource(SRC_POINTS, { type: 'geojson', data: empty });

        map.addLayer({
          id: 'sa-saved-fill', type: 'fill', source: SRC_SAVED,
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: 'sa-saved-line', type: 'line', source: SRC_SAVED,
          paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-dasharray': [2, 2] },
        });
        map.addLayer({
          id: 'sa-draft-fill', type: 'fill', source: SRC_DRAFT,
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 },
        });
        map.addLayer({
          id: 'sa-draft-line', type: 'line', source: SRC_DRAFT,
          paint: { 'line-color': ['get', 'color'], 'line-width': 2.5 },
        });
        map.addLayer({
          id: 'sa-points', type: 'circle', source: SRC_POINTS,
          paint: {
            'circle-radius': 6,
            'circle-color': '#fff',
            'circle-stroke-width': 2.5,
            'circle-stroke-color': ['get', 'color'],
          },
        });

        readyRef.current = true;
        map.getCanvas().style.cursor = 'crosshair';
        // نُجبر أوّل رسمٍ للبيانات الموجودة وقت اكتمال التحميل
        map.fire('sa:ready');
      });

      map.on('click', handleClick);
      mapRef.current = map;
      cleanupResizeRef.current = attachResizeFix(map, containerRef.current);
    })();

    return () => {
      cancelled = true;
      cleanupResizeRef.current?.();
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, [handleClick]);

  // ─── مزامنة المصادر مع الحالة ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const paint = () => {
      if (!readyRef.current) return;

      const savedSrc = map.getSource(SRC_SAVED) as any;
      const draftSrc = map.getSource(SRC_DRAFT) as any;
      const pointsSrc = map.getSource(SRC_POINTS) as any;
      if (!savedSrc || !draftSrc || !pointsSrc) return;

      savedSrc.setData({
        type: 'FeatureCollection',
        features: saved
          .filter((a) => a.polygon?.length >= 3)
          .map((a) => ringToFeature(a.polygon, { color: a.color, name: a.name_ar })),
      });

      draftSrc.setData({
        type: 'FeatureCollection',
        features: draft.length >= 3 ? [ringToFeature(draft, { color })] : [],
      });

      pointsSrc.setData({
        type: 'FeatureCollection',
        features: draft.map((v, i) => ({
          type: 'Feature' as const,
          properties: { color, index: i },
          geometry: { type: 'Point' as const, coordinates: v },
        })),
      });
    };

    paint();
    map.on('sa:ready', paint);
    return () => {
      map.off('sa:ready', paint);
    };
  }, [draft, saved, color]);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--line, #E8E6DE)',
      }}
      role="application"
      aria-label="خريطة رسم منطقة الخدمة — انقر لإضافة نقطة، وانقر على نقطةٍ لحذفها"
    />
  );
}

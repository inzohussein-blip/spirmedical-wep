'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, LatLngExpression } from 'leaflet';
import { IRAQ_CENTER } from '@/types/location';

/**
 * ═══════════════════════════════════════════════════════════════
 * MapHeatmap — خريطة حرارة الطلبات
 * ═══════════════════════════════════════════════════════════════
 *
 * يعرض كثافة الطلبات على الخريطة - المناطق الأكثر طلباً = أحمر
 *
 * يستخدم leaflet.heat plugin (مجاني)
 *
 * استخدام:
 *   <MapHeatmap points={[[lat, lng, intensity], ...]} />
 *
 * مهم: لا تستورد مباشرة! استخدم MapHeatmapWrapper
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
  /** مركز الخريطة */
  center?: { lat: number; lng: number };
  /** zoom level */
  zoom?: number;
  /** الارتفاع */
  height?: number;
  /** نصف قطر النقاط (افتراضي 25) */
  radius?: number;
  /** أقصى كثافة (للتدرّج اللوني) */
  maxIntensity?: number;
}

export default function MapHeatmap({
  points,
  center,
  zoom = 7,
  height = 500,
  radius = 25,
  maxIntensity,
}: MapHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const L = await import('leaflet');
        // تحميل heat plugin
        await import('leaflet.heat');

        if (cancelled || !mapContainerRef.current) return;
        if (mapRef.current) {
          setIsReady(true);
          return;
        }

        const startCenter = center ?? IRAQ_CENTER;

        const map = L.map(mapContainerRef.current, {
          center: [startCenter.lat, startCenter.lng] as LatLngExpression,
          zoom,
          scrollWheelZoom: true,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          minZoom: 5,
        }).addTo(map);

        mapRef.current = map;
        setIsReady(true);

        // 🔧 V31 FIX: إعادة حساب أبعاد الخريطة بعد الرسم
        const fixSize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
        setTimeout(fixSize, 0);
        setTimeout(fixSize, 150);
        setTimeout(fixSize, 400);
        requestAnimationFrame(fixSize);
        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
          resizeObserverRef.current = new ResizeObserver(() => fixSize());
          resizeObserverRef.current.observe(mapContainerRef.current);
        }
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
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      heatLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── تحديث الـ heatmap عند تغيير points ─── */
  useEffect(() => {
    if (!isReady || !mapRef.current || points.length === 0) return;

    let cancelled = false;

    async function updateHeatmap() {
      const L = await import('leaflet');
      const Lwithheat = L as unknown as {
        heatLayer: (
          points: Array<[number, number, number]>,
          opts: Record<string, unknown>
        ) => L.Layer;
      };

      if (cancelled || !mapRef.current) return;

      // إزالة الطبقة القديمة
      if (heatLayerRef.current) {
        heatLayerRef.current.remove();
      }

      // بناء points للـ heat layer: [lat, lng, intensity]
      const heatPoints: Array<[number, number, number]> = points.map((p) => [
        p.lat,
        p.lng,
        p.intensity ?? 0.5,
      ]);

      // إنشاء الطبقة
      const heatLayer = Lwithheat.heatLayer(heatPoints, {
        radius,
        blur: 20,
        maxZoom: 17,
        max: maxIntensity ?? 1.0,
        gradient: {
          0.0: 'blue',
          0.3: 'cyan',
          0.5: 'lime',
          0.7: 'yellow',
          1.0: 'red',
        },
      });

      heatLayer.addTo(mapRef.current);
      heatLayerRef.current = heatLayer;

      // ضبط حدود الخريطة لتغطي كل النقاط
      if (points.length > 1) {
        const bounds = L.latLngBounds(
          points.map((p) => [p.lat, p.lng] as LatLngExpression)
        );
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }

    updateHeatmap();

    return () => {
      cancelled = true;
    };
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
          height: `${height}px`,
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
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'blue' }} />
          <span>قليل</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'lime' }} />
          <span>متوسط</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'red' }} />
          <span>كثيف</span>
        </div>
        <span style={{ marginInlineStart: 'auto', color: 'var(--ink-3)' }}>
          {points.length} طلب
        </span>
      </div>
    </div>
  );
}

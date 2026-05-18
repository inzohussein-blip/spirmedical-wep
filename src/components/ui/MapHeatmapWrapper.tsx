'use client';

import dynamic from 'next/dynamic';
import type { MapHeatmapProps } from './MapHeatmap';

const MapHeatmap = dynamic(
  () =>
    import('./MapHeatmap').then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'var(--paper-3)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          color: 'var(--ink-3)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid var(--paper-2)',
            borderTopColor: 'var(--emerald)',
            borderRadius: '50%',
            animation: 'mhw-spin 0.8s linear infinite',
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 700 }}>جارٍ تحميل خريطة الحرارة...</div>
        <style jsx>{`
          @keyframes mhw-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    ),
  }
);

export function MapHeatmapWrapper(props: MapHeatmapProps) {
  return <MapHeatmap {...props} />;
}

export type { MapHeatmapProps, HeatmapPoint } from './MapHeatmap';

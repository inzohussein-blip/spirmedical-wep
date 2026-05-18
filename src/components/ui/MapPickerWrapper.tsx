'use client';

import dynamic from 'next/dynamic';
import type { MapPickerProps } from './MapPicker';

/**
 * MapPicker Wrapper مع SSR disabled
 */

const MapPicker = dynamic(
  () =>
    import('./MapPicker').then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          height: 380,
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
            animation: 'mpw-spin 0.8s linear infinite',
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 700 }}>جارٍ تحميل الخريطة...</div>
        <style jsx>{`
          @keyframes mpw-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    ),
  }
);

export function MapPickerWrapper(props: MapPickerProps) {
  return <MapPicker {...props} />;
}

export type { MapPickerProps } from './MapPicker';

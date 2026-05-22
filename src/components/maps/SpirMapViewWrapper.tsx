'use client';

import dynamic from 'next/dynamic';
import type { MapMarker } from './SpirMapView';

const SpirMapView = dynamic(
  () => import('./SpirMapView'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 400,
          background: '#E8EEF1',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#5F5E5A',
          fontSize: 13,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid #D3D1C7',
              borderTopColor: '#0F6E56',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 8px',
            }}
          />
          <div>تحميل الخريطة...</div>
        </div>
      </div>
    ),
  }
);

interface Props {
  markers?: MapMarker[];
  marker?: MapMarker;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  showDirections?: boolean;
  className?: string;
}

export default function SpirMapViewWrapper(props: Props) {
  return <SpirMapView {...props} />;
}

export type { MapMarker };

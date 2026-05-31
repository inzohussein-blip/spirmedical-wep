'use client';

import dynamic from 'next/dynamic';
import type { ServiceLocation } from './ServicesMapHub';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ ServicesMapHubWrapper (V25.37)
 * ════════════════════════════════════════════════════════════════════
 *
 * SSR-safe wrapper للـ ServicesMapHub
 *
 * Leaflet لا يعمل في server-side (يستخدم window)
 * هذا الـ wrapper يضمن أنه يُحمّل فقط في الـ client
 * ════════════════════════════════════════════════════════════════════
 */

const ServicesMapHub = dynamic(
  () => import('./ServicesMapHub'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 'clamp(300px, 50vh, 500px)',
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
  locations: ServiceLocation[];
  height?: number;
  defaultFilter?: 'all' | 'blood-draw' | 'home-nursing' | 'pharmacy' | 'dental' | 'optical' | 'mental-health' | 'nutrition' | 'hospital' | 'doctor' | 'clinic';
}

export default function ServicesMapHubWrapper(props: Props) {
  return <ServicesMapHub {...props} />;
}

export type { ServiceLocation };

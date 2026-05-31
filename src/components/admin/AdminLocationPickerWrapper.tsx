'use client';

import dynamic from 'next/dynamic';
import type { ServiceMarkerType } from '@/lib/maps/markers';

const AdminLocationPicker = dynamic(() => import('./AdminLocationPicker'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 260,
        background: '#E8EEF1',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5F5E5A',
        fontSize: 13,
      }}
    >
      تحميل الخريطة...
    </div>
  ),
});

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  markerType?: ServiceMarkerType;
  height?: number;
  onChange: (lat: number, lng: number) => void;
  onAddressDetected?: (address: string, governorate: string | null) => void;
}

export default function AdminLocationPickerWrapper(props: Props) {
  return <AdminLocationPicker {...props} />;
}

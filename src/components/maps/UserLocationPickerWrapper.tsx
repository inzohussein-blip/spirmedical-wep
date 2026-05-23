'use client';

import dynamic from 'next/dynamic';
import type { LocationData } from './UserLocationPicker';

const UserLocationPicker = dynamic(
  () => import('./UserLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 280, background: '#E8EEF1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5F5E5A', fontSize: 13 }}>
        تحميل الخريطة...
      </div>
    ),
  }
);

interface Props {
  initialLocation?: Partial<LocationData>;
  onLocationChange: (location: LocationData) => void;
  height?: number;
  showGovernorate?: boolean;
  showAddress?: boolean;
  label?: string;
  description?: string;
}

export default function UserLocationPickerWrapper(props: Props) {
  return <UserLocationPicker {...props} />;
}

export type { LocationData };

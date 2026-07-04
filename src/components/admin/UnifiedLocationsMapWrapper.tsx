'use client';

import UnifiedLocationsMap from './UnifiedLocationsMap';
import type { UnifiedLocation } from '@/app/admin/locations/types';

interface Props {
  locations: UnifiedLocation[];
  height?: number;
}

export default function UnifiedLocationsMapWrapper(props: Props) {
  return <UnifiedLocationsMap {...props} />;
}

'use client';

import UnifiedLocationsMap from './UnifiedLocationsMap';
import type { UnifiedLocation } from '@/app/admin44/locations/types';

interface Props {
  locations: UnifiedLocation[];
  height?: number;
}

export default function UnifiedLocationsMapWrapper(props: Props) {
  return <UnifiedLocationsMap {...props} />;
}

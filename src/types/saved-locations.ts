/**
 * ═══════════════════════════════════════════════════════════════
 * Saved Locations + Geocoding Types — V25 (Maps Phase C+D)
 * ═══════════════════════════════════════════════════════════════
 */

import type { GpsCoordinates } from './location';

/* ─── User Saved Locations ──────────────────────────────── */

export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  icon: string;
  address: string;
  lat: number;
  lng: number;
  governorate: string | null;
  notes: string | null;
  is_pinned: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedLocationInput {
  label: string;
  icon?: string;
  address: string;
  lat: number;
  lng: number;
  governorate?: string;
  notes?: string;
  is_pinned?: boolean;
}

/* ─── الأيقونات الشائعة (preset suggestions) ──────────── */

export const SAVED_LOCATION_ICONS = [
  { emoji: '🏠', label: 'البيت' },
  { emoji: '💼', label: 'العمل' },
  { emoji: '👵', label: 'الوالدين' },
  { emoji: '🏥', label: 'المستشفى' },
  { emoji: '🎓', label: 'الجامعة' },
  { emoji: '🛒', label: 'السوق' },
  { emoji: '⛪', label: 'المسجد' },
  { emoji: '👫', label: 'الأصدقاء' },
  { emoji: '📍', label: 'مكان آخر' },
] as const;

/* ─── Geocoding Cache ───────────────────────────────────── */

export interface GeocodingResult {
  display_name: string;
  road: string | null;
  suburb: string | null;
  city: string | null;
  governorate: string | null;
  country: string | null;
}

/* ─── Nominatim API Response (مرجعي) ──────────────────── */

export interface NominatimResponse {
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  lat: string;
  lon: string;
}

/* ─── Geocoding helpers ─────────────────────────────────── */

/**
 * تحويل lat/lng إلى الـ rounded version للـ cache
 * 4 خانات عشرية = ~11 متر دقة
 */
export function roundForCache(coords: GpsCoordinates): {
  lat_rounded: number;
  lng_rounded: number;
} {
  return {
    lat_rounded: Math.round(coords.lat * 10000) / 10000,
    lng_rounded: Math.round(coords.lng * 10000) / 10000,
  };
}

/**
 * استخراج أفضل label من Nominatim response
 */
export function formatNominatimAddress(data: NominatimResponse): GeocodingResult {
  const addr = data.address || {};
  
  // اختر المدينة من الأنواع المختلفة (city > town > village)
  const city = addr.city || addr.town || addr.village || null;
  
  // اختر الحي من الأنواع المختلفة
  const suburb = addr.suburb || addr.neighbourhood || null;
  
  // المحافظة من state
  const governorate = addr.state || null;
  
  return {
    display_name: data.display_name,
    road: addr.road || null,
    suburb,
    city,
    governorate,
    country: addr.country || null,
  };
}

/**
 * بناء display label قصير (للـ UI)
 * مثل: "شارع الكرادة الخارجية، الكرادة، بغداد"
 */
export function buildShortAddress(result: GeocodingResult): string {
  const parts = [
    result.road,
    result.suburb,
    result.city,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join('، ') : result.display_name;
}

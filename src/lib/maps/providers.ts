/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ Map Providers (V25.37)
 * ════════════════════════════════════════════════════════════════════
 *
 * Helpers لبناء روابط الخرائط الخارجية
 *
 * كلها مجانية - بدون API keys
 *
 * استخدام:
 *   const url = buildMapUrl('google', { lat: 33.31, lng: 44.36 });
 *   window.open(url, '_blank');
 * ════════════════════════════════════════════════════════════════════
 */

export type MapProvider = 'google' | 'waze' | 'apple' | 'osm';

export interface Coords {
  lat: number;
  lng: number;
}

export interface MapProviderInfo {
  id: MapProvider;
  label: string;
  icon: string; // Tabler icon name
}

export const MAP_PROVIDERS: MapProviderInfo[] = [
  { id: 'google', label: 'Google Maps', icon: 'brand-google-maps' },
  { id: 'waze',   label: 'Waze',         icon: 'brand-waze' },
  { id: 'apple',  label: 'Apple Maps',   icon: 'brand-apple' },
  { id: 'osm',    label: 'OpenStreetMap', icon: 'map' },
];

/**
 * يبني رابط للخرائط حسب المزوّد
 *
 * @param provider - 'google' | 'waze' | 'apple' | 'osm'
 * @param coords - { lat, lng }
 * @param label - اسم المكان (اختياري - يظهر كـ marker label)
 */
export function buildMapUrl(
  provider: MapProvider,
  coords: Coords,
  label?: string
): string {
  const { lat, lng } = coords;
  const encodedLabel = label ? encodeURIComponent(label) : '';

  switch (provider) {
    case 'google':
      // Google Maps - directions to point
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${
        encodedLabel ? `&destination_place_id=${encodedLabel}` : ''
      }`;

    case 'waze':
      // Waze - navigate to point
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    case 'apple':
      // Apple Maps - directions to point (works on iOS + macOS)
      return `https://maps.apple.com/?daddr=${lat},${lng}${
        encodedLabel ? `&q=${encodedLabel}` : ''
      }`;

    case 'osm':
      // OpenStreetMap - view point
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16#map=16/${lat}/${lng}`;

    default:
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
}

/**
 * يكتشف الـ provider الافتراضي حسب نظام التشغيل
 *
 * - iOS/macOS → apple
 * - Android   → google
 * - Other     → google
 */
export function getDefaultProvider(): MapProvider {
  if (typeof navigator === 'undefined') return 'google';

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod|macintosh/.test(ua) && !/chrome/.test(ua)) {
    return 'apple';
  }

  return 'google';
}

/**
 * يفتح الموقع في تطبيق الخرائط المفضّل
 *
 * @param coords - { lat, lng }
 * @param label - اسم المكان (اختياري)
 * @param provider - الـ provider (اختياري - يستخدم الافتراضي)
 */
export function openInExternalMap(
  coords: Coords,
  label?: string,
  provider?: MapProvider
): void {
  if (typeof window === 'undefined') return;

  const chosen = provider || getDefaultProvider();
  const url = buildMapUrl(chosen, coords, label);

  window.open(url, '_blank', 'noopener,noreferrer');
}

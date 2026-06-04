'use server';

/**
 * ═══════════════════════════════════════════════════════════════
 * Geocoding Service — Reverse Geocoding via Nominatim
 * ═══════════════════════════════════════════════════════════════
 *
 * يحوّل إحداثيات GPS → عنوان نصي عربي
 *
 * يستخدم:
 *   - Nominatim API (مجاني، من OpenStreetMap)
 *   - Database cache (نقلل API calls)
 *
 * Rate limiting:
 *   - Nominatim: 1 طلب/ثانية كحدّ أقصى
 *   - نضع cache لمدة طويلة (الأماكن لا تتغيّر)
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type {
  GeocodingResult,
  NominatimResponse,
} from '@/types/saved-locations';
import {
  roundForCache,
  formatNominatimAddress,
  buildShortAddress,
} from '@/types/saved-locations';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'SpirMedical/1.0 (https://spir-medical.com)';

/**
 * يحوّل إحداثيات إلى عنوان عربي
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  if (!isValidCoords(lat, lng)) {
    return null;
  }

  const supabase = createClient();
  const { lat_rounded, lng_rounded } = roundForCache({ lat, lng });

  // ─── 1. ابحث في الـ cache أولاً ───
  try {
    const { data: cached } = await supabase
      .from('geocoding_cache')
      .select('*')
      .eq('lat_rounded', lat_rounded)
      .eq('lng_rounded', lng_rounded)
      .maybeSingle();

    if (cached) {
      // حدّث hit count + last_used (fire-and-forget)
      supabase
        .from('geocoding_cache')
        .update({
          hit_count: cached.hit_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', cached.id)
        .then(() => undefined);

      return {
        display_name: cached.display_name,
        road: cached.road,
        suburb: cached.suburb,
        city: cached.city,
        governorate: cached.governorate,
        country: cached.country,
      };
    }
  } catch (err) {
    logger.warn('geocoding_cache lookup failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    // نُكمل ونستدعي API
  }

  // ─── 2. استدعاء Nominatim ───
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('accept-language', 'ar,en'); // عربي أولاً
    url.searchParams.set('zoom', '18'); // أعلى دقة

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
      // timeout سريع لتجنّب تأخير المستخدم
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logger.warn('Nominatim returned non-OK', {
        status: response.status,
        lat,
        lng,
      });
      return null;
    }

    const data = (await response.json()) as NominatimResponse;
    const result = formatNominatimAddress(data);

    // ─── 3. احفظ في الـ cache (fire-and-forget) ───
    supabase
      .from('geocoding_cache')
      .upsert(
        {
          lat_rounded,
          lng_rounded,
          display_name: result.display_name,
          road: result.road,
          suburb: result.suburb,
          city: result.city,
          governorate: result.governorate,
          country: result.country,
          raw_data: data as unknown as never,
          hit_count: 1,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'lat_rounded,lng_rounded' }
      )
      .then(() => undefined);

    return result;
  } catch (err) {
    logger.error('reverseGeocode failed', {
      lat,
      lng,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * يحوّل إحداثيات لـ عنوان قصير (للعرض في UI)
 */
export async function reverseGeocodeShort(
  lat: number,
  lng: number
): Promise<string | null> {
  const result = await reverseGeocode(lat, lng);
  if (!result) return null;
  return buildShortAddress(result);
}

/* ─── Helpers ────────────────────────────────────────────── */

function isValidCoords(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

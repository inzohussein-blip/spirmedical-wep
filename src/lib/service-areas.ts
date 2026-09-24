/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ هندسة مناطق الخدمة — توأم TypeScript لدالّة `point_in_polygon`
 * ════════════════════════════════════════════════════════════════════
 *
 * المرجع في القاعدة (`supabase/migrations/0030_service_areas.sql`) وهو
 * الفاصل عند أيّ خلاف. وهذا التوأم للاستعمال في المتصفّح: معاينةٌ فورية
 * أثناء الرسم، ورسالةٌ للمستخدم قبل إرسال النموذج — بلا رحلةٍ للخادم.
 *
 * الترتيب `[lng, lat]` على اصطلاح GeoJSON، لا `[lat, lng]`. وهو مصدرُ
 * أخطاءٍ صامتة إن اختلط: نقطةٌ في بغداد تصبح في الصومال.
 */

/** رأسٌ واحد: [خط الطول، خط العرض] */
export type Vertex = [number, number];

/** حلقةٌ مغلقة ضمناً — لا يُكرَّر الرأس الأوّل في النهاية */
export type Ring = Vertex[];

export interface ServiceArea {
  id: string;
  name_ar: string;
  governorate: string | null;
  polygon: Ring;
  color: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export const MIN_VERTICES = 3;
/** حدٌّ أعلى يمنع حمولةً ضخمة من نقرٍ عرضيّ مطوَّل */
export const MAX_VERTICES = 500;

/**
 * اختبار الشعاع (ray casting): يُمدّ شعاعٌ أفقيٌّ من النقطة ويُعدّ تقاطعاته
 * مع الأضلاع. فردٌ ⇒ داخل. الشرط `(yi > lat) !== (yj > lat)` يستبعد الأضلاع
 * الأفقية، فلا يقع `yj - yi` صفراً في المقام.
 */
export function pointInPolygon(ring: Ring, lat: number, lng: number): boolean {
  if (!Array.isArray(ring) || ring.length < MIN_VERTICES) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** أوّل منطقةٍ مفعّلة تغطّي النقطة، أو `null` */
export function areaCovering(
  areas: ServiceArea[],
  lat: number,
  lng: number
): ServiceArea | null {
  return (
    areas.find((a) => a.is_active && pointInPolygon(a.polygon, lat, lng)) ?? null
  );
}

/**
 * مساحةٌ تقريبية بالكيلومتر المربّع (صيغة الحذّاء + تصحيح خط العرض).
 * للعرض على المشرف وحده — ليست لحسابٍ يُبنى عليه قرار.
 */
export function approximateAreaKm2(ring: Ring): number {
  if (ring.length < MIN_VERTICES) return 0;
  const latAvg = ring.reduce((s, v) => s + v[1], 0) / ring.length;
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.32 * Math.cos((latAvg * Math.PI) / 180);

  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    sum += xj * kmPerDegLng * (yi * kmPerDegLat) - xi * kmPerDegLng * (yj * kmPerDegLat);
  }
  return Math.abs(sum / 2);
}

/** تحقّقٌ من شكل الحلقة — يُستعمل على الخادم قبل الكتابة وفي المتصفّح */
export function validateRing(
  value: unknown
): { ok: true; ring: Ring } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: 'المضلّع ليس مصفوفة' };
  if (value.length < MIN_VERTICES) {
    return { ok: false, error: `المنطقة تحتاج ${MIN_VERTICES} نقاطٍ على الأقل` };
  }
  if (value.length > MAX_VERTICES) {
    return { ok: false, error: `عدد النقاط تجاوز ${MAX_VERTICES}` };
  }

  const ring: Ring = [];
  for (const pt of value) {
    if (!Array.isArray(pt) || pt.length !== 2) {
      return { ok: false, error: 'كل نقطةٍ يجب أن تكون [خط الطول، خط العرض]' };
    }
    const [lng, lat] = pt;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return { ok: false, error: 'إحداثيات غير رقمية' };
    }
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return { ok: false, error: 'إحداثيات غير صالحة' };
    }
    if (lat < -90 || lat > 90) return { ok: false, error: 'خط العرض خارج المدى' };
    if (lng < -180 || lng > 180) return { ok: false, error: 'خط الطول خارج المدى' };
    ring.push([lng, lat]);
  }
  return { ok: true, ring };
}

/** GeoJSON لعرض الحلقة على MapLibre — يُغلق الحلقة صراحةً كما يطلب المعيار */
export function ringToFeature(ring: Ring, props: Record<string, unknown> = {}) {
  const closed = ring.length ? [...ring, ring[0]] : [];
  return {
    type: 'Feature' as const,
    properties: props,
    geometry: { type: 'Polygon' as const, coordinates: [closed] },
  };
}

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  pointInPolygon,
  areaCovering,
  validateRing,
  ringToFeature,
  approximateAreaKm2,
  MAX_VERTICES,
  type Ring,
  type ServiceArea,
} from '@/lib/service-areas';

/**
 * 🧭 مناطق الخدمة — التوأمان يجب أن يتّفقا
 *
 * الحكم «أهذا العنوان مخدوم؟» يُتّخذ في مكانين: `point_in_polygon` في
 * القاعدة (الترحيل 0030) و`pointInPolygon` في المتصفّح. واختلافهما يعني
 * أن يرى المريض «منطقتك مخدومة» ثمّ يُرفض حجزه — أو العكس.
 *
 * الحالات أدناه نُفِّذت على القاعدة الحيّة أوّلاً، والنتائج المُثبتة هي
 * `want`. فهذا الاختبار يقيس التوأم على المرجع لا على ظنّي.
 */

const SQUARE: Ring = [[0, 0], [10, 0], [10, 10], [0, 10]];
/** مقعّرٌ على شكل L — يكشف من يختبر الصندوق المحيط بدل المضلَّع */
const LSHAPE: Ring = [[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]];
const BAGHDAD_BOX: Ring = [[44.2, 33.2], [44.6, 33.2], [44.6, 33.5], [44.2, 33.5]];

describe('هندسة مناطق الخدمة', () => {
  // [الوصف، الحلقة، lat، lng، النتيجة المُثبتة على القاعدة]
  const CASES: [string, Ring, number, number, boolean][] = [
    ['مركز المربّع', SQUARE, 5, 5, true],
    ['خارج المربّع تماماً', SQUARE, 15, 15, false],
    ['خارجه أفقياً', SQUARE, 5, 20, false],
    ['سالب الإحداثي', SQUARE, -1, 5, false],
    ['L: داخل الساق', LSHAPE, 8, 2, true],
    ['L: في التجويف', LSHAPE, 8, 8, false],
    ['بغداد داخل مربّع بغداد', BAGHDAD_BOX, 33.3152, 44.3661, true],
    ['البصرة خارج مربّع بغداد', BAGHDAD_BOX, 30.5085, 47.7804, false],
  ];

  it.each(CASES)('%s', (_label, ring, lat, lng, want) => {
    expect(pointInPolygon(ring, lat, lng)).toBe(want);
  });

  it('يرفض ما دون ثلاث نقاط بدل أن يخمّن', () => {
    expect(pointInPolygon([[0, 0], [1, 1]] as Ring, 0, 0)).toBe(false);
    expect(pointInPolygon([] as Ring, 0, 0)).toBe(false);
  });

  it('يرفض الإحداثيات غير الرقمية بدل أن يُرجع نتيجةً عشوائية', () => {
    expect(pointInPolygon(SQUARE, NaN, 5)).toBe(false);
    expect(pointInPolygon(SQUARE, 5, Infinity)).toBe(false);
  });

  it('ترتيب الإحداثيات [lng, lat] لا [lat, lng]', () => {
    // مربّعٌ ضيّقٌ حول بغداد. لو قُلب الترتيب لخرجت النقطة منه.
    expect(pointInPolygon(BAGHDAD_BOX, 33.3152, 44.3661)).toBe(true);
    // النقطة نفسها بإحداثيّين مقلوبين — يجب ألّا تقع داخله
    expect(pointInPolygon(BAGHDAD_BOX, 44.3661, 33.3152)).toBe(false);
  });
});

describe('التحقّق من الحلقة قبل الكتابة', () => {
  it('يقبل حلقةً سليمة', () => {
    const r = validateRing(SQUARE);
    expect(r.ok).toBe(true);
  });

  it.each([
    ['ليست مصفوفة', 'nope'],
    ['نقطتان فقط', [[0, 0], [1, 1]]],
    ['نقطةٌ بثلاثة أعداد', [[0, 0, 0], [1, 1], [2, 2]]],
    ['إحداثيٌّ نصّيّ', [['0', '0'], [1, 1], [2, 2]]],
    ['خط عرضٍ خارج المدى', [[0, 91], [1, 1], [2, 2]]],
    ['خط طولٍ خارج المدى', [[181, 0], [1, 1], [2, 2]]],
    ['NaN', [[0, NaN], [1, 1], [2, 2]]],
  ])('يرفض: %s', (_label, bad) => {
    const r = validateRing(bad);
    expect(r.ok).toBe(false);
  });

  it('يرفض حلقةً أطول من الحدّ الأعلى', () => {
    const huge = Array.from({ length: MAX_VERTICES + 1 }, (_, i) => [i / 1000, 0]);
    expect(validateRing(huge).ok).toBe(false);
  });
});

describe('عرض المضلَّع على الخريطة', () => {
  it('GeoJSON يُغلق الحلقة صراحةً كما يطلب المعيار', () => {
    const f = ringToFeature(SQUARE);
    const coords = f.geometry.coordinates[0];
    expect(coords).toHaveLength(SQUARE.length + 1);
    expect(coords[coords.length - 1]).toEqual(coords[0]);
  });

  it('المساحة التقريبية موجبةٌ ومعقولة', () => {
    // مربّعٌ ضلعه ~0.1 درجة قرب بغداد ≈ 11×9 كم ≈ 100 كم²
    const box: Ring = [[44.3, 33.3], [44.4, 33.3], [44.4, 33.4], [44.3, 33.4]];
    const km2 = approximateAreaKm2(box);
    expect(km2).toBeGreaterThan(50);
    expect(km2).toBeLessThan(200);
  });
});

describe('اختيار المنطقة المغطّية', () => {
  const mk = (id: string, ring: Ring, active: boolean): ServiceArea => ({
    id, name_ar: id, governorate: null, polygon: ring,
    color: '#0F766E', is_active: active, notes: null,
    created_at: '2026-01-01T00:00:00Z',
  });

  it('يتجاهل المناطق المعطّلة', () => {
    const areas = [mk('معطّلة', SQUARE, false)];
    expect(areaCovering(areas, 5, 5)).toBeNull();
  });

  it('يُرجع المنطقة المفعّلة التي تغطّي النقطة', () => {
    const areas = [mk('معطّلة', SQUARE, false), mk('مفعّلة', SQUARE, true)];
    expect(areaCovering(areas, 5, 5)?.id).toBe('مفعّلة');
  });

  it('يُرجع null خارج كلّ المناطق', () => {
    expect(areaCovering([mk('أ', SQUARE, true)], 99, 99)).toBeNull();
  });
});

describe('اتّساق الترحيل مع الكود', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '0030_service_areas.sql'),
    'utf8'
  );

  it('لا يُعيد الترحيل امتداد PostGIS الذي أسقطه 0025', () => {
    expect(/CREATE\s+EXTENSION[^\n;]*postgis/i.test(sql)).toBe(false);
  });

  it('الجدول يفرض حلقةً من ثلاث نقاطٍ فأكثر ولوناً سليماً', () => {
    expect(sql).toContain('jsonb_array_length(polygon) >= 3');
    expect(sql).toContain("color ~ '^#[0-9A-Fa-f]{6}$'");
  });

  it('المناطق المعطّلة لا يقرؤها غير المشرف', () => {
    expect(sql).toContain('FOR SELECT USING (is_active)');
  });

  it('دالّة التغطية INVOKER فتمرّ عبر RLS', () => {
    const fn = sql.slice(sql.indexOf('FUNCTION public.service_areas_covering'));
    expect(/SECURITY\s+DEFINER/i.test(fn)).toBe(false);
  });
});

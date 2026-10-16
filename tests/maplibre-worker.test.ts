/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🗺️ عاملُ MapLibre 6 مُستضافٌ ذاتياً.
 *
 * المكتبةُ تشتقّ عنوانَ عاملها من `import.meta.url`، وwebpack يحوّله إلى `file://`، فقِيس في
 * المتصفّح «Worker failed to load» ولا تُرسم أيُّ خريطة (منتقي الموقع، التغطية، مناطق الخدمة).
 * الإصلاح: نسخةٌ في public/vendor و`setWorkerUrl` قبل أوّل خريطة.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p));

describe('عاملُ MapLibre', () => {
  it('🚨 النسخةُ المُستضافة تطابق المكتبةَ المثبَّتة بايتاً ببايت — تُحدَّث مع كلّ ترقية', () => {
    const vendored = read('public/vendor/maplibre-gl-worker.mjs');
    const installed = read('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
    expect(vendored.equals(installed)).toBe(true);
  });

  it('🚨 loadMapLibre يضبط عنوانَ العامل قبل أن يُعيد المكتبة', () => {
    const src = read('src/lib/maps/maplibre-config.ts').toString();
    const body = src.slice(src.indexOf('export async function loadMapLibre'));
    expect(src).toMatch(/MAPLIBRE_WORKER_URL = '\/vendor\/maplibre-gl-worker\.mjs'/);
    expect(body.indexOf('setWorkerUrl(MAPLIBRE_WORKER_URL)')).toBeGreaterThan(0);
    expect(body.indexOf('setWorkerUrl(MAPLIBRE_WORKER_URL)')).toBeLessThan(body.indexOf('return mod'));
  });

  it('CSP يسمح بعاملٍ من الأصل نفسه', () => {
    expect(read('next.config.js').toString()).toMatch(/worker-src 'self'/);
  });
});

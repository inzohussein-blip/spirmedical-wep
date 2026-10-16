import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🚦 بوّابةُ CI تحرس فعلاً
 *
 * كانت عتبةُ التغطية ٥٠٪ والمقيسُ ~١٦٪، فسقط CI في كلّ دفعة (1975–1979 كلُّها
 * حمراء والاختباراتُ كلُّها ناجحة). بوّابةٌ حمراءُ دائماً تُعلِّم تجاهلَ الأحمر،
 * فيمرّ الكسرُ الحقيقيّ بلا أن يلاحظه أحد. الآن: العتبةُ أرضيّةٌ تحت المقيس،
 * والخطواتُ الأربع (الأنواع، الفحص، الاختبارات، البناء) على كلّ دفعة وكلّ PR.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('خطواتُ CI', () => {
  const ci = read('.github/workflows/ci.yml');

  it('🚨 يعمل على كلّ دفعة وعلى PR إلى main', () => {
    expect(ci).toMatch(/on:\s*[\s\S]*?push:/);
    expect(ci).toMatch(/pull_request:\s*\n\s*branches: \[main\]/);
  });

  it.each(['npm run type-check', 'npm run lint', 'npm run test:coverage', 'npm run build'])('🚨 %s', (step) => {
    expect(ci).toContain(`run: ${step}`);
  });

  it('🚨 لا خطوةَ تُكمل رغم الفشل', () => {
    expect(ci).not.toMatch(/continue-on-error:\s*true/);
  });
});

describe('عتبةُ التغطية سُلّم', () => {
  const src = read('jest.config.js');
  const num = (k: string) => Number(new RegExp(`${k}:\\s*(\\d+)`).exec(src)?.[1]);

  it('🚨 لا تُنزَل تحت أرضيّة 25 أيلول', () => {
    expect(num('statements')).toBeGreaterThanOrEqual(15);
    expect(num('branches')).toBeGreaterThanOrEqual(13);
    expect(num('functions')).toBeGreaterThanOrEqual(13);
    expect(num('lines')).toBeGreaterThanOrEqual(15);
  });

  it('🚨 ولا تُرفع فوق المقيس بلا اختباراتٍ تبلغها (وإلّا عاد الأحمر الدائم)', () => {
    // المقيس في 25 أيلول: 16.3 / 14.2 / 14.5 / 16.1 — ارفع هذا السقفَ مع التغطية
    expect(num('statements')).toBeLessThanOrEqual(16);
    expect(num('branches')).toBeLessThanOrEqual(14);
    expect(num('functions')).toBeLessThanOrEqual(14);
    expect(num('lines')).toBeLessThanOrEqual(16);
  });
});

describe('ترقياتٌ لا تُدمج آليّاً (Dependabot)', () => {
  const dep = read('.github/dependabot.yml');
  const pkg = JSON.parse(read('package.json'));

  it('🚨 Supabase لا يُرقّى آليّاً — #11 أوقف النشر على Vercel', () => {
    expect(dep).toMatch(/- dependency-name: '@supabase\/ssr'\n(?!\s+update-types)/);
    expect(dep).toMatch(/dependency-name: '@supabase\/supabase-js'\n\s+update-types: \['version-update:semver-minor', 'version-update:semver-major'\]/);
  });

  it('🚨 ESLint وتعريفاتُ Node: لا قفزةَ رئيسيّة آليّة', () => {
    expect(dep).toMatch(/dependency-name: 'eslint'\n\s+update-types: \['version-update:semver-major'\]/);
    expect(dep).toMatch(/dependency-name: '@types\/node'\n\s+update-types: \['version-update:semver-major'\]/);
  });

  it.each(['typescript', 'next', 'eslint-config-next', 'jest', 'jest-environment-jsdom', '@types/jest', 'zod', 'maplibre-gl'])(
    '🚨 %s: لا قفزةَ رئيسيّة آليّة — #30 (TypeScript 7) أوقف النشر',
    (name) => {
      expect(dep).toContain(`- dependency-name: '${name}'\n        update-types: ['version-update:semver-major']`);
    },
  );

  it('🚨 zod 3 وmaplibre-gl 5 مثبَّتان — #39 و#38 أسقطا فحصَ الأنواع بـ24 خطأً', () => {
    expect(pkg.dependencies.zod).toMatch(/^3\.\d+\.\d+$/);
    expect(pkg.dependencies['maplibre-gl']).toMatch(/^5\.\d+\.\d+$/);
  });

  it('🚨 TypeScript مثبَّتٌ على 5.x — الإصدار 7 يحذف baseUrl فتنكسر مساراتُ @/', () => {
    expect(pkg.devDependencies.typescript).toMatch(/^5\.\d+\.\d+$/);
  });

  it('🚨 إصدارا Supabase مثبَّتان بدقّة (بلا ^) على المجرَّب', () => {
    expect(pkg.dependencies['@supabase/supabase-js']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.dependencies['@supabase/ssr']).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

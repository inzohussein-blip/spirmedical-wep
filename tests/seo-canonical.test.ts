import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * 🔎 حارس إشارات الفهرسة
 *
 * كلُّ ما هنا قِيس في HTML بناءٍ حقيقيّ (`next build`) لا في الكود وحده:
 *
 * ① **انهيارُ canonical.** الجذر أعلن `canonical: SITE_URL`، وNext يُورّث
 *    metadata إلى كلّ صفحةٍ لا تتجاوزها. فكانت:
 *
 *        /about /faq /contact /blog /help/install /legal/* /blog/category/*
 *        → <link rel="canonical" href="https://spir-medical.com">
 *
 *    أي «أنا نسخةٌ من الرئيسية». فيطويها Google فيها، ولا يبقى ما يترتّب
 *    لبحثٍ محدّد. المقالاتُ وحدها كانت تُعلن نفسها.
 *
 * ② **hreflang إلى غير موجود**: `/en` و`/ku` في كلّ صفحة، ولا صفحةَ لهما.
 *
 * ③ **الخريطة تُقدّم ما يحجبه robots**: خمسُ `/services/*` محجوبةٌ بـ
 *    `Disallow: /services/` — «Submitted URL blocked by robots.txt».
 *
 * ④ **البيانات المنظَّمة بالجافاسكربت**: `next/script` + `afterInteractive`.
 *    صفر وسوم `ld+json` في HTML الخادم، فزواحفُ الذكاء الاصطناعي التي لا
 *    تُنفّذ JS لا تراها أبداً. وFAQPage ومسارُ تنقّلٍ ثابت كانا يُحقنان في
 *    كلّ صفحة، وأسئلتُه لا تطابق حتى الأسئلة المرئيّة.
 *
 * ⑤ **خمسُ صيغٍ متعارضةٍ للتغطية**، و«بابل» مكرّرةٌ في `areaServed`،
 *    و«الديوانية» و«القادسية» — المحافظةُ نفسها — مُدخلان.
 */

const ROOT = process.cwd();
const APP = join(ROOT, 'src', 'app');
const MKT = join(APP, '(marketing)');
const read = (p: string) => readFileSync(p, 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n === 'page.tsx') out.push(p);
  }
  return out;
}

/** مسارُ الصفحة من مسار ملفّها — تُحذف مجموعاتُ `(…)` */
function routeOf(file: string): string {
  const r = relative(APP, file).replace(/\/?page\.tsx$/, '');
  const clean = r.split('/').filter((s) => s && !/^\(.*\)$/.test(s)).join('/');
  return '/' + clean;
}

const publicPages = [join(APP, 'page.tsx'), ...walk(MKT)];

describe('🔎 كلُّ صفحةٍ عامّة تُعلن نفسها أصلاً', () => {
  it('يجد الصفحات العامّة (حارسُ الحارس)', () => {
    expect(publicPages.length).toBeGreaterThan(12);
    expect(publicPages.map(routeOf)).toEqual(expect.arrayContaining(['/', '/faq', '/home-blood-draw']));
  });

  it('🚨 الجذر لا يُعلن canonical ولا hreflang — وإلّا ورثتهما كلُّ صفحة', () => {
    const layout = read(join(APP, 'layout.tsx')).replace(/^\s*\/\/.*$/gm, '');
    expect(layout).not.toMatch(/\balternates\s*:/);
    expect(layout).not.toMatch(/\bcanonical\s*:/);
  });

  it('🚨 كلُّ صفحةٍ عامّة تُعلن canonical، والساكنةُ منها تُعلن مسارها هي', () => {
    const offenders: string[] = [];
    for (const f of publicPages) {
      const src = read(f);
      const route = routeOf(f);
      const m = src.match(/canonical\s*:\s*(['"`])([^'"`]*)\1/);
      if (!m) {
        // المقالة تُعلنه بمتغيّر: `canonical: url` و`url` مبنيٌّ من مسارها.
        // يُتتبَّع المتغيّر إلى تعريفه بدل الاكتفاء بوجود الكلمة.
        const v = src.match(/canonical\s*:\s*(\w+)\s*[,}]/);
        const def = v && src.match(new RegExp(`const ${v[1]}\\s*=\\s*\`[^\`]*\``));
        const expected = route.replace(/\[(\w+)\]/g, '');
        if (!def || !def[0].includes(expected)) offenders.push(`${route}: لا canonical`);
        continue;
      }
      const dynamic = route.includes('[');
      if (!dynamic && m[2] !== route && !(m[2] === 'PATH' || /PATH/.test(m[0]))) {
        offenders.push(`${route}: canonical = ${m[2]}`);
      }
    }
    // الصفحةُ الجديدة تستعمل ثابتاً PATH — يُتحقَّق منه منفصلاً
    const hub = read(join(MKT, 'home-blood-draw', 'page.tsx'));
    expect(hub).toMatch(/const PATH = '\/home-blood-draw'/);
    expect(hub).toMatch(/alternates:\s*\{\s*canonical:\s*PATH\s*\}/);
    expect(offenders.filter((o) => !o.startsWith('/home-blood-draw'))).toEqual([]);
  });

  it('🚨 لا hreflang إلى لغاتٍ لا صفحاتَ لها', () => {
    for (const f of [join(APP, 'layout.tsx'), ...publicPages]) {
      const src = read(f);
      for (const m of src.matchAll(/['"]\$?\{?[^'"]*?\/(en|ku)['"`]/g)) {
        expect(existsSync(join(APP, m[1]))).toBe(true);
      }
    }
  });
});

describe('🗺️ الخريطة وrobots لا يتناقضان', () => {
  const sitemap = read(join(APP, 'sitemap.ts'));
  const robots = read(join(APP, 'robots.ts'));
  const urls = [...sitemap.matchAll(/url:\s*'([^']*)'/g)].map((m) => m[1]);
  const priv = robots.slice(robots.indexOf('const privatePaths'), robots.indexOf('];', robots.indexOf('const privatePaths')));
  const disallowed = [...priv.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  it('يقرأ الخريطة والحجب (حارسُ الحارس)', () => {
    expect(urls.length).toBeGreaterThan(8);
    expect(disallowed).toContain('/services/');
  });

  it('🚨 لا مسارَ في الخريطة يحجبه robots', () => {
    const blocked = urls.filter((u) => u && disallowed.some((d) => (u + '/').startsWith(d.endsWith('/') ? d : d + '/') || u === d));
    expect(blocked).toEqual([]);
  });

  it('🚨 كلُّ مسارٍ في الخريطة له صفحةٌ عامّة', () => {
    const routes = new Set(publicPages.map(routeOf));
    expect(urls.map((u) => u || '/').filter((u) => !routes.has(u))).toEqual([]);
  });
});

describe('🏷️ البيانات المنظَّمة في HTML الخادم', () => {
  const sd = read(join(ROOT, 'src', 'components', 'seo', 'StructuredData.tsx'));

  it('🚨 لا `next/script` للبيانات المنظَّمة — تُكتب في HTML الخادم', () => {
    expect(sd).not.toMatch(/from 'next\/script'/);
    expect(read(join(ROOT, 'src', 'components', 'seo', 'JsonLd.tsx'))).toMatch(/<script/);
  });

  it('🚨 ما يُحقن في كلّ صفحة: المؤسّسةُ والموقع — لا FAQ ولا مسارَ تنقّل', () => {
    const body = sd.slice(sd.indexOf('export default function StructuredData'));
    expect(body).not.toMatch(/faq|breadcrumb/i);
  });

  it('🚨 FAQPage الرئيسية مُشتقّةٌ من الأسئلة المعروضة', () => {
    const home = read(join(APP, 'page.tsx'));
    expect(home).toMatch(/mainEntity:\s*FAQ_ITEMS\.map/);
  });

  it('🚨 لا aggregateRating في أيّ بياناتٍ منظَّمة', () => {
    // تقييمٌ غيرُ مُستمَدٍّ من مراجعاتٍ حقيقيّةٍ مرئيّة مخالفةٌ صريحة لإرشادات
    // Google. والرقمان المعروضان («4.8» و«+1,200 تقييم») مكتوبان في الكود.
    for (const f of [join(ROOT, 'src', 'components', 'seo', 'StructuredData.tsx'), ...publicPages]) {
      expect(`${relative(ROOT, f)}:${/aggregateRating/i.test(read(f))}`).toBe(`${relative(ROOT, f)}:false`);
    }
  });
});

describe('🗺️ ادّعاءُ التغطية واحد', () => {
  const { SERVED_CITIES, areaServedJsonLd } = require('@/lib/seo/coverage');

  it('🚨 لا محافظةَ مكرّرة', () => {
    const names = SERVED_CITIES.map((c: { name: string }) => c.name);
    expect(new Set(names).size).toBe(names.length);
    // والمحافظةُ الواحدة لا تُذكر باسمين
    expect(names.includes('الديوانية') && names.includes('القادسية')).toBe(false);
  });

  it('🚨 areaServed مُشتقّةٌ من المرجع لا مكتوبةٌ باليد', () => {
    const sd = read(join(ROOT, 'src', 'components', 'seo', 'StructuredData.tsx'));
    expect(sd).toMatch(/areaServed:\s*areaServedJsonLd\(\)/);
    expect(areaServedJsonLd().length).toBe(SERVED_CITIES.length + 1);
  });

  it('🚨 خريطةُ الرئيسية تطابق المرجع', () => {
    const home = read(join(APP, 'page.tsx'));
    const block = home.slice(home.indexOf('const ACTIVE_CITIES'), home.indexOf('];', home.indexOf('const ACTIVE_CITIES')));
    const shown = [...block.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]).sort();
    expect(shown).toEqual(SERVED_CITIES.map((c: { name: string }) => c.name).sort());
  });
});

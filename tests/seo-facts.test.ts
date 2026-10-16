/**
 * @jest-environment node
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * 📇 ما يُقال عنّا للآلات يأتي من مصدرٍ واحد ولا يتناقض.
 *
 * كانت `public/llms.txt` و`ai.txt` تقول «بغداد» و«40+ مستشفى» و«AI-assisted» وتربط بـ
 * `spirmedical-wep.vercel.app` وبهاتفٍ مُختلَق، والبياناتُ المنظَّمة «15 خدمة · 18 محافظة ·
 * 24/7»، والتغطيةُ ثماني محافظات. الآن تُولَّد كلُّها من `src/lib/seo/facts.ts`.
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
/** الكودُ بلا تعليقات — التعليقُ يحكي الادّعاءَ القديم ولا يُعلنه */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

const { buildLlmsTxt, buildLlmsFullTxt, buildAiTxt } = require('@/lib/seo/llms');
const facts = require('@/lib/seo/facts');
const { SERVED_CITIES } = require('@/lib/seo/coverage');
const { CORE_SERVICES } = require('@/lib/services-v3');
const sitemap = require('@/app/sitemap').default;

/** ادّعاءاتٌ ثبت أنّها خاطئة أو بلا مصدر — لا تعود إلى أيّ بابٍ آليّ */
const BANNED = [
  /spirmedical-wep\.vercel\.app/,
  /spirmedical\.iq/,
  /07901234567/,
  /40\+/,
  /200\+/,
  /24\/7/,
  /AI-assisted/i,
  /15 خدمة/,
  /18 محافظة|18-governorates/,
  /Next\.js 14/,
];

const generated = { 'llms.txt': buildLlmsTxt(), 'llms-full.txt': buildLlmsFullTxt(), 'ai.txt': buildAiTxt() };

describe('🤖 الملفّاتُ المولَّدة للنماذج', () => {
  it('🚨 لا نسخةَ ثابتة في public/ (تُخفي المسارَ المولَّد أو تتعارض معه)', () => {
    for (const f of Object.keys(generated)) expect(existsSync(join(ROOT, 'public', f))).toBe(false);
    for (const f of Object.keys(generated)) expect(existsSync(join(ROOT, 'src/app', f, 'route.ts'))).toBe(true);
  });

  it.each(Object.entries(generated))('🚨 %s خالٍ من الادّعاءات المرفوضة', (_, txt) => {
    for (const b of BANNED) expect(txt).not.toMatch(b);
    expect(txt).toContain('https://www.spir-medical.com');
  });

  it('🚨 llms.txt يذكر المقرَّ والمحافظاتِ كلَّها والدفعَ نقداً', () => {
    const t = generated['llms.txt'];
    expect(t).toMatch(/^# /);
    expect(t).toMatch(/\n> /);
    expect(t).toContain(facts.BRAND.locality);
    for (const c of SERVED_CITIES) expect(t).toContain(c.name);
    expect(t).toContain('نقداً');
    expect(t).toContain(facts.BRAND.telephoneLocal);
  });

  it('llms-full.txt يحمل المقالاتِ كلَّها', () => {
    const { ARTICLES } = require('@/lib/data/blog-articles');
    for (const a of ARTICLES) expect(generated['llms-full.txt']).toContain(`/blog/${a.slug}`);
  });
});

describe('🚨 الحقائق تطابق الكود', () => {
  it('حالةُ «قريباً» تطابق bookingSoon في services-v3', () => {
    for (const s of facts.SERVICES) {
      const core = CORE_SERVICES.find((c: { id: string }) => c.id === s.id);
      if (core) expect(s.status === 'coming-soon').toBe(core.bookingSoon === true);
    }
    expect(facts.SERVICES.find((s: { id: string }) => s.id === 'physio').status).toBe('coming-soon');
  });

  it('الصفحاتُ المذكورة للنماذج كلُّها في الخريطة ومسموحةٌ في robots', () => {
    const urls = new Set(sitemap().map((e: { url: string }) => new URL(e.url).pathname));
    const robots = read('src/app/robots.ts');
    const pub = robots.slice(robots.indexOf('const publicPaths'), robots.indexOf('];', robots.indexOf('const publicPaths')));
    const allowed = [...pub.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const p of facts.KEY_PAGES) {
      expect(urls.has(p.path)).toBe(true);
      expect(allowed.some((a) => p.path === a || (a !== '/' && p.path.startsWith(a + '/')))).toBe(true);
    }
    for (const t of ['/llms.txt', '/llms-full.txt', '/ai.txt']) expect(pub).toContain(`'${t}'`);
  });

  it('ما يُعلَن خاصّاً للنماذج محجوبٌ فعلاً في robots', () => {
    const robots = read('src/app/robots.ts');
    const priv = robots.slice(robots.indexOf('const privatePaths'), robots.indexOf('];', robots.indexOf('const privatePaths')));
    for (const p of facts.PRIVATE_PREFIXES) expect(priv).toContain(`'${p}'`);
  });
});

describe('🏷️ البياناتُ المنظَّمة والوصف من الحقائق', () => {
  const sd = code('src/components/seo/StructuredData.tsx');
  const layout = code('src/app/layout.tsx');

  it('🚨 JSON-LD يقرأ facts.ts ولا يكتب حقائقَ باليد', () => {
    expect(sd).toMatch(/from '@\/lib\/seo\/facts'/);
    expect(sd).not.toMatch(/'\+964\d+'|support@/);
    expect(sd).not.toMatch(/SearchAction/);
  });

  it.each([['StructuredData', sd], ['layout metadata', layout]])('🚨 %s خالٍ من الادّعاءات المرفوضة', (_, s) => {
    for (const b of BANNED) expect(s).not.toMatch(b);
    expect(s).not.toMatch(/'geo.placename': 'Baghdad'|en_US|ku_IQ/);
  });
});

describe('🗺️ الخريطة لـGoogle', () => {
  const entries = sitemap();

  it('🚨 كلُّ رابطٍ على الأصل الواحد', () => {
    for (const e of entries) expect(e.url.startsWith('https://www.spir-medical.com')).toBe(true);
  });

  it('🚨 لا lastModified مختلَق: الصفحاتُ الثابتة بلا تاريخ، والمقالاتُ بتاريخها', () => {
    expect(code('src/app/sitemap.ts')).not.toMatch(/new Date\(\)/);
    const home = entries.find((e: { url: string }) => e.url === 'https://www.spir-medical.com');
    expect(home.lastModified).toBeUndefined();
    const { ARTICLES } = require('@/lib/data/blog-articles');
    const a = ARTICLES[0];
    const e = entries.find((x: { url: string }) => x.url.endsWith(`/blog/${a.slug}`));
    expect(new Date(e.lastModified).toISOString()).toBe(new Date(a.updatedAt || a.publishedAt).toISOString());
  });

  it('🚨 لا تصنيفَ فارغ ولا رابطَ مكرَّر', () => {
    const { ARTICLES } = require('@/lib/data/blog-articles');
    const cats = entries.map((e: { url: string }) => /\/blog\/category\/([^/]+)$/.exec(e.url)?.[1]).filter(Boolean);
    for (const c of cats) expect(ARTICLES.some((a: { category: string }) => a.category === c)).toBe(true);
    const urls = entries.map((e: { url: string }) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

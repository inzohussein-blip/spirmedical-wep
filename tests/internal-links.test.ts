/**
 * @jest-environment node
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

/**
 * 🔗 كلُّ رابطٍ داخليّ في الكود يصل صفحةً موجودة (29 تشرين الأول): تبويبُ «الخدمات» للزائر كان يشير إلى /guest/services
 * ولا صفحةَ فيه — 404 لكلّ زائر. وحُذفت صفحاتٌ كثيرة مؤخّراً (/services/booking، /provider/requests، /provider/samples)،
 * فرابطٌ باقٍ إليها يُكشف هنا لا عند المستخدم.
 */
const ROOT = process.cwd();
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

const APP = join(ROOT, 'src/app');
const routes = walk(APP)
  .filter((f) => /[\\/](page|route)\.(tsx?|jsx?)$/.test(f))
  .map((f) => relative(APP, f).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith('@')));

function exists(path: string): boolean {
  const segs = path.replace(/\/+$/, '').split('/').filter(Boolean);
  return routes.some((r) => {
    for (let i = 0; i < r.length; i++) {
      if (r[i].startsWith('[[...')) return true;
      if (r[i].startsWith('[...')) return segs.length > i;
      if (i >= segs.length) return false;
      if (!r[i].startsWith('[') && r[i] !== segs[i]) return false;
    }
    return r.length === segs.length;
  });
}

const LINK = /(?:href|router\.(?:push|replace)|redirect)\s*[=(:]\s*\{?\s*['"`](\/[^'"`?#$\s{]*)/g;
const SKIP = /^\/(api|_next|icons|images|vendor|fonts|sw|favicon|screenshots)(\/|$)/;

describe('🔗 الروابطُ الداخليّة', () => {
  it('🚨 لا رابطَ إلى صفحةٍ غير موجودة', () => {
    const bad: string[] = [];
    for (const f of walk(join(ROOT, 'src')).filter((x) => /\.tsx?$/.test(x))) {
      for (const m of readFileSync(f, 'utf8').matchAll(LINK)) {
        const p = m[1];
        if (SKIP.test(p) || p.split('/').pop()!.includes('.')) continue;
        if (!exists(p)) bad.push(`${p} ← ${relative(ROOT, f)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('🚨 لا «جديد» يقع في صفحة [id]: /consultations/new كانت تفتح استشارةً معرّفُها «new» (زرّ «استشارة» العائم)', () => {
    const bad: string[] = [];
    for (const f of walk(join(ROOT, 'src')).filter((x) => /\.tsx?$/.test(x))) {
      for (const m of readFileSync(f, 'utf8').matchAll(LINK)) {
        const segs = m[1].split('/').filter(Boolean);
        if (segs.at(-1) !== 'new') continue;
        if (!routes.some((r) => r.join('/') === segs.join('/'))) bad.push(`${m[1]} ← ${relative(ROOT, f)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('المطابقةُ نفسُها تعمل (الحارسُ لا يمرّ فارغاً)', () => {
    expect(exists('/')).toBe(true);
    expect(exists('/guest/services')).toBe(true);
    expect(exists('/services/doctors/abc')).toBe(true);
    expect(exists('/services/booking')).toBe(false);
    expect(exists('/provider/requests')).toBe(false);
  });
});

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 🩺 شاشات المختص على الهاتف — قِيست بعرض 360×640 بجلسة مختصٍّ محاكاة:
 *
 * ① بطاقاتُ «إحصائيات اليوم» تستعير .service-title (12px) للرقم، فبدا
 *    «١» (طلبٌ جديد) أصغرَ من تسميته — المعلومةُ الأهمّ في الشاشة الأولى.
 * ② ٨٤ عنصراً بخطٍّ 11px عبر ١١ صنفاً مشتركاً وأنماطٍ مضمَّنة.
 * ③ زرُّ الاتصال بالمريض أيقونةٌ بلا اسم — قارئُ الشاشة يقول «رابط».
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const walk = (d: string, out: string[] = []) => {
  for (const f of readdirSync(join(process.cwd(), d))) {
    const p = `${d}/${f}`;
    if (statSync(join(process.cwd(), p)).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
};
const cssRule = (css: string, selector: string) => {
  const i = css.indexOf(selector + ' {');
  if (i < 0) return '';
  return css.slice(i, css.indexOf('}', i));
};

describe('① الرقمُ هو المعلومة', () => {
  it('كلُّ بطاقة إحصاءٍ تعرض رقمها بـ spec-stat-value', () => {
    const page = read('src/app/(specialist)/specialist/page.tsx');
    const cards = page.match(/className="service-card [^"]*spec-stat"/g) ?? [];
    expect(cards).toHaveLength(4);
    expect((page.match(/className="service-title spec-stat-value"/g) ?? []).length).toBe(4);
  });

  it('🚨 وخطُّه أكبرُ من التسمية بوضوح', () => {
    const rule = cssRule(read('src/app/styles/app.css'), '.service-card.spec-stat .spec-stat-value');
    const size = Number(/font-size:\s*(\d+)px/.exec(rule)?.[1]);
    expect(size).toBeGreaterThanOrEqual(22);
  });
});

describe('② لا نصَّ دون 12px في شاشات المختص', () => {
  it('🚨 الأنماطُ المضمَّنة', () => {
    const hits = walk('src/app/(specialist)').flatMap((f) =>
      [...read(f).matchAll(/fontSize: ?'?(?:[0-9]|1[01])(?:\.\d+)?(?:px)?'?\b|font-size: ?(?:[0-9]|1[01])(?:\.\d+)?px/g)]
        .map((m) => `${f}: ${m[0]}`),
    );
    expect(hits).toEqual([]);
  });

  it.each([
    '.scr-list-item-subtitle', '.scr-tag', '.scr-list-item-meta', '.scr-stat-label',
    '.spec-stats-hero-label', '.spec-stats-hero-meta', '.spec-insight-title',
    '.spec-insight-desc', '.inbox-stat-label', '.scr-action-btn',
  ])('🚨 %s', (sel) => {
    const rule = cssRule(read('src/app/styles/app.css'), sel);
    expect(rule).not.toBe('');
    const size = Number(/font-size:\s*([\d.]+)px/.exec(rule)?.[1] ?? 12);
    expect(size).toBeGreaterThanOrEqual(12);
  });
});

describe('③ أزرارُ الأيقونات مُسمّاة', () => {
  it('🚨 كلُّ رابط اتصالٍ في شاشات المختص له اسم', () => {
    const offenders: string[] = [];
    for (const f of walk('src/app/(specialist)')) {
      const s = read(f);
      for (const m of s.matchAll(/<a\b[^>]*href=\{`tel:[^>]*>/g)) {
        const close = s.indexOf('</a>', m.index!);
        const inner = s.slice(m.index! + m[0].length, close).replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').trim();
        if (!/aria-label=/.test(m[0]) && !inner) offenders.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

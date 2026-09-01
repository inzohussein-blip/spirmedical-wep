import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🅰️ حارس أوزان الخطّ
 *
 * الواجهة تطلب أوزاناً لا تُستورَد، فتهبط إلى أقرب وزنٍ موجود. ولا تزوير
 * فيه — خوارزمية المطابقة في CSS تختار وزناً **حقيقياً** — لكنّ النتيجة
 * أنّ درجاتٍ من السلّم البصريّ تنطبق على بعضها:
 *
 *   • ٩٠٠ (٢٤٧ موضعاً) كان يهبط إلى ٨٠٠، فالعنوان والنصّ بثقلٍ واحد.
 *   • ٦٠٠ (١٤٧ موضعاً) يصعد إلى ٧٠٠ دائماً، لأنّ Tajawal لا تملك ٦٠٠.
 *
 * ملاحظةٌ على تشخيصٍ أوّل خاطئ: ظننتُ أنّ الوزن الغائب يُصطنع بتغليظٍ
 * حسابيّ يشوّه وصلات الحروف العربية. وذلك لا يحدث ما دام في العائلة وزنٌ
 * حقيقيٌّ آخر — الاصطناع للعائلات ذات الوزن الواحد. فالعطب في التسلسل
 * البصريّ لا في شكل الحرف.
 */

const ROOT = process.cwd();

/** الأوزان التي تشحنها الحزمة فعلاً (من ملفّات woff2 العربية) */
function shippedByPackage(): Set<number> {
  const dir = join(ROOT, 'node_modules', '@fontsource', 'tajawal', 'files');
  const out = new Set<number>();
  for (const f of readdirSync(dir)) {
    const m = f.match(/^tajawal-arabic-(\d+)-normal\.woff2$/);
    if (m) out.add(Number(m[1]));
  }
  return out;
}

/** الأوزان المستورَدة في التخطيط الجذر */
function imported(): Set<number> {
  const layout = readFileSync(join(ROOT, 'src', 'app', 'layout.tsx'), 'utf8');
  const out = new Set<number>();
  for (const m of layout.matchAll(/@fontsource\/tajawal\/(\d+)\.css/g)) {
    out.add(Number(m[1]));
  }
  return out;
}

/** الأوزان المطلوبة في الكود */
function requested(): Map<number, number> {
  const counts = new Map<number, number>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) { walk(p); continue; }
      if (!/\.(tsx?|css)$/.test(entry.name)) continue;
      const src = readFileSync(p, 'utf8');
      for (const m of src.matchAll(/font-?[Ww]eight:\s*'?(\d{3})'?/g)) {
        const w = Number(m[1]);
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
    }
  };
  walk(join(ROOT, 'src'));
  return counts;
}

describe('أوزان الخطّ المطلوبة تُقابلها أوزانٌ مُحمَّلة', () => {
  const ship = shippedByPackage();
  const imp = imported();
  const req = requested();

  it('الحزمة لا تملك وزن ٦٠٠ — فالرمز لا يجوز أن يَعِد به', () => {
    expect(ship.has(600)).toBe(false);
    const css = readFileSync(join(ROOT, 'src', 'app', 'styles', 'shared.css'), 'utf8');
    const m = css.match(/--weight-semibold:\s*(\d{3})/);
    expect(m).not.toBeNull();
    expect(ship.has(Number(m![1]))).toBe(true);
  });

  it('الوزن ٩٠٠ مستورَد — وهو مطلوبٌ في مئات المواضع', () => {
    expect(imp.has(900)).toBe(true);
    expect(req.get(900) ?? 0).toBeGreaterThan(100);
  });

  it('كلّ وزنٍ مطلوبٍ كثيراً له وزنٌ مُحمَّل', () => {
    // «كثيراً» = أكثر من ٢٠ موضعاً؛ ما دون ذلك لا يُبرّر ملفّ خطٍّ إضافياً
    const heavy = [...req.entries()].filter(([, n]) => n > 20).map(([w]) => w);
    const missing = heavy.filter((w) => !imp.has(w) && ship.has(w));
    expect(missing).toEqual([]);
  });

  it('لا يُستورَد وزنٌ لا تملكه العائلة', () => {
    const bogus = [...imp].filter((w) => !ship.has(w));
    expect(bogus).toEqual([]);
  });
});

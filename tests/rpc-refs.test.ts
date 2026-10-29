/**
 * @jest-environment node
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * 🧭 كلُّ `.rpc('…')` يستدعي دالّةً موجودةً في القاعدة (29 تشرين الأول): بحثُ الصيدليات كان يستدعي `increment_search_count`
 * — غيرَ موجودة — لكلّ دواءٍ وُجد، مُخفاةً بـ`as never` ومبلوعاً خطؤها: رحلةٌ فاشلة إلى القاعدة في كلّ نتيجة.
 * الدوالُّ من `src/types/database.ts` المولَّدة من الإنتاج.
 */
const ROOT = process.cwd();
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

const types = readFileSync(join(ROOT, 'src/types/database.ts'), 'utf8');
const fnBlock = types.match(/\n {4}Functions: \{\n([\s\S]*?)\n {4}Enums:/)?.[1] ?? '';
const FUNCTIONS = new Set([...fnBlock.matchAll(/^ {6}([a-z_0-9]+):/gm)].map((m) => m[1]));

describe('🧭 دوالُّ القاعدة', () => {
  it('الأنواعُ قُرئت', () => {
    expect(FUNCTIONS.size).toBeGreaterThan(10);
    expect(FUNCTIONS.has('generate_referral_code')).toBe(true);
  });

  it('🚨 لا .rpc() لدالّةٍ غير موجودة', () => {
    const bad: string[] = [];
    for (const f of walk(join(ROOT, 'src')).filter((x) => /\.tsx?$/.test(x))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\.rpc\(\s*['"]([a-z_0-9]+)['"]/g)) {
        if (!FUNCTIONS.has(m[1])) bad.push(`${m[1]} ← ${relative(ROOT, f)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

/**
 * @jest-environment node
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔢 الأرقامُ لاتينيّة (1 2 3) في المشروع كلّه — قرار المالك، 16 تشرين الأول.
 *
 * مصدران للأرقام الهنديّة (١٢٣): نصوصٌ مكتوبة في الكود (~900 سطر)، وتنسيقُ `'ar-IQ'` الذي
 * يُخرجها في المتصفّح وفي Node. الآن `DISPLAY_LOCALE = 'ar-IQ-u-nu-latn'` (أسماءٌ عربيّة،
 * أرقامٌ لاتينيّة)، والترحيلُ 0053 حوّل 14 صفّاً في القاعدة.
 *
 * يُستثنى ما **يقبل** أرقاماً هنديّة يكتبها المستخدم: تطبيعُ رمز التحقّق في inbound-verify.
 */
const ROOT = process.cwd();
const ARABIC_INDIC = /[٠-٩۰-۹]/;
const ALLOWED = [/src\/lib\/whatsapp\/inbound-verify\.ts$/];

function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(tsx?|css|json|mjs)$/.test(e.name) ? [p] : [];
  });
}
const files = [...walk('src'), ...walk('public/locales')];

describe('🔢 لا أرقامَ هنديّة', () => {
  it('🚨 لا رقمَ هنديّاً في الكود والنصوص', () => {
    const offenders = files.filter((f) => !ALLOWED.some((a) => a.test(f)) && ARABIC_INDIC.test(readFileSync(join(ROOT, f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it("🚨 لا تنسيقَ بـ'ar-IQ' وحدها (تُخرج ١٢٣)", () => {
    const bad: string[] = [];
    for (const f of files) {
      const s = readFileSync(join(ROOT, f), 'utf8');
      for (const m of s.matchAll(/(?:toLocale\w*String|Intl\.\w+)\(\s*['"]ar(?:-[A-Z]{2})?['"]/g)) bad.push(`${f}: ${m[0]}`);
      if (/locale\s*=\s*['"]ar-IQ['"]|LOCALE\s*=\s*['"]ar-IQ['"]/.test(s)) bad.push(`${f}: افتراضيّ ar-IQ`);
    }
    expect(bad).toEqual([]);
  });

  it('🚨 التنسيقُ يُخرج أرقاماً لاتينيّة وأسماءً عربيّة', () => {
    const { formatDate, formatCurrency } = require('@/lib/utils');
    const { formatPrice } = require('@/lib/format/price');
    const date = formatDate(new Date(2026, 4, 6));
    expect(date).toMatch(/2026/);
    expect(date).toMatch(/[ء-ي]/);
    expect(date).not.toMatch(ARABIC_INDIC);
    expect(formatCurrency(50000)).not.toMatch(ARABIC_INDIC);
    expect(String(formatPrice(12000))).toMatch(/12/);
  });

  it('لا toArabicDigits', () => {
    expect(files.some((f) => /function toArabicDigits/.test(readFileSync(join(ROOT, f), 'utf8')))).toBe(false);
  });
});

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 🎨 حارس رموز الألوان
 *
 * الفحص الأهمّ هنا: **قيمةُ الاحتياط يجب أن تطابق الرمز الذي تحتاط له.**
 *
 * كان في المشروع ٨٠ موضعاً على هذا الشكل:
 *
 *     var(--emerald, #0E5C4D)        و --emerald: #01875F
 *     var(--emerald-deep, #073B30)   و --emerald-deep: #056559
 *
 * أي أنّ الاحتياط أخضرُ آخر غير الذي يحتاط له — بقايا لوحةٍ قديمة. وهو لا
 * يظهر في الاستعمال العاديّ (الرمز يُحلّ دائماً)، لكنّه يظهر في اللحظة
 * التي تسبق تحميل الأنماط، ويُضلّل كلَّ من يقرأ الكود: يظنّ الأخضرَ
 * الأساسيّ `#0E5C4D` وهو `#01875F`.
 *
 * وقد أخطأتُ في تشخيص هذا مرّتين قبل أن أضبطه: ظننتُ أوّلاً أنّ في
 * المشروع «ستّ خُضرٍ متنافسة»، ثمّ أنّ `--btn-primary-bg` غير معرَّف.
 * وكلاهما خطأ — الرموز معرَّفةٌ وسليمةٌ وقابلةٌ لتخصيص المشرف، والعطب
 * محصورٌ في قيم الاحتياط وفي أخضرَ واحدٍ يتيم.
 */

const ROOT = process.cwd();
const CSS_FILES = [
  join(ROOT, 'src', 'app', 'styles', 'shared.css'),
  join(ROOT, 'src', 'app', 'pwa.css'),
];

/** قيمة كلّ رمزٍ لونيّ كما تُعرَّف في `:root` — لا داخل وسائط الاستعلام */
function tokenValues(): Map<string, string> {
  const out = new Map<string, string>();
  const alias = new Map<string, string>();
  for (const f of CSS_FILES) {
    let css: string;
    try { css = readFileSync(f, 'utf8'); } catch { continue; }
    // نُسقط كتل @media كي لا يُلتقط تجاوزُ `prefers-contrast` كتعريفٍ منافس
    const base = css.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
    for (const m of base.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;/g)) {
      if (!out.has(m[1])) out.set(m[1], m[2].toUpperCase());
    }
    // رمزٌ يُحيل إلى رمزٍ آخر (`--btn-secondary-bg: var(--paper)`) معرَّفٌ
    // أيضاً. وإغفالُ ذلك جعل قارئي أوّلَ مرّةٍ يعدّه «غير معرَّف».
    for (const m of base.matchAll(/--([a-z0-9-]+):\s*var\(\s*--([a-z0-9-]+)/g)) {
      alias.set(m[1], m[2]);
    }
  }
  // نحلّ الإحالات (بعمقٍ محدودٍ يمنع الدوران)
  for (const [name, target] of alias) {
    let t: string | undefined = target;
    for (let i = 0; i < 5 && t; i++) {
      if (out.has(t)) { out.set(name, out.get(t)!); break; }
      t = alias.get(t);
    }
  }
  return out;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

describe('رموز الألوان واحتياطاتها', () => {
  const tokens = tokenValues();
  const files = sourceFiles(join(ROOT, 'src'));

  it('يقرأ الرموز قراءةً صحيحة', () => {
    // حارسٌ للحارس: لو فشل التحليل لمرّ الفحص التالي فارغاً
    expect(tokens.size).toBeGreaterThan(30);
    expect(tokens.get('emerald')).toBe('#01875F');
    expect(tokens.get('emerald-deep')).toBe('#056559');
  });

  it('كلّ احتياطٍ يطابق قيمة رمزه', () => {
    const mismatches: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/var\(\s*--([a-z0-9-]+)\s*,\s*(#[0-9A-Fa-f]{6})\s*\)/gi)) {
        const declared = tokens.get(m[1]);
        if (!declared) continue; // رمزٌ غير معرَّفٍ هنا — يفحصه الاختبار التالي
        if (declared !== m[2].toUpperCase()) {
          mismatches.push(`${f.replace(ROOT + '/', '')}: ${m[1]} = ${declared} لكنّ الاحتياط ${m[2]}`);
        }
      }
    }
    expect([...new Set(mismatches)]).toEqual([]);
  });

  it('الأخضر اليتيم صار له رمز', () => {
    expect(tokens.get('emerald-mid')).toBe('#0F6E56');
  });

  it('كلّ رمزٍ يُستعمل باحتياطٍ يكون معرَّفاً', () => {
    // احتياطٌ لرمزٍ غير معرَّفٍ يعني أنّ الاحتياط هو القيمة الفعليّة دائماً،
    // وأنّ اللون خرج من نظام الرموز بلا أن يُلاحَظ.
    const undefinedTokens = new Set<string>();
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8')
        .matchAll(/var\(\s*--([a-z0-9-]+)\s*,\s*#[0-9A-Fa-f]{6}\s*\)/gi)) {
        if (!tokens.has(m[1])) undefinedTokens.add(m[1]);
      }
    }
    // رموزٌ يحقنها ThemeProvider وقت التشغيل لا تُعرَّف في CSS — تُستثنى
    const RUNTIME = new Set(['btn-primary-bg', 'btn-primary-bg-hover', 'btn-primary-fg']);
    expect([...undefinedTokens].filter((t) => !RUNTIME.has(t)).sort()).toEqual([]);
  });
});

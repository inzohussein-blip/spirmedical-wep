/**
 * @jest-environment node
 */

/**
 * 🧭 كودُ الإدارة لا يسأل عن عمودٍ غير موجود.
 *
 * `tsc` لا يرى استعلاماً مُرَّر عبر `as any` أو عميلاً بلا أنواع. هكذا طلب «إسنادُ الطلب»
 * `specialist:assigned_specialist_id (full_name, user_id)` — و`users` بلا `user_id` —
 * فسقط الاستعلامُ كلُّه ولم يصل إشعارٌ للمريض ولا للمختصّ عند الإسناد (16 تشرين الأول).
 *
 * يقرأ كلَّ `.from('t').select('…')` و`.insert/update/upsert({…})` في كود الإدارة ويطابق
 * الأعمدةَ (وما بين أقواس التضمين) بأنواع `src/types/database.ts` المولَّدة من الإنتاج.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
// الكودُ كلُّه منذ 29 تشرين الأول (كان كودَ الإدارة وحده): كشف `users.gender` في تسجيل البريد — عمودٌ غيرُ موجود
// فكان كلُّ تسجيلٍ بالبريد يُرفض ويُحذف حسابُه.
const ROOTS = ['src'];

function walk(p: string): string[] {
  const abs = join(ROOT, p);
  if (statSync(abs).isFile()) return [p];
  return readdirSync(abs).flatMap((f) => walk(join(p, f)));
}
const files = ROOTS.flatMap(walk).filter((f) => /\.(ts|tsx)$/.test(f));

const types = readFileSync(join(ROOT, 'src/types/database.ts'), 'utf8');
const cols = new Map<string, Set<string>>();
for (const m of types.matchAll(/\n {6}([a-z_0-9]+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}/g)) {
  cols.set(m[1], new Set([...m[2].matchAll(/^ {10}([a-z_0-9]+)\??:/gm)].map((x) => x[1])));
}

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

/** أعمدةُ select غيرُ الموجودة. التضمينُ `alias:fk_column (cols)` يُطابَق بجدول `users` حين يكون عمودَ مفتاح. */
function unknownSelect(table: string, sel: string): string[] {
  const known = cols.get(table);
  if (!known) return [`جدول ${table}`];
  const bad: string[] = [];
  for (const part of splitTop(sel.replace(/\s+/g, ' '))) {
    if (part === '*') continue;
    const m = /^(?:([a-z_0-9]+):)?\s*([a-z_0-9]+)(?:!([a-z_0-9_]+))?\s*(?:\((.*)\))?$/s.exec(part);
    if (!m) {
      const c = /^(?:[a-z_0-9]+:)?([a-z_0-9]+)(?:::[a-z]+)?$/.exec(part);
      if (!c || !known.has(c[1])) bad.push(part);
      continue;
    }
    const [, , name, , inner] = m;
    if (inner === undefined) {
      if (!known.has(name)) bad.push(name);
      continue;
    }
    // تضمين: باسم جدول، أو بعمود مفتاحٍ أجنبيّ إلى users (user_id، assigned_specialist_id…)
    const target = cols.has(name) ? name : known.has(name) && /_id$/.test(name) ? 'users' : null;
    if (!target) {
      bad.push(`تضمين ${name}`);
      continue;
    }
    bad.push(...unknownSelect(target, inner).map((b) => `${name}.${b}`));
  }
  return bad;
}

function objectBody(s: string, i: number): string {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return s.slice(i + 1, j);
  }
  return '';
}

function topKeys(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of body) {
    if ('{(['.includes(ch)) depth++;
    if ('})]'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  return parts
    .map((p) => p.replace(/\/\/.*$/gm, '').trim())
    .filter((p) => p && !p.startsWith('...'))
    .map((p) => /^['"]?([a-zA-Z_0-9]+)['"]?\s*(?::|$)/.exec(p)?.[1])
    .filter((k): k is string => !!k);
}

describe('🧭 أعمدةُ استعلامات الإدارة موجودةٌ في القاعدة', () => {
  it('الأنواعُ قُرئت (ضمانُ أنّ الحارس يعمل)', () => {
    expect(cols.get('users')?.has('phone')).toBe(true);
    expect(cols.size).toBeGreaterThan(50);
    expect(files.length).toBeGreaterThan(400);
  });

  it('🚨 select: لا عمودَ ولا تضمينَ مجهول', () => {
    const problems: string[] = [];
    for (const f of files) {
      const s = readFileSync(join(ROOT, f), 'utf8');
      for (const m of s.matchAll(/\.from\(\s*['"]([a-z_0-9]+)['"]\s*\)\s*\.select\(\s*([`'"])([\s\S]*?)\2/g)) {
        if (m[3].includes('${')) continue;
        const bad = unknownSelect(m[1], m[3]);
        if (bad.length) problems.push(`${f}:${s.slice(0, m.index).split('\n').length} [${m[1]}] ${bad.join(', ')}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('🚨 insert/update/upsert: لا مفتاحَ مجهول', () => {
    const problems: string[] = [];
    for (const f of files) {
      const s = readFileSync(join(ROOT, f), 'utf8');
      for (const m of s.matchAll(/\.from\(\s*['"]([a-z_0-9]+)['"]\s*\)\s*\.(insert|update|upsert)\(\s*\[?\s*\{/g)) {
        const known = cols.get(m[1]);
        if (!known) continue;
        const keys = topKeys(objectBody(s, s.indexOf('{', m.index! + m[0].length - 1)));
        const bad = keys.filter((k) => !known.has(k));
        if (bad.length) problems.push(`${f} [${m[1]}.${m[2]}] ${bad.join(', ')}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

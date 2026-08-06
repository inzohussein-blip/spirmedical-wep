import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

/**
 * 🎯 حارس قيم الأعمدة المقيَّدة (ENUM / CHECK … IN)
 *
 * فئة أخطاء أعمق من «العمود غير موجود»: **العمود صحيح والقيمة خاطئة**.
 * لا يكشفها المترجم (القيم نصوص)، وأثرها في Postgres قاسٍ:
 *   • في الكتابة → الإدراج يفشل.
 *   • في الفلترة (`.eq`/`.in`) على عمود ENUM → الاستعلام **كلّه** يُرفض (22P02)،
 *     فتعود النتيجة فارغة وتبدو الميزة «لا بيانات لها» بدل أن تبدو معطوبة.
 *
 * كشفت هذه الفئة خللين حقيقيين:
 *   1. حملات التسويق تستهدف `role = 'user'` — دور غير موجود في `user_role`،
 *      فالجمهور **صفر دائماً**.
 *   2. بطاقة الطلب النشط تفلتر بـ`on_the_way` — ليست في `appointment_status`،
 *      فالاستعلام يُرفض ولا تظهر البطاقة **لأي مريض**.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const SRC_DIR = join(process.cwd(), 'src');

function migrationsSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');
}

/** يبني: «جدول.عمود» → القيم المسموحة، من أنواع ENUM وقيود CHECK…IN */
export function constrainedColumns(sql: string): Map<string, Set<string>> {
  const enums = new Map<string, Set<string>>();
  let m: RegExpExecArray | null;

  const enumRe = /CREATE TYPE (?:public\.)?([a-z_]+) AS ENUM\s*\(([^)]*)\)/gi;
  while ((m = enumRe.exec(sql)) !== null) {
    enums.set(m[1], new Set([...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])));
  }

  const cols = new Map<string, Set<string>>();
  const tableRe = /CREATE TABLE IF NOT EXISTS public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/gi;
  let t: RegExpExecArray | null;
  while ((t = tableRe.exec(sql)) !== null) {
    const [, table, body] = t;

    for (const [enumName, values] of enums) {
      const re = new RegExp(`^\\s*([a-z_]+)\\s+${enumName}\\b`, 'gim');
      let c: RegExpExecArray | null;
      while ((c = re.exec(body)) !== null) cols.set(`${table}.${c[1]}`, values);
    }

    const chk = /([a-z_]+)[\s\S]{0,120}?CHECK\s*\(\s*\1\s+IN\s*\(([\s\S]*?)\)\s*\)/gi;
    let c2: RegExpExecArray | null;
    while ((c2 = chk.exec(body)) !== null) {
      const values = [...c2[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
      if (values.length) cols.set(`${table}.${c2[1]}`, new Set(values));
    }
  }

  return cols;
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * يفحص قيم الفلترة (`.eq` / `.in`) فقط — وهي الأخطر لأنّ قيمة ENUM غير صالحة
 * تُسقط الاستعلام كلّه. قيم الكتابة تُترك لأنّ نافذة المسح النصّية لا تستطيع
 * نسبة مفاتيح الكائن إلى جدولها بثقة (كائنات متداخلة، استعلامات متجاورة).
 */
export function filterViolations(): string[] {
  const cols = constrainedColumns(migrationsSql());
  const out: string[] = [];
  const seen = new Set<string>();

  for (const file of sourceFiles(SRC_DIR)) {
    const code = readFileSync(file, 'utf8');
    const fromRe = /\.from\(\s*['"]([a-z_]+)['"]\s*\)/g;
    let fm: RegExpExecArray | null;

    while ((fm = fromRe.exec(code)) !== null) {
      const table = fm[1];
      // النافذة تتوقّف عند `.from(` التالي: استعلامات `Promise.all` المتجاورة
      // كانت تُنسب فلاتر الاستعلام التالي إلى الجدول السابق (إنذارات كاذبة).
      const rest = code.slice(fm.index + fm[0].length);
      const nextFrom = rest.search(/\.from\(\s*['"]/);
      const end = nextFrom === -1 ? Math.min(rest.length, 700) : Math.min(nextFrom, 700);
      const window = rest.slice(0, end);

      const checks: Array<[RegExp, boolean]> = [
        [/\.eq\(\s*['"]([a-z_]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g, false],
        [/\.in\(\s*['"]([a-z_]+)['"]\s*,\s*\[([^\]]*)\]/g, true],
      ];

      for (const [re, isList] of checks) {
        let x: RegExpExecArray | null;
        while ((x = re.exec(window)) !== null) {
          const allowed = cols.get(`${table}.${x[1]}`);
          if (!allowed) continue;
          const values = isList
            ? [...x[2].matchAll(/'([^']+)'/g)].map((y) => y[1])
            : [x[2]];
          for (const v of values) {
            if (allowed.has(v)) continue;
            const key = `${relative(process.cwd(), file)}|${table}.${x[1]}|${v}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(
              `${relative(process.cwd(), file)}: ${table}.${x[1]} = '${v}' ` +
                `(المسموح: ${[...allowed].join('|')})`
            );
          }
        }
      }
    }
  }

  return out.sort();
}

describe('🎯 استخراج القيم المسموحة من الترحيلات', () => {
  const cols = constrainedColumns(migrationsSql());

  it('يجد أعمدة مقيَّدة كثيرة', () => {
    expect(cols.size).toBeGreaterThan(30);
  });

  it('يقرأ أنواع ENUM بدقّة', () => {
    expect([...(cols.get('appointments.status') ?? [])].sort()).toEqual(
      ['cancelled', 'completed', 'confirmed', 'in_progress', 'pending'].sort()
    );
    expect(cols.get('users.role')?.has('patient')).toBe(true);
    // 🚨 القيمتان اللتان كسرتا الإنتاج
    expect(cols.get('users.role')?.has('user')).toBe(false);
    expect(cols.get('appointments.status')?.has('on_the_way')).toBe(false);
  });

  it('يقرأ قيود CHECK … IN أيضاً', () => {
    expect(cols.get('consultations.status')?.has('awaiting_doctor')).toBe(true);
  });
});

describe('🎯 لا فلترة بقيمة خارج المسموح', () => {
  it('كل `.eq`/`.in` على عمود مقيَّد يستعمل قيمة صالحة', () => {
    expect(filterViolations()).toEqual([]);
  });
});

describe('🎯 الحارس يكشف فعلاً (لا يمرّ فارغاً)', () => {
  const cols = constrainedColumns(migrationsSql());

  /** نسخة مصغّرة من منطق الفحص تعمل على نصّ معطى */
  const scan = (code: string): string[] => {
    const out: string[] = [];
    const fromRe = /\.from\(\s*['"]([a-z_]+)['"]\s*\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fromRe.exec(code)) !== null) {
      const table = fm[1];
      const rest = code.slice(fm.index + fm[0].length);
      const next = rest.search(/\.from\(\s*['"]/);
      const win = rest.slice(0, next === -1 ? Math.min(rest.length, 700) : Math.min(next, 700));
      for (const [re, isList] of [
        [/\.eq\(\s*['"]([a-z_]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g, false],
        [/\.in\(\s*['"]([a-z_]+)['"]\s*,\s*\[([^\]]*)\]/g, true],
      ] as Array<[RegExp, boolean]>) {
        let x: RegExpExecArray | null;
        while ((x = re.exec(win)) !== null) {
          const allowed = cols.get(`${table}.${x[1]}`);
          if (!allowed) continue;
          const vals = isList ? [...x[2].matchAll(/'([^']+)'/g)].map((y) => y[1]) : [x[2]];
          for (const v of vals) if (!allowed.has(v)) out.push(`${table}.${x[1]}='${v}'`);
        }
      }
    }
    return out;
  };

  it('🚨 يكشف خلل الحملات (role = "user")', () => {
    expect(scan(`supabase.from('users').select('id').eq('role', 'user')`)).toEqual([
      "users.role='user'",
    ]);
  });

  it('🚨 يكشف خلل بطاقة الطلب النشط (on_the_way)', () => {
    expect(
      scan(`supabase.from('appointments').in('status', ['pending','on_the_way'])`)
    ).toEqual(["appointments.status='on_the_way'"]);
  });

  it('يقبل القيم الصالحة', () => {
    expect(scan(`supabase.from('users').select('id').eq('role', 'patient')`)).toEqual([]);
    expect(
      scan(`supabase.from('appointments').in('status', ['pending','confirmed','in_progress'])`)
    ).toEqual([]);
  });

  it('لا ينسب فلاتر استعلام إلى الجدول السابق', () => {
    // نمط Promise.all المتجاور — كان يُنتج إنذارات كاذبة قبل تقييد النافذة
    expect(
      scan(
        `supabase.from('appointments').select('*'),\n` +
          `supabase.from('doctor_subscriptions').select('*').eq('status', 'active')`
      )
    ).toEqual([]);
  });
});

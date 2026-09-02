import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * ⚡ حارس سرعة فتح الشاشات
 *
 * عطبان مختلفان، وكلاهما يؤخّر ظهور الشاشة بلا أن يظهر في أيّ خطأ:
 *
 *  ١) `AnimatePresence mode="wait"`: الصفحة الخارجة تُكمل خروجها قبل أن
 *     تبدأ الداخلة. كان ذلك 0.28s خروجاً + 0.28s دخولاً يُضافان إلى كلّ
 *     فتح شاشة — ويشمل هيكلَ التحميل نفسه، فحتى «جارٍ التحميل» كان ينتظر.
 *
 *  ٢) نداءاتٌ مستقلّة تُنتظَر واحداً بعد واحد: كلّ واحدٍ يدفع رحلةً شبكيّةً
 *     كاملة إلى Supabase قبل أن يبدأ الذي يليه، وهي لا تحتاج بعضها.
 *
 * ولا يمنع الحارس التوازيَ الواجب: عبارتان بينهما كودٌ فاعل، أو في فرعَي
 * `if/else`، أو في دالّتين مختلفتين — كلّها تُستثنى، لأنّ توازيها إمّا
 * مستحيلٌ أو تغييرٌ في المعنى.
 */

const APP = join(process.cwd(), 'src', 'app');

function walk(dir: string, name: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p, name));
    else if (entry === name) out.push(p);
  }
  return out;
}

function stripComments(s: string): string {
  // يُحذف التعليق السطريّ **إذا بدأ السطر به** وحده، فلا تُقصّ عناوين
  // مثل `https://…` في وسط السطر.
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

describe('انتقال الصفحات لا ينتظر خروج السابقة', () => {
  it('لا `AnimatePresence mode="wait"` في المشروع', () => {
    const hits: string[] = [];
    const scan = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) { scan(p); continue; }
        if (!/\.tsx?$/.test(entry)) continue;
        const src = stripComments(readFileSync(p, 'utf8'));
        if (/AnimatePresence[\s\S]{0,200}mode\s*=\s*["'{]?\s*["']?wait/.test(src)) {
          hits.push(p);
        }
      }
    };
    scan(join(process.cwd(), 'src'));
    expect(hits).toEqual([]);
  });

  it('لا تُعاد framer-motion — مستهلكها الوحيد استُبدل بـCSS', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps)).not.toContain('framer-motion');
  });

  it('حركة الدخول قصيرة وتحترم تقليل الحركة', () => {
    const css = readFileSync(join(APP, 'styles', 'shared.css'), 'utf8');
    expect(css).toContain('.page-enter');
    const m = css.match(/\.page-enter\s*\{[^}]*animation:\s*page-enter-slide\s+([\d.]+)s/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeLessThanOrEqual(0.2);
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});

describe('لا شلّالَ انتظارٍ في الصفحات', () => {
  /** عمق الأقواس عند كلّ موضع — يفصل فرعَي if/else عن بعضهما */
  function depths(src: string): number[] {
    const out: number[] = [];
    let d = 0;
    for (const ch of src) {
      if (ch === '{') d++;
      out.push(d);
      if (ch === '}') d--;
    }
    return out;
  }

  const FN = /\n\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+|\n\s*(?:export\s+)?const\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/g;
  const STMT = /^([ \t]*)const\s+(\{[^}]*\}|\[[^\]]*\]|[A-Za-z_$][\w$]*)\s*=\s*await\s/gm;

  function waterfalls(path: string): number {
    const src = stripComments(readFileSync(path, 'utf8'));
    const dep = depths(src);
    const bounds = [...src.matchAll(FN)].map((m) => m.index!);
    const fnOf = (pos: number) => bounds.filter((b) => b <= pos).length;

    const stmts: {
      start: number; end: number; indent: string;
      binds: Set<string>; uses: Set<string>; fn: number; depth: number;
    }[] = [];

    for (const m of src.matchAll(STMT)) {
      let i = m.index! + m[0].length;
      let d = 0;
      while (i < src.length) {
        const c = src[i];
        if ('([{'.includes(c)) d++;
        else if (')]}'.includes(c)) d--;
        else if (c === ';' && d <= 0) break;
        i++;
      }
      const expr = src.slice(m.index! + m[0].length, i);
      if (!expr.includes('supabase') && !expr.includes('createClient')) continue;
      if (expr.includes('Promise.all')) continue;
      stmts.push({
        start: m.index!, end: i, indent: m[1],
        binds: new Set((m[2].replace(/:\s*/g, ' ').match(/[A-Za-z_$][\w$]*/g) ?? [])),
        uses: new Set((expr.match(/[A-Za-z_$][\w$]*/g) ?? [])),
        fn: fnOf(m.index!), depth: dep[m.index!] ?? 0,
      });
    }

    let count = 0;
    let run: typeof stmts = [];
    const flush = () => { if (run.length >= 2) count++; run = []; };
    for (const st of stmts) {
      if (!run.length) { run = [st]; continue; }
      const produced = new Set(run.flatMap((r) => [...r.binds]));
      const gap = src.slice(run[run.length - 1].end, st.start);
      const gapClean = stripComments(gap).replace(/[;\s]/g, '') === '';
      const independent = ![...st.uses].some((u) => produced.has(u));
      if (
        st.fn === run[0].fn && st.indent === run[0].indent &&
        st.depth === run[0].depth && gapClean && independent
      ) run.push(st);
      else flush(), (run = [st]);
    }
    flush();
    return count;
  }

  it('لا صفحةَ تنتظر نداءين مستقلّين بالتتابع', () => {
    const offenders = walk(APP, 'page.tsx')
      .map((p) => [p, waterfalls(p)] as const)
      .filter(([, n]) => n > 0)
      .map(([p, n]) => `${p.replace(process.cwd() + '/', '')} (${n})`);

    expect(offenders).toEqual([]);
  });
});

describe('التوازي لا يخلط كتابةً بقراءة', () => {
  /**
   * «لا تبعيّة في التعبير» لا تعني «آمنٌ للتوازي».
   *
   * كاد تحويلٌ آليٌّ أن يُدخل هذا في `deleteServiceArea`:
   *
   *     const [{ data: before }, { error }] = await Promise.all([
   *       supabase.from('service_areas').select('name_ar').eq('id', id),
   *       supabase.from('service_areas').delete().eq('id', id),
   *     ]);
   *
   * لا يشير الحذفُ إلى `before`، فبدا للكاشف مستقلّاً. لكنّهما يمسّان
   * **الصفّ نفسه**: قد يسبق الحذفُ القراءةَ فيُسجَّل الحذفُ بلا اسم — وهو
   * بالضبط ما كان الترتيبُ المتسلسل يمنعه.
   *
   * فالقاعدة: كتلةُ `Promise.all` تقرأ أو تكتب، لا الاثنين على جدولٍ واحد.
   */
  const WRITE = /\.(insert|update|upsert|delete)\(/;

  function parallelBlocks(src: string): string[] {
    const out: string[] = [];
    const marker = 'await Promise.all([';
    let from = 0;
    for (;;) {
      const i = src.indexOf(marker, from);
      if (i < 0) break;
      let j = i + marker.length;
      let depth = 0;
      while (j < src.length) {
        if (src[j] === '[') depth++;
        else if (src[j] === ']') { if (depth === 0) break; depth--; }
        j++;
      }
      out.push(src.slice(i, j));
      from = j;
    }
    return out;
  }

  function tablesIn(block: string): string[] {
    return [...block.matchAll(/\.from\(\s*['"`]([\w.]+)['"`]\s*\)/g)].map((m) => m[1]);
  }

  it('يقرأ كتل التوازي قراءةً صحيحة', () => {
    // حارسُ الحارس: محلّلٌ مكسورٌ يجد صفراً فيمرّ الفحصُ التالي بلا معنى
    const total = walk(APP, 'page.tsx')
      .concat(walk(APP, 'actions.ts'))
      .reduce((n, f) => n + parallelBlocks(readFileSync(f, 'utf8')).length, 0);
    expect(total).toBeGreaterThan(5);
  });

  it('لا كتلةَ توازٍ تجمع كتابةً وقراءةً على الجدول نفسه', () => {
    const offenders: string[] = [];
    for (const f of walk(APP, 'page.tsx').concat(walk(APP, 'actions.ts'))) {
      for (const block of parallelBlocks(readFileSync(f, 'utf8'))) {
        if (!WRITE.test(block)) continue;
        const tables = tablesIn(block);
        const dupes = tables.filter((t, i) => tables.indexOf(t) !== i);
        if (dupes.length) {
          offenders.push(`${f.replace(process.cwd() + '/', '')} → ${[...new Set(dupes)].join(', ')}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

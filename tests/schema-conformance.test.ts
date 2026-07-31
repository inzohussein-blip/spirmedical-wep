import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🛡️ حارس تطابق المخطّط (Schema Conformance Guard)
 *
 * الخلفية — ثلاثة أخطاء إنتاجية صامتة (0.7.0):
 *   1. `sendCampaign` كان يُدرج في `notification_queue` أعمدة غير موجودة
 *      (`user_id`/`notification_type`/`payload`) → كل حملة تُوسَم «مُرسَلة»
 *      وتصل صفر مستلمين.
 *   2. `dental_ratings`: كتابة `cleanliness_rating`/`skill_rating` بدل
 *      `hygiene_rating`/`expertise_rating` → لا يُحفظ تقييم أبداً.
 *   3. `optical_ratings`: كتابة `product_quality_rating` بدل `quality_rating`.
 *
 * لماذا لم يكشفها المترجم؟ لأنّ هذه الجداول **غائبة عن** `types/database.ts`،
 * فالاستعلام يمرّ عبر cast (`as any` / شيم) فيسقط فحص الأنواع. وبما أنّ الخطأ
 * كان مُهمَلاً (`if (!error)` أو بلا فحص)، فشل الإدراج بصمت تامّ.
 *
 * هذا الاختبار يقرأ الـ DDL الحقيقي من `supabase/migrations/*.sql` ويقارنه
 * بأعمدة كل `insert`/`update` في الكود — فيمنع تكرار الفئة كلّها، سواء أكان
 * الجدول مُعرَّفاً في الأنواع أم لا.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const SRC_DIR = join(process.cwd(), 'src');

// كلمات تبدأ بها أسطر القيود (لا أعمدة)
const CONSTRAINT_KEYWORDS = new Set([
  'constraint', 'primary', 'unique', 'foreign', 'check', 'exclude', 'like',
]);

/** استخراج {اسم الجدول → مجموعة أعمدته} من كل ملفات الترحيل */
export function parseMigrationSchema(sqlFiles: string[]): Map<string, Set<string>> {
  const schema = new Map<string, Set<string>>();

  for (const sql of sqlFiles) {
    // ─── CREATE TABLE ───
    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\n\s*\);/gi;
    let m: RegExpExecArray | null;
    while ((m = createRe.exec(sql)) !== null) {
      const table = m[1].toLowerCase();
      const body = m[2];
      const cols = schema.get(table) ?? new Set<string>();

      for (const rawLine of body.split('\n')) {
        const line = rawLine.replace(/--.*$/, '').trim();
        if (!line) continue;
        // عمود = معرّف صغير الأحرف يتبعه نوع (كلمة أخرى)
        const colMatch = /^([a-z_][a-z0-9_]*)\s+[a-zA-Z]/.exec(line);
        if (!colMatch) continue;
        const name = colMatch[1].toLowerCase();
        if (CONSTRAINT_KEYWORDS.has(name)) continue;
        cols.add(name);
      }
      schema.set(table, cols);
    }

    // ─── ALTER TABLE … ADD COLUMN (ترحيلات لاحقة تضيف أعمدة) ───
    // ملاحظة: الصيغة الشائعة هنا متعدّدة الأعمدة في عبارة واحدة:
    //   ALTER TABLE public.users
    //     ADD COLUMN IF NOT EXISTS email text,
    //     ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
    // لذا نلتقط العبارة كاملةً حتى `;` ثم نستخرج **كل** ADD COLUMN بداخلها.
    const alterRe = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\b([\s\S]*?);/gi;
    while ((m = alterRe.exec(sql)) !== null) {
      const table = m[1].toLowerCase();
      const stmt = m[2];
      const cols = schema.get(table) ?? new Set<string>();
      const addRe = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)/gi;
      let a: RegExpExecArray | null;
      while ((a = addRe.exec(stmt)) !== null) cols.add(a[1].toLowerCase());
      if (cols.size > 0) schema.set(table, cols);
    }
  }

  return schema;
}

export interface WriteSite {
  file: string;
  table: string;
  op: 'insert' | 'update';
  columns: string[];
}

export interface ChainCall {
  method: string;
  args: string;
}

/**
 * يقرأ سلسلة الاستدعاءات `.m(...)` التي تلي `.from('t')` مباشرةً،
 * بتوازن الأقواس، ويتوقّف عند أوّل شيء ليس استدعاءً متسلسلاً.
 */
export function parseChain(code: string, startIndex: number): ChainCall[] {
  const calls: ChainCall[] = [];
  let i = startIndex;

  for (;;) {
    const rest = code.slice(i);
    const m = /^[\s\r\n]*\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/.exec(rest);
    if (!m) break;

    const openIdx = i + m[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let j = openIdx; j < code.length; j++) {
      const ch = code[j];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }
    if (end === -1) break;

    calls.push({ method: m[1], args: code.slice(openIdx + 1, end) });
    i = end + 1;
  }

  return calls;
}

/** أعمدة الفلترة/الترتيب: الوسيط الأول نصّ حرفي */
const FILTER_METHODS = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'not',
]);

/**
 * استخراج أعمدة القراءة (`select`) والفلترة (`eq`/`order`/…) لكل `.from('t')`.
 * محافظ: يتخطّى الأعمدة المضمّنة (`a.b`)، ومسارات JSON (`->`)، والصيغ المركّبة
 * (`or`/`filter`)، والعلاقات المُضمَّنة داخل الأقواس.
 */
export function extractReadSites(code: string, file: string): WriteSite[] {
  const sites: WriteSite[] = [];
  const fromRe = /\.from\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*\)/g;
  let m: RegExpExecArray | null;

  while ((m = fromRe.exec(code)) !== null) {
    const table = m[1];
    const chain = parseChain(code, m.index + m[0].length);
    const columns: string[] = [];

    for (const call of chain) {
      if (call.method === 'select') {
        const lit = /^\s*['"`]([\s\S]*?)['"`]/.exec(call.args);
        if (!lit) continue;
        let spec = lit[1];
        if (spec.includes('$') || spec.includes('->')) continue; // قوالب/JSON
        // احذف العلاقات المُضمَّنة مع اسم العلاقة الذي يسبقها
        let prev: string;
        do {
          prev = spec;
          spec = spec.replace(/[a-zA-Z_][a-zA-Z0-9_]*\s*(?:!\s*[a-zA-Z_]+)?\s*\([^()]*\)/g, '');
        } while (spec !== prev);

        for (const rawPart of spec.split(',')) {
          let part = rawPart.trim();
          if (!part || part === '*') continue;
          if (part.includes('.') || part.includes('(') || part.includes(')')) continue;
          if (part.includes(':')) part = part.split(':').pop()!.trim(); // alias:col
          part = part.split('!')[0].trim(); // col!inner
          if (!/^[a-z_][a-z0-9_]*$/i.test(part)) continue;
          columns.push(part);
        }
      } else if (FILTER_METHODS.has(call.method)) {
        const lit = /^\s*['"]([^'"]*)['"]/.exec(call.args);
        if (!lit) continue;
        const col = lit[1].trim();
        if (!col || col.includes('.') || col.includes('->')) continue;
        if (!/^[a-z_][a-z0-9_]*$/i.test(col)) continue;
        columns.push(col);
      }
    }

    if (columns.length > 0) {
      sites.push({ file, table, op: 'update', columns: Array.from(new Set(columns)) });
    }
  }

  return sites;
}

/**
 * استخراج مواضع الكتابة `.from('t').insert({...})` / `.update({...})`.
 * محافظ عمداً: يتخطّى الكائنات التي تحوي spread (`...x`) أو مفاتيح محسوبة
 * (`[cfg.col]`) لأنّ أعمدتها غير قابلة للتحديد ساكناً.
 */
export function extractWriteSites(code: string, file: string): WriteSite[] {
  const sites: WriteSite[] = [];
  const fromRe = /\.from\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*\)/g;
  let m: RegExpExecArray | null;

  while ((m = fromRe.exec(code)) !== null) {
    const table = m[1];
    const after = code.slice(m.index + m[0].length);

    // العملية التالية مباشرةً (نتجاوز المسافات/الأسطر والتعليقات البسيطة)
    const opMatch = /^[\s\r\n]*\.(insert|update|upsert)\s*\(\s*\{/.exec(after);
    if (!opMatch) continue;

    // اقرأ الكائن بتوازن الأقواس
    const objStart = m.index + m[0].length + opMatch[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let i = objStart; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) continue;

    const objBody = code.slice(objStart + 1, end);

    // تخطَّ ما لا يمكن تحليله ساكناً
    if (objBody.includes('...')) continue;

    // مفاتيح المستوى الأول فقط
    const columns: string[] = [];
    let d = 0;
    let computed = false;
    const lines = objBody.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.replace(/\/\/.*$/, '');
      const trimmed = line.trim();
      if (d === 0) {
        if (/^\[/.test(trimmed)) computed = true;
        const key = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/.exec(trimmed);
        if (key) columns.push(key[1]);
      }
      for (const ch of line) {
        if (ch === '{' || ch === '[' || ch === '(') d++;
        else if (ch === '}' || ch === ']' || ch === ')') d--;
      }
    }
    if (computed) continue;

    const op = opMatch[1] === 'upsert' ? 'insert' : (opMatch[1] as 'insert' | 'update');
    if (columns.length > 0) sites.push({ file, table, op, columns });
  }

  return sites;
}

function readSqlFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
}

function walkSource(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkSource(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe('🛡️ تطابق المخطّط — أعمدة الكتابة موجودة فعلاً في الـ DDL', () => {
  const schema = parseMigrationSchema(readSqlFiles());

  it('يقرأ الـ DDL ويجد الجداول الأساسية', () => {
    expect(schema.size).toBeGreaterThan(30);
    expect(schema.get('notification_queue')).toBeDefined();
    expect(schema.get('dental_ratings')).toBeDefined();
    // أعمدة صحيحة معروفة
    expect(schema.get('notification_queue')!.has('recipient_phone')).toBe(true);
    expect(schema.get('dental_ratings')!.has('hygiene_rating')).toBe(true);
    // عمود يضيفه ALTER في ترحيل لاحق
    expect(schema.get('partner_labs')!.has('slug')).toBe(true);
  });

  it('لا يكتب أيّ ملف في عمود غير موجود', () => {
    const files = walkSource(SRC_DIR);
    const violations: string[] = [];

    for (const file of files) {
      const code = readFileSync(file, 'utf8');
      for (const site of extractWriteSites(code, file)) {
        const cols = schema.get(site.table);
        if (!cols) continue; // جدول خارج الترحيلات — لا حكم
        for (const col of site.columns) {
          if (!cols.has(col.toLowerCase())) {
            violations.push(
              `${file.replace(process.cwd() + '/', '')}: ` +
              `${site.op} في «${site.table}» يستخدم عموداً غير موجود «${col}»`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('🛡️ تطابق المخطّط — أعمدة القراءة/الفلترة موجودة فعلاً في الـ DDL', () => {
  const schema = parseMigrationSchema(readSqlFiles());

  it('لا يقرأ/يفلتر أيّ ملف على عمود غير موجود', () => {
    const files = walkSource(SRC_DIR);
    const violations: string[] = [];

    for (const file of files) {
      const code = readFileSync(file, 'utf8');
      for (const site of extractReadSites(code, file)) {
        const cols = schema.get(site.table);
        if (!cols) continue; // جدول خارج الترحيلات — لا حكم
        for (const col of site.columns) {
          if (!cols.has(col.toLowerCase())) {
            violations.push(
              `${file.replace(process.cwd() + '/', '')}: ` +
              `قراءة/فلترة «${site.table}» تستخدم عموداً غير موجود «${col}»`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('🛡️ الحارس نفسه يكشف الأخطاء الثلاثة التاريخية', () => {
  const schema = parseMigrationSchema(readSqlFiles());

  const check = (code: string) =>
    extractWriteSites(code, 'x.ts').flatMap((s) =>
      s.columns.filter((c) => !schema.get(s.table)?.has(c.toLowerCase()))
    );

  it('يكشف أعمدة notification_queue القديمة الخاطئة', () => {
    const buggy = `
      await supabase.from('notification_queue').insert({
        user_id: u.id,
        notification_type: campaign.type,
        payload: { title: 'x' },
        status: 'pending',
      });`;
    expect(check(buggy).sort()).toEqual(['notification_type', 'payload', 'user_id']);
  });

  it('يكشف أعمدة dental_ratings القديمة الخاطئة', () => {
    const buggy = `
      await supabaseAny.from('dental_ratings').insert({
        user_id: user.id,
        rating: 5,
        cleanliness_rating: 4,
        skill_rating: 3,
      });`;
    expect(check(buggy).sort()).toEqual(['cleanliness_rating', 'skill_rating']);
  });

  it('يكشف عمود optical_ratings القديم الخاطئ', () => {
    const buggy = `
      await supabaseAny.from('optical_ratings').insert({
        user_id: user.id,
        rating: 5,
        product_quality_rating: 4,
      });`;
    expect(check(buggy)).toEqual(['product_quality_rating']);
  });

  it('يقبل النسخ المُصحَّحة (لا إنذار كاذب)', () => {
    const fixed = `
      await supabase.from('notification_queue').insert({
        recipient_user_id: u.id,
        recipient_phone: u.phone,
        channel: 'whatsapp',
        body: 'x',
        related_type: 'campaign',
      });
      await supabaseAny.from('dental_ratings').insert({
        user_id: user.id, rating: 5, hygiene_rating: 4, expertise_rating: 3,
      });
      await supabaseAny.from('optical_ratings').insert({
        user_id: user.id, rating: 5, quality_rating: 4,
      });`;
    expect(check(fixed)).toEqual([]);
  });

  it('يتخطّى الحمولات غير القابلة للتحليل الساكن (spread / مفاتيح محسوبة)', () => {
    const dynamic = `
      await supabase.from('campaigns').insert({ ...input, status });
      await supabase.from('hospitals').update({ [cfg.latCol]: lat });`;
    expect(extractWriteSites(dynamic, 'x.ts')).toEqual([]);
  });
});

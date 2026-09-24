import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🧱 حارس عقد الأعمدة في عبارات الإدراج
 *
 * ثلاثة مشغِّلات في القاعدة كانت تُدرج في `notification_queue` بهذه الأعمدة:
 *
 *     user_id, template_key, title, body, icon, data, created_at, scheduled_at
 *
 * والجدول يحمل `recipient_user_id` و`recipient_phone` و`channel`. فخمسةٌ من
 * الثمانية لا وجود لها، واثنان إلزاميّان غائبان. وهي مشغِّلات AFTER، فالخطأ
 * لا يُسقط الإشعار وحده بل **العبارةَ المُشغِّلة كلَّها**: كلّ تغيير حالةِ حجزٍ
 * في صيدلية، وكلّ حجزٍ جديدٍ في صيدليةٍ لها مالك، وكلّ انتقال طلب مختبر إلى
 * `results_ready`. أصلحه الترحيل 0029.
 *
 * ولم يكن ذلك ليظهر في أيّ اختبارٍ يعمل على كائناتٍ وهمية: العطب في
 * التوافق بين نصّ الترحيل وبنية الجدول، وكلاهما في هذا المستودع. فهذا
 * الحارس يقرأ الاثنين ويقابلهما.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

function allMigrations(): { name: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ name: f, sql: readFileSync(join(MIGRATIONS_DIR, f), 'utf8') }));
}

function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '');
}

interface TableDef {
  columns: Set<string>;
  notNullNoDefault: Set<string>;
}

/** يستخرج تعريفات الجداول من `CREATE TABLE` في كلّ الترحيلات */
function tableDefs(): Map<string, TableDef> {
  const defs = new Map<string, TableDef>();

  for (const { sql } of allMigrations()) {
    const clean = stripComments(sql);
    const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\s*\);/gi;

    for (const m of clean.matchAll(re)) {
      const table = m[1];
      const columns = new Set<string>();
      const notNullNoDefault = new Set<string>();

      // يُقسَّم جسم التعريف على الفواصل التي **خارج** الأقواس، فلا ينكسر
      // على `CHECK (x IN ('a','b'))` ولا على `numeric(10, 2)`
      let depth = 0;
      let cur = '';
      const lines: string[] = [];
      for (const ch of m[2]) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { lines.push(cur); cur = ''; continue; }
        cur += ch;
      }
      lines.push(cur);

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        // تخطّي قيود الجدول (لا أعمدة)
        if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|EXCLUDE)\b/i.test(line)) continue;
        const nameMatch = line.match(/^"?(\w+)"?\s+/);
        if (!nameMatch) continue;
        const col = nameMatch[1];
        columns.add(col);
        if (/\bNOT\s+NULL\b/i.test(line) && !/\bDEFAULT\b/i.test(line) && !/\bPRIMARY\s+KEY\b/i.test(line)) {
          notNullNoDefault.add(col);
        }
      }

      // ترحيلٌ لاحقٌ قد يعيد التعريف؛ نُبقي الأوّل ثمّ نضمّ إليه
      const prev = defs.get(table);
      if (prev) {
        columns.forEach((c) => prev.columns.add(c));
      } else {
        defs.set(table, { columns, notNullNoDefault });
      }
    }
  }

  // `ALTER TABLE ... ADD COLUMN` يوسّع الجدول أيضاً.
  // وقد تحمل العبارة الواحدة عدّة `ADD COLUMN` مفصولةً بفواصل — أوّل صياغةٍ
  // لهذا الحارس التقطت الأولى وحدها، فأبلغ عن ثلاثة أعمدةٍ في `coupons`
  // كأنّها مفقودة وهي مضافةٌ في 0007 نفسه. فيُقرأ جسم العبارة كاملاً.
  for (const { sql } of allMigrations()) {
    const clean = stripComments(sql);
    const stmtRe = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)([\s\S]*?);/gi;
    for (const stmt of clean.matchAll(stmtRe)) {
      const def = defs.get(stmt[1]);
      if (!def) continue;
      const colRe = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
      for (const c of stmt[2].matchAll(colRe)) def.columns.add(c[1]);
    }
  }

  return defs;
}

/** كلّ عبارات `INSERT INTO <table> (cols...)` في الترحيلات */
function inserts(): { file: string; table: string; cols: string[] }[] {
  const out: { file: string; table: string; cols: string[] }[] = [];
  for (const { name, sql } of allMigrations()) {
    const clean = stripComments(sql);
    const re = /INSERT\s+INTO\s+(?:public\.)?(\w+)\s*(?:AS\s+\w+\s*)?\(([^)]*)\)/gi;
    for (const m of clean.matchAll(re)) {
      const cols = m[2]
        .split(',')
        .map((c) => c.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      if (cols.length) out.push({ file: name, table: m[1], cols });
    }
  }
  return out;
}

describe('عقد الأعمدة بين الترحيلات والجداول', () => {
  const defs = tableDefs();

  it('يقرأ تعريف notification_queue من 0002 قراءةً صحيحة', () => {
    const nq = defs.get('notification_queue');
    expect(nq).toBeDefined();
    expect([...nq!.columns].sort()).toEqual(
      expect.arrayContaining([
        'body', 'channel', 'recipient_phone', 'recipient_user_id',
        'related_id', 'related_type', 'scheduled_for', 'template_key',
      ])
    );
    // الأعمدة التي كانت المشغِّلات تكتبها ولا وجود لها
    for (const ghost of ['user_id', 'title', 'icon', 'data', 'scheduled_at']) {
      expect(nq!.columns.has(ghost)).toBe(false);
    }
    expect([...nq!.notNullNoDefault].sort()).toEqual(['body', 'channel', 'recipient_phone']);
  });

  it('كلّ عمودٍ في كلّ INSERT موجودٌ في الجدول المقصود', () => {
    const offenders: string[] = [];
    for (const ins of inserts()) {
      const def = defs.get(ins.table);
      if (!def) continue; // جدولٌ لا تعريف له في الترحيلات — خارج نطاق هذا الحارس
      for (const col of ins.cols) {
        if (!def.columns.has(col)) offenders.push(`${ins.file}: ${ins.table}.${col}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('كلّ INSERT يزوّد الأعمدةَ الإلزاميّة التي لا افتراضيّ لها', () => {
    const offenders: string[] = [];
    for (const ins of inserts()) {
      const def = defs.get(ins.table);
      if (!def) continue;
      for (const req of def.notNullNoDefault) {
        if (!ins.cols.includes(req)) offenders.push(`${ins.file}: ${ins.table} ينقصه ${req}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

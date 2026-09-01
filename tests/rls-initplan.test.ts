import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * ⚡ حارس InitPlan في سياسات RLS
 *
 * `auth.uid()` دالّةٌ مُستقرّة لا ثابتة، فالمكتوبة هكذا:
 *
 *     USING (auth.uid() = user_id)
 *
 * تُنفَّذ **لكلّ صفّ** يمرّ عليه الفحص. ولفّها في استعلامٍ فرعيّ يجعلها
 * InitPlan تُحسب مرّةً واحدة:
 *
 *     USING ((SELECT auth.uid()) = user_id)
 *
 * كانت ٢١٤ سياسةً على ٩٢ جدولاً بلا لفّ، فصُحّحت في الترحيل 0032 وهبطت
 * ملاحظات المدقّق من ٧٨٨ إلى ٥٧٤. وهذا الحارس يمنع عودة الشكل في ترحيلٍ
 * جديد — والقاعدةُ لا تشتكي منه، فالمدقّق وحده يراه ولا أحد يقرؤه يومياً.
 */

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');

function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '');
}

/** جسم كلّ `CREATE POLICY` في الملفّ، حتى الفاصلة المنقوطة خارج الأقواس */
function policyBodies(sql: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = [];
  const re = /CREATE\s+POLICY\s+"?([\w]+)"?/gi;
  for (const m of sql.matchAll(re)) {
    let i = m.index! + m[0].length;
    let depth = 0;
    const start = i;
    while (i < sql.length) {
      const ch = sql[i];
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      else if (ch === ';' && depth <= 0) break;
      i++;
    }
    out.push({ name: m[1], body: sql.slice(start, i) });
  }
  return out;
}

/** نداءٌ غير ملفوف: `auth.x()` لا يسبقه `SELECT ` */
function unwrappedCalls(body: string): string[] {
  const hits: string[] = [];
  const re = /auth\.(uid|jwt|role)\(\)/g;
  for (const m of body.matchAll(re)) {
    const before = body.slice(Math.max(0, m.index! - 12), m.index!);
    if (!/SELECT\s+$/i.test(before)) hits.push(m[0]);
  }
  return hits;
}

describe('سياسات RLS تحسب auth.uid() مرّةً لا لكلّ صفّ', () => {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ name: f, sql: stripComments(readFileSync(join(MIGRATIONS, f), 'utf8')) }));

  it('يقرأ سياسات الترحيلات قراءةً صحيحة', () => {
    // حارسٌ للحارس: لو انكسر المحلّل ولم يجد شيئاً لمرّ الاختبار التالي
    // فارغاً ولم يُثبت شيئاً — كما وقع لي في حارسٍ سابق في هذه الجلسة.
    const total = files.reduce((n, f) => n + policyBodies(f.sql).length, 0);
    expect(total).toBeGreaterThan(20);
  });

  it('لا سياسةَ في ترحيلٍ تُنادي auth.uid() بلا لفّ', () => {
    const offenders: string[] = [];
    for (const { name, sql } of files) {
      // 0032 نفسه يذكر النمط في نصّ التحويل — وهو الذي يُصلحه لا يخالفه
      if (name.startsWith('0032_')) continue;
      for (const p of policyBodies(sql)) {
        const bad = unwrappedCalls(p.body);
        if (bad.length) offenders.push(`${name}: ${p.name} (${bad.length}×)`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('الترحيل 0032 يحمل حارساً يُفشل نفسه إن بقيت سياسةٌ غير ملفوفة', () => {
    const sql = readFileSync(
      join(MIGRATIONS, '0032_rls_auth_uid_initplan.sql'), 'utf8'
    );
    expect(sql).toMatch(/RAISE\s+EXCEPTION/i);
    expect(sql).toContain('leftover');
    // ويمنع اللفّ المزدوج عند إعادة التشغيل
    expect(sql).toContain('(?<!SELECT )');
  });
});

describe('ترحيلات الأداء تُثبت أنّها فعلت شيئاً', () => {
  const read = (f: string) => readFileSync(join(MIGRATIONS, f), 'utf8');

  it('التحقّق الذاتيّ يمنع ترحيلاً «ينجح» وهو فارغ', () => {
    // ترحيلٌ يمرّ بلا أن يفعل شيئاً أسوأ من ترحيلٍ يفشل: الفشل يُرى.
    for (const f of ['0032_rls_auth_uid_initplan.sql', '0035_merge_permissive_policies.sql']) {
      expect(read(f)).toMatch(/RAISE\s+EXCEPTION/i);
    }
  });

  it('دمج السياسات يأخذ WITH CHECK من USING عند غيابه', () => {
    // سياسةُ UPDATE بلا WITH CHECK تستعمل USING في الفحص أيضاً. وإغفال ذلك
    // عند الدمج يُضيّق الفحصَ على من كان يمرّ — أي تغييرُ صلاحيةٍ لا إعادةَ
    // صياغة، وهو ما يُفترض ألّا يفعله هذا الترحيل.
    expect(read('0035_merge_permissive_policies.sql'))
      .toMatch(/coalesce\(\s*p\.with_check\s*,\s*p\.qual\s*\)/);
  });

  it('فهرسة المفاتيح الأجنبية تغطّي ما رصده المدقّق', () => {
    const n = (read('0033_index_foreign_keys.sql').match(/CREATE INDEX/g) ?? []).length;
    expect(n).toBe(56);
  });
});

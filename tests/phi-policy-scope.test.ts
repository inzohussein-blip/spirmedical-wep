import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🩺 حارس نطاق سياسات RLS على جداول البيانات الصحّية
 *
 * كانت `lab_results` تحمل هذه السياسة:
 *
 *     lab_results_specialist_manage  ALL
 *     USING (EXISTS (SELECT 1 FROM users
 *                     WHERE users.id = auth.uid()
 *                       AND users.specialist_type = 'lab_analyst'))
 *
 * لا تسأل عن طلبٍ ولا عن مريض — تسأل عن **صفة الحساب** وحدها. فكلّ من
 * حمل صفة محلّل مختبرات كان يقرأ ويعدّل ويحذف نتائج كلّ المرضى. أُثبت ذلك
 * في معاملةٍ مُلغاة: محلّلٌ لا صلة له بالمريض حذف نتيجة فحص HIV وأرجعت
 * القاعدة `n = 1`. أصلحه الترحيل 0028 بالربط عبر `appointments`.
 *
 * وهذا الحارس يمنع عودة الشكل: سياسةٌ على جدولٍ صحّيّ تكتفي بصفة الحساب
 * دون أن تربطه بالصفّ الذي يقرأه.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

function allSql(): { name: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ name: f, sql: readFileSync(join(MIGRATIONS_DIR, f), 'utf8') }));
}

function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '');
}

/** جداولٌ يحمل كلّ صفٍّ فيها بيانات مريضٍ بعينه */
const PHI_TABLES = [
  'lab_results',
  'lab_orders',
  'medical_records',
  'prescriptions',
  'consultations',
];

interface Policy {
  file: string;
  name: string;
  table: string;
  expr: string;
}

function policies(): Policy[] {
  const out: Policy[] = [];
  for (const { name, sql } of allSql()) {
    const clean = stripComments(sql);
    const re =
      /CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+(?:public\.)?(\w+)([\s\S]*?);(?=\s*(?:\n|$))/gi;
    for (const m of clean.matchAll(re)) {
      out.push({ file: name, name: m[1], table: m[2], expr: m[3] });
    }
  }
  return out;
}

describe('نطاق سياسات RLS على الجداول الصحّية', () => {
  const all = policies();

  it('يعثر على سياسات 0028 الجديدة', () => {
    const found = all.filter((p) => p.table === 'lab_results').map((p) => p.name);
    expect(found).toEqual(
      expect.arrayContaining([
        'lab_results_analyst_read',
        'lab_results_analyst_insert',
        'lab_results_analyst_update',
        'lab_results_analyst_delete',
      ])
    );
  });

  it('لا سياسةَ اختصاصيٍّ على جدولٍ صحّيّ تكتفي بصفة الحساب', () => {
    // سياسةٌ تفحص `specialist_type` أو `role = 'specialist'` يجب أن تربط
    // الاختصاصيّ أيضاً بالصفّ نفسه — عبر `appointments` أو معرّفٍ في الصفّ.
    const LINKS = [
      'appointments',
      'assigned_specialist_id',
      'specialist_id',
      'entered_by',
      'doctor_id',
    ];

    const offenders = all
      .filter((p) => PHI_TABLES.includes(p.table))
      .filter((p) => /specialist_type|'specialist'/.test(p.expr))
      .filter((p) => !LINKS.some((l) => p.expr.includes(l)))
      .map((p) => `${p.file}: ${p.table} → ${p.name}`);

    expect(offenders).toEqual([]);
  });

  it('سياسات lab_results تشترط الاعتماد وعدم الإيقاف', () => {
    const analystPolicies = all.filter(
      (p) => p.table === 'lab_results' && p.name.startsWith('lab_results_analyst_')
    );
    // أربعٌ في 0003 (المصدر المُصحَّح) وأربعٌ في 0028 (الترحيل التصحيحيّ)
    expect(analystPolicies.length).toBeGreaterThanOrEqual(4);
    for (const p of analystPolicies) {
      expect(p.expr).toContain("approval_status = 'approved'");
      expect(p.expr).toContain('is_suspended');
    }
  });
});

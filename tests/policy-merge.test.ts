import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔀 0046 — دمج السياسات المتراكبة (بموافقة المالك).
 *
 * قِيس قبل التطبيق في BEGIN … ROLLBACK: ٥٢٨ فحصاً (44 جدولاً × 4 هويّات ×
 * قراءة/تحديث/حذف) على 6,974 صفّاً — صفرُ فرق. وتنبيهاتُ المدقّق 323 → 8
 * (كلّها lab_results المستثنى عمداً).
 *
 * الحارس يحمي ما يجعل الدمج مكافئاً: OR بين عبارات USING، وOR بين
 * coalesce(WITH CHECK, USING)، والتوقّف بدل التخمين، واستثناء السياسات
 * المرتبطة بأدوار. ويحمي إغلاقَ إدراج bug_reports.
 */

const DIR = join(process.cwd(), 'supabase/migrations');
const sql = readFileSync(join(DIR, '0046_merge_permissive_policies.sql'), 'utf8');
const body = sql.slice(sql.indexOf('DO $merge$'));

describe('0046: الدمجُ مكافئٌ لا تقريبيّ', () => {
  it('🚨 USING تُجمع بـOR، وWITH CHECK بـOR على coalesce(WITH CHECK, USING)', () => {
    expect(body).toMatch(/string_agg\('\(' \|\| p\.q \|\| '\)', ' OR '/);
    expect(body).toMatch(/string_agg\('\(' \|\| coalesce\(p\.wc, p\.q\) \|\| '\)', ' OR '/);
  });

  it('🚨 يتوقّف أمام سياسةٍ مقيِّدة أو سياسةٍ بلا USING — لا تخمين', () => {
    expect(body).toMatch(/NOT pol\.polpermissive\) THEN\s+RAISE EXCEPTION/);
    expect(body).toMatch(/IF bad > 0 THEN\s+RAISE EXCEPTION/);
  });

  it('🚨 سياساتُ PUBLIC وحدها، وlab_results مستثنى (سياساته لأدوارٍ محدّدة)', () => {
    expect(body).toMatch(/pol\.polroles = '\{0\}'/);
    expect(body).toMatch(/p\.t <> 'lab_results'/);
  });
});

describe('bug_reports: لا إدراجَ من زائر', () => {
  it('🚨 0046 يُسقط سياسة الإدراج المدمجة', () => {
    expect(body).toMatch(/DROP POLICY IF EXISTS bug_reports_insert_merged ON public\.bug_reports;/);
  });

  it('🚨 ولا ترحيلَ بعده يعيد إدراجاً مفتوحاً', () => {
    const later = readdirSync(DIR)
      .filter((f) => /^\d{4}_.*\.sql$/.test(f) && f > '0046')
      .map((f) => readFileSync(join(DIR, f), 'utf8'));
    for (const s of later) {
      expect(s).not.toMatch(/ON\s+public\.bug_reports\s+FOR\s+(INSERT|ALL)[^;]*WITH CHECK\s*\(\s*true\s*\)/i);
    }
  });
});

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🛡️ حارس تغطية RLS
 *
 * RLS هي خطّ الدفاع الأخير: مفتاح `anon` يصل إلى المتصفّح، فأي جدول بلا سياسة
 * صحيحة يمكن قراءته مباشرةً من أدوات المطوّر — بغضّ النظر عن كل الفحوص في الكود.
 *
 * تدقيقٌ يدويّ وجد الوضع سليماً (90 جدولاً، RLS مُفعّلة على الكل، 269 سياسة،
 * ولا سياسة متساهلة على جدول حسّاس). هذه الاختبارات تُثبّت ذلك: ترحيلٌ جديد
 * يضيف جدولاً يحمل بيانات مرضى بلا RLS أو بلا سياسة — أو يفتحه بـ`USING (true)` —
 * يُفشل البناء بدل أن يمرّ صامتاً.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

function allMigrationSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');
}

/** جداول تحمل بيانات شخصية أو طبية — الفشل فيها له كلفة حقيقية */
const SENSITIVE_TABLES = [
  'users', 'appointments', 'lab_orders', 'lab_results', 'consultations',
  'messages', 'chats', 'prescriptions', 'health_vitals', 'family_members',
  'nursing_visit_history', 'pharmacy_reservations', 'user_medications',
  'patient_notes', 'user_saved_locations', 'audit_logs', 'whatsapp_otp',
  'admin_requests', 'reminders',
];

const sql = allMigrationSql();

function definedTables(): Set<string> {
  const out = new Set<string>();
  const re = /CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) out.add(m[1]);
  return out;
}

function tablesWithRlsEnabled(): Set<string> {
  const out = new Set<string>();
  const re = /ALTER TABLE (?:IF EXISTS )?(?:public\.)?([a-z_]+)\s+ENABLE ROW LEVEL SECURITY/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) out.add(m[1]);
  return out;
}

interface Policy {
  table: string;
  name: string;
  body: string;
}

function policies(): Policy[] {
  const out: Policy[] = [];
  const re = /CREATE POLICY\s+"?([^"\n]+?)"?\s+ON\s+(?:public\.)?([a-z_]+)([\s\S]*?);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    out.push({ name: m[1].trim(), table: m[2], body: m[3] });
  }
  return out;
}

describe('🛡️ كل جدول حسّاس محميّ بـ RLS', () => {
  const tables = definedTables();
  const rlsOn = tablesWithRlsEnabled();
  const withPolicy = new Set(policies().map((p) => p.table));

  it('يقرأ الترحيلات ويجد الجداول والسياسات', () => {
    expect(tables.size).toBeGreaterThan(50);
    expect(policies().length).toBeGreaterThan(100);
  });

  it.each(SENSITIVE_TABLES)('%s: RLS مُفعّلة', (table) => {
    if (!definedTables().has(table)) return; // جدول غير معرّف بعد — لا حكم
    expect(rlsOn.has(table)).toBe(true);
  });

  it.each(SENSITIVE_TABLES)('%s: له سياسة واحدة على الأقل', (table) => {
    if (!definedTables().has(table)) return;
    expect(withPolicy.has(table)).toBe(true);
  });

  it('كل جدول معرّف عليه RLS (لا استثناءات صامتة)', () => {
    const missing = Array.from(tables).filter((t) => !rlsOn.has(t)).sort();
    expect(missing).toEqual([]);
  });
});

describe('🛡️ لا سياسة تفتح جدولاً حسّاساً للجميع', () => {
  const sensitive = new Set(SENSITIVE_TABLES);

  it('لا `USING (true)` / `WITH CHECK (true)` بلا قيد `auth.uid()`', () => {
    const permissive = policies()
      .filter((p) => sensitive.has(p.table))
      .filter((p) => {
        const openRead = /USING\s*\(\s*true\s*\)/i.test(p.body);
        const openWrite = /WITH CHECK\s*\(\s*true\s*\)/i.test(p.body);
        const scoped = /auth\.uid\(\)/i.test(p.body);
        return (openRead || openWrite) && !scoped;
      })
      .map((p) => `${p.table}: «${p.name}»`);

    expect(permissive.sort()).toEqual([]);
  });
});

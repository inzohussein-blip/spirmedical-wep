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

describe('🛡️ المنظورات الممنوحة لا تتجاوز RLS', () => {
  /**
   * 🚨 ثغرة كشفها فحص القاعدة الحيّة ولم يكشفها هذا الحارس نفسه:
   * كان يفحص **الجداول** فقط. والمنظور في Postgres يُنفَّذ افتراضياً
   * بصلاحيات مالكه (`SECURITY DEFINER`)، فيتجاوز RLS على الجداول الأساسية.
   *
   * `vitals_trends` و`admin_lab_orders_summary` كانا ممنوحَين لـ
   * `authenticated` بلا شرطٍ يقصر النتائج على صاحبها — فأيّ مريض مسجَّل
   * يقرأ العلامات الحيوية وأسماء وهواتف كل المرضى. التعليق كان يقول
   * «للـadmin» لكنّ `authenticated` تعني كل من سجّل الدخول.
   *
   * القاعدة: كل منظور يُمنح لـ`authenticated`/`anon` يجب أن يكون
   * `security_invoker = on` كي تُطبَّق سياسات المستعلِم.
   */

  /** منظورات مُنِحت لأدوار العملاء */
  function grantedViews(): Map<string, string[]> {
    const out = new Map<string, string[]>();
    const re = /GRANT\s+[A-Z, ]*\s+ON\s+(?:TABLE\s+)?public\.([a-z_]+)\s+TO\s+([a-z_, ]+);/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
      const roles = m[2].split(',').map((r) => r.trim().toLowerCase());
      if (!roles.some((r) => r === 'authenticated' || r === 'anon')) continue;
      out.set(m[1], roles);
    }
    return out;
  }

  function definedViews(): Set<string> {
    const out = new Set<string>();
    const re = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+public\.([a-z_]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) out.add(m[1]);
    return out;
  }

  /** منظورات ضُبطت على security_invoker */
  function invokerViews(): Set<string> {
    const out = new Set<string>();
    const re = /ALTER\s+VIEW\s+public\.([a-z_]+)\s+SET\s*\(\s*security_invoker\s*=\s*on\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) out.add(m[1]);
    return out;
  }

  it('يقرأ المنظورات والمنح فعلاً (الحارس ليس فارغاً)', () => {
    expect(definedViews().size).toBeGreaterThan(3);
    expect(grantedViews().size).toBeGreaterThan(0);
  });

  it('🚨 كل منظور ممنوح لـ authenticated/anon هو security_invoker', () => {
    const views = definedViews();
    const invoker = invokerViews();

    const leaking = [...grantedViews().entries()]
      .filter(([name]) => views.has(name))
      .filter(([name]) => !invoker.has(name))
      .map(([name, roles]) => `${name} → ${roles.join('/')}`);

    expect(leaking.sort()).toEqual([]);
  });

  it('المنظوران اللذان سرّبا بيانات المرضى مُصلَحان تحديداً', () => {
    const invoker = invokerViews();
    expect(invoker.has('vitals_trends')).toBe(true);
    expect(invoker.has('admin_lab_orders_summary')).toBe(true);
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

describe('🛡️ كل دالّة جديدة تُثبّت search_path', () => {
  /**
   * 🚨 دالّة بلا `search_path` مثبَّت تُحلّ الأسماء داخلها وفق مسار
   * **المُستدعي**. فمن يستطيع إنشاء كائنات في مخطّطٍ يسبق `public` يجعلها
   * تقرأ جدوله بدل جدولنا. وفي دالّة `SECURITY DEFINER` — تُنفَّذ بصلاحيات
   * `postgres` — يصير ذلك تصعيد صلاحيات مكتملاً.
   *
   * كُشف من فحص القاعدة الحيّة: ٥٦ دالّة بلا تثبيت، منها ١٦ `SECURITY
   * DEFINER` (`is_admin` و`handle_new_user` و`verify_start_otp` …).
   */
  const created = new Set<string>();
  const reCreate = /CREATE (?:OR REPLACE )?FUNCTION\s+(?:public\.)?([a-z_]+)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = reCreate.exec(sql)) !== null) created.add(m[1]);

  it('ترحيل التثبيت موجود ويستثني دوالّ الامتدادات بالتبعيّة', () => {
    const migration = sql;
    expect(migration).toContain('SET search_path = public, pg_temp');
    // الاستثناء عبر pg_depend لا بمطابقة أسماء
    expect(migration).toContain("deptype = 'e'");
    // pg_temp أخيراً كي لا تحجب جداولٌ مؤقّتة جداولنا
    expect(/search_path = public, pg_temp/.test(migration)).toBe(true);
  });

  it('🚨 كل دالّة يُعرّفها المشروع مشمولة بالتثبيت', () => {
    // التثبيت يجري بحلقة تشمل كل دوالّ public غير المملوكة لامتداد،
    // فوجود الحلقة يكفي — لكنّنا نتحقّق أنّها لم تُقيَّد بأسماء بعينها.
    expect(created.size).toBeGreaterThan(20);
    expect(/ALTER FUNCTION %s SET search_path/.test(sql)).toBe(true);
    expect(/FOR fn IN[\s\S]{0,600}nspname = 'public'/.test(sql)).toBe(true);
  });
});

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

  /**
   * الترحيلات تكتب هذه العمليات بأسلوبين: نداءً مباشراً باسم المنظور،
   * أو حلقة `DO $$ … FOREACH v IN ARRAY views … format('… public.%I …')`.
   * الحارس يجب أن يفهم الاثنين، وإلّا فاته ما يُكتب بالأسلوب الثاني —
   * وهو بالضبط أسلوب الترحيل 0018.
   *
   * لكل حلقة: نلتقط أسماء المصفوفة، ثمّ ننسب إليها كل عملية تظهر في
   * جسم الحلقة نفسها.
   */
  interface LoopBlock { names: string[]; body: string }

  function loopBlocks(): LoopBlock[] {
    const out: LoopBlock[] = [];
    for (const m of sql.matchAll(/DO \$\$([\s\S]*?)\$\$;/g)) {
      const body = m[1];
      const arr = /ARRAY\[([\s\S]*?)\]/.exec(body)?.[1];
      if (!arr) continue;
      const names = [...arr.matchAll(/'([a-z_]+)'/g)].map((n) => n[1]);
      if (names.length) out.push({ names, body });
    }
    return out;
  }

  /** أسماءٌ خضعت لعمليةٍ ما — مباشرةً أو عبر حلقة */
  function viewsWith(direct: RegExp, inLoop: RegExp): Set<string> {
    const out = new Set<string>();
    for (const m of sql.matchAll(direct)) if (m[1]) out.add(m[1]);
    for (const { names, body } of loopBlocks()) {
      if (inLoop.test(body)) for (const n of names) out.add(n);
    }
    return out;
  }

  /** منظورات ضُبطت على security_invoker */
  function invokerViews(): Set<string> {
    return viewsWith(
      /ALTER\s+VIEW\s+public\.([a-z_]+)\s+SET\s*\(\s*security_invoker\s*=\s*on\s*\)/gi,
      /ALTER VIEW public\.%I SET \(security_invoker = on\)/i
    );
  }

  /**
   * ⚠️ المِنحة الشاملة — وهي ثغرة هذا الحارس نفسه سابقاً.
   *
   * كان يعدّ المنظور «ممنوحاً» فقط إن وجد له `GRANT` **صريحاً**. لكنّ
   * الترحيل 0016 منح `SELECT ON ALL TABLES IN SCHEMA public TO anon`،
   * وهي في Postgres تشمل المنظورات أيضاً. فستّة منظورات لم تُذكر بالاسم
   * في أيّ `GRANT` نجحت في الحارس **بالفراغ**، وهي طوال الوقت مقروءة
   * لـ`anon`. أحدها `appointments_with_target`: كل المواعيد مع أسماء
   * أفراد العائلة وأمراضهم المزمنة وحساسيّاتهم وعناوين البيوت.
   *
   * لذا: متى وُجدت مِنحة شاملة، **كل** منظور معرَّف يُعدّ ممنوحاً.
   */
  function hasBlanketGrant(): boolean {
    return /GRANT\s+[A-Z, ]*\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public\s+TO\s+[a-z_, ]*\b(anon|authenticated)\b/i.test(sql);
  }

  /** منظورات سُحبت صراحةً من **كلا** الدورين */
  function revokedViews(): Set<string> {
    const anon = viewsWith(
      /REVOKE\s+ALL\s+ON\s+public\.([a-z_]+)\s+FROM\s+anon/gi,
      /REVOKE ALL ON public\.%I FROM anon/i
    );
    const auth = viewsWith(
      /REVOKE\s+ALL\s+ON\s+public\.([a-z_]+)\s+FROM\s+authenticated/gi,
      /REVOKE ALL ON public\.%I FROM authenticated/i
    );
    return new Set([...anon].filter((v) => auth.has(v)));
  }

  it('يقرأ المنظورات والمنح فعلاً (الحارس ليس فارغاً)', () => {
    expect(definedViews().size).toBeGreaterThan(3);
    expect(grantedViews().size).toBeGreaterThan(0);
    // لو اختفت المِنحة الشاملة يوماً فهذا تغيّرٌ جوهري يستحقّ الانتباه
    expect(hasBlanketGrant()).toBe(true);
  });

  it('🚨 كل منظور مكشوف إمّا security_invoker أو مسحوب صراحةً', () => {
    const invoker = invokerViews();
    const revoked = revokedViews();
    const explicit = grantedViews();

    const exposed = [...definedViews()].filter(
      (name) => hasBlanketGrant() || explicit.has(name)
    );

    const leaking = exposed
      .filter((name) => !invoker.has(name) && !revoked.has(name))
      .sort();

    expect(leaking).toEqual([]);
  });

  it('المنظوران اللذان سرّبا بيانات المرضى مُصلَحان تحديداً', () => {
    const invoker = invokerViews();
    expect(invoker.has('vitals_trends')).toBe(true);
    expect(invoker.has('admin_lab_orders_summary')).toBe(true);
  });

  it('🚨 الستّة التي فاتت 0012 مُغلقة — سحبٌ **و**invoker', () => {
    // `appointments_with_target` أُثبت عملياً أنّه كان يُعيد اسم طفلٍ
    // مريض وتشخيصه وحساسيّته وعنوانه لدور `anon` قبل الترحيل 0018.
    const invoker = invokerViews();
    const revoked = revokedViews();
    for (const v of [
      'appointments_with_target',
      'expiring_credentials',
      'analytics_summary',
      'doctors_with_stats',
      'medications_with_availability',
      'pharmacy_inventory_stats',
    ]) {
      expect({ view: v, invoker: invoker.has(v) }).toEqual({ view: v, invoker: true });
      expect({ view: v, revoked: revoked.has(v) }).toEqual({ view: v, revoked: true });
    }
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

describe('🔑 البوّابة الأولى: صلاحيات الجداول', () => {
  /**
   * 🚨 في Postgres بوّابتان مستقلّتان: `GRANT` (هل للدور حقّ العملية؟)
   * ثمّ `RLS` (أيّ الصفوف يرى؟). المشروع بنى الثانية بعناية — ٩١ جدولاً
   * و٢٤٦ سياسة — وترك الأولى مغلقة تماماً: لم يمنح أيّ جدول لـ`anon` أو
   * `authenticated`. فكان كل استعلام من التطبيق يُردّ بـ
   * `42501: permission denied`، والسياسات الـ٢٤٦ لا تُقيَّم أصلاً.
   *
   * التوزيع المعتمَد أضيق من افتراضي Supabase:
   *   authenticated → SELECT/INSERT/UPDATE/DELETE
   *   anon          → SELECT فقط
   */
  const grantMigration = readFileSync(
    join(MIGRATIONS_DIR, '0016_grant_table_privileges.sql'),
    'utf8'
  );

  it('الترحيل يمنح القراءة لـ anon والكتابة لـ authenticated', () => {
    expect(grantMigration).toMatch(/GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon/);
    expect(grantMigration).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated/
    );
  });

  it('🚨 anon لا يُمنح كتابة إطلاقاً', () => {
    const anonGrants = grantMigration
      .split('\n')
      .filter((l) => !l.trim().startsWith('--') && /TO[^;]*\banon\b/.test(l));

    expect(anonGrants.length).toBeGreaterThan(0);
    for (const line of anonGrants) {
      expect(/\b(INSERT|UPDATE|DELETE|TRUNCATE)\b/.test(line)).toBe(false);
    }
  });

  it('الجداول المستقبلية مشمولة (لا يتكرّر الخلل مع كل ترحيل)', () => {
    expect(grantMigration).toContain('ALTER DEFAULT PRIVILEGES');
  });

  it('المنح لا يُغني عن RLS — الحارس أعلاه يشترطها على كل جدول', () => {
    // توثيقٌ للعلاقة: الفتح هنا آمن فقط لأنّ RLS مُفعّلة على كل جدول
    const tables = definedTables();
    const rlsOn = tablesWithRlsEnabled();
    expect([...tables].filter((t) => !rlsOn.has(t))).toEqual([]);
  });
});

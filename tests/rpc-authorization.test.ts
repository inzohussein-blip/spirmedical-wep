import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔐 حارس التفويض على دوالّ RPC
 *
 * `SECURITY DEFINER` تُنفَّذ بصلاحية **مالك** الدالّة لا مستدعيها، فتتخطّى
 * RLS تخطّياً كاملاً. وهذا مقصودٌ ومفيد — لكنّه ينقل عبء التفويض من
 * السياسات إلى جسم الدالّة. فإن قبلت الدالّة معرّفاً من المستدعي ثمّ كتبت
 * به دون مقارنته بـ`auth.uid()`، صارت بوّابةً مفتوحة.
 *
 * حدث ذلك فعلاً في `generate_referral_code(p_user_id uuid)`:
 *
 *     INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code)
 *     ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code
 *
 * و`EXECUTE` ممنوحٌ لـ`authenticated`. فأيّ مستخدمٍ مسجَّل كان يستدعيها
 * بمعرّف شخصٍ آخر فيُبدّل رمز إحالته — من وزّع رمزه على أصدقائه يفقده بلا
 * إشعار. أصلحه الترحيل 0023.
 *
 * والفحصُ الحيّ لهذا الثابت في `supabase/health-check.sql` (رقم ١٤)، وهذا
 * توأمه الساكن: يقرأ ملفّات الترحيل فيمنع عودة الشكل نفسه في ترحيلٍ جديد
 * قبل أن يصل القاعدة أصلاً.
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

function migrationFiles(): { name: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ name: f, sql: readFileSync(join(MIGRATIONS_DIR, f), 'utf8') }));
}

/** يقسّم ملفّ ترحيل إلى أجسام دوالّ منفصلة (بين $function$ / $$ ) */
function functionBodies(sql: string): { header: string; body: string }[] {
  const out: { header: string; body: string }[] = [];
  const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([\s\S]*?)AS\s+(\$[a-zA-Z_]*\$)([\s\S]*?)\2/gi;
  for (const m of sql.matchAll(re)) out.push({ header: m[1], body: m[3] });
  return out;
}

describe('تفويض دوالّ SECURITY DEFINER', () => {
  /**
   * دوالٌّ تكتب بمعرّفٍ **مشتقٍّ من بياناتٍ أخرى** لا يمرّره المستدعي
   * مباشرةً، أو لا تحتاج تفويضاً لأنّها غير مكشوفة. عند إضافة اسمٍ هنا
   * اذكر السبب — القائمة تُقرأ لا تُطوَّل.
   */
  const EXEMPT = new Map<string, string>([
    // تستخرج المعرّفات من صفّ الطلب نفسه؛ ولا EXECUTE لـanon/authenticated
    ['create_prescription_from_order', 'المعرّفات مستخرجةٌ من الطلب، والدالّة غير مكشوفة'],
    // تُستدعى من خادمٍ بمفتاح service_role؛ EXECUTE مسحوبٌ من الدورين
    ['add_wallet_transaction', 'مسحوبةُ EXECUTE — لا تبلغها REST'],
  ]);

  it('كل دالّة DEFINER تكتب بوسيط uuid تقارنه بـauth.uid()', () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationFiles()) {
      for (const { header, body } of functionBodies(sql)) {
        if (!/SECURITY\s+DEFINER/i.test(header)) continue;
        if (!/\buuid\b/i.test(header)) continue;
        if (!/(INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM)/i.test(body)) continue;
        if (/auth\.uid\(\)/i.test(body)) continue;

        const fn = header.match(/^\s*(?:public\.)?([a-zA-Z_][a-zA-Z0-9_]*)/)?.[1] ?? '؟';
        if (EXEMPT.has(fn)) continue;
        offenders.push(`${name} → ${fn}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('generate_referral_code ترفض معرّفاً ليس معرّف صاحب الجلسة', () => {
    const sql = migrationFiles().map((f) => f.sql).join('\n');
    const fn = functionBodies(sql)
      .filter((f) => /generate_referral_code\s*\(\s*p_user_id/i.test(f.header))
      .pop();

    expect(fn).toBeDefined();
    // الشرط قبل أيّ كتابة، ويرفع خطأً لا يكتفي بالإرجاع
    expect(fn!.body).toMatch(/p_user_id\s+IS\s+DISTINCT\s+FROM\s+auth\.uid\(\)/i);
    expect(fn!.body).toMatch(/RAISE\s+EXCEPTION/i);
  });
});

describe('كشف دوالّ المُشغِّلات على REST', () => {
  /**
   * سحب EXECUTE من `anon, authenticated` وحدَهما **بلا أثر**: المنحة
   * موروثةٌ من `PUBLIC` بحكم الإعداد الافتراضي لا ممنوحةً للدورين صراحةً.
   * قِستُ ذلك: بعد السحب منهما بقيت `has_function_privilege` تساوي `true`،
   * ولم تصر `false` إلّا بإضافة `PUBLIC`.
   *
   * وهو خطأٌ صامت تماماً — الترحيل ينجح والمدقّق يبقى مُنذِراً.
   */
  it('سحب EXECUTE يشمل PUBLIC لا الدورين وحدهما', () => {
    for (const { name, sql } of migrationFiles()) {
      for (const m of sql.matchAll(/REVOKE\s+EXECUTE\s+ON\s+FUNCTION[^;]*?FROM\s+([^;]+)/gi)) {
        const grantees = m[1].toUpperCase();
        // السحب من دورٍ مُسمّى وحده لا يُسقط المنحة الموروثة من PUBLIC
        if (/\b(ANON|AUTHENTICATED)\b/.test(grantees) && !/\bPUBLIC\b/.test(grantees)) {
          throw new Error(`${name}: سحبٌ لا يشمل PUBLIC فلا أثر له → ${m[1].trim()}`);
        }
      }
    }
  });
});

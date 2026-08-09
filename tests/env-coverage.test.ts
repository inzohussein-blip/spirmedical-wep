import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔐 حارس توثيق متغيّرات البيئة
 *
 * الخلل الذي يحرسه: الكود كان يتطلّب **٤٢** متغيّراً بينما `.env.example`
 * يوثّق **١٠**. والفارق ليس تفصيلاً تنظيمياً — أثر غياب هذه الأسرار
 * **صامت** لا صاخب:
 *
 *   • `CRON_SECRET` غائب ⇒ كل المهامّ المجدولة تفشل مغلقة، فتذكيرات
 *     المواعيد والطلبات الدورية لا تعمل بلا أيّ خطأ ظاهر.
 *   • `VAPID_*` غائبة ⇒ إشعارات الدفع معطّلة كلّياً (no-op).
 *   • `RESEND_API_KEY` غائب ⇒ لا تحقّق بريد ولا استعادة كلمة مرور.
 *   • `META_APP_SECRET` غائب ⇒ كل ردود تسليم واتساب تُرفض 401.
 *
 * القاعدة: `src/lib/env.ts` هو المصدر الموثوق، و`.env.example` يجب أن
 * يغطّيه بالكامل — وكذلك كل متغيّر يقرؤه الكود فعلاً.
 */

const ROOT = process.cwd();
const example = readFileSync(join(ROOT, '.env.example'), 'utf8');
const envSchema = readFileSync(join(ROOT, 'src/lib/env.ts'), 'utf8');

/** المتغيّرات المذكورة في `.env.example` (مفاتيح أو داخل تعليقات) */
const documented = new Set(
  [...example.matchAll(/^\s*#?\s*([A-Z][A-Za-z0-9_]+)\s*=/gm)].map((m) => m[1])
);

/** المتغيّرات المعرّفة في مخطّط zod */
function schemaVars(): string[] {
  const body = /const envSchema = z\.object\(\{([\s\S]*?)\n\}\);/.exec(envSchema)?.[1] ?? '';
  return [...body.matchAll(/^\s{2}([A-Z][A-Z0-9_]+)\s*:/gm)].map((m) => m[1]);
}

/** المتغيّرات التي يقرؤها الكود فعلاً */
function usedInCode(): Set<string> {
  const out = new Set<string>();
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name)) {
        const code = readFileSync(p, 'utf8');
        for (const m of code.matchAll(/process\.env\.([A-Z][A-Za-z0-9_]+)/g)) {
          out.add(m[1]);
        }
      }
    }
  };
  walk(join(ROOT, 'src'));
  return out;
}

/** متغيّرات تضبطها المنصّة نفسها — لا تُوثَّق في المثال */
const PLATFORM_PROVIDED = new Set([
  'NODE_ENV',
  'NEXT_RUNTIME',
  'VERCEL_REGION',
  'VERCEL_ENV',
  'VERCEL_URL',
]);

describe('🔐 كل متغيّر في المخطّط موثّق في .env.example', () => {
  it('المخطّط يُقرأ فعلاً (الحارس ليس فارغاً)', () => {
    expect(schemaVars().length).toBeGreaterThan(20);
    expect(documented.size).toBeGreaterThan(20);
  });

  it('🚨 لا متغيّر في المخطّط بلا توثيق', () => {
    const missing = schemaVars()
      .filter((v) => !PLATFORM_PROVIDED.has(v))
      .filter((v) => !documented.has(v))
      .sort();

    expect(missing).toEqual([]);
  });
});

describe('🔐 كل متغيّر يقرؤه الكود موثّق أيضاً', () => {
  it('🚨 لا متغيّر مستعمَل بلا توثيق', () => {
    const missing = [...usedInCode()]
      .filter((v) => !PLATFORM_PROVIDED.has(v))
      .filter((v) => !documented.has(v))
      .sort();

    expect(missing).toEqual([]);
  });
});

describe('🔐 الأسرار ذات الفشل الصامت موثّق أثرها', () => {
  /**
   * لا يكفي ذكر الاسم: من يقرأ الملف يجب أن يعرف **ماذا يتعطّل** بدونه،
   * وإلّا بدت هذه الأسرار اختياريةً بلا ثمن.
   */
  const SILENT_FAILURES = [
    'CRON_SECRET',
    'VAPID_PRIVATE_KEY',
    'RESEND_API_KEY',
    'META_APP_SECRET',
    'AUTH_PASSWORD_SECRET',
  ];

  it.each(SILENT_FAILURES)('%s: أثر غيابه مذكور', (name) => {
    expect(documented.has(name)).toBe(true);

    // يجب أن يسبقه شرحٌ في تعليق ضمن مقطعه
    const idx = example.indexOf(`${name}=`);
    const preceding = example.slice(Math.max(0, idx - 700), idx);
    expect(/#[^\n]*\S/.test(preceding)).toBe(true);
  });

  it('🚨 خطر الدخول بلا رمز موثّق صراحةً', () => {
    expect(example).toContain('ALLOW_PASSWORDLESS_LOGIN');
    expect(example).toMatch(/من يعرف رقم الهاتف/);
  });

  it('فخّ النطاق الواحد موثّق', () => {
    expect(example).toMatch(/حلقة تحويل/);
  });
});

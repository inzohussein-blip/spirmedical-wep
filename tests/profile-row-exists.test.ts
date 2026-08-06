import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🧬 حارس: الصفّ في `public.users` مُنشَأ سلفاً بواسطة مشغّل قاعدة البيانات
 *
 * `on_auth_user_created` يعمل `AFTER INSERT ON auth.users` فيُدرج صفّاً في
 * `public.users` بهاتف مؤقّت `+temp_<uuid>` (لأنّ `users.phone` هو
 * `NOT NULL UNIQUE`). أي مسارٍ يُنشئ مستخدماً عبر `auth.admin.createUser`
 * أو OAuth ثمّ يفترض أنّ الصفّ **غير موجود** يقع في خللين صامتين:
 *
 *   1. `insert` عادي → اصطدام بالمفتاح الأساسي (23505). في تسجيل المريض
 *      بالبريد كان هذا يُدخل فرع التراجع فيحذف مستخدم auth ويُرجع خطأ
 *      Postgres خاماً — أي أنّ **التسجيل كان يفشل في كل مرّة**.
 *   2. شرط `if (!existing)` → **لا يتحقّق أبداً**. في ارتجاع Google كان ذلك
 *      يعني أنّ الاسم و`signup_method` وتوثيق البريد لا تُكتب، ولا يُوجَّه
 *      المستخدم الجديد إلى `/onboarding` إطلاقاً.
 *
 * المعيار الصحيح في المسارين: `upsert` على `id`، والحكم بـ«ملفّ لم يُكمَل»
 * (اسم فارغ أو هاتف `+temp_`) بدل «صفّ غير موجود».
 */

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const SRC = join(process.cwd(), 'src');

const migrationsSql = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
  .join('\n');

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

describe('🧬 المشغّل الذي يُنشئ الملف الشخصي قائم فعلاً', () => {
  it('المشغّل معرَّف على auth.users ولم يُحذف', () => {
    expect(/CREATE TRIGGER on_auth_user_created[\s\S]{0,80}AFTER INSERT ON auth\.users/i
      .test(migrationsSql)).toBe(true);
  });

  it('يُدرج في public.users بهاتف مؤقّت — فالصفّ موجود بعد createUser', () => {
    expect(/INSERT INTO public\.users/i.test(migrationsSql)).toBe(true);
    expect(migrationsSql).toContain("'+temp_'");
  });

  it('`users.phone` هو NOT NULL — سبب وجود الهاتف المؤقّت أصلاً', () => {
    expect(/phone\s+VARCHAR\(20\)\s+UNIQUE\s+NOT NULL/i.test(migrationsSql)).toBe(true);
    // لم يُخفَّف القيد لاحقاً في أي ترحيل
    expect(/phone[\s\S]{0,40}DROP NOT NULL/i.test(migrationsSql)).toBe(false);
  });
});

describe('🧬 مسارات إنشاء الحساب لا تفترض أنّ الصفّ غير موجود', () => {
  it('🚨 تسجيل المريض بالبريد يستعمل upsert لا insert', () => {
    const code = read('lib/auth/email-auth.ts');
    // الكتابة على users بعد createUser يجب أن تكون upsert على id
    expect(/from\('users'\)\s*\.upsert\(/.test(code)).toBe(true);
    expect(code).toContain("onConflict: 'id'");
    // لا يعود إلى insert المباشر الذي كان يصطدم بالمفتاح الأساسي
    expect(/from\('users'\)\s*\.insert\(/.test(code)).toBe(false);
  });

  it('🚨 ارتجاع Google يحكم بـ«ملفّ ناقص» لا بـ«صفّ غير موجود»', () => {
    const code = read('app/auth/callback/route.ts');
    expect(code).toContain('+temp_');
    expect(/from\('users'\)\s*\.upsert\(/.test(code)).toBe(true);
    // الشرط الميّت `if (!existing) {` لم يعد وحده بوّابة إنشاء الملف
    expect(/if\s*\(\s*!existing\s*\)/.test(code)).toBe(false);
  });

  it('🔒 ولا يمنح أيٌّ منهما اعتماداً ثابتاً للمختصّ', () => {
    for (const rel of ['lib/auth/email-auth.ts', 'app/auth/callback/route.ts']) {
      const code = read(rel);
      expect(code).toContain('resolveApprovalStatus');
      // لا `approval_status: 'approved'` حرفيّة تتجاوز الدالة
      expect(/approval_status:\s*'approved'/.test(code)).toBe(false);
    }
  });
});

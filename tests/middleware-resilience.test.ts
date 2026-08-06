import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * ⚡ حارس صمود الوسيط (middleware)
 *
 * الوسيط يعمل على **كل** طلب. أي نداء شبكي فيه بلا سقفٍ زمني يجعل تباطؤ
 * Supabase انقطاعاً شاملاً للموقع: تُنهي Vercel الطلب بـ
 * `504 MIDDLEWARE_INVOCATION_TIMEOUT` فلا تُخدَم أي صفحة — لا العامّة ولا
 * المحميّة. وهذا ما حدث فعلاً على `spir-medical.com`.
 *
 * ثلاث خصائص تمنع تكراره:
 *   1. الزائر المجهول (بلا كوكي جلسة) لا يُطلق أي نداء شبكي إطلاقاً.
 *   2. كل نداء محاطٌ بسقفٍ زمني.
 *   3. فحص الدور نداءٌ واحد لا ثلاثة.
 */

const src = readFileSync(
  join(process.cwd(), 'src/lib/supabase/middleware.ts'),
  'utf8'
);

/** يُزيل التعليقات كي لا يُرضي الحارسَ ذكرٌ في تعليق */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

const code = stripComments(src);

describe('⚡ الوسيط لا يعلّق الموقع عند تباطؤ Supabase', () => {
  it('كل نداء Supabase محاطٌ بسقفٍ زمني', () => {
    // لا `await supabase.…` عارياً خارج withTimeout
    const bare = code.match(/await\s+supabase\s*\.\s*(auth|from)\b/g) ?? [];
    expect(bare).toEqual([]);

    expect(code).toContain('withTimeout');
    expect(/withTimeout\(\s*supabase\.auth\.getUser\(\)/.test(code)).toBe(true);
  });

  it('السقف الزمني معرّف بقيمة معقولة (أقل من مهلة Vercel)', () => {
    const authMs = Number(/AUTH_TIMEOUT_MS\s*=\s*(\d+)/.exec(code)?.[1]);
    const roleMs = Number(/ROLE_TIMEOUT_MS\s*=\s*(\d+)/.exec(code)?.[1]);

    expect(authMs).toBeGreaterThan(0);
    expect(authMs).toBeLessThanOrEqual(5000);
    expect(roleMs).toBeGreaterThan(0);
    expect(roleMs).toBeLessThanOrEqual(5000);
  });

  it('⚡ الزائر المجهول يُخدَم بلا أي نداء شبكي', () => {
    expect(code).toContain('hasAuthCookie');
    // الفحص يسبق **استدعاء** إنشاء عميل Supabase (لا سطر الاستيراد)
    const callIdx = code.indexOf('createServerClient<Database>(');
    expect(callIdx).toBeGreaterThan(0);
    expect(code.indexOf('hasAuthCookie(request)')).toBeLessThan(callIdx);
  });

  it('فحص الدور نداءٌ واحد لا ثلاثة', () => {
    const roleQueries = code.match(/from\(\s*['"]users['"]\s*\)\s*\.select\(\s*['"]role['"]/g) ?? [];
    expect(roleQueries.length).toBe(1);
  });
});

describe('⚡ سياسة الفشل تبقى آمنة', () => {
  it('انتهاء المهلة على مسارٍ محميّ يُحوّل لتسجيل الدخول لا يمرّره', () => {
    // بعد فحص authResult === null يجب أن يظهر تحويل، لا `next()` غير مشروط
    const branch = /authResult === null\)?\s*\{([\s\S]{0,400}?)\n\s{4}\}/.exec(code);
    expect(branch).not.toBeNull();
    expect(branch![1]).toContain('redirect');
  });

  it('الزائر المجهول على مسارٍ محميّ يُحوّل لا يُخدَم', () => {
    const branch = /!hasAuthCookie\(request\)\)\s*\{([\s\S]{0,400}?)\n\s{2}\}/.exec(code);
    expect(branch).not.toBeNull();
    expect(branch![1]).toContain('redirect');
    expect(branch![1]).toContain('admin-login');
  });

  it('لوحة الأدمن تفشل بأمان حين يتعذّر معرفة الدور', () => {
    const branch = /roleResult === null\)?\s*\{([\s\S]{0,300}?)\n\s{4}\}/.exec(code);
    expect(branch).not.toBeNull();
    expect(branch![1]).toContain('admin-login');
  });
});

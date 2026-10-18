/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🔑 المديرُ يدخل تطبيقَي المريض والمختصّ (قرار المالك، 18 تشرين الأول — «دخول كامل»).
 *
 * زرُّ «تطبيق المريض» في لوحة الإدارة كان يربط بـ/dashboard، وتخطيطُه يقبل `patient` وحده فيُعيد
 * المديرَ إلى /admin فوراً — بدا الزرُّ معطّلاً. ولم يكن زرٌّ للمختصّ.
 */
const redirect = jest.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
jest.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to) }));

let role = 'admin';
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'a@x' } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { full_name: 'مدير', role, approval_status: null, user_settings: {} } }) }),
      }),
    }),
  }),
}));

const { requireSession } = require('@/lib/auth/session');
const ROOT = process.cwd();
const code = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('🔑 requireSession', () => {
  beforeEach(() => redirect.mockClear());

  it('🚨 بلا allowAdmin يُعاد المديرُ إلى لوحته (السلوكُ القديم الذي عطّل الزرّ)', async () => {
    role = 'admin';
    await expect(requireSession({ allowedRoles: ['patient'] })).rejects.toThrow('REDIRECT:/admin');
  });

  it.each(['admin', 'super_admin', 'manager', 'support'])('🚨 مع allowAdmin يدخل %s', async (r) => {
    role = r;
    const s = await requireSession({ allowedRoles: ['patient'], allowAdmin: true });
    expect(s.profile.role).toBe(r);
  });

  it('المختصُّ لا يدخل تطبيقَ المريض بـallowAdmin', async () => {
    role = 'specialist';
    await expect(requireSession({ allowedRoles: ['patient'], allowAdmin: true })).rejects.toThrow('REDIRECT:/specialist');
  });
});

describe('🔑 الأبواب كلُّها مفتوحةٌ للمدير', () => {
  it('🚨 التخطيطان يمرّران allowAdmin، وبوّابةُ الاعتماد لا تحجز المدير', () => {
    expect(code('src/app/(dashboard)/layout.tsx')).toMatch(/allowedRoles: \['patient'\],\s*allowAdmin: true/);
    const sp = code('src/app/(specialist)/layout.tsx');
    expect(sp).toMatch(/allowedRoles: \['specialist'\],\s*allowAdmin: true/);
    expect(sp).toMatch(/!isAdminRole\(session\.profile\.role\) && session\.profile\.approval_status !== 'approved'/);
  });

  it('🚨 الوسيطُ لا يُعيد المديرَ من /specialist', () => {
    expect(code('src/lib/supabase/middleware.ts')).toMatch(/pathname\.startsWith\('\/specialist'\) && role !== 'specialist' && !isAdminRole\(role\)/);
  });

  it('🚨 رأسُ اللوحة فيه زرّا التطبيقين', () => {
    const l = code('src/app/admin/layout.tsx');
    expect(l).toMatch(/getAppUrl\('\/dashboard'\)[\s\S]*تطبيق المريض/);
    expect(l).toMatch(/getAppUrl\('\/specialist'\)[\s\S]*تطبيق المختصّ/);
  });

  it('المديرُ يقبل أيَّ طلب، والمختصُّ ما يطابق نوعه وحده', () => {
    const a = code('src/app/(specialist)/specialist/orders/[id]/actions.ts');
    expect(a).toMatch(/if \(!asAdmin\) acceptQuery = acceptQuery\.eq\('required_specialist_type'/);
    expect(a).toMatch(/!asAdmin && \(profile\.role !== 'specialist' \|\| profile\.approval_status !== 'approved'\)/);
  });
});

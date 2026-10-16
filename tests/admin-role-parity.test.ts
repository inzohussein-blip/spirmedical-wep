/**
 * @jest-environment node
 */

/**
 * 🛡️ المديرُ (admin) = المديرُ العامّ (super_admin) — قرار المالك (16 تشرين الأول).
 *
 * `admin-types.ts` يمنح الدورين الصلاحيّاتِ نفسها و`isSuperAdmin()` يقبلهما، لكنّ أربعة مواضع
 * اشترطت `super_admin` بالاسم: مدّةُ الرفض التلقائيّ، والبياناتُ الأوّليّة (صفحةً ومساراً)، وإنشاءُ
 * حساب إدارةٍ بلا مفتاح. فالقائمةُ تُظهرها للمدير ثمّ ترفضه. وحفظُ الألوان كان يُقال «تمّ» بينما
 * السياسةُ ترفض بصمت (0 صفّ) — الآن يُعدّ الصفّ، و0052 يوسّع السياسة.
 *
 * الاستثناءُ الوحيد: إنشاءُ **مديرٍ عامّ** للمدير العامّ وحده (لا ترقيةَ فوق الذات).
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
function walk(p: string): string[] {
  const abs = join(process.cwd(), p);
  if (statSync(abs).isFile()) return [p];
  return readdirSync(abs).flatMap((f) => walk(join(p, f)));
}

describe('🛡️ لا بوّابةَ «super_admin بالاسم» في الإدارة', () => {
  it('🚨 لا مقارنةَ مباشرة بـsuper_admin إلّا قاعدةَ إنشاء المدير العامّ', () => {
    const files = ['src/app/admin', 'src/app/api/admin', 'src/app/admin-login']
      .flatMap(walk)
      .filter((f) => /\.(ts|tsx)$/.test(f));
    const offenders: string[] = [];
    for (const f of files) {
      for (const [i, line] of read(f).split('\n').entries()) {
        // الاستثناء: قاعدةُ «المدير العامّ وحده يمنح دورَ المدير العامّ» (الإنشاء والتعيين)
        const topRule = /body\.role === 'super_admin' && caller\.role !== 'super_admin'|role === 'super_admin' \|\| target\.role === 'super_admin'|callerIsTop: profile\?\.role === 'super_admin'|newRole === 'super_admin'|target\?\.role === 'super_admin'/;
        if (/role\s*(!==|===)\s*'super_admin'/.test(line) && !topRule.test(line)) {
          offenders.push(`${f}:${i + 1}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it.each([
    'src/app/admin/settings/auto-reject-actions.ts',
    'src/app/admin/seed-data/page.tsx',
    'src/app/api/admin/seed/route.ts',
    'src/app/admin-login/actions.ts',
  ])('%s يستعمل isSuperAdmin (يقبل المدير)', (f) => {
    expect(read(f)).toMatch(/isSuperAdmin\(/);
  });

  it('isSuperAdmin يقبل الدورين وحدهما', () => {
    const { isSuperAdmin } = require('@/lib/admin-types');
    expect(isSuperAdmin('admin')).toBe(true);
    expect(isSuperAdmin('super_admin')).toBe(true);
    expect(isSuperAdmin('manager')).toBe(false);
  });

  it('🚨 الترحيل 0052 يوسّع سياستَي الألوان للمدير', () => {
    const sql = read('supabase/migrations/0052_theme_policies_admin.sql');
    expect(sql).toMatch(/ALTER POLICY theme_update_super_admin[\s\S]*'admin'::user_role/);
    expect(sql).toMatch(/ALTER POLICY theme_insert_super_admin[\s\S]*'admin'::user_role/);
  });
});

describe('🎨 حفظُ الألوان لا يقول «تمّ» حين لا يُحفظ شيء', () => {
  const state = { updated: [] as { id: string }[] };
  jest.doMock('next/cache', () => ({ updateTag: () => {} }));
  jest.doMock('@/lib/admin-audit', () => ({ logAdminAction: async () => {} }));
  jest.doMock('@/lib/supabase/server', () => ({
    createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'a1' } } }) },
      from: (t: string) => {
        const q: any = {
          select: () => q, eq: () => q, limit: () => q, update: () => q, insert: async () => ({ error: null }),
          single: async () => (t === 'users' ? { data: { role: 'admin' } } : { data: { id: 'th1' }, error: null }),
          then: (res: any) => Promise.resolve({ data: state.updated, error: null }).then(res),
        };
        return q;
      },
    }),
  }));
  const valid = { primary_color: '#0E5C4D', primary_dark: '#073B30', primary_soft: '#D9E5DF', accent_color: '#B8540C', danger_color: '#A82E3D' };

  it('🚨 سياسةٌ ترفض بصمت (0 صفّ) ← فشلٌ صريح', async () => {
    state.updated = [];
    const { updateTheme } = require('@/app/admin/settings/theme/actions');
    const r = await updateTheme(valid);
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/لم يُحفظ/);
  });

  it('صفٌّ حُدِّث ← نجاح', async () => {
    state.updated = [{ id: 'th1' }];
    const { updateTheme } = require('@/app/admin/settings/theme/actions');
    expect((await updateTheme(valid)).success).toBe(true);
  });
});

describe('👑 منحُ «مدير عام» للمدير العامّ وحده (لا ترقيةَ فوق الذات)', () => {
  it('🚨 التعيينُ والتغييرُ والإزالة: المديرُ لا يمنح دورَ المدير العامّ ولا يمسّ صاحبه', () => {
    const src = read('src/app/admin/admins/actions.ts');
    expect(src).toMatch(/if \(\(role === 'super_admin' \|\| target\.role === 'super_admin'\) && !auth\.callerIsTop\)/);
    const change = src.slice(src.indexOf('export async function changeAdminRole'));
    expect(change).toMatch(/await topRoleBlocked\(auth, userId, newRole\)/);
    const revoke = src.slice(src.indexOf('export async function revokeAdminRole'), src.indexOf('export async function changeAdminRole'));
    expect(revoke).toMatch(/await topRoleBlocked\(auth, userId\)/);
  });
});

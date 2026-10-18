/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';

/**
 * 🏥 ثلاثُ نوافذ: المريض، والمختصّ (محلّلٌ يسحب أو ممرّضٌ منزليّ)، والخدمة (مختبر، صيدلية، عيادة، مستشفى)
 * — قرار المالك، 18 تشرين الأول (0059/0060).
 *
 * كان «المختصّ» يجمع الطبيبَ والصيدليّ والمختبرَ مع سحّاب الدم، فلا يُعرف من يُحلّل ومن يذهب إلى المريض،
 * والمختبرُ الذي يختاره المريضُ مختصٌّ فرد. الآن المنشأةُ `role = 'provider'` بنوعها، ولها نافذتُها `/provider`.
 */
const state = { user: { id: 'u1' } as { id: string } | null, role: 'provider' as string | null };

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: state.user } }) },
    from: () => {
      const q: any = { select: () => q, eq: () => q, single: () => Promise.resolve({ data: { role: state.role } }) };
      return q;
    },
  }),
}));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const e = new Error('NEXT_REDIRECT') as Error & { digest: string };
    e.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw e;
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), updateTag: jest.fn() }));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ allowed: true }) }));
jest.mock('@/lib/auth/request-helpers', () => ({
  ...jest.requireActual('@/lib/auth/request-helpers'),
  getClientIp: async () => '1.2.3.4',
}));

// عميلُ RLS للمدير في اعتماد الخدمة: كم صفّاً كتب التحديث
const writes = { rows: [] as unknown[], updates: [] as unknown[] };
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) },
    from: () => {
      const q: any = {
        select: () => q,
        eq: () => q,
        single: async () => ({ data: { role: 'admin' } }),
        update: (v: unknown) => {
          writes.updates.push(v);
          const u: any = { eq: () => u, select: async () => ({ data: writes.rows, error: null }) };
          return u;
        },
      };
      return q;
    },
  }),
  createAdminClient: () => ({}),
}));
jest.mock('@/lib/supabase/server-service', () => ({
  createServiceClient: () => ({ from: () => ({ insert: async () => ({ error: null }) }) }),
}));
jest.mock('@/lib/admin-audit', () => ({ logAdminAction: jest.fn(async () => {}) }));

const ROOT = process.cwd();
const code = (p: string) =>
  readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-placeholder-0000000000';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key-placeholder-00000000';

describe('🚪 كلُّ دورٍ في نافذته', () => {
  const { updateSession } = require('@/lib/supabase/middleware');
  const go = async (path: string, role: string) => {
    state.role = role;
    const r = new NextRequest(new URL(path, 'https://spir-medical.com'));
    r.cookies.set('sb-ref-auth-token', 'base64-x');
    const res: Response = await updateSession(r);
    const loc = res.headers.get('location');
    return loc ? new URL(loc).pathname : null;
  };

  it('🚨 حسابُ الخدمة لا يدخل تطبيقَي المريض والمختصّ — بقفزةٍ واحدة إلى /provider', async () => {
    expect(await go('/dashboard', 'provider')).toBe('/provider');
    expect(await go('/specialist/orders', 'provider')).toBe('/provider');
    expect(await go('/provider/lab-tests', 'provider')).toBeNull();
  });

  it('🚨 نافذةُ الخدمة للخدمة والمدير وحدهما', async () => {
    expect(await go('/provider', 'patient')).toBe('/dashboard');
    expect(await go('/provider', 'specialist')).toBe('/specialist');
    expect(await go('/provider', 'admin')).toBeNull();
  });
});

describe('📝 التسجيل: المختصُّ محلّلٌ أو ممرّض، والباقي خدمة', () => {
  const { registerProviderForm, registerSpecialistForm } = require('@/app/(auth)/register/actions');
  const form = (fields: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  };
  const provider = { providerType: 'lab', facilityName: 'مختبر النور', fullName: 'علي حسن', city: 'النجف', phone: '07801234567', acceptTerms: 'on' };

  it('🚨 نوعُ خدمةٍ غيرُ معروف يُرفض قبل أيّ حساب', async () => {
    await expect(registerProviderForm(form({ ...provider, providerType: 'specialist' }))).resolves.toEqual({ error: 'اختر نوعَ الخدمة' });
    await expect(registerProviderForm(form({ ...provider, facilityName: '' }))).resolves.toEqual({ error: 'اكتب اسمَ المنشأة' });
    await expect(registerProviderForm(form({ ...provider, city: '' }))).resolves.toEqual({ error: 'حدّد المدينة أو المحافظة' });
  });

  it('🚨 «طبيب» ليس اختصاصاً للمختصّ بعد الآن', async () => {
    const r = await registerSpecialistForm(form({ fullName: 'علي حسن', gender: 'male', phone: '07801234567', specialization: 'doctor', acceptTerms: 'on' }));
    expect(r?.error).toMatch(/تسجّل كخدمة/);
  });

  it('الحسابُ يُكتب بدوره ونوعه معاً (قيدُ users_provider_type_matches_role)', () => {
    const a = code('src/app/(auth)/register/actions.ts');
    expect(a).toMatch(/profileData\.provider_type = opts\.role === 'provider' \? opts\.provider\?\.type \?\? null : null/);
    expect(a).toMatch(/role: 'provider',[\s\S]{0,80}provider: \{ type: type as ProviderType, name, city, governorate \}/);
  });
});

describe('🛡️ الإدارةُ تعتمد — ولا «تمّ» بلا صفّ', () => {
  const { approveProvider, rejectProvider } = require('@/app/admin/providers/actions');

  it('🚨 تحديثٌ لم يطابق حسابَ خدمة ← فشلٌ صريح', async () => {
    writes.rows = [];
    expect(await approveProvider('x')).toMatchObject({ ok: false });
    writes.rows = [{ provider_type: 'lab' }];
    expect(await approveProvider('x')).toEqual({ ok: true, message: 'اعتُمد' });
    expect(writes.updates.at(-1)).toEqual({ approval_status: 'approved', rejection_reason: null });
  });

  it('الرفضُ يطلب سبباً', async () => {
    expect(await rejectProvider('x', '  ')).toEqual({ ok: false, message: 'اذكر سببَ الرفض' });
  });
});

describe('🗄️ 0059/0060', () => {
  const m = code('supabase/migrations/0060_providers.sql');

  it('🚨 النوعُ يلازم الدور، ولا يغيّره صاحبُ الحساب', () => {
    expect(code('supabase/migrations/0059_provider_role_enum.sql')).toMatch(/ALTER TYPE public\.user_role ADD VALUE IF NOT EXISTS 'provider'/);
    expect(m).toMatch(/CHECK \(\(role = 'provider'\) = \(provider_type IS NOT NULL\)\)/);
    expect(m).toMatch(/provider_type IN \('lab', 'pharmacy', 'clinic', 'hospital'\)/);
    expect(m).toMatch(/OR NEW\.provider_type IS NOT NULL/);
    expect(m).toMatch(/OR NEW\.provider_type IS DISTINCT FROM OLD\.provider_type/);
    expect(m).not.toMatch(/\bDROP\b/);
  });

  it('🚨 تحاليلُ المختبر لحساب المختبر', () => {
    expect(m).toMatch(/ALTER POLICY specialist_lab_tests_insert[\s\S]*u\.role = 'provider' AND u\.provider_type = 'lab'/);
    // 0061: المحلّلُ يسحب ولا يُحلّل — لا ذراعَ له بعد دمج نافذة الخدمة
    const m61 = code('supabase/migrations/0061_lab_tests_provider_only.sql');
    expect(m61).toMatch(/ALTER POLICY specialist_lab_tests_insert[\s\S]*u\.role = 'provider' AND u\.provider_type = 'lab'/);
    expect(m61).not.toMatch(/lab_analyst|role = 'specialist'/);
  });
});

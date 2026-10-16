/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

/**
 * 🔐 حمايةُ المسارات في الوسيط (`updateSession`) — اختبارُ سلوك.
 *
 * هذا الملفّ هو البوّابةُ الأولى لكلّ صفحةٍ محميّة، ولم يكن له اختبار (تغطيته 0٪). وقد رُقّي
 * @supabase/ssr تحته إلى 0.12، فالحارسُ هنا يقيس ما يجب أن يبقى ثابتاً:
 *   • الزائرُ بلا جلسة لا يُكلّف نداءً شبكيّاً، ويُحوَّل عن المحميّ (سقطةُ 504 السابقة).
 *   • كلُّ دورٍ إلى واجهته، والإدارةُ للمدير وحده.
 *   • انقضاءُ المهلة يفشل بأمانٍ على المحميّ، وبانفتاحٍ على العامّ.
 */

const state = {
  user: null as { id: string } | null,
  role: null as string | null,
  getUserCalls: 0,
  hangAuth: false,
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: () => {
        state.getUserCalls++;
        if (state.hangAuth) return new Promise(() => {});
        return Promise.resolve({ data: { user: state.user } });
      },
    },
    from: () => {
      const q: any = { select: () => q, eq: () => q, single: () => Promise.resolve({ data: { role: state.role } }) };
      return q;
    },
  }),
}));

const { updateSession } = require('@/lib/supabase/middleware');

const req = (path: string, withCookie = true) => {
  const r = new NextRequest(new URL(path, 'https://spir-medical.com'));
  if (withCookie) r.cookies.set('sb-ref-auth-token', 'base64-x');
  return r;
};
const target = (res: Response) => {
  const loc = res.headers.get('location');
  return loc ? new URL(loc).pathname + new URL(loc).search : null;
};

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-000000000000000000';
});
beforeEach(() => {
  state.user = null;
  state.role = null;
  state.getUserCalls = 0;
  state.hangAuth = false;
});

describe('الزائرُ بلا جلسة', () => {
  it('🚨 الصفحةُ العامّة تُخدَم بلا أيّ نداءٍ شبكيّ', async () => {
    const res = await updateSession(req('/', false));
    expect(target(res)).toBeNull();
    expect(state.getUserCalls).toBe(0);
  });

  it('🚨 المحميّ ← /login مع مسار العودة', async () => {
    expect(target(await updateSession(req('/appointments/new', false)))).toBe('/login?redirect=%2Fappointments%2Fnew');
  });

  it('🚨 الإدارة ← /admin-login', async () => {
    expect(target(await updateSession(req('/admin/patients', false)))).toBe('/admin-login');
  });
});

describe('الأدوار', () => {
  it('🚨 كعكةٌ بلا مستخدمٍ صالح على محميّ ← /login', async () => {
    expect(target(await updateSession(req('/dashboard')))).toBe('/login?redirect=%2Fdashboard');
  });

  it('🚨 مريضٌ على /admin ← /dashboard', async () => {
    state.user = { id: 'u1' };
    state.role = 'patient';
    expect(target(await updateSession(req('/admin')))).toBe('/dashboard');
  });

  it('🚨 مريضٌ على /specialist ← /dashboard', async () => {
    state.user = { id: 'u1' };
    state.role = 'patient';
    expect(target(await updateSession(req('/specialist/orders')))).toBe('/dashboard');
  });

  it('المختصّ على /dashboard ← واجهته', async () => {
    state.user = { id: 'u1' };
    state.role = 'specialist';
    expect(target(await updateSession(req('/dashboard')))).toBe('/specialist');
  });

  it('المديرُ يدخل الإدارة، والمريضُ لوحته', async () => {
    state.user = { id: 'u1' };
    state.role = 'admin';
    expect(target(await updateSession(req('/admin/orders')))).toBeNull();
    state.role = 'patient';
    expect(target(await updateSession(req('/dashboard')))).toBeNull();
  });
});

describe('انقضاءُ المهلة', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const settle = async (p: Promise<Response>) => {
    await jest.advanceTimersByTimeAsync(5000);
    return p;
  };

  it('🚨 يفشل بأمانٍ على المحميّ (لا 504 ولا دخول)', async () => {
    state.hangAuth = true;
    expect(target(await settle(updateSession(req('/dashboard'))))).toBe('/login');
  });

  it('ويفشل بانفتاحٍ على العامّ', async () => {
    state.hangAuth = true;
    expect(target(await settle(updateSession(req('/about'))))).toBeNull();
  });
});

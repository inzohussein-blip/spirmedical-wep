/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🔑 ما بعد رمز الدخول (0049): مَن نسي رمزه، ومَن يسجّل، وما يُوعَد به في الدفع.
 *
 *   ① «نسيت الرمز» يمرّ برمز واتساب — وتوكن Meta مرفوض. فالإدارةُ تُصدر رمزاً مؤقّتاً،
 *      لحسابٍ هاتفيّ وحده (حسابُ البريد — ومنه الإدارة — يدخل بكلمة سرّه).
 *   ② `registerPatient` بالهاتف كان بلا واجهة: المريضُ لا يسجّل إلّا بالبريد.
 *   ③ الشروطُ وعدت بزين كاش وآسيا حوالة والبطاقات، و`payments` فارغٌ ولا بوّابةَ في الكود.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

const state = {
  role: 'admin' as string | null,
  authEmail: {} as Record<string, string>,
  setPins: [] as { userId: string; pin: string }[],
  logged: [] as unknown[],
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.role ? { id: 'admin-1' } : null } }) },
    from: () => {
      const api: any = { select: () => api, eq: () => api, single: async () => ({ data: { role: state.role } }) };
      return api;
    },
  }),
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: async (id: string) =>
          state.authEmail[id] ? { data: { user: { id, email: state.authEmail[id] } }, error: null } : { data: { user: null }, error: { message: 'nf' } },
      },
    },
  }),
}));
jest.mock('@/lib/admin-audit', () => ({ logAdminAction: async (a: unknown) => { state.logged.push(a); } }));
jest.mock('@/lib/auth/login-pin', () => {
  const actual = jest.requireActual('@/lib/auth/login-pin');
  return { ...actual, setLoginPin: async (userId: string, pin: string) => { state.setPins.push({ userId, pin }); return true; } };
});

beforeEach(() => {
  state.role = 'admin';
  state.authEmail = { p1: '9647701112233@phone.spirmedical.local', e1: 'owner@gmail.com' };
  state.setPins = [];
  state.logged = [];
});

describe('① الرمزُ المؤقّت', () => {
  const { generateTemporaryPin, loginPinProblem } = jest.requireActual('@/lib/auth/login-pin');

  it('🚨 لا يُعطي رمزاً ترفضه قاعدةُ الرموز — يتخطّى الضعيف', () => {
    const seq = [111111, 123456, 654321, 42];
    const pin = generateTemporaryPin(() => seq.shift()!);
    expect(pin).toBe('000042');
    expect(loginPinProblem(pin)).toBeNull();
  });

  it('عشوائيٌّ تشفيريّاً افتراضيّاً، وكلُّ ناتجٍ صالح', () => {
    const pins = new Set(Array.from({ length: 50 }, () => generateTemporaryPin()));
    pins.forEach((p) => expect(loginPinProblem(p)).toBeNull());
    expect(pins.size).toBeGreaterThan(40);
    expect(read('src/lib/auth/login-pin.ts')).toMatch(/import \{ randomInt \} from 'crypto'/);
  });
});

describe('① إعادةُ الضبط من الإدارة', () => {
  const load = () => require('@/app/admin/_actions/login-pin').adminResetLoginPin;

  it('🚨 غيرُ المدير لا يضبط رمزاً', async () => {
    state.role = 'patient';
    expect((await load()('p1')).ok).toBe(false);
    state.role = null;
    expect((await load()('p1')).ok).toBe(false);
    expect(state.setPins).toHaveLength(0);
  });

  it('🚨 حسابُ البريد لا يُمسّ', async () => {
    const res = await load()('e1');
    expect(res.ok).toBe(false);
    expect(state.setPins).toHaveLength(0);
  });

  it('الحسابُ الهاتفيّ: يُحفظ الرمزُ نفسُه الذي يُعاد، ويُسجَّل الفعل', async () => {
    const res = await load()('p1');
    expect(res.ok).toBe(true);
    expect(state.setPins).toEqual([{ userId: 'p1', pin: res.pin }]);
    expect(state.logged).toEqual([expect.objectContaining({ action_type: 'reset_login_pin', target_id: 'p1' })]);
    expect(read('src/lib/admin-types.ts')).toMatch(/'reset_login_pin':/);
  });

  it.each(['src/app/admin/patients/[id]/page.tsx', 'src/app/admin/specialists/[id]/page.tsx'])(
    'الزرّ في %s',
    (p) => expect(read(p)).toMatch(/<ResetLoginPinButton userId=\{\w+\.id\} \/>/),
  );
});

describe('② تسجيلُ المريض بالرقم والرمز', () => {
  const page = read('src/app/(auth)/register/patient/page.tsx');

  it('🚨 النموذجُ الافتراضيّ يُرسل إلى registerPatient بلا واتساب', () => {
    expect(page).toMatch(/<form action=\{registerPatient\}/);
    expect(page).toMatch(/name="action" value="skip"/);
    for (const f of ['fullName', 'gender', 'phone', 'acceptTerms']) expect(page).toMatch(new RegExp(`name="${f}"`));
  });

  it('🚨 الرمزُ في الحقل الذي يقرؤه guardPinRegistration (password)، ستّةُ أرقام', () => {
    expect(read('src/app/(auth)/register/actions.ts')).toMatch(/formData\.get\('password'\)/);
    expect(page).toMatch(/name="password"[\s\S]{0,200}autoComplete="new-password"[\s\S]{0,200}pattern="\[0-9\]\{6\}"/);
  });

  it('البريدُ يبقى بديلاً', () => {
    expect(page).toMatch(/method === 'email'\) return <PatientEmailRegister \/>/);
    expect(page).toMatch(/href="\/register\/patient\?method=email"/);
  });
});

describe('③ الدفع كما هو', () => {
  it('🚨 لا وعدَ بوسيلة دفعٍ غير مُنفَّذة', () => {
    const terms = read('src/app/(marketing)/legal/terms/page.tsx');
    expect(terms).not.toMatch(/ZainCash|AsiaHawala|زين كاش|آسيا حوالة|فيزا|ماستر/);
    expect(terms).toMatch(/نقداً/);
  });
});

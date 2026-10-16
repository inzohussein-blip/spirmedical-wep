/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🔑 التسجيلُ والدخول بلا رمز واتساب — آمناً (0049)
 *
 * قِيس على الإنتاج في 16 تشرين الأول:
 *   ① `/login/phone` يُدخل أيَّ حسابٍ هاتفيّ **برقمه وحده** (كلمةُ السرّ مشتقّةٌ من الرقم).
 *   ② وينشئ حساباً لأيّ رقمٍ مجهول.
 *   ③ ويكتب كلمةَ السرّ المشتقّة فوق كلمة سرّ حساب البريد — ومنه حسابُ الإدارة — إن
 *      عُرف رقمُه، فيُقفل صاحبُه خارج حسابه.
 *   ④ تسجيلُ المختصّ يطلب «رمز دخول (PIN)» ويُهمله، والتسجيلُ برقمٍ قائم يفتح الحساب.
 *
 * المالك أراد «التسجيل بدون OTP». فالعاملُ الثاني رمزُ دخولٍ يختاره صاحبُ الحساب.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

/* ── قاعدة بيانات صغيرة في الذاكرة لما يلمسه المنطق ── */
interface PinRow { user_id: string; pin_hash: string; failed_attempts: number; locked_until: string | null }
const db = {
  users: [] as { id: string; role: string; phone: string }[],
  authEmail: {} as Record<string, string>,
  pins: [] as PinRow[],
  passwordUpdates: [] as { id: string; password: string }[],
  signIns: [] as { email: string; password: string }[],
  authPasswords: {} as Record<string, string>, // email → password
  createUserCalls: 0,
};

function adminClient() {
  return {
    from(table: string) {
      const f: Record<string, unknown> = {};
      let op: 'select' | 'update' | 'upsert' = 'select';
      let payload: Record<string, unknown> = {};
      const rows = () =>
        table === 'users'
          ? db.users.filter((u) => Object.entries(f).every(([k, v]) => (u as never)[k] === v))
          : db.pins.filter((p) => Object.entries(f).every(([k, v]) => (p as never)[k] === v));
      const api: any = {
        select: () => api,
        eq(c: string, v: unknown) { f[c] = v; return api; },
        update(p: Record<string, unknown>) { op = 'update'; payload = p; return api; },
        upsert(p: PinRow) {
          db.pins = db.pins.filter((r) => r.user_id !== p.user_id).concat([{ ...p }]);
          return Promise.resolve({ error: null });
        },
        maybeSingle: () => Promise.resolve({ data: rows()[0] ?? null, error: null }),
        then(res: (v: unknown) => unknown) {
          if (op === 'update') rows().forEach((r) => Object.assign(r, payload));
          return Promise.resolve(res({ data: null, error: null }));
        },
      };
      return api;
    },
    auth: {
      admin: {
        getUserById: async (id: string) => ({ data: { user: { id, email: db.authEmail[id] } } }),
        updateUserById: async (id: string, { password }: { password: string }) => {
          db.passwordUpdates.push({ id, password });
          db.authPasswords[db.authEmail[id]] = password;
          return { data: {}, error: null };
        },
        createUser: async () => { db.createUserCalls++; return { data: null, error: null }; },
      },
    },
  };
}

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => adminClient(),
  createClient: () => ({
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        db.signIns.push({ email, password });
        return db.authPasswords[email] === password
          ? { data: { user: { id: 'x' } }, error: null }
          : { data: { user: null }, error: { message: 'Invalid login credentials' } };
      },
    },
  }),
}));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ allowed: true, retryAfterSeconds: 0 }) }));
jest.mock('@/lib/audit', () => ({ logAuditEvent: async () => undefined }));
jest.mock('@/lib/auth/phone-credentials', () => ({
  derivePhonePassword: (p: string) => `derived:${p}`,
  phoneToEmail: (p: string) => `${p.replace(/\D/g, '')}@phone.spirmedical.local`,
}));

const PHONE = '+9647701234567';
const PHONE_EMAIL = '9647701234567@phone.spirmedical.local';

beforeEach(() => {
  db.users = [];
  db.authEmail = {};
  db.pins = [];
  db.passwordUpdates = [];
  db.signIns = [];
  db.authPasswords = {};
  db.createUserCalls = 0;
});

describe('loginPinProblem', () => {
  const { loginPinProblem } = require('@/lib/auth/login-pin');
  it.each(['12345', '1234567', 'abcdef', '', '000000', '777777', '123456', '987654'])('🚨 يرفض «%s»', (pin) => {
    expect(loginPinProblem(pin)).not.toBeNull();
  });
  it.each(['482915', '135790', '102938'])('يقبل «%s»', (pin) => {
    expect(loginPinProblem(pin)).toBeNull();
  });
});

describe('checkLoginPin — العدّ والقفل', () => {
  const { setLoginPin, checkLoginPin, MAX_PIN_ATTEMPTS } = require('@/lib/auth/login-pin');

  it('🚨 الصحيحُ ok، والخاطئُ يُنقص المتبقّي، والخامسُ يقفل حتى مع الرمز الصحيح', async () => {
    db.users.push({ id: 'u1', role: 'patient', phone: PHONE });
    await setLoginPin('u1', '482915');
    expect(db.pins[0].pin_hash).not.toContain('482915');

    expect(await checkLoginPin('u1', '482915')).toEqual({ status: 'ok' });
    for (let i = 1; i < MAX_PIN_ATTEMPTS; i++) {
      expect(await checkLoginPin('u1', '111222')).toEqual({ status: 'wrong', remaining: MAX_PIN_ATTEMPTS - i });
    }
    expect((await checkLoginPin('u1', '111222')).status).toBe('locked');
    expect((await checkLoginPin('u1', '482915')).status).toBe('locked');

    // بعد انقضاء القفل يعود الصحيحُ مقبولاً
    const later = new Date(Date.now() + 16 * 60_000);
    expect(await checkLoginPin('u1', '482915', later)).toEqual({ status: 'ok' });
  });

  it('حسابٌ بلا رمز → none', async () => {
    expect(await checkLoginPin('nobody', '482915')).toEqual({ status: 'none' });
  });
});

describe('phonePinLogin', () => {
  const { phonePinLogin } = require('@/lib/auth/phone-pin-login');
  const { setLoginPin } = require('@/lib/auth/login-pin');

  function phoneAccount(pin?: string) {
    db.users.push({ id: 'p1', role: 'patient', phone: PHONE });
    db.authEmail.p1 = PHONE_EMAIL;
    db.authPasswords[PHONE_EMAIL] = `derived:${PHONE}`;
    return pin ? setLoginPin('p1', pin) : Promise.resolve();
  }

  it('🚨 ① الرقمُ وحده لا يُدخل: رمزٌ خاطئ يُرفض بلا تسجيل دخول', async () => {
    await phoneAccount('482915');
    const res = await phonePinLogin(PHONE, '111222', '1.1.1.1');
    expect(res.ok).toBe(false);
    expect(db.signIns).toHaveLength(0);
  });

  it('الرمزُ الصحيح يُدخل بالبريد الاصطناعيّ للحساب', async () => {
    await phoneAccount('482915');
    const res = await phonePinLogin(PHONE, '482915', '1.1.1.1');
    expect(res).toMatchObject({ ok: true, role: 'patient', claimed: false });
    expect(db.signIns[0]).toEqual({ email: PHONE_EMAIL, password: `derived:${PHONE}` });
  });

  it('🚨 ② رقمٌ مجهول لا يُنشئ حساباً', async () => {
    const res = await phonePinLogin(PHONE, '482915', '1.1.1.1');
    expect(res.ok).toBe(false);
    expect(db.createUserCalls).toBe(0);
    expect(db.signIns).toHaveLength(0);
  });

  it('🚨 ③ حسابُ البريد (الإدارة) لا تُمسّ كلمةُ سرّه', async () => {
    db.users.push({ id: 'admin1', role: 'admin', phone: PHONE });
    db.authEmail.admin1 = 'owner@gmail.com';
    db.authPasswords['owner@gmail.com'] = 'owner-secret';
    const res = await phonePinLogin(PHONE, '482915', '1.1.1.1');
    expect(res.ok).toBe(false);
    expect(db.passwordUpdates).toHaveLength(0);
    expect(db.authPasswords['owner@gmail.com']).toBe('owner-secret');
  });

  it('🚨 حسابٌ قديم بلا رمز: الرمزُ الأوّل يصير رمزَه، ثمّ يُطلب', async () => {
    await phoneAccount();
    expect(await phonePinLogin(PHONE, '482915', '1.1.1.1')).toMatchObject({ ok: true, claimed: true });
    expect(db.pins).toHaveLength(1);
    expect((await phonePinLogin(PHONE, '135790', '1.1.1.1')).ok).toBe(false);
  });

  it('حسابٌ قديم ورمزٌ سهل → يُرفض ولا يُحفظ', async () => {
    await phoneAccount();
    expect((await phonePinLogin(PHONE, '123456', '1.1.1.1')).ok).toBe(false);
    expect(db.pins).toHaveLength(0);
  });
});

describe('④ التسجيل والواجهة', () => {
  const reg = read('src/app/(auth)/register/actions.ts');

  it.each(['registerPatient', 'registerSpecialist'])('🚨 %s يفحص الرمزَ والرقمَ القائم قبل إنشاء الحساب ثمّ يحفظ الرمز', (fn) => {
    const start = reg.indexOf(`export async function ${fn}(`);
    const body = reg.slice(start, reg.indexOf('\nexport async function ', start + 10));
    const guard = body.indexOf('guardPinRegistration(');
    const create = body.indexOf('createOrGetAccount(');
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(create);
    expect(body.slice(create)).toMatch(/if \(pin\) await setLoginPin\(userId, pin\)/);
  });

  it('🚨 الحارسُ يرفض الرمزَ الضعيف والرقمَ المسجَّل في مسار «بلا رمز واتساب»', () => {
    const g = reg.slice(reg.indexOf('async function guardPinRegistration('));
    expect(g).toMatch(/if \(!willUseOtp\(action\)\) \{[\s\S]*?if \(problem\) redirect\(/);
    expect(g).toMatch(/\.eq\('phone', phone\)[\s\S]*?if \(existing\)/);
  });

  it('🚨 مسارُ الدخول بلا واتساب يمرّ بـ phonePinLogin ولا يُنشئ حساباً', () => {
    const login = read('src/app/(auth)/login/actions.ts');
    const fn = login.slice(login.indexOf('async function loginWithoutOtp('), login.indexOf('// التحقق من OTP'));
    expect(fn).toMatch(/phonePinLogin\(phone, pin, ip\)/);
    expect(fn).not.toMatch(/createUser|updateUserById|signInWithPassword/);
  });

  it('🚨 صفحةُ الدخول بالهاتف تطلب الرمز، وصفحةُ «نسيت» ترسل رمز واتساب صراحةً', () => {
    expect(read('src/app/(auth)/login/phone/page.tsx')).toMatch(/name="pin"/);
    const forgot = read('src/app/(auth)/forgot/page.tsx');
    expect(forgot).toMatch(/name="action" value="otp"/);
    expect(forgot).toMatch(/name="redirect" value="\/login-pin"/);
  });

  it('🚨 0049: الجدول للخادم وحده', () => {
    const sql = read('supabase/migrations/0049_login_pins.sql');
    expect(sql).toMatch(/REVOKE ALL ON public\.auth_login_pins FROM PUBLIC, anon, authenticated;/);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).not.toMatch(/CREATE POLICY/);
  });
});

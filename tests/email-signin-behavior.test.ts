/**
 * @jest-environment node
 */

/**
 * 🔑 `signInWithEmail` — مدخلُ «/login» للبريد، وللرقم + رمز الدخول.
 *
 * كان بلا اختبار (0٪) وهو يقرّر: من يدخل، وبأيّ رسالةٍ يُردّ، ومتى يُحوَّل إلى `phonePinLogin`.
 */

const state = {
  signInError: null as { message: string } | null,
  profile: { role: 'patient', email_verified: true } as Record<string, unknown>,
  emailConfigured: false,
  pinCalls: [] as string[][],
  pinResult: { ok: true, role: 'patient' } as { ok: boolean; role?: string; error?: string },
  sentVerification: 0,
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: async () => ({ error: state.signInError }),
      getUser: async () => ({ data: { user: { id: 'u1' } } }),
    },
    from: () => {
      const q: any = { select: () => q, eq: () => q, single: async () => ({ data: state.profile }) };
      return q;
    },
  }),
}));
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ insert: async () => { state.sentVerification++; return { error: null }; } }) }),
}));
jest.mock('@/lib/email/send', () => ({
  isEmailConfigured: () => state.emailConfigured,
  sendEmail: async () => { state.sentVerification++; return { ok: true }; },
}));
jest.mock('@/lib/auth/phone-pin-login', () => ({
  phonePinLogin: async (...args: string[]) => { state.pinCalls.push(args); return state.pinResult; },
}));
jest.mock('@/lib/auth/request-helpers', () => ({ getClientIp: () => '1.2.3.4' }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

const { signInWithEmail } = require('@/lib/auth/email-auth');

beforeEach(() => {
  state.signInError = null;
  state.profile = { role: 'patient', email_verified: true };
  state.emailConfigured = false;
  state.pinCalls = [];
  state.pinResult = { ok: true, role: 'patient' };
  state.sentVerification = 0;
});

it('دخولٌ صحيح يُعيد الدورَ لتوجيه صاحبه إلى بيته', async () => {
  state.profile = { role: 'specialist', email_verified: true };
  expect(await signInWithEmail('a@b.com', 'secret-pass')).toEqual({ success: true, role: 'specialist' });
});

it('🚨 كلمةُ سرٍّ خاطئة للبريد ← رسالةٌ عربيّة، ولا مسارَ PIN', async () => {
  state.signInError = { message: 'Invalid login credentials' };
  expect(await signInWithEmail('a@b.com', '123456')).toEqual({ success: false, error: 'البريد أو كلمة المرور خاطئة' });
  expect(state.pinCalls).toHaveLength(0);
});

it('🚨 رقمُ هاتف + ستّة أرقام ← phonePinLogin بالرقم المُطبَّع', async () => {
  state.signInError = { message: 'Invalid login credentials' };
  state.pinResult = { ok: true, role: 'patient' };
  expect(await signInWithEmail('07701234567', '582913')).toEqual({ success: true, role: 'patient' });
  expect(state.pinCalls).toHaveLength(1);
  expect(state.pinCalls[0][1]).toBe('582913');
  expect(state.pinCalls[0][0]).toMatch(/7701234567$/);
});

it('🚨 رمزٌ خاطئ ← خطأُ phonePinLogin نفسُه (لا دخول)', async () => {
  state.signInError = { message: 'Invalid login credentials' };
  state.pinResult = { ok: false, error: 'رمز الدخول خاطئ — بقيت 4 محاولات' };
  expect(await signInWithEmail('07701234567', '000001')).toEqual({ success: false, error: 'رمز الدخول خاطئ — بقيت 4 محاولات' });
});

it('رقمُ هاتف بكلمة سرٍّ ليست ستّة أرقام ← رسالةُ الهاتف', async () => {
  state.signInError = { message: 'Invalid login credentials' };
  expect(await signInWithEmail('07701234567', 'temp-pass')).toEqual({ success: false, error: 'رقم الهاتف أو رمز الدخول خاطئ' });
  expect(state.pinCalls).toHaveLength(0);
});

it('🚨 بريدٌ غيرُ مؤكَّد والبريدُ مُهيَّأ ← يُمنع ويُرسَل رابطُ تفعيل', async () => {
  state.profile = { role: 'patient', email_verified: false };
  state.emailConfigured = true;
  const r = await signInWithEmail('a@b.com', 'secret-pass');
  expect(r.success).toBe(false);
  expect(r.error).toMatch(/تأكيد بريدك/);
});

it('بريدٌ غيرُ مؤكَّد والبريدُ غيرُ مُهيَّأ ← لا طريقَ مسدوداً', async () => {
  state.profile = { role: 'patient', email_verified: false };
  state.emailConfigured = false;
  expect((await signInWithEmail('a@b.com', 'secret-pass')).success).toBe(true);
});

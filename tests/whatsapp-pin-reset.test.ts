/**
 * @jest-environment node
 */

/**
 * 🔑 استعادةُ رمز الدخول عبر واتساب (`/login/reset-pin`) — وهي أيضاً «رابطُ التفعيل» من الإدارة.
 *
 * ما يحرسه: لا بدء والتحقّقُ معطّل؛ حساباتُ البريد (ومنها الإدارة) لا تُمسّ؛ الرمزُ الجديد
 * يُفحص قبل استهلاك التحقّق؛ والتحقّقُ يُستهلك مرّةً واحدة ثمّ يُضبط الرمزُ ويُدخَل.
 */

const state = {
  available: true,
  profile: { id: 'u1' } as { id: string } | null,
  authEmail: '9647701234567@phone.spirmedical.local',
  started: [] as Record<string, unknown>[],
  consumed: { phone: '+9647701234567', userId: 'u1' } as { phone: string; userId: string | null } | null,
  consumeCalls: 0,
  pins: [] as [string, string][],
  logins: [] as string[][],
};

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: () => {
      const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: state.profile }) };
      return q;
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: state.authEmail } } }) } },
  }),
}));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ allowed: true }) }));
jest.mock('@/lib/auth/request-helpers', () => ({ getClientIp: async () => '1.2.3.4' }));
jest.mock('@/lib/audit', () => ({ logAuditEvent: async () => {} }));
jest.mock('@/lib/auth/login-pin', () => ({
  ...jest.requireActual('@/lib/auth/login-pin'),
  setLoginPin: async (id: string, pin: string) => { state.pins.push([id, pin]); return true; },
}));
jest.mock('@/lib/auth/phone-pin-login', () => ({
  phonePinLogin: async (phone: string, pin: string) => { state.logins.push([phone, pin]); return { ok: true, role: 'specialist' }; },
}));
jest.mock('@/lib/whatsapp/inbound-verify', () => ({
  isWaVerifyAvailable: async () => state.available,
  getWaVerifyConfig: () => ({ number: '9647801112222' }),
  startVerification: async (o: Record<string, unknown>) => {
    state.started.push(o);
    return { ok: true, id: 'v1', code: '482913', link: 'https://wa.me/9647801112222?text=x', expiresAt: 'z' };
  },
  consumeVerification: async () => { state.consumeCalls++; return state.consumed; },
}));

const { startPinReset, completePinReset } = require('@/app/(auth)/login/reset-pin/actions');

beforeEach(() => {
  state.available = true;
  state.profile = { id: 'u1' };
  state.authEmail = '9647701234567@phone.spirmedical.local';
  state.started = [];
  state.consumed = { phone: '+9647701234567', userId: 'u1' };
  state.consumeCalls = 0;
  state.pins = [];
  state.logins = [];
});

describe('بدءُ الاستعادة', () => {
  it('🚨 التحقّقُ معطّل ← لا رمز', async () => {
    state.available = false;
    expect((await startPinReset('07701234567')).ok).toBe(false);
    expect(state.started).toEqual([]);
  });

  it('🚨 حسابُ بريد (ومنها الإدارة) ← لا يُمسّ', async () => {
    state.authEmail = 'owner@example.com';
    const r = await startPinReset('07701234567');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/البريد/);
    expect(state.started).toEqual([]);
  });

  it('رقمٌ بلا حساب ← رسالة، لا رمز', async () => {
    state.profile = null;
    expect((await startPinReset('07701234567')).error).toMatch(/لا يوجد/);
  });

  it('حسابٌ هاتفيّ ← رمزٌ مربوطٌ بصاحبه ورقمِه الصحيح', async () => {
    const r = await startPinReset('0770 123 4567');
    expect(r).toMatchObject({ ok: true, id: 'v1', number: '9647801112222' });
    expect(state.started[0]).toMatchObject({ phone: '+9647701234567', purpose: 'reset_pin', userId: 'u1' });
  });
});

describe('إكمالُ الاستعادة', () => {
  it('🚨 رمزٌ ضعيف أو غيرُ متطابق ← لا يُستهلك التحقّق', async () => {
    expect((await completePinReset('v1', '123456', '123456')).ok).toBe(false);
    expect((await completePinReset('v1', '582913', '582914')).ok).toBe(false);
    expect(state.consumeCalls).toBe(0);
  });

  it('🚨 تحقّقٌ غيرُ مُثبَت أو مستهلَك ← لا رمزَ يُضبط', async () => {
    state.consumed = null;
    expect((await completePinReset('v1', '582913', '582913')).ok).toBe(false);
    expect(state.pins).toEqual([]);
  });

  it('🚨 مُثبَت ← يُضبط الرمزُ لصاحب الرقم ويُدخَل إلى بيته', async () => {
    expect(await completePinReset('v1', '582913', '582913')).toEqual({ ok: true, redirectTo: '/specialist' });
    expect(state.pins).toEqual([['u1', '582913']]);
    expect(state.logins).toEqual([['+9647701234567', '582913']]);
  });
});

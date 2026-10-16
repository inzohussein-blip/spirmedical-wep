/**
 * @jest-environment node
 */

/**
 * 👤 إنشاءُ الحساب من الإدارة + استعادةُ الرمز عبر واتساب.
 *
 * ① كان كلُّ إنشاءٍ يفشل: مُشغِّلُ `handle_new_user` يُدرج صفَّ `users` لحظةَ إنشاء حساب الدخول،
 *   والمسارُ يُدرجه ثانيةً بـinsert ← مفتاحٌ مكرَّر ← يحذف حسابَ الدخول. (قِيس على الإنتاج.)
 * ② حسابُ الهاتف بلا رمز دخول: أوّلُ من يكتب الرقمَ يمتلكه. الآن رمزٌ مؤقّتٌ فوراً.
 * ③ بريدٌ اختياريّ للمختصّ كان يصير بريدَ الدخول فيرفض «الرقم + الرمز» الحساب.
 * ④ الاستعادةُ عبر واتساب: تستهلك تحقّقاً مُثبَتاً مرّةً، ولا تمسّ حساباتِ البريد.
 */

const state = {
  caller: { id: 'admin-1', role: 'admin' } as { id: string; role: string } | null,
  users: [] as Record<string, unknown>[],
  createUserArgs: [] as Record<string, any>[],
  deleted: [] as string[],
  upserts: [] as { row: Record<string, unknown>; opts: unknown }[],
  pins: [] as [string, string][],
  waAvailable: false,
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.caller ? { id: state.caller.id } : null } }) },
    from: () => {
      const q: any = { select: () => q, eq: () => q, single: async () => ({ data: state.caller }) };
      return q;
    },
  }),
  createAdminClient: () => ({}),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      admin: {
        createUser: async (args: Record<string, any>) => {
          state.createUserArgs.push(args);
          const id = `new-${state.createUserArgs.length}`;
          // مُشغِّلُ handle_new_user: يُدرج الصفَّ فوراً كما في الإنتاج
          state.users.push({ id, phone: '+temp_' + id, role: args.user_metadata?.role ?? 'patient' });
          return { data: { user: { id } }, error: null };
        },
        deleteUser: async (id: string) => {
          state.deleted.push(id);
          return { error: null };
        },
      },
    },
    from: () => {
      const f: Record<string, unknown> = {};
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { f[c] = v; return q; },
        maybeSingle: async () => ({ data: state.users.find((u) => u.phone === f.phone) ?? null }),
        insert: async (row: Record<string, unknown>) =>
          state.users.some((u) => u.id === row.id)
            ? { error: { code: '23505', message: 'duplicate key value violates unique constraint "users_pkey"' } }
            : (state.users.push(row), { error: null }),
        upsert: async (row: Record<string, unknown>, opts: unknown) => {
          state.upserts.push({ row, opts });
          const i = state.users.findIndex((u) => u.id === row.id);
          if (i >= 0) state.users[i] = { ...state.users[i], ...row };
          else state.users.push(row);
          return { error: null };
        },
      };
      return q;
    },
  }),
}));

jest.mock('@/lib/auth/login-pin', () => ({
  ...jest.requireActual('@/lib/auth/login-pin'),
  generateTemporaryPin: () => '482913',
  setLoginPin: async (id: string, pin: string) => { state.pins.push([id, pin]); return true; },
}));
jest.mock('@/lib/whatsapp/inbound-verify', () => ({
  ...jest.requireActual('@/lib/whatsapp/inbound-verify'),
  isWaVerifyAvailable: async () => state.waAvailable,
}));
jest.mock('@/lib/service-waitlist', () => ({ notifyServiceWaitlist: async () => {} }));
jest.mock('@/lib/audit', () => ({ logAuditEvent: async () => {} }));
jest.mock('@/lib/logger', () => ({ logger: { error: () => {}, warn: () => {}, info: () => {} } }));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key-placeholder-00000000';
process.env.ENCRYPTION_KEY = '0'.repeat(64);
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.spir-medical.com';

const { POST } = require('@/app/api/admin/users/create/route');
const { derivePhonePassword, phoneToEmail } = require('@/lib/auth/phone-credentials');

const create = async (body: Record<string, unknown>) => {
  const res = await POST(new Request('https://x/api/admin/users/create', { method: 'POST', body: JSON.stringify(body) }));
  return { status: res.status, data: await res.json() };
};

const specialist = { role: 'specialist', phone: '07701234567', full_name: 'علي حسين', specialist_type: 'nurse' };

beforeEach(() => {
  state.caller = { id: 'admin-1', role: 'admin' };
  state.users = [];
  state.createUserArgs = [];
  state.deleted = [];
  state.upserts = [];
  state.pins = [];
  state.waAvailable = false;
});

describe('① الإنشاءُ ينجح رغم مُشغِّل handle_new_user', () => {
  it('🚨 مختصّ ← نجاح، والملفُّ بـupsert على المعرّف، ولا حذفَ لحساب الدخول', async () => {
    const { status, data } = await create(specialist);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(state.deleted).toEqual([]);
    expect(state.upserts[0].opts).toEqual({ onConflict: 'id' });
    expect(state.users.find((u) => u.id === data.user_id)).toMatchObject({
      phone: '+9647701234567', role: 'specialist', specialist_type: 'nurse', approval_status: 'approved',
    });
  });

  it('رقمٌ مسجَّل ← 409 ومعرّفُ الحساب القائم', async () => {
    state.users.push({ id: 'old', phone: '+9647701234567', role: 'patient' });
    const { status, data } = await create(specialist);
    expect(status).toBe(409);
    expect(data).toMatchObject({ existing_user_id: 'old', existing_role: 'patient' });
    expect(data.error).toMatch(/مريض/);
  });

  it('رقمٌ غير صالح أو تخصّصٌ مجهول ← 400 بالعربيّة', async () => {
    expect((await create({ ...specialist, phone: '123' })).status).toBe(400);
    const bad = await create({ ...specialist, specialist_type: 'astronaut' });
    expect(bad.status).toBe(400);
    expect(bad.data.error).toMatch(/تخصّص/);
  });
});

describe('② حسابُ الهاتف يدخل بالرقم + رمزٍ مؤقّت (لا يمتلكه أوّلُ كاتبٍ للرقم)', () => {
  it('🚨 بريدٌ اصطناعيّ وكلمةُ سرٍّ مشتقّة — ما يتوقّعه دخولُ الرقم + الرمز', async () => {
    await create(specialist);
    const args = state.createUserArgs[0];
    expect(args.email).toBe(phoneToEmail('+9647701234567'));
    expect(args.password).toBe(derivePhonePassword('+9647701234567'));
    expect(args.user_metadata.role).toBe('specialist');
  });

  it('🚨 رمزُ دخولٍ مؤقّت يُضبط فوراً ويُعاد مرّةً، ولا كلمةَ سرّ', async () => {
    const { data } = await create(specialist);
    expect(state.pins).toEqual([[data.user_id, '482913']]);
    expect(data).toMatchObject({ login_method: 'phone_pin', temp_pin: '482913', login_url: 'https://www.spir-medical.com/login/phone' });
    expect(data.temp_password).toBeUndefined();
  });

  it('🚨 بريدٌ اختياريّ يُحفظ في الملفّ ولا يصير بريدَ الدخول', async () => {
    await create({ ...specialist, email: 'Ali@Example.com' });
    expect(state.createUserArgs[0].email).toBe(phoneToEmail('+9647701234567'));
    expect(state.upserts[0].row.email).toBe('ali@example.com');
  });

  it('🚨 رابطُ التفعيل عبر واتساب حين يعمل التحقّقُ العكسيّ فقط', async () => {
    expect((await create(specialist)).data.activation_url).toBeUndefined();
    state.users = [];
    state.waAvailable = true;
    expect((await create(specialist)).data.activation_url).toBe('https://www.spir-medical.com/login/reset-pin?phone=07701234567');
  });
});

describe('③ حسابُ الإدارة يدخل بالبريد', () => {
  it('بلا بريد ← 400', async () => {
    state.caller = { id: 's', role: 'super_admin' };
    const r = await create({ role: 'manager', phone: '07701234567', full_name: 'مشرف' });
    expect(r.status).toBe(400);
    expect(r.data.error).toMatch(/البريد/);
  });

  it('🚨 المديرُ ينشئ مديراً (صلاحيّاتُه كالعامّ)، والمديرُ العامّ وحده ينشئ مديراً عامّاً', async () => {
    const asAdmin = await create({ role: 'admin', phone: '07701234567', full_name: 'م', email: 'm@x.io' });
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.data).toMatchObject({ success: true, login_method: 'email_password' });
    state.users = [];
    const superByAdmin = await create({ role: 'super_admin', phone: '07701234568', full_name: 'ع', email: 's@x.io' });
    expect(superByAdmin.status).toBe(403);
  });

  it('🚨 بالبريد ← كلمةُ سرٍّ مؤقّتة (لا رمز)', async () => {
    state.caller = { id: 's', role: 'super_admin' };
    const { data } = await create({ role: 'manager', phone: '07701234567', full_name: 'مشرف', email: 'm@x.io' });
    expect(data).toMatchObject({ success: true, login_method: 'email_password', email: 'm@x.io' });
    expect(data.temp_password).toMatch(/^[A-Za-z0-9]{14}$/);
    expect(data.temp_pin).toBeUndefined();
    expect(state.pins).toEqual([]);
  });

  it('غيرُ المدير ← 403', async () => {
    state.caller = { id: 'p', role: 'patient' };
    expect((await create(specialist)).status).toBe(403);
  });
});

describe('④ رسائلُ واتساب من الإدارة', () => {
  const share = require('@/lib/whatsapp/share');

  it('الروابطُ إلى رقم صاحب الحساب بصيغة wa.me', () => {
    expect(share.waChatLink('07701234567', 'x')).toBe('https://wa.me/9647701234567?text=x');
    expect(share.waChatLink('+9647701234567', 'x')).toBe('https://wa.me/9647701234567?text=x');
    expect(share.displayPhone('+9647701234567')).toBe('07701234567');
  });

  it('🚨 رسالةُ التفعيل تحمل الرابطَ لا رمزاً؛ ورسالةُ الاحتياط تحمل الرقمَ والرمز', () => {
    const a = share.activationMessage({ name: 'علي', role: 'specialist', url: 'https://s/login/reset-pin?phone=07701234567' });
    expect(a).toContain('https://s/login/reset-pin?phone=07701234567');
    expect(a).not.toMatch(/\b\d{6}\b/);
    const c = share.credentialsMessage({ name: 'علي', role: 'specialist', phone: '+9647701234567', pin: '482913', loginUrl: 'https://s/login/phone' });
    expect(c).toContain('07701234567');
    expect(c).toContain('482913');
  });
});

describe('⑤ فحصُ البريد بلا تراجعٍ متعدّد الحدود (CodeQL ReDoS)', () => {
  const { isEmail } = require('@/lib/validations/is-email');

  it('يقبل الصحيح ويرفض الناقص', () => {
    expect(isEmail('m@x.io')).toBe(true);
    expect(isEmail('a.b@sub.example.com')).toBe(true);
    for (const bad of ['', 'm@x', '@x.io', 'm@@x.io', 'm@.io', 'm@x.', 'm x@x.io', 'm@x..io']) {
      expect(isEmail(bad)).toBe(false);
    }
  });

  it('🚨 مدخلٌ مَرَضيّ («!@!.» + تكرار «!.») يُرفض فوراً', () => {
    const evil = '!@!.' + '!.'.repeat(50_000) + ' ';
    const t = Date.now();
    expect(isEmail(evil)).toBe(false);
    expect(Date.now() - t).toBeLessThan(50);
  });

  it('المسارُ والنموذج بلا التعبير القديم', () => {
    const fs = require('fs');
    for (const f of ['src/app/api/admin/users/create/route.ts', 'src/app/admin/users/create/CreateUserClient.tsx']) {
      expect(fs.readFileSync(f, 'utf8')).not.toMatch(/\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+/);
    }
  });
});

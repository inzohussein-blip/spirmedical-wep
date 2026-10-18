/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';

/**
 * 🔒 الإدارةُ نافذةٌ منفصلة لا تُدخَل إلّا برابط (طلبُ المالك، 18 تشرين الأول) — ومعها 0058.
 *
 * كان `/admin` يُحوِّل كلَّ زائرٍ إلى دخول الإدارة، وrobots.txt يُعلن المسار، وحسابُ المدير يدخل من `/login`
 * العامّة. وقِيس على الإنتاج: مريضٌ يرفع نفسه super_admin بتحديث صفّه (0058 أغلقه).
 */
let role: string | null = 'admin';
const signOut = jest.fn(async () => ({}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async () => ({ error: null }),
      getUser: async () => ({ data: { user: { id: 'u1' } } }),
      signOut,
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { email_verified: true, role } }) }) }) }),
  }),
}));
jest.mock('@/lib/email/send', () => ({ sendEmail: jest.fn(), isEmailConfigured: () => false }));
jest.mock('@/lib/auth/phone-pin-login', () => ({ phonePinLogin: jest.fn() }));
jest.mock('@/lib/auth/request-helpers', () => ({ getClientIp: async () => '1.1.1.1' }));
const updateSession = jest.fn(async () => new Response(null, { status: 200 }));
jest.mock('@/lib/supabase/middleware', () => ({ updateSession: (...a: unknown[]) => updateSession(...(a as [])) }));

const ROOT = process.cwd();
const code = (p: string) =>
  readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');

const gate = require('@/lib/auth/admin-gate');

describe('🔑 مفتاحُ الرابط', () => {
  it('🚨 بلا مفتاحٍ مضبوط: مفتوحة؛ ومعه: الرابطُ الصحيح أو الكعكةُ وحدهما', async () => {
    expect(await gate.decideAdminGate({ key: undefined, queryKey: null, cookie: undefined })).toBe('open');
    expect(await gate.decideAdminGate({ key: 's3cret-key', queryKey: 's3cret-key', cookie: undefined })).toBe('grant');
    expect(await gate.decideAdminGate({ key: 's3cret-key', queryKey: 'guess', cookie: undefined })).toBe('deny');
    expect(await gate.decideAdminGate({ key: 's3cret-key', queryKey: null, cookie: undefined })).toBe('deny');
    const token = await gate.adminGateToken('s3cret-key');
    expect(token).not.toContain('s3cret');
    expect(await gate.decideAdminGate({ key: 's3cret-key', queryKey: null, cookie: token })).toBe('open');
    expect(await gate.decideAdminGate({ key: 's3cret-key', queryKey: null, cookie: 'forged' })).toBe('deny');
  });

  it('🚨 proxy: بلا الرابط «غير موجودة»، وبه كعكةٌ وشريطٌ بلا المفتاح', async () => {
    process.env.ADMIN_LOGIN_KEY = 's3cret-key';
    try {
      const { proxy } = require('@/proxy');
      const bare = await proxy(new NextRequest('https://www.spir-medical.com/admin-login'));
      expect(bare.status).toBe(404);
      expect(updateSession).not.toHaveBeenCalled();

      const linked = await proxy(new NextRequest('https://www.spir-medical.com/admin-login?k=s3cret-key'));
      expect(linked.status).toBe(307);
      expect(new URL(linked.headers.get('location')!).search).toBe('');
      const cookie = linked.headers.get('set-cookie')!;
      expect(cookie).toMatch(/spir_admin_gate=/);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).not.toContain('s3cret-key');

      const back = new NextRequest('https://www.spir-medical.com/admin-login');
      back.cookies.set('spir_admin_gate', await gate.adminGateToken('s3cret-key'));
      await proxy(back);
      expect(updateSession).toHaveBeenCalledTimes(1);
    } finally {
      delete process.env.ADMIN_LOGIN_KEY;
    }
  });
});

describe('🚪 الدخولُ العامّ لا يُدخل الإدارة', () => {
  const { signInWithEmail } = require('@/lib/auth/email-auth');

  it('🚨 حسابُ إدارة: يُخرَج فوراً برسالة البيانات الخاطئة نفسِها', async () => {
    role = 'super_admin';
    const r = await signInWithEmail('owner@spir-medical.com', 'whatever');
    expect(r).toEqual({ success: false, error: gate.PUBLIC_LOGIN_ADMIN_ERROR });
    expect(signOut).toHaveBeenCalled();
  });

  it('المريضُ يدخل كما كان', async () => {
    signOut.mockClear();
    role = 'patient';
    expect(await signInWithEmail('p@x.com', 'pw')).toEqual({ success: true, role: 'patient' });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('🚨 «الدخول بـGoogle» كذلك، وrobots.txt لا يذكر الإدارة', () => {
    expect(code('src/app/auth/callback/route.ts')).toMatch(/isAdminAccountRole\(role\)\)\s*\{\s*await supabase\.auth\.signOut\(\)/);
    expect(code('src/app/auth/callback/route.ts')).not.toMatch(/\/admin`\)/);
    expect(code('src/lib/seo/indexable.ts')).toMatch(/CRAWL_BLOCKED = \['\/api\/'\] as const/);
  });
});

describe('🔴 0058: لا يرفع مستخدمٌ نفسَه', () => {
  const m = code('supabase/migrations/0058_users_privileged_columns_guard.sql');

  it('🚨 المُشغِّل يحرس الدورَ والاعتمادَ والمحفظةَ والتوثيق — قبل التحديث وعند الإدراج', () => {
    for (const col of ['role', 'approval_status', 'specialist_type', 'is_suspended', 'wallet_balance', 'loyalty_points', 'phone', 'wa_verified', 'email_verified', 'admin_internal_notes']) {
      expect([col, new RegExp(`NEW\\.${col} IS DISTINCT FROM OLD\\.${col}`).test(m)]).toEqual([col, true]);
    }
    expect(m).toMatch(/IF NEW\.role IS DISTINCT FROM 'patient'/);
    expect(m).toMatch(/BEFORE INSERT OR UPDATE ON public\.users/);
    expect(m).toMatch(/SECURITY INVOKER/);
    expect(m).toMatch(/current_user NOT IN \('authenticated', 'anon'\)/);
    // لا EXECUTE لـauthenticated على private.is_admin — كان يُسقط كلَّ تحديث (قِيس)
    expect(m).not.toMatch(/private\.is_admin/);
  });
});

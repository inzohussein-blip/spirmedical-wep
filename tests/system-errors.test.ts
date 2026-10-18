/**
 * @jest-environment node
 */
import { generateKeyPairSync, sign } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';

/**
 * 🚨 رصدُ الأخطاء في لوحة الإدارة (0057، طلبُ المالك 18 تشرين الأول):
 * «يرصد أخطاءَ النظام والسجلّ وفشلَ النظام أو فشلاً عند عميل، وفشلَ البناء وفشلَ فحصٍ في GitHub.»
 *
 * كانت الأخطاءُ تذهب إلى Sentry (بلا DSN في الإنتاج) وسجلِّ Vercel، وفشلُ البناء يبقى في Vercel/GitHub
 * حتى يُلاحَظ صدفةً — #11 و#30 أوقفا النشرَ ولم يعلم أحد.
 */
const rpc = jest.fn(async (..._a: unknown[]) => ({ error: null as null | { message: string } }));
const updateSelect = jest.fn(async () => ({ data: [{ id: 'x' }], error: null }));
const upsert = jest.fn(async (..._a: unknown[]) => ({ error: null }));
const resolvedIn = jest.fn();
jest.mock('@/lib/supabase/server-service', () => ({
  createServiceClient: () => ({
    rpc: (...a: unknown[]) => rpc(...a),
    from: (t: string) => ({
      upsert: (...a: unknown[]) => upsert(t, ...a),
      update: () => ({
        in: (_c: string, keys: string[]) => {
          resolvedIn(keys);
          return { is: () => ({ select: updateSelect }) };
        },
      }),
    }),
  }),
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u-1' } } }) } }),
}));
const rate = jest.fn(async (..._a: unknown[]) => ({ allowed: true }));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: (...a: unknown[]) => rate(...a) }));
const mail = jest.fn(async (..._a: unknown[]) => true);
const realFetch = global.fetch;

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(--|\/\/).*$/gm, '');
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); };

const se = require('@/lib/ops/system-errors');

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://sb.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
  rpc.mockClear(); resolvedIn.mockClear(); upsert.mockClear(); rate.mockClear(); mail.mockClear();
  rpc.mockImplementation(async () => ({ error: null }));
  se.__resetSystemErrorDedupe();
});

describe('🧬 البصمة: الخطأُ نفسُه صفٌّ واحد', () => {
  it('🚨 المعرّفاتُ والأرقام والاستعلامُ لا تُفرّق الخطأ؛ والمسارُ المختلف يُفرّقه', () => {
    const a = se.fingerprintOf({ source: 'server', message: 'Order 3f1c2b4a-1111-2222-3333-444455556666 not found (42)', path: '/orders/3f1c2b4a-1111-2222-3333-444455556666?x=1' });
    const b = se.fingerprintOf({ source: 'server', message: 'Order 9a9a9a9a-1111-2222-3333-444455556666 not found (7)', path: '/orders/9a9a9a9a-1111-2222-3333-444455556666' });
    const c = se.fingerprintOf({ source: 'server', message: 'Order x not found', path: '/admin' });
    expect(a).toBe(b);
    expect(a).not.toBe(se.fingerprintOf({ source: 'client', message: 'Order 1 not found (1)', path: '/orders/1' }));
    expect(se.fingerprintOf({ source: 'server', message: 'Order 1 not found (1)', path: '/x' })).not.toBe(a);
    expect(c).toMatch(/^server:[0-9a-f]{8}$/);
    expect(se.fingerprintOf({ source: 'ci', key: 'CI:main', message: '' })).toBe('ci:CI:main');
    expect(se.normalizePath('https://www.spir-medical.com/orders/123/edit?phone=077')).toBe('/orders/:n/edit');
  });
});

describe('✍️ recordSystemError', () => {
  it('🚨 يكتب عبر الدالّة بالبصمة، ويحجب الأسرار من التفاصيل', async () => {
    const ok = await se.recordSystemError({ source: 'log', message: 'boom', detail: { token: 'abc', phone: '0770', step: 2 } });
    expect(ok).toBe(true);
    const [fn, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(fn).toBe('record_system_error');
    expect(args).toMatchObject({ p_source: 'log', p_level: 'error', p_message: 'boom' });
    expect(args.p_detail).toEqual({ token: '[REDACTED]', phone: '[REDACTED]', step: 2 });
    expect(String(args.p_fingerprint)).toMatch(/^log:/);
  });

  it('حلقةٌ ترمي ألفَ مرّة = كتابةٌ واحدة في الدقيقة', async () => {
    for (let i = 0; i < 50; i++) await se.recordSystemError({ source: 'server', message: 'loop' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('🚨 لا يرمي أبداً: عطلُ القاعدة أو غيابُ المفاتيح ← false', async () => {
    rpc.mockImplementationOnce(async () => { throw new Error('down'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(se.recordSystemError({ source: 'server', message: 'a' })).resolves.toBe(false);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(se.recordSystemError({ source: 'server', message: 'b' })).resolves.toBe(false);
  });
});

describe('📜 السجلّ: logger.error على خادم الإنتاج', () => {
  it('🚨 يُسجَّل في الإنتاج وحده', async () => {
    const env = process.env as Record<string, string | undefined>;
    const { logger } = require('@/lib/logger');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test-env error', { a: 1 });
    await flush();
    expect(rpc).not.toHaveBeenCalled();
    const prev = env.NODE_ENV;
    env.NODE_ENV = 'production';
    try {
      logger.error('payment step failed', { secret: 's', order: 5 });
      await flush();
    } finally {
      env.NODE_ENV = prev;
    }
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args).toMatchObject({ p_source: 'log', p_message: 'payment step failed' });
    expect(args.p_detail).toEqual({ secret: '[REDACTED]', order: 5 });
  });
});

describe('⏰ الكرون', () => {
  const { withCronAlert } = require('@/lib/ops/alert-owner');
  const req = () => new NextRequest('http://x/api/cron/demo');

  it('🚨 5xx يُسجَّل، والنجاحُ يُغلقه، و401 لا هذا ولا ذاك', async () => {
    await withCronAlert('demo', async () => new Response('bad', { status: 500 }))(req());
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_source: 'cron', p_fingerprint: 'cron:demo:status' });

    await withCronAlert('demo', async () => new Response('ok', { status: 200 }))(req());
    expect(resolvedIn).toHaveBeenCalledWith(['cron:demo:status', 'cron:demo:crash']);

    resolvedIn.mockClear(); rpc.mockClear();
    await withCronAlert('demo', async () => new Response('no', { status: 401 }))(req());
    expect(resolvedIn).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('الانهيارُ حرِج', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await withCronAlert('demo', async () => { throw new Error('kaboom'); })(req());
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_source: 'cron', p_level: 'fatal', p_fingerprint: 'cron:demo:crash' });
  });
});

describe('🌐 فشلٌ عند المستخدم (المتصفّح)', () => {
  const { POST } = require('@/app/api/ops/client-error/route');
  const post = (body: unknown, ip = '1.1.1.1') =>
    POST(new NextRequest('http://x/api/ops/client-error', {
      method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': ip, 'user-agent': 'UA' },
    }));

  it('🚨 يُسجَّل بمسارٍ بلا استعلام ومعرّفِ المستخدم', async () => {
    const res = await post({ kind: 'boundary', message: 'Cannot read properties of undefined', url: '/orders/5?phone=0770' });
    expect(res.status).toBe(204);
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args).toMatchObject({ p_source: 'client', p_level: 'error', p_path: '/orders/:n' });
    expect(args.p_detail).toMatchObject({ kind: 'boundary', user_id: 'u-1', ua: 'UA' });
  });

  it('🚨 محدودٌ لكلّ عنوان، ويرفض المشوَّه، ويُسقط الضجيج', async () => {
    rate.mockImplementationOnce(async () => ({ allowed: false }));
    expect((await post({ kind: 'error', message: 'x' })).status).toBe(429);
    expect((await post({ kind: 'nope', message: 'x' })).status).toBe(400);
    expect((await post({ kind: 'error', message: 'y'.repeat(600) })).status).toBe(400);
    expect((await post({ kind: 'error', message: 'Script error.' })).status).toBe(204);
    expect((await post({ kind: 'error', message: 'x', stack: 'at chrome-extension://abc/x.js' })).status).toBe(204);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('كلُّ حدود الأخطاء في التطبيق تُبلّغ، والمُبلِّغُ العامّ في الجذر', () => {
    const boundaries: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(join(ROOT, d), { withFileTypes: true })) {
        const p = `${d}/${e.name}`;
        if (e.isDirectory()) walk(p);
        else if (e.name === 'error.tsx' || e.name === 'global-error.tsx') boundaries.push(p);
      }
    };
    walk('src/app');
    expect(boundaries.length).toBeGreaterThanOrEqual(11);
    for (const b of boundaries) expect([b, /reportClientError\(error, 'boundary'/.test(code(b))]).toEqual([b, true]);
    expect(code('src/app/layout.tsx')).toMatch(/<ClientErrorReporter \/>/);
  });
});

describe('🧭 المُبلِّغ في المتصفّح', () => {
  it('🚨 خمسٌ لكلّ صفحة، بلا تكرار، وبلا ضجيج', () => {
    const { reportClientError, __resetClientErrorReporter } = require('@/lib/ops/report-client-error');
    const beacon = jest.fn(() => true);
    (global as unknown as { window: unknown }).window = { location: { pathname: '/dashboard' } };
    (global as unknown as { navigator: unknown }).navigator = { sendBeacon: beacon };
    try {
      __resetClientErrorReporter();
      reportClientError(new Error('ResizeObserver loop completed with undelivered notifications.'), 'error');
      reportClientError(new Error('a'), 'error');
      reportClientError(new Error('a'), 'error');
      for (let i = 0; i < 10; i++) reportClientError(new Error(`e${i}`), 'unhandledrejection');
      expect(beacon).toHaveBeenCalledTimes(5);
      expect((beacon.mock.calls[0] as unknown[])[0]).toBe('/api/ops/client-error');
    } finally {
      delete (global as unknown as { window?: unknown }).window;
      delete (global as unknown as { navigator?: unknown }).navigator;
    }
  });
});

describe('🔐 GitHub: فشلُ البناء والفحوص عبر OIDC', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
  const fetcher = (async () => new Response(JSON.stringify({ keys: [jwk] }))) as typeof fetch;
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Date.now();
  const good = {
    iss: 'https://token.actions.githubusercontent.com',
    aud: 'spir-medical-ops',
    exp: Math.floor(now / 1000) + 300,
    repository: 'inzohussein-blip/spirmedical-wep',
    job_workflow_ref: 'inzohussein-blip/spirmedical-wep/.github/workflows/report-failures.yml@refs/heads/main',
  };
  const jwt = (claims: Record<string, unknown>, key = privateKey) => {
    const head = b64({ alg: 'RS256', kid: 'k1' });
    const body = b64(claims);
    return `${head}.${body}.${sign('RSA-SHA256', Buffer.from(`${head}.${body}`), key).toString('base64url')}`;
  };
  const { verifyGithubOidc, __resetJwksCache } = require('@/lib/ops/github-oidc');
  beforeEach(() => __resetJwksCache());

  it('🚨 يقبل رمزَ سير report-failures من مستودعنا وحده', async () => {
    expect(await verifyGithubOidc(jwt(good), { now, fetcher })).toMatchObject({ ok: true });
    const bad = async (c: Record<string, unknown>) => (await verifyGithubOidc(jwt({ ...good, ...c }), { now, fetcher })).reason;
    expect(await bad({ repository: 'someone/fork' })).toBe('repository');
    expect(await bad({ job_workflow_ref: 'inzohussein-blip/spirmedical-wep/.github/workflows/ci.yml@refs/heads/main' })).toBe('workflow');
    expect(await bad({ aud: 'other' })).toBe('aud');
    expect(await bad({ iss: 'https://evil' })).toBe('iss');
    expect(await bad({ exp: Math.floor(now / 1000) - 120 })).toBe('expired');
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    expect((await verifyGithubOidc(jwt(good, other), { now, fetcher })).reason).toBe('signature');
    expect((await verifyGithubOidc('a.b', { now, fetcher })).reason).toBe('malformed');
  });

  it('🚨 النقطة: بلا رمزٍ صالح 401؛ فشلُ main يُسجَّل حرِجاً ويُرسل بريداً؛ والنجاحُ يُغلقه', async () => {
    jest.resetModules();
    jest.doMock('@/lib/ops/alert-owner', () => ({ alertOwner: (...a: unknown[]) => mail(...a) }));
    global.fetch = fetcher;
    try {
      const { POST } = require('@/app/api/ops/ingest/route');
      const call = (body: unknown, token?: string) => POST(new NextRequest('http://x/api/ops/ingest', {
        method: 'POST', body: JSON.stringify(body), headers: token ? { authorization: `Bearer ${token}` } : {},
      }));
      const fail = { kind: 'ci', status: 'failure', name: 'CI', branch: 'main', url: 'https://github.com/r/1', sha: 'abcdef1234567890' };

      expect((await call(fail)).status).toBe(401);
      expect(rpc).not.toHaveBeenCalled();

      expect((await call(fail, jwt(good))).status).toBe(200);
      expect(rpc.mock.calls[0][1]).toMatchObject({ p_source: 'ci', p_level: 'fatal', p_fingerprint: 'ci:CI:main' });
      expect(mail).toHaveBeenCalledTimes(1);
      expect(upsert.mock.calls[0][0]).toBe('app_settings');

      await call({ ...fail, branch: 'feature/x' }, jwt(good));
      expect(rpc.mock.calls[1][1]).toMatchObject({ p_level: 'error', p_fingerprint: 'ci:CI:feature/x' });
      expect(mail).toHaveBeenCalledTimes(1);

      await call({ kind: 'build', status: 'success', name: 'Production', branch: 'main' }, jwt(good));
      expect(resolvedIn).toHaveBeenCalledWith(['build:Production:main']);
    } finally {
      global.fetch = realFetch;
      jest.dontMock('@/lib/ops/alert-owner');
    }
  });

  it('سيرُ العمل: يراقب كلَّ سيرٍ بأسمائها الحقيقيّة ونشرَ Vercel، وبياناتُ الحدث لا تدخل shell', () => {
    const wf = read('.github/workflows/report-failures.yml');
    const names = readdirSync(join(ROOT, '.github/workflows'))
      .filter((f) => f !== 'report-failures.yml')
      .map((f) => read(`.github/workflows/${f}`).match(/^name:\s*(.+)$/m)?.[1].trim());
    const watched = wf.match(/workflows: \[([^\]]+)\]/)![1].split(',').map((s) => s.trim());
    expect(watched.sort()).toEqual([...names].sort());
    expect(wf).toMatch(/deployment_status:/);
    expect(wf).toMatch(/id-token: write/);
    expect(wf).toContain('audience=spir-medical-ops');
    const run = wf.slice(wf.indexOf('run: |'));
    expect(run).not.toMatch(/\$\{\{/);
  });
});

describe('🗄️ القاعدة (0057)', () => {
  const m = code('supabase/migrations/0057_system_errors.sql');
  it('🚨 لا قراءةَ ولا كتابةَ لغير عميل الخدمة، والدالّةُ بصلاحيّة المستدعي وسقفٍ للبصمات الجديدة', () => {
    expect(m).toMatch(/REVOKE ALL ON public\.system_errors FROM anon, authenticated/);
    expect(m).not.toMatch(/CREATE POLICY/);
    expect(m).toMatch(/SECURITY INVOKER/);
    expect(m).not.toMatch(/SECURITY DEFINER/);
    expect(m).toMatch(/SET search_path = public, pg_temp/);
    expect(m).toMatch(/REVOKE ALL ON FUNCTION public\.record_system_error[^;]*FROM PUBLIC, anon, authenticated/);
    expect(m).toMatch(/>= 300 THEN\s+RETURN false/);
    expect(m).toMatch(/resolved_at = NULL/);
  });
});

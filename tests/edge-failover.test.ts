/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🛰️ بوّابةُ التبديل Vercel ← Netlify (طلبُ المالك، 24 تشرين الأول): «حتى في حال توقّفت واحدة الثانية تعمل احتياطيّاً بلا
 * ضياع البيانات وبالصفحة نفسها ومعلومات العميل المحفوظة في المتصفّح».
 *   - نطاقٌ واحد في المتصفّح ← الكوكيز والجلسة وlocalStorage تبقى. والتحويلاتُ إلى نطاق المنصّة تُعاد إليه.
 *   - لا طلبَ يكتب مرّتين: POST يُعاد إلى الثانية فقط حين لم يبلغ الدالّة.
 *   - المنصّةُ ترى عنوانَ الزائر من البوّابة الموثوقة وحدها (وإلّا تجاوز أيُّ أحدٍ حدودَ المعدّل).
 */
const worker = require('../edge/failover/worker.js');
const VERCEL = 'spirmedical-wep.vercel.app';
const NETLIFY = 'spir-medical.netlify.app';
const env = { ORIGINS: `${VERCEL},${NETLIFY}`, EDGE_PROXY_SECRET: 's'.repeat(24) };

type Hit = { host: string; method: string; headers: Headers; body: string };
let hits: Hit[] = [];
let reply: (host: string) => Response | Promise<Response>;
const store = new Map<string, Response>();

beforeEach(() => {
  hits = [];
  store.clear();
  (globalThis as any).caches = {
    default: {
      match: async (k: string) => store.get(k),
      put: async (k: string, v: Response) => { store.set(k, v); },
    },
  };
  (globalThis as any).fetch = async (req: Request) => {
    const u = new URL(req.url);
    hits.push({ host: u.host, method: req.method, headers: req.headers, body: req.body ? await req.text() : '' });
    return reply(u.host);
  };
});

const call = (path = '/dashboard', init: RequestInit = {}) =>
  worker.default.fetch(new Request(`https://www.spir-medical.com${path}`, { headers: { 'cf-connecting-ip': '5.6.7.8' }, ...init }), env);

describe('التبديل', () => {
  it('🚨 Vercel موقوفة (402 — إيقافُ الحساب) ← الصفحةُ من Netlify، ثمّ Netlify أوّلاً حتى تعود', async () => {
    reply = (h) => (h === VERCEL ? new Response('blocked', { status: 402 }) : new Response('ok'));
    const res = await call();
    expect(await res.text()).toBe('ok');
    expect(res.headers.get('x-spir-origin')).toBe(NETLIFY);
    expect(hits.map((h) => h.host)).toEqual([VERCEL, NETLIFY]);
    hits = [];
    await call();
    expect(hits.map((h) => h.host)).toEqual([NETLIFY]);
  });

  it('🚨 انقطاعٌ أو 5xx لصفحةٍ تُقرأ ← Netlify؛ والعاملةُ لا يُسأل غيرُها', async () => {
    reply = (h) => { if (h === VERCEL) throw new TypeError('connection refused'); return new Response('ok'); };
    expect(await (await call()).text()).toBe('ok');
    store.clear(); hits = [];
    reply = (h) => new Response(h, { status: h === VERCEL ? 503 : 200 });
    expect(await (await call()).text()).toBe(NETLIFY);
    store.clear(); hits = [];
    reply = (h) => new Response(h);
    expect(await (await call()).text()).toBe(VERCEL);
    expect(hits).toHaveLength(1);
  });

  it('🚨 POST: 504 قد يكون كتب ← لا يُعاد (لا طلبَ طبّيٌّ مكرَّر)؛ 402 أو DEPLOYMENT_* لم يبلغ الدالّة ← يُعاد بالجسم نفسه', async () => {
    reply = (h) => new Response(h, { status: h === VERCEL ? 504 : 200 });
    const timedOut = await call('/appointments/new', { method: 'POST', body: 'x=1' });
    expect(timedOut.status).toBe(504);
    expect(hits.map((h) => h.host)).toEqual([VERCEL]);

    hits = []; store.clear();
    reply = (h) => (h === VERCEL ? new Response('', { status: 404, headers: { 'x-vercel-error': 'DEPLOYMENT_DISABLED' } }) : new Response('ok'));
    const moved = await call('/appointments/new', { method: 'POST', body: 'x=1' });
    expect(await moved.text()).toBe('ok');
    expect(hits.map((h) => [h.host, h.body])).toEqual([[VERCEL, 'x=1'], [NETLIFY, 'x=1']]);
  });

  it('المنصّتان ساقطتان ← 503 برسالةٍ عربيّة', async () => {
    reply = () => { throw new TypeError('down'); };
    const res = await call();
    expect(res.status).toBe(503);
  });
});

describe('ما يبقى للزائر كما هو', () => {
  it('🚨 التحويلُ إلى نطاق المنصّة يُعاد إلى نطاق الزائر، والكوكيز بلا Domain المنصّة', async () => {
    reply = () => {
      const h = new Headers({ location: `https://${VERCEL}/login?error=x` });
      h.append('set-cookie', `sb-auth=1; Path=/; Domain=${VERCEL}; Secure`);
      return new Response(null, { status: 307, headers: h });
    };
    const res = await call('/auth/callback');
    expect(res.headers.get('location')).toBe('https://www.spir-medical.com/login?error=x');
    expect(res.headers.getSetCookie()).toEqual(['sb-auth=1; Path=/; Secure']);
  });

  it('🚨 يُرسل الكوكيز وعنوانَ الزائر والسرّ، والعاري يُحوَّل إلى www', async () => {
    reply = () => new Response('ok');
    await call('/x', { headers: { cookie: 'sb-auth=1', 'cf-connecting-ip': '5.6.7.8' } });
    expect(hits[0].headers.get('cookie')).toBe('sb-auth=1');
    expect(hits[0].headers.get('x-spir-client-ip')).toBe('5.6.7.8');
    expect(hits[0].headers.get('x-spir-edge')).toBe(env.EDGE_PROXY_SECRET);
    const apex = await worker.default.fetch(new Request('https://spir-medical.com/a?b=1'), env);
    expect(apex.status).toBe(308);
    expect(apex.headers.get('location')).toBe('https://www.spir-medical.com/a?b=1');
  });
});

describe('🔐 عنوانُ الزائر في التطبيق', () => {
  const { clientIpFrom, isTrustedEdge } = require('@/lib/edge-proxy');
  const H = (o: Record<string, string>) => new Headers(o);
  const secret = 'k'.repeat(20);

  it('🚨 x-spir-client-ip يُصدَّق مع السرّ وحده، وإلّا x-forwarded-for', () => {
    const base = { 'x-forwarded-for': '9.9.9.9, 1.1.1.1', 'x-spir-client-ip': '5.6.7.8' };
    expect(clientIpFrom(H({ ...base, 'x-spir-edge': secret }), secret)).toBe('5.6.7.8');
    expect(clientIpFrom(H({ ...base, 'x-spir-edge': 'k'.repeat(19) + 'x' }), secret)).toBe('9.9.9.9');
    expect(clientIpFrom(H({ ...base, 'x-spir-edge': '1' }), '')).toBe('9.9.9.9');
    expect(isTrustedEdge(H({ 'x-spir-edge': 'short' }), 'short')).toBe(false);
  });

  it('🚨 لا قراءةَ لـx-forwarded-for خارج المساعد — وإلّا عادت الحدودُ كلُّها على عنوان البوّابة', () => {
    const { execSync } = require('child_process');
    const out = execSync("grep -rln \"x-forwarded-for\" src --include=*.ts --include=*.tsx || true", { encoding: 'utf8' });
    expect(out.trim().split('\n').filter(Boolean)).toEqual(['src/lib/edge-proxy.ts']);
  });

  it('🚨 الوسيطُ لا يحوّل ما جاء من البوّابة (وإلّا دار الطلب)، ويحوّل زائرَ المنصّتين المباشر', () => {
    const src = readFileSync(join(process.cwd(), 'src/proxy.ts'), 'utf8');
    expect(src).toMatch(/PLATFORM_HOSTS\.includes\(host\)[\s\S]{0,120}!viaEdge\(request\.headers\)/);
    const { PLATFORM_HOSTS } = require('@/lib/seo/origin');
    expect(PLATFORM_HOSTS).toEqual([VERCEL, NETLIFY]);
    expect(JSON.parse(readFileSync(join(process.cwd(), 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, '')).vars.ORIGINS).toBe(env.ORIGINS);
  });
});

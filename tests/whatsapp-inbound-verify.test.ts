/**
 * @jest-environment node
 */

/**
 * 📲 التحقّق العكسيّ عبر واتساب (0050) — العميلُ يرسل الرمز، والإثباتُ مطابقةُ رقم المرسِل.
 *
 * ما يحرسه:
 *  ① الرمزُ وحده لا يكفي: رقمٌ آخر أو رقمٌ مخفيّ (LID) لا يُتحقَّق به، وخمسُ محاولاتٍ تُبطله.
 *  ② مرّةٌ واحدة: verified ← consumed، ولا تحقّقَ بعد انتهاء الصلاحية.
 *  ③ توقيعُ البوّابة: نافذةُ وقت، ولا عبثَ بالجسم، والبوّابةُ تُوقّع بما يقبله الموقع.
 *  ④ المفتاح مطفأ افتراضياً، والزرُّ يختفي إن غابت نبضةُ البوّابة.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── قاعدةٌ في الذاكرة تكفي لاستعلامات الوحدة ───
type Row = Record<string, any>;
const db: Record<string, Row[]> = { phone_verifications: [], wa_gateway_status: [] };
let nextId = 1;

function query(table: string) {
  const filters: ((r: Row) => boolean)[] = [];
  let op: 'select' | 'update' | 'insert' | 'upsert' = 'select';
  let payload: Row = {};
  let countMode = false;
  let returning = false;
  const rows = () => (db[table] ?? []).filter((r) => filters.every((f) => f(r)));
  const run = () => {
    if (op === 'update') {
      const hit = rows();
      hit.forEach((r) => Object.assign(r, payload));
      return { data: returning ? hit.map((r) => ({ ...r })) : null, error: null };
    }
    if (op === 'insert') {
      if (table === 'phone_verifications' && db[table].some((r) => r.status === 'pending' && r.code === payload.code)) {
        return { data: null, error: { code: '23505', message: 'duplicate' } };
      }
      const row = { id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`, status: 'pending', attempts: 0, ...payload };
      db[table].push(row);
      return { data: returning ? { ...row } : null, error: null };
    }
    if (op === 'upsert') {
      const existing = db[table].find((r) => r.provider === payload.provider);
      if (existing) Object.assign(existing, payload);
      else db[table].push({ ...payload });
      return { data: null, error: null };
    }
    const hit = rows();
    return countMode ? { count: hit.length, data: null, error: null } : { data: hit.map((r) => ({ ...r })), error: null };
  };
  const q: any = {
    select: (_c?: string, o?: { count?: string; head?: boolean }) => {
      if (op === 'select') countMode = !!o?.count;
      else returning = true;
      return q;
    },
    insert: (p: Row) => { op = 'insert'; payload = p; return q; },
    update: (p: Row) => { op = 'update'; payload = p; return q; },
    upsert: (p: Row) => { op = 'upsert'; payload = p; return q; },
    eq: (c: string, v: unknown) => { filters.push((r) => r[c] === v); return q; },
    gt: (c: string, v: string) => { filters.push((r) => r[c] > v); return q; },
    gte: (c: string, v: string) => { filters.push((r) => r[c] >= v); return q; },
    // ما تستعمله `getOpsHealth` لجداولَ لا تهمّ هنا — بلا أثر
    or: () => q, is: () => q, not: () => q, neq: () => q, order: () => q, limit: () => q,
    single: async () => run(),
    maybeSingle: async () => {
      const r = run();
      return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error };
    },
    then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
  };
  return q;
}

jest.mock('@/lib/supabase/server', () => ({ createAdminClient: () => ({ from: (t: string) => query(t) }) }));
jest.mock('@/lib/logger', () => ({ logger: { error: () => {}, warn: () => {}, info: () => {} } }));

const v = require('@/lib/whatsapp/inbound-verify');
const gw = require('../services/wa-inbound/src/lib.cjs');

const SECRET = 'a'.repeat(40);
const PHONE = '+9647701234567';
const T0 = new Date('2026-10-16T20:00:00Z');

beforeEach(() => {
  db.phone_verifications = [];
  db.wa_gateway_status = [];
  process.env.WA_VERIFY_MODE = 'optional';
  process.env.WA_VERIFY_PROVIDER = 'baileys';
  process.env.WA_VERIFY_NUMBER = '9647801112222';
  process.env.WA_INBOUND_SECRET = SECRET;
});

let seq = 0;
const start = (over: Record<string, unknown> = {}) =>
  v.startVerification({ phone: PHONE, purpose: 'reset_pin', now: T0, rand: () => 482913 + seq++, ...over });

describe('① الرمزُ وحده لا يكفي — مطابقةُ المرسِل هي الإثبات', () => {
  it('🚨 الرقمُ نفسُه ← verified (ورسالةٌ بأرقامٍ عربيّة تُقبل)', async () => {
    const s = await start();
    const arabic = s.code.replace(/\d/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
    const r = await v.handleInboundMessage({ from: '9647701234567@s.whatsapp.net', text: `رمز التحقّق: ${arabic}`, provider: 'baileys', now: T0 });
    expect(r).toBe('verified');
    expect(await v.getVerificationState(s.id, T0)).toBe('verified');
  });

  it('🚨 رقمٌ آخر بالرمز الصحيح ← mismatch ولا تحقّق، وخمسٌ تُبطله', async () => {
    const s = await start();
    for (let i = 0; i < 4; i++) {
      expect(await v.handleInboundMessage({ from: '9647709999999@s.whatsapp.net', text: s.code, provider: 'baileys', now: T0 })).toBe('mismatch');
    }
    expect(await v.getVerificationState(s.id, T0)).toBe('pending');
    await v.handleInboundMessage({ from: '9647709999999@s.whatsapp.net', text: s.code, provider: 'baileys', now: T0 });
    expect(await v.getVerificationState(s.id, T0)).toBe('expired');
    // صاحبُ الرقم بعدها لا يستطيع بالرمز المُبطَل
    expect(await v.handleInboundMessage({ from: '9647701234567@s.whatsapp.net', text: s.code, provider: 'baileys', now: T0 })).toBe('unknown_code');
  });

  it('🚨 رقمٌ مخفيّ (LID) ← no_sender لا تحقّق', async () => {
    const s = await start();
    expect(await v.handleInboundMessage({ from: '123456789012345@lid', text: s.code, provider: 'baileys', now: T0 })).toBe('no_sender');
    expect(await v.getVerificationState(s.id, T0)).toBe('pending');
  });

  it('رسالةٌ بلا رمز، أو رمزٌ غير معروف', async () => {
    expect(await v.handleInboundMessage({ from: '9647701234567', text: 'مرحبا', provider: 'meta', now: T0 })).toBe('no_code');
    expect(await v.handleInboundMessage({ from: '9647701234567', text: '111111', provider: 'meta', now: T0 })).toBe('unknown_code');
  });

  it('صيغُ المرسِل', () => {
    expect(v.normalizeSender('9647701234567@s.whatsapp.net')).toBe(PHONE);
    expect(v.normalizeSender('9647701234567:12@s.whatsapp.net')).toBe(PHONE);
    expect(v.normalizeSender('9647701234567')).toBe(PHONE);
    expect(v.normalizeSender('07701234567')).toBe(PHONE);
    expect(v.normalizeSender('123@lid')).toBeNull();
    expect(v.normalizeSender('120363000000@g.us')).toBeNull();
  });
});

describe('② مرّةٌ واحدة، وفي وقته', () => {
  it('🚨 بعد عشر دقائق ← لا تحقّق', async () => {
    const s = await start();
    const late = new Date(T0.getTime() + 11 * 60_000);
    expect(await v.handleInboundMessage({ from: '9647701234567', text: s.code, provider: 'meta', now: late })).toBe('unknown_code');
    expect(await v.getVerificationState(s.id, late)).toBe('expired');
  });

  it('🚨 الاستهلاكُ مرّةً واحدة وللغرض نفسه', async () => {
    const s = await start();
    await v.handleInboundMessage({ from: '9647701234567', text: s.code, provider: 'meta', now: T0 });
    expect(await v.consumeVerification(s.id, 'verify_phone', T0)).toBeNull();
    expect(await v.consumeVerification(s.id, 'reset_pin', T0)).toEqual({ phone: PHONE, userId: null });
    expect(await v.consumeVerification(s.id, 'reset_pin', T0)).toBeNull();
  });

  it('غيرُ المتحقَّق لا يُستهلك', async () => {
    const s = await start();
    expect(await v.consumeVerification(s.id, 'reset_pin', T0)).toBeNull();
  });

  it('رمزٌ جديد يُبطل السابقَ للرقم والغرض نفسيهما', async () => {
    const a = await start();
    const b = await start();
    expect(await v.getVerificationState(a.id, T0)).toBe('expired');
    expect(await v.getVerificationState(b.id, T0)).toBe('pending');
  });

  it('🚨 حدٌّ لكلّ رقم: الطلبُ السادس في الساعة يُرفض', async () => {
    for (let i = 0; i < 5; i++) expect((await start()).ok).toBe(true);
    const sixth = await start();
    expect(sixth.ok).toBe(false);
    expect(sixth.error).toMatch(/كثيرة/);
  });

  it('رمزٌ معلَّقٌ مكرَّر ← يُعاد التوليد', async () => {
    db.phone_verifications.push({ id: 'x', phone: '+9647700000000', code: '555555', purpose: 'reset_pin', status: 'pending', attempts: 0, expires_at: '2099-01-01', created_at: T0.toISOString() });
    const vals = [555555, 666666];
    const s = await v.startVerification({ phone: PHONE, purpose: 'reset_pin', now: T0, rand: () => vals.shift()! });
    expect(s.code).toBe('666666');
  });

  it('الرابطُ إلى رقمنا والرسالةُ تحمل الرمز', async () => {
    const s = await start();
    expect(s.link).toMatch(/^https:\/\/wa\.me\/9647801112222\?text=/);
    expect(decodeURIComponent(s.link)).toContain(s.code);
    expect(v.extractCode(decodeURIComponent(s.link.split('text=')[1]))).toBe(s.code);
  });
});

describe('③ توقيعُ البوّابة', () => {
  const body = JSON.stringify({ from: '9647701234567@s.whatsapp.net', text: '482913' });

  it('🚨 البوّابةُ تُوقّع بما يقبله الموقع', () => {
    const h = gw.signedHeaders(SECRET, body, T0.getTime());
    expect(v.verifySignature(SECRET, h['x-spir-timestamp'], h['x-spir-signature'], body, T0.getTime())).toBe(true);
  });

  it('🚨 جسمٌ معدَّل، أو سرٌّ آخر، أو طلبٌ قديم ← مرفوض', () => {
    const h = gw.signedHeaders(SECRET, body, T0.getTime());
    expect(v.verifySignature(SECRET, h['x-spir-timestamp'], h['x-spir-signature'], body.replace('482913', '000000'), T0.getTime())).toBe(false);
    expect(v.verifySignature('b'.repeat(40), h['x-spir-timestamp'], h['x-spir-signature'], body, T0.getTime())).toBe(false);
    expect(v.verifySignature(SECRET, h['x-spir-timestamp'], h['x-spir-signature'], body, T0.getTime() + 6 * 60_000)).toBe(false);
    expect(v.verifySignature(null, h['x-spir-timestamp'], h['x-spir-signature'], body, T0.getTime())).toBe(false);
  });

  it('البوّابة تستخرج الرقمَ الحقيقيّ من خلف LID حين يتاح', async () => {
    expect(await gw.resolveSender({ remoteJid: '9647701234567@s.whatsapp.net' })).toEqual({ pn: '9647701234567@s.whatsapp.net', via: 'direct' });
    expect(await gw.resolveSender({ remoteJid: '1@lid', remoteJidAlt: '9647701234567@s.whatsapp.net' })).toEqual({ pn: '9647701234567@s.whatsapp.net', via: 'alt' });
    expect(await gw.resolveSender({ remoteJid: '1@lid' }, async () => '9647701234567@s.whatsapp.net')).toEqual({ pn: '9647701234567@s.whatsapp.net', via: 'mapping' });
    expect(await gw.resolveSender({ remoteJid: '1@lid' }, async () => null)).toEqual({ pn: null, via: 'lid-hidden' });
    expect(await gw.resolveSender({ remoteJid: '120363@g.us' })).toEqual({ pn: null, via: 'other' });
  });

  it('رسائلُ بلا رمز لا تغادر البوّابة', () => {
    expect(gw.looksLikeCode('مرحبا، كم السعر؟')).toBe(false);
    expect(gw.looksLikeCode('رمز التحقّق: 482913')).toBe(true);
    expect(gw.messageText({ extendedTextMessage: { text: 'x 482913' } })).toBe('x 482913');
  });

  it('🚨 البوّابة لا ترسل رسائلَ واتساب أبداً', () => {
    const src = readFileSync(join(process.cwd(), 'services/wa-inbound/src/index.mjs'), 'utf8');
    expect(src).not.toMatch(/sendMessage|readMessages|sendPresenceUpdate/);
    expect(src).toMatch(/markOnlineOnConnect: false/);
  });
});

describe('④ مطفأ افتراضياً، والزرّ يتبع نبضةَ البوّابة', () => {
  it('🚨 بلا WA_VERIFY_MODE ← off، ولا رمزَ يُولَّد', async () => {
    delete process.env.WA_VERIFY_MODE;
    expect(v.getWaVerifyConfig().mode).toBe('off');
    expect((await start()).ok).toBe(false);
    expect(await v.isWaVerifyAvailable()).toBe(false);
  });

  it('سرٌّ قصير أو رقمٌ غير عراقيّ لا يُقبلان', () => {
    expect(v.getWaVerifyConfig({ WA_INBOUND_SECRET: 'short', WA_VERIFY_NUMBER: '0770' }).secret).toBeNull();
    expect(v.getWaVerifyConfig({ WA_VERIFY_NUMBER: '+964 780 111 2222' }).number).toBe('9647801112222');
  });

  it('🚨 نبضةٌ حديثة ← متاح؛ قديمة أو منقطعة ← لا زرّ', async () => {
    const now = T0.getTime();
    db.wa_gateway_status.push({ provider: 'baileys', connected: true, last_seen_at: new Date(now - 30_000).toISOString() });
    expect(await v.isWaVerifyAvailable(v.getWaVerifyConfig(), now)).toBe(true);
    db.wa_gateway_status[0].last_seen_at = new Date(now - 3 * 60_000).toISOString();
    expect(await v.isWaVerifyAvailable(v.getWaVerifyConfig(), now)).toBe(false);
    db.wa_gateway_status[0] = { provider: 'baileys', connected: false, last_seen_at: new Date(now).toISOString() };
    expect(await v.isWaVerifyAvailable(v.getWaVerifyConfig(), now)).toBe(false);
  });

  it('Meta: يكفي ضبطُها (خدمةٌ مُدارة بلا نبضة)', async () => {
    process.env.WA_VERIFY_PROVIDER = 'meta';
    expect(await v.isWaVerifyAvailable()).toBe(true);
  });
});

describe('⑤ نقاطُ الاستقبال', () => {
  const post = (body: string, headers: Record<string, string>) =>
    new Request('https://x/api/whatsapp/inbound', { method: 'POST', body, headers });

  it('🚨 بلا توقيع ← 401، وبلا سرّ ← 503', async () => {
    const { POST } = require('@/app/api/whatsapp/inbound/route');
    expect((await POST(post('{}', {}))).status).toBe(401);
    delete process.env.WA_INBOUND_SECRET;
    expect((await POST(post('{}', {}))).status).toBe(503);
  });

  it('🚨 موقَّع ← يُعالَج ويُتحقَّق', async () => {
    const s = await v.startVerification({ phone: PHONE, purpose: 'reset_pin', rand: () => 731905 });
    const { POST } = require('@/app/api/whatsapp/inbound/route');
    const body = JSON.stringify({ from: '9647701234567@s.whatsapp.net', text: s.code });
    const res = await POST(post(body, gw.signedHeaders(SECRET, body)));
    expect(await res.json()).toEqual({ result: 'verified' });
  });

  it('المفتاح مطفأ ← يُستلم ولا يُعالَج', async () => {
    process.env.WA_VERIFY_MODE = 'off';
    const { POST } = require('@/app/api/whatsapp/inbound/route');
    const body = JSON.stringify({ from: '9647701234567', text: '123456' });
    expect(await (await POST(post(body, gw.signedHeaders(SECRET, body)))).json()).toEqual({ result: 'disabled' });
  });

  it('🚨 Webhook من Meta يمرّ بالدالّة نفسها حين يكون Meta هو المصدر', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/api/whatsapp/webhook/route.ts'), 'utf8');
    expect(src).toMatch(/cfg\.provider === 'meta'/);
    expect(src).toMatch(/handleInboundMessage\(\{ from: msg\.from, text: msg\.text\?\.body, provider: 'meta' \}\)/);
  });
});

describe('⑥ صحّة التشغيل تُظهر البوّابةَ المنقطعة', () => {
  it('🚨 مفعّلٌ وبلا نبضة ← منقطعة؛ مطفأ ← لا بطاقة', async () => {
    const { getOpsHealth } = require('@/lib/admin/ops-health');
    // الاستعلاماتُ الأخرى لا تهمّنا هنا؛ الذاكرةُ تعيد صفوفاً فارغة
    db.users = []; db.service_waitlist = []; db.notification_queue = [];
    const h = await getOpsHealth(T0);
    expect(h.waGateway).toEqual({ connected: false, lastSeenAt: null, stale: true });
    process.env.WA_VERIFY_MODE = 'off';
    expect((await getOpsHealth(T0)).waGateway).toBeNull();
  });

  it('البطاقةُ تُعرض حين تنقطع البوّابة', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/admin/_components/OpsHealthCards.tsx'), 'utf8');
    expect(src).toMatch(/const waDown = !!wa && !wa\.connected;/);
    expect(src).toMatch(/data-testid="ops-wa-gateway"/);
  });
});

describe('⑦ نشرُ البوّابة على Railway', () => {
  const src = readFileSync(join(process.cwd(), 'services/wa-inbound/src/index.mjs'), 'utf8');

  it('🚨 /health يردّ 200 قبل مسح QR (Railway يفحصه عند النشر)', () => {
    const health = src.slice(src.indexOf("url.pathname === '/health'"), src.indexOf("url.pathname === '/qr'"));
    expect(health).toMatch(/res\.writeHead\(200,/);
    expect(health).not.toMatch(/503/);
  });

  it('الجلسةُ على القرص الدائم، وصفحةُ QR محميّةٌ برمز', () => {
    const docker = readFileSync(join(process.cwd(), 'services/wa-inbound/Dockerfile'), 'utf8');
    expect(docker).toMatch(/ENV AUTH_DIR=\/data\/auth/);
    expect(src).toMatch(/if \(!tokenOk\(url\.searchParams\.get\('token'\)\)\)/);
  });
});

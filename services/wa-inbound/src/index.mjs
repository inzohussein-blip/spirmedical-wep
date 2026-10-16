/**
 * ════════════════════════════════════════════════════════════════════
 * 📲 بوّابةُ واتساب الواردة — سباير ميديكال (Baileys على Railway)
 * ════════════════════════════════════════════════════════════════════
 *
 * تستقبل فقط ولا ترسل شيئاً أبداً: العميلُ يرسل رمزَ التحقّق إلى رقمنا، والبوّابةُ
 * تنقل (المرسِل، النصّ) إلى الموقع بطلبٍ موقَّع. المطابقةُ والقرارُ كلّه في الموقع —
 * هنا لا مفتاحَ قاعدة بيانات ولا منطقَ تحقّق.
 *
 * PROBE_ONLY=1 (المرحلة 0): لا يُرسل للموقع شيئاً؛ يسجّل فقط هل وصل رقمُ المرسِل
 * صريحاً أم مخفيّاً (LID). يُقرأ من /health أو من السجلّ.
 * ════════════════════════════════════════════════════════════════════
 */
import http from 'node:http';
import { rm } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from 'baileys';
import pino from 'pino';
import QRCode from 'qrcode';

const require = createRequire(import.meta.url);
const { signedHeaders, resolveSender, messageText, looksLikeCode } = require('./lib.cjs');

const env = {
  siteUrl: (process.env.SITE_URL || 'https://www.spir-medical.com').replace(/\/$/, ''),
  secret: process.env.WA_INBOUND_SECRET || '',
  authDir: process.env.AUTH_DIR || '/data/auth',
  port: Number(process.env.PORT || 8080),
  adminToken: process.env.ADMIN_TOKEN || '',
  probeOnly: process.env.PROBE_ONLY === '1',
};

if (!env.probeOnly && env.secret.length < 32) {
  console.error('WA_INBOUND_SECRET مفقود أو أقصر من 32 حرفاً — (أو شغّل PROBE_ONLY=1 للتجربة)');
  process.exit(1);
}
if (env.adminToken.length < 16) {
  console.error('ADMIN_TOKEN مفقود أو أقصر من 16 حرفاً — يحمي صفحةَ رمز QR');
  process.exit(1);
}

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const state = {
  connected: false,
  qr: null,
  me: null,
  startedAt: new Date().toISOString(),
  stats: { received: 0, codes: 0, direct: 0, alt: 0, mapping: 0, hidden: 0, forwarded: 0, forwardFailed: 0 },
  lastResults: [],
};

let sock = null;
let reconnectDelay = 2_000;

// ─────────────────────────────────────────────────────────
// الموقع
// ─────────────────────────────────────────────────────────

async function postSigned(path, payload) {
  const body = JSON.stringify(payload);
  const res = await fetch(env.siteUrl + path, {
    method: 'POST',
    headers: signedHeaders(env.secret, body),
    body,
    redirect: 'error', // تحويلٌ (مثل spir-medical.com → www) يُسقط جسمَ POST — اضبط SITE_URL
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

async function forward(from, text) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { result } = await postSigned('/api/whatsapp/inbound', { from, text });
      state.stats.forwarded++;
      state.lastResults = [{ at: new Date().toISOString(), result }, ...state.lastResults].slice(0, 10);
      log.info({ result }, 'forwarded');
      return;
    } catch (err) {
      log.warn({ attempt, err: String(err) }, 'forward failed');
      await new Promise((r) => setTimeout(r, attempt * 1_000));
    }
  }
  state.stats.forwardFailed++;
}

async function heartbeat() {
  if (env.probeOnly) return;
  try {
    await postSigned('/api/whatsapp/heartbeat', {
      connected: state.connected,
      detail: { stats: state.stats, me: state.me, startedAt: state.startedAt },
    });
  } catch (err) {
    log.warn({ err: String(err) }, 'heartbeat failed');
  }
}

// ─────────────────────────────────────────────────────────
// واتساب
// ─────────────────────────────────────────────────────────

async function onMessages({ messages, type }) {
  if (type !== 'notify') return;
  for (const m of messages) {
    if (!m.key || m.key.fromMe) continue;
    state.stats.received++;
    const text = messageText(m.message);
    if (!looksLikeCode(text)) continue; // رسائلُ عاديّة لا تغادر البوّابة
    state.stats.codes++;

    const { pn, via } = await resolveSender(m.key, (lid) =>
      sock?.signalRepository?.lidMapping?.getPNForLID(lid),
    );
    if (via === 'direct') state.stats.direct++;
    else if (via === 'alt') state.stats.alt++;
    else if (via === 'mapping') state.stats.mapping++;
    else state.stats.hidden++;

    if (env.probeOnly) {
      // لا نسجّل الرقمَ نفسه — يكفي أن نعرف هل وصل
      log.info({ via, hasNumber: Boolean(pn) }, 'probe: code message');
      continue;
    }
    // بلا رقمٍ صريح نرسل المعرّفَ المخفيّ؛ الموقعُ يرفضه («no_sender») ويعدّه محاولة
    await forward(pn || m.key.remoteJid, text);
  }
}

async function connect() {
  const { state: auth, saveCreds } = await useMultiFileAuthState(env.authDir);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

  sock = makeWASocket({
    auth,
    version,
    logger: log.child({ module: 'baileys' }, { level: 'warn' }),
    browser: Browsers.ubuntu('Spir Verify'),
    markOnlineOnConnect: false, // لا يظهر الرقمُ «متّصلاً» لمن يراسله
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', (ev) => {
    onMessages(ev).catch((err) => log.error({ err: String(err) }, 'message handling failed'));
  });
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      state.qr = qr;
      log.info('QR جاهز — افتح /qr?token=… وامسحه من «الأجهزة المرتبطة»');
    }
    if (connection === 'open') {
      state.connected = true;
      state.qr = null;
      state.me = sock.user?.id?.split(':')[0]?.replace(/\D/g, '').replace(/^(\d{3})\d+(\d{3})$/, '$1…$2') ?? null;
      reconnectDelay = 2_000;
      log.info('connected');
      heartbeat();
    }
    if (connection === 'close') {
      state.connected = false;
      heartbeat();
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        // الجهازُ أُزيل من «الأجهزة المرتبطة»: جلسةٌ جديدة ورمزُ QR جديد
        log.error('logged out — يُطلب ربطٌ جديد');
        await rm(env.authDir, { recursive: true, force: true });
      }
      setTimeout(() => connect().catch((err) => log.error({ err: String(err) }, 'reconnect failed')), reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 60_000);
    }
  });
}

// ─────────────────────────────────────────────────────────
// HTTP: /health (عامّ، بلا أرقام) و/qr (بالرمز الإداريّ)
// ─────────────────────────────────────────────────────────

function tokenOk(given) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(env.adminToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    if (url.pathname === '/health') {
      // 200 دائماً: Railway يفحصه عند النشر، والاتصالُ لا يكون قبل مسح QR. الحالةُ في الجسم.
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ connected: state.connected, probeOnly: env.probeOnly, stats: state.stats }));
      return;
    }
    if (url.pathname === '/qr') {
      if (!tokenOk(url.searchParams.get('token'))) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      if (state.connected) {
        res.end(`<meta charset="utf-8"><h2 dir="rtl">✓ متّصل (${state.me ?? ''})</h2><pre>${JSON.stringify(state.stats, null, 2)}</pre>`);
      } else if (state.qr) {
        const svg = await QRCode.toString(state.qr, { type: 'svg', margin: 2, width: 320 });
        res.end(`<meta charset="utf-8"><meta http-equiv="refresh" content="20"><div dir="rtl" style="font-family:sans-serif;text-align:center"><h2>امسح من واتساب ← الأجهزة المرتبطة ← ربط جهاز</h2>${svg}<p>يتجدّد الرمز كلَّ 20 ثانية</p></div>`);
      } else {
        res.end('<meta charset="utf-8"><meta http-equiv="refresh" content="3"><p dir="rtl">جارٍ الاتصال…</p>');
      }
      return;
    }
    res.writeHead(404).end();
  })
  .listen(env.port, () => log.info({ port: env.port, probeOnly: env.probeOnly }, 'http ready'));

setInterval(heartbeat, 60_000);
connect().catch((err) => {
  log.error({ err: String(err) }, 'initial connect failed');
  process.exit(1);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    state.connected = false;
    heartbeat().finally(() => process.exit(0));
  });
}

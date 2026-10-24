/**
 * 🛰️ بوّابةُ التبديل — Cloudflare Worker أمام www.spir-medical.com (طلبُ المالك، 24 تشرين الأول).
 *
 * كلُّ طلبٍ يذهب إلى Vercel أوّلاً، فإن لم تُجِب يُعاد إلى Netlify (نسخةٌ من الكود نفسه من `main`). النطاقُ في
 * المتصفّح واحد، فالكوكيز والجلسة وlocalStorage والتطبيقُ المثبَّت تبقى كما هي، والبياناتُ في Supabase المشترك.
 *
 * متى يُعاد الطلبُ إلى الثانية — لا طلبَ يُنفَّذ مرّتين:
 *   - GET/HEAD/OPTIONS (لا تكتب): انقطاعٌ، أو مهلة، أو 402 (إيقافُ الحساب)، أو 5xx من المنصّة.
 *   - POST وما يكتب: حين **لم تصل الدالّةَ** وحده — انقطاعٌ قبل الردّ، أو 402، أو `x-vercel-error: DEPLOYMENT_*`.
 *     أمّا 502/504 فقد تكون الدالّةُ كتبت ثمّ انتهت مهلتُها؛ إعادتُها تُنشئ طلباً طبّياً مكرَّراً.
 * وحين تسقط الأولى تُعلَّم «ساقطة» `DOWN_TTL` ثانية في هذا المركز فتُسأل الثانيةُ أوّلاً — لا انتظارَ مع كلّ طلب.
 *
 * المنصّةُ ترى البوّابةَ لا الزائر: نرسل `x-spir-edge` (السرُّ المشترك) و`x-spir-client-ip` — انظر `src/lib/edge-proxy.ts`.
 * والتحويلاتُ إلى نطاق المنصّة (`Location`) تُعاد إلى نطاق الزائر.
 */
export const DEFAULT_ORIGINS = ['spirmedical-wep.vercel.app', 'spir-medical.netlify.app'];
export const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const DOWN_TTL = 30;
const SAFE_TIMEOUT_MS = 15000;
const DOWN_KEY = 'https://edge-failover.internal/down/';

export function originsFrom(env) {
  const list = String(env?.ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

/** المنصّةُ رفضت قبل أن تبلغ الدالّة — آمنٌ إعادتُه أيّاً كان الطلب */
export function notReached(res) {
  if (res.status === 402) return true;
  const code = res.headers.get('x-vercel-error') || '';
  return code.startsWith('DEPLOYMENT_');
}

/** هل يُعاد هذا الردُّ إلى المنصّة الأخرى؟ */
export function shouldFailover(method, res) {
  if (notReached(res)) return true;
  return SAFE_METHODS.has(method) && res.status >= 500;
}

function upstreamRequest(request, origin, body, env) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, `https://${origin}`);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-spir-edge', env?.EDGE_PROXY_SECRET || '1');
  headers.set('x-spir-client-ip', request.headers.get('cf-connecting-ip') || '');
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', 'https');
  return new Request(target, { method: request.method, headers, body, redirect: 'manual' });
}

/** يعيد التحويلات والكوكيز إلى نطاق الزائر */
export function toPublic(res, publicHost, origins, origin) {
  const out = new Response(res.body, res);
  const loc = out.headers.get('location');
  if (loc) {
    try {
      const u = new URL(loc);
      if (origins.includes(u.host)) {
        u.host = publicHost;
        u.protocol = 'https:';
        out.headers.set('location', u.toString());
      }
    } catch { /* مسارٌ نسبيّ — يبقى */ }
  }
  const cookies = typeof out.headers.getSetCookie === 'function' ? out.headers.getSetCookie() : [];
  if (cookies.some((c) => /;\s*domain=/i.test(c))) {
    out.headers.delete('set-cookie');
    for (const c of cookies) out.headers.append('set-cookie', c.replace(/;\s*domain=[^;]*/gi, ''));
  }
  out.headers.set('x-spir-origin', origin);
  return out;
}

async function isDown(origin) {
  try { return Boolean(await caches.default.match(DOWN_KEY + origin)); } catch { return false; }
}
async function markDown(origin) {
  try {
    await caches.default.put(DOWN_KEY + origin, new Response('1', { headers: { 'cache-control': `max-age=${DOWN_TTL}` } }));
  } catch { /* لا مخزن — نسأل الأولى كلَّ مرّة */ }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const canonical = env?.CANONICAL_HOST || 'www.spir-medical.com';
    // النطاقُ العاري ← www (كان يفعله Vercel قبل أن تصير البوّابةُ أمامه)
    if (url.hostname !== canonical && url.hostname === canonical.replace(/^www\./, '')) {
      url.hostname = canonical;
      return Response.redirect(url.toString(), 308);
    }

    const origins = originsFrom(env);
    const order = [...origins];
    if (order.length > 1 && (await isDown(order[0]))) order.push(order.shift());

    const method = request.method.toUpperCase();
    const safe = SAFE_METHODS.has(method);
    const body = safe ? undefined : await request.arrayBuffer();

    let last = null;
    for (let i = 0; i < order.length; i++) {
      const origin = order[i];
      const isLast = i === order.length - 1;
      try {
        const res = await fetch(upstreamRequest(request, origin, body, env), safe ? { signal: AbortSignal.timeout(SAFE_TIMEOUT_MS) } : {});
        if (isLast || !shouldFailover(method, res)) return toPublic(res, url.host, origins, origin);
        last = res;
        await markDown(origin);
      } catch {
        // انقطاعٌ قبل الردّ (أو مهلةُ طلبٍ لا يكتب) — لم يُنفَّذ شيءٌ نعرفه، فالمنصّةُ الأخرى
        if (isLast) break;
        await markDown(origin);
      }
    }
    if (last) return toPublic(last, url.host, origins, order[order.length - 1]);
    return new Response('الخدمة غير متاحة مؤقّتاً — حاول بعد قليل.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '30' },
    });
  },
};

export default worker;

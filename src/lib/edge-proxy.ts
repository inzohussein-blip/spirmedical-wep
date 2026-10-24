/**
 * 🛰️ بوّابةُ التبديل (Cloudflare Worker في `edge/failover/`) أمام Vercel وNetlify.
 *
 * المتصفّحُ يرى نطاقاً واحداً (www.spir-medical.com) فتبقى الكوكيز والجلسة وlocalStorage كما هي أيّاً كانت المنصّةُ
 * التي أجابت، والبياناتُ في Supabase المشترك. لكنّ المنصّة ترى البوّابةَ لا الزائر:
 *   - `host` نطاقُها هي (spirmedical-wep.vercel.app / spir-medical.netlify.app) ← لا نحوّله إلى الأصل وإلّا دار الطلب.
 *   - `x-forwarded-for` عنوانُ البوّابة ← حدودُ المعدّل كلُّها على عنوانٍ واحد. فالبوّابةُ ترسل عنوانَ الزائر في
 *     `x-spir-client-ip`، ولا يُصدَّق إلّا مع السرّ المشترك (`EDGE_PROXY_SECRET`) — وإلّا زوّره أيُّ أحدٍ ليتجاوز الحدود.
 */
export const EDGE_HEADER = 'x-spir-edge';
export const EDGE_CLIENT_IP_HEADER = 'x-spir-client-ip';

type HeaderSource = { get(name: string): string | null };

/** طلبٌ مرّ بالبوّابة (لأجل التحويل فقط — لا ثقةَ فيه) */
export function viaEdge(h: HeaderSource): boolean {
  return h.get(EDGE_HEADER) !== null;
}

/** البوّابةُ موثوقة: السرُّ مضبوطٌ (16 حرفاً فأكثر) ومطابق */
export function isTrustedEdge(h: HeaderSource, secret: string | undefined = process.env.EDGE_PROXY_SECRET): boolean {
  const got = h.get(EDGE_HEADER);
  if (!secret || secret.length < 16 || !got || got.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

/** عنوانُ الزائر: من البوّابة الموثوقة، وإلّا أوّلُ `x-forwarded-for`، ثمّ `x-real-ip` */
export function clientIpFrom(h: HeaderSource, secret?: string): string | null {
  if (isTrustedEdge(h, secret ?? process.env.EDGE_PROXY_SECRET)) {
    const ip = h.get(EDGE_CLIENT_IP_HEADER)?.trim();
    if (ip) return ip;
  }
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
}

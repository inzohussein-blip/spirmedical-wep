import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📲 التحقّق العكسيّ عبر واتساب — العميلُ يرسل الرمزَ إلى رقمنا (0050)
 * ════════════════════════════════════════════════════════════════════
 *
 * لا نرسل شيئاً: الموقعُ يولّد رمزاً ورابطَ `wa.me/<رقمنا>?text=…`، والعميلُ يضغط
 * «إرسال»، وبوّابةٌ (Baileys على Railway، أو Webhook من Meta) تنقل الرسالةَ إلى
 * `/api/whatsapp/inbound`. **المنطقُ كلُّه هنا** — البوّابةُ ناقلٌ موقَّع بلا مفتاح قاعدة.
 *
 * الإثبات = رمزٌ معلَّق غيرُ منتهٍ **و** رقمُ المرسِل هو الرقمُ الذي طُلب له.
 * الرمزُ وحده يُنسخ ويُرسَل من رقمٍ آخر؛ فإن جاء من غير صاحبه عُدَّ محاولةً، وخمسٌ تُبطله.
 *
 * مفتاحُ التشغيل `WA_VERIFY_MODE` (off افتراضياً): لا يظهر شيءٌ ولا يُقبل شيء حتى يُفعَّل.
 * ════════════════════════════════════════════════════════════════════
 */

export type WaVerifyMode = 'off' | 'optional' | 'required';
export type WaVerifyProvider = 'baileys' | 'meta';
export type VerificationPurpose = 'reset_pin' | 'verify_phone' | 'register_specialist';

export const CODE_TTL_MINUTES = 10;
/** رسائلُ بالرمز من رقمٍ غير صاحبه قبل إبطاله */
export const MAX_MISMATCH = 5;
/** رموزٌ لكلّ رقم في الساعة */
export const MAX_PER_PHONE_HOUR = 5;
/** غيابُ النبضة أطولَ من هذا = البوّابةُ منقطعة، فيختفي الزرّ */
export const GATEWAY_STALE_MS = 2 * 60_000;
/** فرقُ الساعة المقبول في توقيع البوّابة (يمنع إعادةَ إرسال طلبٍ قديمٍ ملتقَط) */
export const SIGNATURE_WINDOW_MS = 5 * 60_000;

export interface WaVerifyConfig {
  mode: WaVerifyMode;
  provider: WaVerifyProvider;
  /** رقمُنا بلا + (لرابط wa.me)، أو null إن لم يُضبط */
  number: string | null;
  secret: string | null;
}

export function getWaVerifyConfig(env: NodeJS.ProcessEnv = process.env): WaVerifyConfig {
  const m = env.WA_VERIFY_MODE;
  const mode: WaVerifyMode = m === 'optional' || m === 'required' ? m : 'off';
  const provider: WaVerifyProvider = env.WA_VERIFY_PROVIDER === 'meta' ? 'meta' : 'baileys';
  const digits = (env.WA_VERIFY_NUMBER ?? '').replace(/\D/g, '');
  const secret = env.WA_INBOUND_SECRET ?? '';
  return {
    mode,
    provider,
    number: /^9647\d{9}$/.test(digits) ? digits : null,
    secret: secret.length >= 32 ? secret : null,
  };
}

// ─────────────────────────────────────────────────────────
// الأرقامُ والرسالة
// ─────────────────────────────────────────────────────────

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
function toAsciiDigits(s: string): string {
  return s.replace(ARABIC_DIGITS, (d) => {
    const c = d.charCodeAt(0);
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
  });
}

/** أوّلُ ستّة أرقام متتالية في الرسالة (لوحاتُ المفاتيح العربيّة تُحوَّل). */
export function extractCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = /(?:^|\D)(\d{6})(?!\d)/.exec(toAsciiDigits(text));
  return m ? m[1] : null;
}

/**
 * رقمُ المرسِل بصيغة المخزَّن (`+9647XXXXXXXXX`)، أو null.
 * Baileys يعطي `9647…@s.whatsapp.net`؛ Meta يعطي `9647…`. ومعرّفُ «LID»
 * (`…@lid`) يُخفي الرقم — لا يُطابَق، لأنّ المطابقة بالرقم هي الإثبات.
 */
export function normalizeSender(from: string | null | undefined): string | null {
  if (!from || from.includes('@lid')) return null;
  const digits = toAsciiDigits(from.split('@')[0].split(':')[0]).replace(/\D/g, '');
  if (/^9647\d{9}$/.test(digits)) return '+' + digits;
  if (/^07\d{9}$/.test(digits)) return '+964' + digits.slice(1);
  return null;
}

export function verificationMessage(code: string): string {
  return `رمز التحقّق في سباير ميديكال: ${code}\n(اضغط «إرسال» فقط — لا تعدّل الرسالة)`;
}

export function waLink(number: string, code: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(verificationMessage(code))}`;
}

// ─────────────────────────────────────────────────────────
// توقيعُ البوّابة (HMAC-SHA256 على `<timestamp>.<body>`)
// ─────────────────────────────────────────────────────────

export function signPayload(secret: string, timestamp: string, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export function verifySignature(
  secret: string | null,
  timestamp: string | null,
  signature: string | null,
  body: string,
  now: number = Date.now(),
): boolean {
  if (!secret || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > SIGNATURE_WINDOW_MS) return false;
  const expected = Buffer.from(signPayload(secret, timestamp, body), 'hex');
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// ─────────────────────────────────────────────────────────
// البوّابة: متّصلة؟
// ─────────────────────────────────────────────────────────

export async function recordHeartbeat(
  provider: WaVerifyProvider,
  connected: boolean,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await createAdminClient()
    .from('wa_gateway_status')
    .upsert({ provider, connected, detail: detail as never, last_seen_at: new Date().toISOString() });
  if (error) logger.error('wa heartbeat upsert failed', { error: error.message });
}

/**
 * هل يُعرض زرُّ واتساب الآن؟ المفتاحُ مفعَّل، والرقمُ مضبوط، والبوّابةُ حيّة.
 * Meta لا نبضةَ لها (خدمةٌ مُدارة) — يكفي ضبطُها. وأيُّ عطبٍ في السؤال = لا زرّ:
 * الطرقُ الأخرى (رمز الدخول، رمزُ الإدارة المؤقّت) قائمة، والزرُّ المعطوب أسوأ من غيابه.
 */
export async function isWaVerifyAvailable(
  cfg: WaVerifyConfig = getWaVerifyConfig(),
  now: number = Date.now(),
): Promise<boolean> {
  if (cfg.mode === 'off' || !cfg.number) return false;
  if (cfg.provider === 'meta') return true;
  if (!cfg.secret) return false;
  const { data, error } = await createAdminClient()
    .from('wa_gateway_status')
    .select('connected, last_seen_at')
    .eq('provider', 'baileys')
    .maybeSingle();
  if (error || !data) return false;
  return data.connected && now - new Date(data.last_seen_at).getTime() <= GATEWAY_STALE_MS;
}

// ─────────────────────────────────────────────────────────
// الرموز
// ─────────────────────────────────────────────────────────

export type StartResult =
  | { ok: true; id: string; code: string; link: string; expiresAt: string }
  | { ok: false; error: string };

/** يولّد رمزاً لرقمٍ مخزَّن (`+9647…`). المتّصلُ يتحقّق قبلها من أنّ الغرضَ يناسب الرقم. */
export async function startVerification(opts: {
  phone: string;
  purpose: VerificationPurpose;
  userId?: string | null;
  ip?: string | null;
  now?: Date;
  rand?: (min: number, max: number) => number;
}): Promise<StartResult> {
  const cfg = getWaVerifyConfig();
  if (cfg.mode === 'off' || !cfg.number) return { ok: false, error: 'التحقّق عبر واتساب غير مفعّل' };
  if (!/^\+9647\d{9}$/.test(opts.phone)) return { ok: false, error: 'رقم الهاتف غير صالح' };

  const now = opts.now ?? new Date();
  const rand = opts.rand ?? randomInt;
  const sb = createAdminClient();

  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
  const { count } = await sb
    .from('phone_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('phone', opts.phone)
    .gte('created_at', hourAgo);
  if ((count ?? 0) >= MAX_PER_PHONE_HOUR) {
    return { ok: false, error: 'طلباتٌ كثيرة لهذا الرقم — حاول بعد ساعة' };
  }

  // رمزٌ سابقٌ معلَّق للرقم والغرض نفسيهما يُبطَل: رمزٌ واحدٌ حيٌّ لكلّ طلب
  await sb
    .from('phone_verifications')
    .update({ status: 'expired' })
    .eq('phone', opts.phone)
    .eq('purpose', opts.purpose)
    .eq('status', 'pending');

  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60_000).toISOString();
  // الفهرسُ الجزئيّ يرفض رمزاً معلَّقاً مكرَّراً (23505) — نعيد التوليد
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(rand(100000, 1000000));
    const { data, error } = await sb
      .from('phone_verifications')
      .insert({
        phone: opts.phone,
        code,
        purpose: opts.purpose,
        user_id: opts.userId ?? null,
        created_ip: opts.ip ?? null,
        expires_at: expiresAt,
        created_at: now.toISOString(),
      })
      .select('id')
      .single();
    if (data) return { ok: true, id: data.id, code, link: waLink(cfg.number, code), expiresAt };
    if (error?.code !== '23505') {
      logger.error('phone_verifications insert failed', { error: error?.message });
      break;
    }
  }
  return { ok: false, error: 'تعذّر إنشاء الرمز — حاول مجدّداً' };
}

export type InboundResult =
  | 'verified'
  | 'no_code'
  | 'unknown_code'
  | 'no_sender'
  | 'mismatch'
  | 'error';

/** رسالةٌ واردة من البوّابة. لا تردّ على المرسِل أبداً — النتيجةُ للسجلّ وحده. */
export async function handleInboundMessage(msg: {
  from: string | null | undefined;
  text: string | null | undefined;
  provider: WaVerifyProvider;
  now?: Date;
}): Promise<InboundResult> {
  const code = extractCode(msg.text);
  if (!code) return 'no_code';
  const now = msg.now ?? new Date();
  const sb = createAdminClient();

  const { data: row, error } = await sb
    .from('phone_verifications')
    .select('id, phone, attempts')
    .eq('code', code)
    .eq('status', 'pending')
    .gt('expires_at', now.toISOString())
    .maybeSingle();
  if (error) {
    logger.error('inbound lookup failed', { error: error.message });
    return 'error';
  }
  if (!row) return 'unknown_code';

  const sender = normalizeSender(msg.from);
  if (sender !== row.phone) {
    // رقمٌ مخفيّ (LID) أو رقمٌ آخر: لا تحقّق. خمسُ محاولاتٍ تُبطل الرمز.
    const attempts = row.attempts + 1;
    await sb
      .from('phone_verifications')
      .update({ attempts, ...(attempts >= MAX_MISMATCH ? { status: 'expired' } : {}) })
      .eq('id', row.id)
      .eq('status', 'pending');
    logger.warn('inbound verification sender mismatch', { id: row.id, hidden: sender === null });
    return sender === null ? 'no_sender' : 'mismatch';
  }

  // شرطُ `status = pending` يجعل التحقّقَ مرّةً واحدة حتى مع رسالتين متزامنتين
  const { data: updated } = await sb
    .from('phone_verifications')
    .update({ status: 'verified', verified_at: now.toISOString(), provider: msg.provider })
    .eq('id', row.id)
    .eq('status', 'pending')
    .select('id');
  return updated && updated.length > 0 ? 'verified' : 'unknown_code';
}

export type VerificationState = 'pending' | 'verified' | 'expired';

/** لصفحة الانتظار (تسأل كلَّ ثانيتين). المعرّفُ عشوائيّ (uuid) ولا يكشف رقماً. */
export async function getVerificationState(id: string, now: Date = new Date()): Promise<VerificationState> {
  const { data } = await createAdminClient()
    .from('phone_verifications')
    .select('status, expires_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return 'expired';
  if (data.status === 'verified') return 'verified';
  if (data.status === 'pending' && new Date(data.expires_at) > now) return 'pending';
  return 'expired';
}

/**
 * يستهلك تحقّقاً ناجحاً مرّةً واحدة (verified → consumed) — يستدعيه الإجراءُ الذي
 * يمنح شيئاً (رمز دخولٍ جديد، شارة توثيق). يعيد الرقمَ المُثبَت أو null.
 */
export async function consumeVerification(
  id: string,
  purpose: VerificationPurpose,
  now: Date = new Date(),
): Promise<{ phone: string; userId: string | null } | null> {
  // التحقّقُ صالحٌ للاستهلاك ما دام الرمزُ نفسُه لم ينتهِ — بعدها يُطلب رمزٌ جديد
  const { data } = await createAdminClient()
    .from('phone_verifications')
    .update({ status: 'consumed', consumed_at: now.toISOString() })
    .eq('id', id)
    .eq('purpose', purpose)
    .eq('status', 'verified')
    .gt('expires_at', now.toISOString())
    .select('phone, user_id');
  const row = data?.[0];
  return row ? { phone: row.phone, userId: row.user_id } : null;
}

// ─────────────────────────────────────────────────────────
// لوحةُ الإدارة: حالةُ البوّابة وحركةُ الرموز
// ─────────────────────────────────────────────────────────

export interface WaOverview {
  mode: WaVerifyMode;
  provider: WaVerifyProvider;
  number: string | null;
  secretSet: boolean;
  available: boolean;
  gateway: { connected: boolean; lastSeenAt: string; detail: Record<string, unknown> } | null;
  /** آخر ٢٤ ساعة: طُلب، وتحقّق، واستُعمل، وانتهى/أُبطل */
  last24h: { started: number; verified: number; consumed: number; expired: number };
}

export async function getWaOverview(now: Date = new Date()): Promise<WaOverview> {
  const cfg = getWaVerifyConfig();
  const sb = createAdminClient();
  const since = new Date(now.getTime() - 86_400_000).toISOString();
  const [{ data: gw }, { data: rows }] = await Promise.all([
    sb.from('wa_gateway_status').select('connected, last_seen_at, detail').eq('provider', 'baileys').maybeSingle(),
    sb.from('phone_verifications').select('status').gte('created_at', since),
  ]);
  const count = (s: string) => (rows ?? []).filter((r) => r.status === s).length;
  return {
    mode: cfg.mode,
    provider: cfg.provider,
    number: cfg.number,
    secretSet: cfg.secret !== null,
    available: await isWaVerifyAvailable(cfg, now.getTime()).catch(() => false),
    gateway: gw
      ? { connected: gw.connected, lastSeenAt: gw.last_seen_at, detail: (gw.detail as Record<string, unknown>) ?? {} }
      : null,
    last24h: {
      started: rows?.length ?? 0,
      verified: count('verified'),
      consumed: count('consumed'),
      expired: count('expired'),
    },
  };
}

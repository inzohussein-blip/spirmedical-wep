import { sanitize } from '@/lib/logger';

/**
 * 🚨 رصدُ الأخطاء (0057): كلُّ مصدرٍ يكتب هنا، ولوحةُ الإدارة تقرأ `/admin/errors`.
 *
 * لا يرمي أبداً ولا يستعمل `logger.error` — هذا ما يستدعيه `logger.error` نفسُه، فخطأٌ في التسجيل
 * يصير حلقةً لا تنتهي. والتسجيلُ لا يجوز أن يُسقط العملَ الذي يسجّل عنه.
 */
export const ERROR_SOURCES = ['server', 'log', 'client', 'cron', 'build', 'ci'] as const;
export type ErrorSource = (typeof ERROR_SOURCES)[number];
export type ErrorLevel = 'warning' | 'error' | 'fatal';

export interface SystemErrorInput {
  source: ErrorSource;
  message: string;
  level?: ErrorLevel;
  path?: string | null;
  detail?: Record<string, unknown>;
  /** بصمةٌ صريحة (البناء والفحوص: اسمُ السير والفرع) — وإلّا تُشتقّ من الرسالة */
  key?: string;
}

/** الرسالةُ بلا ما يتغيّر بين تكرارات الخطأ نفسه: المعرّفات والأرقام والأوقات */
export function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<id>')
    .replace(/\b[0-9a-f]{12,}\b/g, '<hex>')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

/** FNV-1a — يعمل في Node وEdge والمتصفّح بلا crypto */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** المسارُ بلا استعلامٍ ولا معرّفات: `/orders/123?x=1` و`/orders/456` خطأٌ واحد */
export function normalizePath(path: string | null | undefined): string | null {
  if (!path) return null;
  let p = path;
  try {
    if (/^https?:\/\//.test(p)) p = new URL(p).pathname;
  } catch { /* نصٌّ غيرُ رابط */ }
  p = p.split(/[?#]/)[0];
  return p.replace(/\/[0-9a-f-]{8,}(?=\/|$)/gi, '/:id').replace(/\/\d+(?=\/|$)/g, '/:n').slice(0, 500) || '/';
}

export function fingerprintOf(input: Pick<SystemErrorInput, 'source' | 'message' | 'path' | 'key'>): string {
  if (input.key) return `${input.source}:${input.key}`.slice(0, 200);
  return `${input.source}:${hash(`${normalizeMessage(input.message)}|${normalizePath(input.path) ?? ''}`)}`;
}

/** لكلّ نسخةٍ خادمٍ: لا يُكتب الخطأ نفسُه أكثرَ من مرّةٍ في الدقيقة (حلقةٌ ترمي ألفَ مرّة = استدعاءٌ واحد) */
const recent = new Map<string, number>();
const LOCAL_DEDUPE_MS = 60_000;

export async function recordSystemError(input: SystemErrorInput): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  const message = (input.message || 'خطأٌ بلا رسالة').slice(0, 1000);
  const fingerprint = fingerprintOf({ ...input, message });
  const now = Date.now();
  const last = recent.get(fingerprint);
  if (last && now - last < LOCAL_DEDUPE_MS) return false;
  recent.set(fingerprint, now);
  if (recent.size > 500) recent.clear();

  try {
    const { createServiceClient } = await import('@/lib/supabase/server-service');
    const { error } = await createServiceClient().rpc('record_system_error', {
      p_source: input.source,
      p_level: input.level ?? 'error',
      p_fingerprint: fingerprint,
      p_message: message,
      p_detail: JSON.parse(JSON.stringify(sanitize(input.detail ?? {}))),
      p_path: normalizePath(input.path) ?? undefined,
    });
    if (error) {
      console.error(JSON.stringify({ level: 'error', message: '[system-errors] write failed', error: error.message }));
      return false;
    }
    return true;
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', message: '[system-errors] write crashed', error: String(err) }));
    return false;
  }
}

/** للاختبارات */
export function __resetSystemErrorDedupe() {
  recent.clear();
}

/**
 * يُغلق أخطاءً ببصماتٍ صريحة حين يعود مصدرُها سليماً (كرونٌ نجح، سيرُ عملٍ أخضر، نشرٌ تمّ).
 * لا يرمي. يُعيد عددَ ما أُغلق.
 */
export async function resolveSystemErrors(source: ErrorSource, keys: string[]): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || keys.length === 0) return 0;
  try {
    const { createServiceClient } = await import('@/lib/supabase/server-service');
    const { data, error } = await createServiceClient()
      .from('system_errors')
      .update({ resolved_at: new Date().toISOString() })
      .in('fingerprint', keys.map((k) => fingerprintOf({ source, key: k, message: '' })))
      .is('resolved_at', null)
      .select('id');
    if (error) return 0;
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

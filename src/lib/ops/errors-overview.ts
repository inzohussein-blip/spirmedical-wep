import { createServiceClient } from '@/lib/supabase/server-service';
import { ERROR_SOURCES, type ErrorSource } from '@/lib/ops/system-errors';
import { INGEST_SEEN_KEY, type IngestSeen } from '@/lib/ops/ci-ingest';
import type { Json } from '@/types/database';

/**
 * 🚨 ما تعرضه `/admin/errors`: الأخطاءُ المجمَّعة (0057)، وفشلُ طابور الإشعارات (لا يُنسخ — يُقرأ من
 * مكانه)، وحالةُ الربط. بعميل الخدمة — يُستدعى بعد التحقّق من دور المدير في الصفحة.
 */
export type StatusFilter = 'open' | 'resolved' | 'all';

export interface SystemErrorRow {
  id: string;
  source: ErrorSource;
  level: string;
  message: string;
  path: string | null;
  detail: Json;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
}

export interface QueueFailureGroup {
  error: string;
  channel: string;
  count: number;
  lastAt: string;
}

export interface ErrorsOverview {
  rows: SystemErrorRow[];
  /** المفتوحةُ لكلّ مصدر */
  openBySource: Record<ErrorSource, number>;
  /** ظهرت (أو تكرّرت) في آخر 24 ساعة، مفتوحةً */
  last24h: number;
  queue: QueueFailureGroup[];
  ingest: IngestSeen | null;
  /** قراءةٌ فشلت — الصفحةُ تقول ذلك بدل أن توحي بالسلامة */
  failed: boolean;
}

export const isErrorSource = (v: unknown): v is ErrorSource =>
  typeof v === 'string' && (ERROR_SOURCES as readonly string[]).includes(v);

export async function getErrorsOverview(
  { source, status }: { source: ErrorSource | null; status: StatusFilter },
  now = new Date(),
): Promise<ErrorsOverview> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - 86_400_000).toISOString();

  let list = sb
    .from('system_errors')
    .select('id, source, level, message, path, detail, occurrences, first_seen_at, last_seen_at, resolved_at')
    .order('last_seen_at', { ascending: false })
    .limit(200);
  if (source) list = list.eq('source', source);
  if (status === 'open') list = list.is('resolved_at', null);
  if (status === 'resolved') list = list.not('resolved_at', 'is', null);

  const [listRes, openRes, queueRes, ingestRes] = await Promise.all([
    list,
    sb.from('system_errors').select('source, last_seen_at').is('resolved_at', null).limit(2000),
    sb.from('notification_queue').select('error_message, channel, failed_at')
      .eq('status', 'failed').gte('failed_at', since).order('failed_at', { ascending: false }).limit(500),
    sb.from('app_settings').select('value').eq('key', INGEST_SEEN_KEY).maybeSingle(),
  ]);

  const openBySource = Object.fromEntries(ERROR_SOURCES.map((s) => [s, 0])) as Record<ErrorSource, number>;
  let last24h = 0;
  for (const r of openRes.data ?? []) {
    if (isErrorSource(r.source)) openBySource[r.source] += 1;
    if (r.last_seen_at >= since) last24h += 1;
  }

  const groups = new Map<string, QueueFailureGroup>();
  for (const q of queueRes.data ?? []) {
    const error = (q.error_message || 'بلا رسالة').slice(0, 300);
    const k = `${q.channel}|${error}`;
    const g = groups.get(k);
    if (g) g.count += 1;
    else groups.set(k, { error, channel: q.channel ?? '—', count: 1, lastAt: q.failed_at ?? '' });
  }

  return {
    rows: ((listRes.data ?? []) as SystemErrorRow[]).filter((r) => isErrorSource(r.source)),
    openBySource,
    last24h,
    queue: [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    ingest: (ingestRes.data?.value as unknown as IngestSeen | undefined) ?? null,
    failed: !!(listRes.error || openRes.error),
  };
}

/** للوحة التحكّم: عددُ المفتوح وما ظهر اليوم — لا يرمي */
export async function getOpenErrorCounts(now = new Date()): Promise<{ open: number; last24h: number; fatal: number } | null> {
  try {
    const sb = createServiceClient();
    const since = new Date(now.getTime() - 86_400_000).toISOString();
    const { data, error } = await sb.from('system_errors').select('level, last_seen_at').is('resolved_at', null).limit(2000);
    if (error) return null;
    const rows = data ?? [];
    return {
      open: rows.length,
      last24h: rows.filter((r) => r.last_seen_at >= since).length,
      fatal: rows.filter((r) => r.level === 'fatal').length,
    };
  } catch {
    return null;
  }
}

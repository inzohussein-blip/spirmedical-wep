import { createAdminClient } from '@/lib/supabase/server';
import { getWaVerifyConfig, GATEWAY_STALE_MS } from '@/lib/whatsapp/inbound-verify';
import { SERVICES } from '@/lib/services/services-data';
import { SPECIALIST_META, toSpecialistType } from '@/lib/specialist-types';

/**
 * 🩺 صحّةُ التشغيل في لوحة الإدارة — ما قِيس في 25 أيلول ولم يره أحد:
 *
 * ① صفرُ مختصّين معتمَدين، فكلُّ طلبٍ بقي معلّقاً حتى ألغاه المؤقّت.
 * ② كلُّ رسائل واتساب فشلت بـ«Authentication Error» (توكن Meta)، والطابورُ
 *    يُعيد بصمت. الخطأُ مكتوبٌ في `error_message` ولا شاشةَ تعرضه.
 *
 * عميلُ الخدمة: قائمةُ الانتظار لا يقرؤها المشرف تحت RLS (كلٌّ يرى صفوفه).
 * يُستدعى بعد التحقّق من دور المشرف في الصفحة.
 */

/** أنواعُ المختصّين التي تستلم طلباتٍ فعلاً: خدماتُ المعالج + التدفّقان المخصّصان */
export const ORDERABLE_SPECIALIST_TYPES = [
  ...new Set(
    ['lab_analyst', 'nurse', ...SERVICES.map((s) => s.specialistType ?? '')]
      .map((t) => toSpecialistType(t))
      .filter((t): t is NonNullable<typeof t> => !!t),
  ),
];

export interface SpecialistCoverage {
  type: string;
  label: string;
  approved: number;
  waiting: number;
}

export interface QueueHealth {
  /** فشلت نهائياً خلال ٢٤ ساعة */
  failed24h: number;
  /** ما تزال `pending` بعد محاولةٍ فاشلة — ستُعاد */
  retrying: number;
  lastError: string | null;
  lastErrorChannel: string | null;
  lastErrorQueuedAt: string | null;
}

/** بوّابةُ واتساب الواردة (0050) — تُحسب فقط حين يكون التحقّقُ مفعّلاً عبر Baileys */
export interface WaGatewayHealth {
  connected: boolean;
  lastSeenAt: string | null;
  /** لا نبضةَ منذ أكثر من دقيقتين — الزرّ مخفيٌّ عن العملاء */
  stale: boolean;
}

export interface OpsHealth {
  coverage: SpecialistCoverage[];
  queue: QueueHealth | null;
  waGateway: WaGatewayHealth | null;
}

export async function getOpsHealth(now = new Date()): Promise<OpsHealth> {
  const sb = createAdminClient();
  const since = new Date(now.getTime() - 86_400_000).toISOString();

  const [{ data: specialists }, { data: waiting }, failedRes, retryRes, lastErrRes] = await Promise.all([
    sb.from('users').select('specialist_type')
      .eq('role', 'specialist').eq('approval_status', 'approved')
      .or('is_suspended.is.null,is_suspended.eq.false'),
    sb.from('service_waitlist').select('specialist_type').is('notified_at', null),
    sb.from('notification_queue').select('id', { count: 'exact', head: true })
      .eq('status', 'failed').gte('failed_at', since),
    sb.from('notification_queue').select('id', { count: 'exact', head: true })
      .eq('status', 'pending').gt('attempts', 0),
    // لا عمودَ «آخر محاولة» في الطابور؛ الأحدثُ إدراجاً أقربُ تقريب
    sb.from('notification_queue').select('error_message, channel, created_at')
      .not('error_message', 'is', null)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const tally = (rows: { specialist_type: string | null }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) if (r.specialist_type) m.set(r.specialist_type, (m.get(r.specialist_type) ?? 0) + 1);
    return m;
  };
  const approved = tally(specialists);
  const waitingBy = tally(waiting);

  const coverage = ORDERABLE_SPECIALIST_TYPES.map((t) => ({
    type: t,
    label: SPECIALIST_META[t].label,
    approved: approved.get(t) ?? 0,
    waiting: waitingBy.get(t) ?? 0,
  }));

  const queueOk = !failedRes.error && !retryRes.error;
  const waGateway = await gatewayHealth(sb, now);
  const last = lastErrRes.data?.[0];
  return {
    coverage,
    queue: queueOk
      ? {
          failed24h: failedRes.count ?? 0,
          retrying: retryRes.count ?? 0,
          lastError: last?.error_message ?? null,
          lastErrorChannel: last?.channel ?? null,
          lastErrorQueuedAt: last?.created_at ?? null,
        }
      : null,
    waGateway,
  };
}

async function gatewayHealth(
  sb: ReturnType<typeof createAdminClient>,
  now: Date,
): Promise<WaGatewayHealth | null> {
  const cfg = getWaVerifyConfig();
  if (cfg.mode === 'off' || cfg.provider !== 'baileys') return null;
  const { data } = await sb
    .from('wa_gateway_status')
    .select('connected, last_seen_at')
    .eq('provider', 'baileys')
    .maybeSingle();
  if (!data) return { connected: false, lastSeenAt: null, stale: true };
  const stale = now.getTime() - new Date(data.last_seen_at).getTime() > GATEWAY_STALE_MS;
  return { connected: data.connected && !stale, lastSeenAt: data.last_seen_at, stale };
}

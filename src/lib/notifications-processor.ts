import { createServiceClient } from '@/lib/supabase/server-service';
import { sendWhatsApp } from '@/lib/whatsapp';
import { sendPushToUser } from '@/lib/services/push';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type DB = SupabaseClient<Database>;
type QueueRow = Database['public']['Tables']['notification_queue']['Row'];

/**
 * معالج طابور الإشعارات — يستعمل **service client** دائماً لأنّ صفوف
 * notification_queue محميّة بـ RLS (الكرون يعمل بلا جلسة مستخدم → anon يُحجب).
 * كان المسار السابق يستعمل عميل المستخدم فيفشل صامتاً تحت الكرون.
 */

/**
 * عنوانُ إشعار الدفع. الطابور لا يحمل عنواناً — يحمل `body` و`template_key`
 * — والقالبُ يحمل `name_ar` (مثل «إلغاء الحجز»). فيُقرأ منه ويُخبَّأ.
 *
 * والخبيئةُ على مستوى الوحدة، فتعيش بعمر نسخة الخادم لا بعمر الدفعة: لو
 * أعاد المشرفُ تسميةَ قالبٍ لظهر الاسمُ القديم حتى تُعاد النسخة. وهذا
 * مقبولٌ هنا — الاسمُ عنوانُ إشعارٍ لا بيانٌ طبّيّ — والبديلُ قراءةٌ لكلّ
 * صفّ.
 */
const NO_PUSH_SUBSCRIPTION = 'no_active_push_subscription';

const titleCache = new Map<string, string>();
const FALLBACK_TITLE = 'سباير ميديكال';

async function pushTitle(client: DB, templateKey: string | null): Promise<string> {
  if (!templateKey) return FALLBACK_TITLE;
  const cached = titleCache.get(templateKey);
  if (cached) return cached;

  const { data } = await client
    .from('notification_templates')
    .select('name_ar')
    .eq('key', templateKey)
    .maybeSingle();

  const title = data?.name_ar || FALLBACK_TITLE;
  titleCache.set(templateKey, title);
  return title;
}

/**
 * قناةُ `push`: القوالبُ الثلاثة التي تُدرجها مُشغِّلاتُ القاعدة (0029)
 * تُعلن `channel = 'push'` — وكان المعالج يردّ «channel push not
 * implemented» فتفشل كلُّها ثلاث مرّاتٍ ثمّ تُدفن في `failed`. والتنفيذُ
 * كان موجوداً أصلاً في `@/lib/services/push`، غيرَ موصولٍ بالطابور.
 */
async function deliverPush(
  client: DB,
  msg: QueueRow,
): Promise<{ ok: boolean; error?: string; provider?: string }> {
  if (!msg.recipient_user_id) {
    // الدفعُ يُرسَل إلى اشتراكات المستخدم لا إلى رقم هاتف
    return { ok: false, error: 'push requires recipient_user_id', provider: 'web-push' };
  }

  const res = await sendPushToUser(msg.recipient_user_id, {
    title: await pushTitle(client, msg.template_key),
    body: msg.body,
    tag: msg.template_key ?? undefined,
  });

  if (res.sent > 0) return { ok: true, provider: 'web-push' };
  if (res.failed > 0) {
    return { ok: false, error: `web-push failed for ${res.failed} subscription(s)`, provider: 'web-push' };
  }
  return { ok: false, error: NO_PUSH_SUBSCRIPTION, provider: 'web-push' };
}

async function deliverRow(
  client: DB,
  msg: QueueRow,
): Promise<'sent' | 'failed' | 'skipped' | 'cancelled'> {
  // مطالبة ذرّية: علّمها sending فقط إن كانت ما تزال pending (يمنع الإرسال المزدوج).
  const { data: claimed } = await client
    .from('notification_queue')
    .update({ status: 'sending', attempts: (msg.attempts ?? 0) + 1 })
    .eq('id', msg.id)
    .eq('status', 'pending')
    .select('id')
    .single();

  if (!claimed) return 'skipped';

  let result: { ok: boolean; messageId?: string; error?: string; provider?: string };
  if (msg.channel === 'whatsapp') {
    result = await sendWhatsApp({ to: msg.recipient_phone, body: msg.body });
  } else if (msg.channel === 'push') {
    result = await deliverPush(client, msg);
    // «لا اشتراك دفعٍ نشِط» ليس عطباً يُعاد: المستخدم لم يأذن بالإشعارات
    // أصلاً. فتُنهى الرسالة `cancelled` بدل أن تُحاول ثلاثاً ثمّ تُعلَن
    // فاشلةً في لوحة المشرف بلا سببٍ حقيقيّ.
    if (!result.ok && result.error === NO_PUSH_SUBSCRIPTION) {
      await client
        .from('notification_queue')
        .update({ status: 'cancelled', error_message: NO_PUSH_SUBSCRIPTION })
        .eq('id', msg.id);
      return 'cancelled';
    }
  } else {
    // SMS غير مبنيّة في هذا المسار — تبقى فاشلة بوضوح (لا ادعاء نجاح).
    result = { ok: false, error: `channel ${msg.channel} not implemented` };
  }

  if (result.ok) {
    await client
      .from('notification_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider: result.provider ?? null,
        provider_message_id: result.messageId ?? null,
      })
      .eq('id', msg.id);
    return 'sent';
  }

  const maxReached = (msg.attempts ?? 0) + 1 >= (msg.max_attempts ?? 3);
  await client
    .from('notification_queue')
    .update({
      status: maxReached ? 'failed' : 'pending',
      failed_at: maxReached ? new Date().toISOString() : null,
      error_message: result.error?.substring(0, 500) ?? 'unknown',
      provider: result.provider ?? null,
    })
    .eq('id', msg.id);
  return 'failed';
}

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  /** أُنهيت بلا إرسالٍ ولا عطب — مستخدمٌ بلا اشتراك دفعٍ نشِط */
  cancelled?: number;
  error?: string;
}

/** يعالج دفعة من الرسائل المستحقّة (pending + مجدولة الآن + دون تجاوز المحاولات). */
export async function processNotificationQueue(limit = 100): Promise<ProcessResult> {
  const client = createServiceClient();
  const now = new Date().toISOString();

  // لا مُرشِّح على `attempts` هنا: `deliverRow` هو الذي يحسم التوقّف، وهو
  // يقارن بـ`max_attempts` الخاصّ بالصفّ ثمّ يضع `failed`. ومُرشِّحُ
  // `attempts < 3` الذي كان هنا يتجاهل `max_attempts`، فصفٌّ ضُبط على خمسٍ
  // يبقى `pending` أبداً: يتخطّاه الاستعلام ولا يُعلَن فاشلاً قطّ.
  const { data: messages, error } = await client
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) return { processed: 0, succeeded: 0, failed: 0, error: error.message };
  if (!messages || messages.length === 0) return { processed: 0, succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;
  let cancelled = 0;
  for (const msg of messages) {
    const outcome = await deliverRow(client, msg);
    if (outcome === 'sent') succeeded++;
    else if (outcome === 'failed') failed++;
    else if (outcome === 'cancelled') cancelled++;
  }
  return { processed: messages.length, succeeded, failed, cancelled };
}

/**
 * إرسال فوري (best-effort) لرسالة واحدة بعد إدراجها — لإشعارات المعاملات
 * الحسّاسة للوقت (تأكيد/تعيين/إلغاء) بدل انتظار مكنسة الكرون اليومية.
 * لا يرمي أبداً؛ لو فشل تبقى الرسالة pending فيلتقطها الكرون.
 */
export async function sendQueuedNotification(id: string): Promise<void> {
  try {
    const client = createServiceClient();
    const { data: msg } = await client
      .from('notification_queue')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();
    if (!msg) return;
    await deliverRow(client, msg);
  } catch {
    // best-effort — المكنسة اليومية تلتقطها لاحقاً
  }
}

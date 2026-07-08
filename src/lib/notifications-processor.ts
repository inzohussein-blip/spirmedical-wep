import { createServiceClient } from '@/lib/supabase/server-service';
import { sendWhatsApp } from '@/lib/whatsapp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type DB = SupabaseClient<Database>;
type QueueRow = Database['public']['Tables']['notification_queue']['Row'];

/**
 * معالج طابور الإشعارات — يستعمل **service client** دائماً لأنّ صفوف
 * notification_queue محميّة بـ RLS (الكرون يعمل بلا جلسة مستخدم → anon يُحجب).
 * كان المسار السابق يستعمل عميل المستخدم فيفشل صامتاً تحت الكرون.
 */

async function deliverRow(client: DB, msg: QueueRow): Promise<'sent' | 'failed' | 'skipped'> {
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
  } else {
    // SMS/Push غير مبنيّة في هذا المسار — تبقى فاشلة بوضوح (لا ادعاء نجاح).
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
  error?: string;
}

/** يعالج دفعة من الرسائل المستحقّة (pending + مجدولة الآن + دون تجاوز المحاولات). */
export async function processNotificationQueue(limit = 100): Promise<ProcessResult> {
  const client = createServiceClient();
  const now = new Date().toISOString();

  const { data: messages, error } = await client
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .lt('attempts', 3)
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) return { processed: 0, succeeded: 0, failed: 0, error: error.message };
  if (!messages || messages.length === 0) return { processed: 0, succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;
  for (const msg of messages) {
    const outcome = await deliverRow(client, msg);
    if (outcome === 'sent') succeeded++;
    else if (outcome === 'failed') failed++;
  }
  return { processed: messages.length, succeeded, failed };
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

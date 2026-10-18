import { createServiceClient } from '@/lib/supabase/server-service';
import { logger } from '@/lib/logger';

export interface InboxMessage {
  user_id: string;
  title: string;
  body: string;
  type: string;
  link: string;
}

/**
 * يكتب في صندوق التطبيق (`/account/inbox`) لغير المستدعي — المختبر والمريض بعد تسليم العيّنة مثلاً.
 * بعميل الخدمة: `notifications` لا يقبل إدراجاً لصفّ غيرك تحت RLS. لا يرمي: الإخطارُ لا يُسقط الفعل.
 */
export async function notifyInbox(messages: InboxMessage[]): Promise<void> {
  if (messages.length === 0) return;
  try {
    const { error } = await createServiceClient().from('notifications').insert(messages);
    if (error) logger.warn('notifyInbox failed', { error: error.message, count: messages.length });
  } catch (e) {
    logger.warn('notifyInbox threw', { error: e instanceof Error ? e.message : String(e) });
  }
}

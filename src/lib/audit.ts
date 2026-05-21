import { createAdminClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export interface AuditEvent {
  action: string;
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  changes?: Json;
  metadata?: Json;
}

/**
 * تسجيل حدث في سجل التدقيق
 *
 * يستخدم admin client لأن الـ logging يجب أن يحدث حتى لو فشل الـ auth context.
 * الجدول `audit_logs` immutable — لا يمكن تعديل أو حذف السجلات.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('audit_logs').insert({
      action: event.action,
      user_id: event.user_id ?? null,
      entity_type: event.entity_type ?? null,
      entity_id: event.entity_id ?? null,
      changes: event.changes ?? null,
      metadata: event.metadata ?? null,
    });

    if (error) {
      // فشل audit logging لا يجب أن يكسر العملية الأصلية،
      // لكن يجب أن يُسجَّل في الـ console لتنبيه DevOps
      // eslint-disable-next-line no-console
      console.error('[audit] Failed to log event:', error.message, event);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] Exception:', err);
  }
}

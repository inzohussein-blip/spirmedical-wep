import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { SPECIALIST_META, toSpecialistType } from '@/lib/specialist-types';

/**
 * إخطارُ قائمة «أعلِمني حين تتوفّر» (0048) حين يُعتمد مختصٌّ من نوعها.
 *
 * يُحجَز الصفُّ أوّلاً (`notified_at` يُضبط بشرط أن يكون فارغاً) ثمّ يُكتب
 * الإشعار داخل التطبيق لمن حُجز صفُّه وحده — فاعتمادان متزامنان لا يُخطِران
 * المريضَ مرّتين. الإشعارُ في صندوق التطبيق (`/account/inbox`) لا في واتساب:
 * لا يعتمد على توكن Meta ولا على اشتراك دفع.
 *
 * عميلُ الخدمة لازم: الإدارة تكتب إشعاراتِ مستخدمين آخرين.
 */
export async function notifyServiceWaitlist(specialistType: string): Promise<number> {
  const type = toSpecialistType(specialistType);
  if (!type) return 0;

  const supabase = createAdminClient();
  const { data: claimed, error } = await supabase
    .from('service_waitlist')
    .update({ notified_at: new Date().toISOString() })
    .eq('specialist_type', type)
    .is('notified_at', null)
    .select('user_id, service_id');

  if (error) {
    logger.warn('notifyServiceWaitlist claim failed', { type, error: error.message });
    return 0;
  }
  if (!claimed?.length) return 0;

  const label = SPECIALIST_META[type].label;
  const rows = claimed.map((r) => ({
    user_id: r.user_id,
    type: 'service_available',
    title: 'الخدمة التي طلبتَها متاحةٌ الآن',
    body: `انضمّ مختصٌّ (${label}) إلى المنصّة، ويمكنك رفعُ طلبك الآن.`,
    link: r.service_id ? `/appointments/new?service=${encodeURIComponent(r.service_id)}` : '/appointments/new',
    metadata: { specialist_type: type },
  }));

  const { error: insErr } = await supabase.from('notifications').insert(rows);
  if (insErr) {
    logger.error('notifyServiceWaitlist insert failed', { type, error: insErr.message });
    return 0;
  }
  return rows.length;
}

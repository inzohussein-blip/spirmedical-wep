/**
 * ════════════════════════════════════════════════════════════════════
 * 🚦 حالاتُ الطلب — مصدرٌ واحد للويب (وتطبيق «برو» يكتبها عبر `transition_order`)
 * ════════════════════════════════════════════════════════════════════
 *
 *   pending → confirmed → on_the_way → arrived → in_progress → completed
 *                                                            ↘ cancelled
 *
 * `on_the_way` و`arrived` أُضيفتا في 0064 (تطبيق المختصّ — «انطلقت/وصلت»).
 * الويب لا يكتبهما، لكنّه **يجب أن يعرضهما**: طلبٌ يقوده التطبيق قد يكون فيهما.
 * أيُّ قائمةٍ أو مرشّحٍ بالحالات «الجارية» يأخذها من هنا لا من مصفوفةٍ محلّية،
 * وإلّا اختفى الطلبُ من «طلباتي» و«الحيّة» أثناء توجّه المختصّ إليه.
 *
 * الحارس: tests/order-status-coverage.test.ts
 * ════════════════════════════════════════════════════════════════════
 */
import type { Database } from '@/types/database';

export type OrderStatus = Database['public']['Enums']['appointment_status'];

/** كلُّ الحالات بترتيبها */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'on_the_way',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
] as const satisfies readonly OrderStatus[];

/** طلبٌ لم ينتهِ بعد (يظهر في «الحيّة» و«القادمة» وبطاقة الطلب النشط) */
export const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'on_the_way', 'arrived', 'in_progress'] as const satisfies readonly OrderStatus[];

/** مُسنَدٌ إلى مختصّ ولم يكتمل (طلبات المختصّ «قيد التنفيذ») */
export const IN_FLIGHT_STATUSES = ['confirmed', 'on_the_way', 'arrived', 'in_progress'] as const satisfies readonly OrderStatus[];

/** العنوانُ العربيّ لكلّ حالة (للمريض والإدارة) */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'بانتظار التأكيد',
  confirmed: 'مؤكّد',
  on_the_way: 'في الطريق',
  arrived: 'وصل المختص',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

/** ترتيبُ الحالة في المسار (للخطوط الزمنيّة) — الإلغاءُ خارجه */
export function orderStatusRank(status: string | null | undefined): number {
  const i = (ORDER_STATUSES as readonly string[]).indexOf(status ?? '');
  return status === 'cancelled' ? -1 : i;
}

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🩺 هل يوجد مختصٌّ يستلم هذا الطلب؟
 * ════════════════════════════════════════════════════════════════════
 *
 * في 25 أيلول كان في المنصّة صفرُ مختصّين، فبقيت الطلبات الثلاثة كلُّها معلّقةً
 * حتى ألغاها الرفضُ التلقائيّ بعد ٤٨ ساعة. قبولُ طلبٍ لا أحدَ يستلمه وعدٌ كاذب
 * للمريض؛ فتُسأل هذه الدالّة قبل الرفع، ويُعرض «أعلِمني حين تتوفّر» بدلاً منه.
 *
 * المعيار هو نفسه الذي يحدّد مَن يُخطَر بالطلب الجديد
 * (`notifyEligibleSpecialistsOfNewOrder`): مختصٌّ من النوع المطلوب، معتمَد،
 * غيرُ موقوف. معيارٌ واحد في موضعٍ واحد — وإلّا قَبِل الحارسُ طلباً لا يصل
 * إشعارُه إلى أحد، أو ردَّ طلباً كان سيُستلم.
 *
 * عميلُ الخدمة لازم: المريض لا يقرأ صفوفَ المختصّين (RLS).
 *
 * ─── فشلٌ مفتوح مقصود ───
 * إن تعذّر السؤال (انقطاع، صلاحية) يُعتبر المختصّ متاحاً. عطبٌ في استعلامٍ
 * لا يجوز أن يمنع مريضاً من طلب خدمةٍ طبّية؛ وأسوأ ما في الفتح أن يعود
 * السلوكُ القديم (طلبٌ يُلغى بعد يومين)، وهو أهونُ من منعٍ صامت.
 * ════════════════════════════════════════════════════════════════════
 */

/** المختصّون الذين يستلمون طلبات نوعٍ ما — المعيار الموحّد */
export async function eligibleSpecialistIds(
  specialistType: string,
  limit = 100,
): Promise<string[] | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'specialist')
    .eq('specialist_type', specialistType)
    .eq('approval_status', 'approved')
    .or('is_suspended.is.null,is_suspended.eq.false')
    .limit(limit);
  if (error) {
    logger.warn('eligibleSpecialistIds lookup failed', { specialistType, error: error.message });
    return null;
  }
  return (data ?? []).map((r: { id: string }) => r.id);
}

/** هل يوجد مختصٌّ واحدٌ على الأقلّ؟ يفشل مفتوحاً (true) إن تعذّر السؤال. */
export async function isSpecialistAvailable(specialistType: string | null | undefined): Promise<boolean> {
  if (!specialistType) return true; // خدمةٌ تُنفَّذ في منشأة — لا مختصَّ مُرسَل
  const ids = await eligibleSpecialistIds(specialistType, 1);
  return ids === null ? true : ids.length > 0;
}

/** أنواعُ المختصّين غير المتاحة من بين قائمة — لتعطيل خدماتها في المعالج. */
export async function unavailableSpecialistTypes(types: string[]): Promise<string[]> {
  const unique = [...new Set(types.filter(Boolean))];
  const results = await Promise.all(unique.map(async (t) => [t, await isSpecialistAvailable(t)] as const));
  return results.filter(([, ok]) => !ok).map(([t]) => t);
}

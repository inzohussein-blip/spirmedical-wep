/**
 * 🔒 حسم حالة اعتماد الحساب عند التسجيل
 *
 * مستخرَجة في وحدة مستقلّة كي تكون **قابلة للاختبار**: ملفات `'use server'`
 * لا تسمح بتصدير دوال غير async، والمنطق هنا حسّاس أمنياً بما يكفي ليُختبَر.
 *
 * الخلفية (ثغرة أُصلحت): كان الشرط «لا يوجد ملف سابق» يُنتج `approved` لأي
 * مختصّ لديه ملف. وبما أنّ البحث يتمّ بالهاتف والكتابة upsert تستبدل الدور
 * والاعتماد، كان بالإمكان التسجيل كمريض ثمّ إعادة التسجيل كمختصّ بالرقم نفسه
 * للحصول على **اعتماد فوري** بلا مراجعة الإدارة — ومعه الوصول إلى بيانات
 * المرضى وقبول الطلبات الطبّية.
 */

export type AccountRole = 'patient' | 'specialist';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ExistingProfileSnapshot {
  role?: string | null;
  approval_status?: string | null;
}

/**
 * المرضى معتمدون تلقائياً. المختصّون يبدأون `pending` **دائماً**، ولا يُحتفظ
 * بالاعتماد إلا لمن كان مختصّاً معتمَداً بالفعل (كي لا تُسقط إعادةُ التسجيل
 * اعتماداً قائماً).
 */
export function resolveApprovalStatus(
  role: AccountRole,
  existingProfile?: ExistingProfileSnapshot | null
): ApprovalStatus {
  if (role !== 'specialist') return 'approved';

  const wasApprovedSpecialist =
    existingProfile?.role === 'specialist' &&
    existingProfile?.approval_status === 'approved';

  return wasApprovedSpecialist ? 'approved' : 'pending';
}

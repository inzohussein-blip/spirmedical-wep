/**
 * نظام الصلاحيات و Guest Mode
 *
 * الاستخدام:
 *   const { canSubmit, canEdit, isGuest } = usePermissions();
 *
 *   <button disabled={!canSubmit}>طلب سحب دم</button>
 */

export type UserRole = 'guest' | 'patient' | 'specialist' | 'admin';

export interface Permissions {
  // قراءة
  canView: boolean;
  canSearch: boolean;

  // كتابة
  canSubmit: boolean; // إرسال طلبات
  canEdit: boolean; // تعديل البيانات
  canDelete: boolean; // حذف
  canBook: boolean; // حجز موعد
  canChat: boolean; // محادثة طبيب
  canUpload: boolean; // رفع ملفات

  // مالية
  canPay: boolean; // الدفع
  canPurchase: boolean; // الشراء

  // عائلية
  canManageFamily: boolean;
  canAddMembers: boolean;

  // طوارئ
  canSOS: boolean;

  // علم بصري
  isGuest: boolean;
  showLocks: boolean; // عرض أيقونات القفل
}

const PERMISSIONS_BY_ROLE: Record<UserRole, Permissions> = {
  guest: {
    canView: true,
    canSearch: true,
    canSubmit: false,
    canEdit: false,
    canDelete: false,
    canBook: false,
    canChat: false,
    canUpload: false,
    canPay: false,
    canPurchase: false,
    canManageFamily: false,
    canAddMembers: false,
    canSOS: true, // الطوارئ متاحة للضيف!
    isGuest: true,
    showLocks: true,
  },
  patient: {
    canView: true,
    canSearch: true,
    canSubmit: true,
    canEdit: true,
    canDelete: true,
    canBook: true,
    canChat: true,
    canUpload: true,
    canPay: true,
    canPurchase: true,
    canManageFamily: true,
    canAddMembers: true,
    canSOS: true,
    isGuest: false,
    showLocks: false,
  },
  specialist: {
    canView: true,
    canSearch: true,
    canSubmit: true,
    canEdit: true,
    canDelete: true,
    canBook: false, // الأخصائي لا يحجز
    canChat: true,
    canUpload: true,
    canPay: false,
    canPurchase: false,
    canManageFamily: false,
    canAddMembers: false,
    canSOS: true,
    isGuest: false,
    showLocks: false,
  },
  admin: {
    canView: true,
    canSearch: true,
    canSubmit: true,
    canEdit: true,
    canDelete: true,
    canBook: true,
    canChat: true,
    canUpload: true,
    canPay: true,
    canPurchase: true,
    canManageFamily: true,
    canAddMembers: true,
    canSOS: true,
    isGuest: false,
    showLocks: false,
  },
};

export function getPermissions(role: UserRole): Permissions {
  return PERMISSIONS_BY_ROLE[role];
}

/**
 * فحص إذا الميزة مقفلة (للضيف)
 */
export function isFeatureLocked(
  role: UserRole,
  feature: keyof Omit<Permissions, 'isGuest' | 'showLocks' | 'canView' | 'canSearch'>
): boolean {
  const perms = getPermissions(role);
  return !perms[feature];
}

/**
 * رسائل التشجيع للضيف (Upsell messages)
 */
export const guestUpsellMessages = {
  canSubmit: 'سجّل الآن لإرسال طلبات الخدمات الطبية',
  canBook: 'سجّل الآن لحجز المواعيد',
  canChat: 'سجّل الآن للتحدث مع الأطباء',
  canUpload: 'سجّل الآن لرفع ملفاتك الطبية',
  canPay: 'سجّل الآن لإجراء الدفع',
  canPurchase: 'سجّل الآن للشراء',
  canManageFamily: 'سجّل الآن لإدارة حسابات العائلة',
  canEdit: 'سجّل الآن لتعديل البيانات',
};

/**
 * Hook للاستخدام السهل في React
 */
export function getRoleFromContext(): UserRole {
  // في الإنتاج: اقرأ من Supabase session
  // للضيف: ارجع 'guest'
  if (typeof window === 'undefined') return 'guest';

  // فحص بسيط من URL
  const path = window.location.pathname;
  if (path.startsWith('/guest')) return 'guest';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/specialist')) return 'specialist';
  return 'patient'; // افتراضي للمستخدم المسجّل
}

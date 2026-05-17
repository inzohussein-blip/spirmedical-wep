// نظام الإدارة — الأدوار والصلاحيات

export type AdminRole = 'super_admin' | 'manager' | 'support' | 'admin';

export interface AdminRoleMeta {
  role: AdminRole;
  label: string;
  icon: string;
  color: string;
  description: string;
  permissions: Permission[];
}

export type Permission =
  // اختصاصيون
  | 'specialists.view'
  | 'specialists.approve'
  | 'specialists.reject'
  | 'specialists.suspend'
  | 'specialists.edit'
  // مرضى
  | 'patients.view'
  | 'patients.edit'
  | 'patients.suspend'
  | 'patients.delete'
  | 'patients.notes'
  | 'patients.tags'
  // طلبات
  | 'orders.view'
  | 'orders.assign'
  | 'orders.cancel'
  | 'orders.edit'
  // تقارير
  | 'reports.view'
  | 'reports.export'
  // إدارة
  | 'admins.manage'
  | 'settings.edit'
  // CRM
  | 'campaigns.manage'
  | 'coupons.manage';

export const ADMIN_ROLES: Record<AdminRole, AdminRoleMeta> = {
  super_admin: {
    role: 'super_admin',
    label: 'مدير عام',
    icon: '👑',
    color: '#A82E3D',
    description: 'صلاحيات كاملة على كل النظام',
    permissions: [
      'specialists.view', 'specialists.approve', 'specialists.reject', 'specialists.suspend', 'specialists.edit',
      'patients.view', 'patients.edit', 'patients.suspend', 'patients.delete', 'patients.notes', 'patients.tags',
      'orders.view', 'orders.assign', 'orders.cancel', 'orders.edit',
      'reports.view', 'reports.export',
      'admins.manage', 'settings.edit',
      'campaigns.manage', 'coupons.manage',
    ],
  },
  admin: {
    role: 'admin',
    label: 'مدير',
    icon: '👑',
    color: '#A82E3D',
    description: 'مدير عام (متوافق مع النظام القديم)',
    permissions: [
      'specialists.view', 'specialists.approve', 'specialists.reject', 'specialists.suspend', 'specialists.edit',
      'patients.view', 'patients.edit', 'patients.suspend', 'patients.delete', 'patients.notes', 'patients.tags',
      'orders.view', 'orders.assign', 'orders.cancel', 'orders.edit',
      'reports.view', 'reports.export',
      'admins.manage', 'settings.edit',
      'campaigns.manage', 'coupons.manage',
    ],
  },
  manager: {
    role: 'manager',
    label: 'مدير عمليات',
    icon: '👔',
    color: '#B8540C',
    description: 'يدير الاختصاصيين والطلبات والتقارير',
    permissions: [
      'specialists.view', 'specialists.approve', 'specialists.reject', 'specialists.suspend',
      'patients.view', 'patients.edit', 'patients.notes', 'patients.tags',
      'orders.view', 'orders.assign', 'orders.cancel', 'orders.edit',
      'reports.view', 'reports.export',
      'campaigns.manage', 'coupons.manage',
    ],
  },
  support: {
    role: 'support',
    label: 'دعم فني',
    icon: '🎧',
    color: '#534AB7',
    description: 'يساعد المرضى ويتابع الطلبات (قراءة فقط في معظم الأمور)',
    permissions: [
      'specialists.view',
      'patients.view', 'patients.notes', 'patients.tags',
      'orders.view',
      'reports.view',
    ],
  },
};

export const ADMIN_ROLE_KEYS: AdminRole[] = ['super_admin', 'admin', 'manager', 'support'];

/**
 * هل هذا الدور admin؟
 */
export function isAdminRole(role: string | null | undefined): role is AdminRole {
  if (!role) return false;
  return ADMIN_ROLE_KEYS.includes(role as AdminRole);
}

/**
 * هل المستخدم super admin؟
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'admin';
}

/**
 * هل عنده هذه الصلاحية؟
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!isAdminRole(role)) return false;
  return ADMIN_ROLES[role].permissions.includes(permission);
}

/**
 * تسميات أنواع الإجراءات الإدارية (للـ audit log)
 */
export const ACTION_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  'approve_specialist': { label: 'الموافقة على اختصاصي', icon: '✅' },
  'reject_specialist': { label: 'رفض اختصاصي', icon: '❌' },
  'suspend_user': { label: 'تعليق مستخدم', icon: '⛔' },
  'unsuspend_user': { label: 'إلغاء التعليق', icon: '▶️' },
  'edit_user': { label: 'تعديل مستخدم', icon: '✏️' },
  'add_patient_tag': { label: 'إضافة تصنيف', icon: '🏷️' },
  'remove_patient_tag': { label: 'حذف تصنيف', icon: '🗑️' },
  'add_patient_note': { label: 'إضافة ملاحظة', icon: '📝' },
  'cancel_appointment': { label: 'إلغاء موعد', icon: '🚫' },
  'assign_appointment': { label: 'تعيين موعد', icon: '🎯' },
  'create_campaign': { label: 'إنشاء حملة', icon: '📧' },
  'create_coupon': { label: 'إنشاء كوبون', icon: '🎁' },
  'export_report': { label: 'تصدير تقرير', icon: '📥' },
};

/**
 * ════════════════════════════════════════════════════════════════════
 * مسار «بيت» المستخدم بعد الدخول — مصدر واحد
 * ════════════════════════════════════════════════════════════════════
 *
 * كان منطق «حسب الدور → أين نذهب» مكرّراً في 8 ملفات بصيَغ متعارضة
 * (بعضها يرسل manager/support إلى /dashboard وبعضها إلى /admin). هذا المصدر
 * الموحّد يضمن أنّ الدخول يقود دائماً إلى **واجهة التطبيق** لا التسويق.
 * ════════════════════════════════════════════════════════════════════
 */

/** أدوار لوحة الإدارة (كلها → /admin). */
const ADMIN_ROLES = ['admin', 'super_admin', 'manager', 'support'];

/**
 * يُرجع مسار الوجهة داخل التطبيق حسب دور المستخدم.
 *   specialist → /specialist · admin/إدارة → /admin · غيرهم (مريض) → /dashboard
 */
export function getRoleHomePath(role?: string | null): string {
  if (role === 'specialist') return '/specialist';
  if (role && ADMIN_ROLES.includes(role)) return '/admin';
  return '/dashboard';
}

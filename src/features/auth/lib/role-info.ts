/**
 * ═══════════════════════════════════════════════════════════════
 * 👥 Role Metadata
 * ═══════════════════════════════════════════════════════════════
 *
 * معلومات ثابتة لكل نوع حساب: الأيقونة، العنوان، الوصف.
 * (Icons من lucide-react تُمرَّر كمرجع خارجي)
 */

import type { Role } from '../types';

export interface RoleMetadata {
  iconName: 'User' | 'Stethoscope' | 'Eye' | 'ShieldCheck';
  label: string;
  hint: string;
  description: string;
}

export const ROLE_INFO: Record<Role, RoleMetadata> = {
  guest: {
    iconName: 'Eye',
    label: 'وضع الضيف',
    hint: 'تصفّح بدون تسجيل · بعض الميزات مقفلة',
    description: 'استكشف المنصة بدون حساب',
  },
  patient: {
    iconName: 'User',
    label: 'مراجع',
    hint: 'الوصول لجميع الخدمات الطبية',
    description: 'ابحث عن طبيب، احجز موعد، استشر أونلاين',
  },
  specialist: {
    iconName: 'Stethoscope',
    label: 'أخصائي',
    hint: 'لوحة تقديم الخدمات الطبية',
    description: 'لوحة الأخصائي الصحي لإدارة عيادتك',
  },
  admin:        { iconName: 'ShieldCheck', label: 'مدير', hint: '', description: '' },
  super_admin:  { iconName: 'ShieldCheck', label: 'مدير عام', hint: '', description: '' },
  manager:      { iconName: 'ShieldCheck', label: 'مسؤول', hint: '', description: '' },
  support:      { iconName: 'ShieldCheck', label: 'دعم', hint: '', description: '' },
};

/**
 * أي الأدوار يجب أن تظهر في tabs تسجيل الدخول
 */
export const PUBLIC_ROLES: ReadonlyArray<Role> = ['patient', 'specialist'];

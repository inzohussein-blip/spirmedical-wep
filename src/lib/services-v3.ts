/**
 * ════════════════════════════════════════════════════════════════════
 * 🏥 V26.0: Services Config - 14 Medical Services
 * ════════════════════════════════════════════════════════════════════
 * المرجع: docs/spir-v3-design-reference.md (Section 12)
 * ════════════════════════════════════════════════════════════════════
 */

import {
  IconDroplet,         // سحب الدم
  IconVaccine,         // التمريض
  IconStethoscope,     // طبيب العائلة
  IconBuildingHospital,// المستشفيات
  IconPill,            // الصيدلية
  IconMessage2,        // الاستشارات
  IconDental,          // الأسنان
  IconApple,           // التغذية
  IconVaccineBottle,   // اللقاحات
  IconAlertTriangle,   // الطوارئ
  IconVideo,           // فيديو
  IconSearch,          // الأعراض
  IconCalculator,      // المخاطر
  IconCalendarCheck,   // جدول اللقاحات
} from '@tabler/icons-react';

export type ServiceBadge = 'الأكثر طلباً' | 'جديد' | 'قريباً' | null;

export interface ServiceConfig {
  id: string;
  title: string;
  description: string;
  icon: typeof IconDroplet;
  color: string;
  softBg: string;
  badge?: ServiceBadge;
  route: string;
}

export const SERVICES_V3: ServiceConfig[] = [
  {
    id: 'blood',
    title: 'سحب الدم والتحاليل',
    description: 'فني مختبر يأتي لمنزلك',
    icon: IconDroplet,
    color: '#EA4335',
    softBg: '#FCE8E6',
    badge: 'الأكثر طلباً',
    route: '/services/blood-draw',
  },
  {
    id: 'nursing',
    title: 'التمريض المنزلي',
    description: 'إبر · مغذيات · رعاية',
    icon: IconVaccine,
    color: '#B06000',
    softBg: '#FEF7E0',
    route: '/services/home-nursing',
  },
  {
    id: 'doctor',
    title: 'طبيب العائلة',
    description: 'استشارة فورية',
    icon: IconStethoscope,
    color: '#01875F',
    softBg: '#E6F3EF',
    badge: 'جديد',
    route: '/services/doctors',
  },
  {
    id: 'hospital',
    title: 'المستشفيات',
    description: 'دليل + حجوزات',
    icon: IconBuildingHospital,
    color: '#1A73E8',
    softBg: '#E8F0FE',
    route: '/services/hospitals',
  },
  {
    id: 'pharmacy',
    title: 'الصيدلية',
    description: 'احجز دواءك',
    icon: IconPill,
    color: '#9334E6',
    softBg: '#F3E8FD',
    route: '/services/pharmacies',
  },
  {
    id: 'consult',
    title: 'الاستشارات',
    description: 'دردشة مع طبيب',
    icon: IconMessage2,
    color: '#00BCD4',
    softBg: '#E0F7FA',
    route: '/services/consultation',
  },
  {
    id: 'dental',
    title: 'طب الأسنان',
    description: 'عيادات معتمدة',
    icon: IconDental,
    color: '#00838F',
    softBg: '#E0F7FA',
    route: '/services/dental',
  },
  {
    id: 'nutrition',
    title: 'التغذية',
    description: 'برامج صحية',
    icon: IconApple,
    color: '#34A853',
    softBg: '#E8F5E9',
    route: '/services/nutrition',
  },
  {
    id: 'vaccines',
    title: 'اللقاحات',
    description: 'حجز جرعات',
    icon: IconVaccineBottle,
    color: '#FF6D00',
    softBg: '#FFF3E0',
    badge: 'قريباً',
    route: '/services/vaccines',
  },
  {
    id: 'emergency',
    title: 'طوارئ SOS',
    description: 'تواصل فوري',
    icon: IconAlertTriangle,
    color: '#8B0000',
    softBg: '#FCE8E6',
    route: '/services/emergency',
  },
  {
    id: 'video',
    title: 'استشارة فيديو',
    description: 'مكالمة مباشرة',
    icon: IconVideo,
    color: '#7C4DFF',
    softBg: '#EDE7F6',
    route: '/services/doctors?video=true',
  },
  {
    id: 'symptom',
    title: 'فحص الأعراض',
    description: 'تشخيص أولي',
    icon: IconSearch,
    color: '#00897B',
    softBg: '#E0F2F1',
    badge: 'قريباً',
    route: '/services/symptoms',
  },
  {
    id: 'risk',
    title: 'حاسبة المخاطر',
    description: 'تقييم صحي',
    icon: IconCalculator,
    color: '#FF7043',
    softBg: '#FBE9E7',
    badge: 'قريباً',
    route: '/services/risk',
  },
  {
    id: 'vaccine-table',
    title: 'جدول اللقاحات',
    description: 'لقاحات الطفل',
    icon: IconCalendarCheck,
    color: '#26A69A',
    softBg: '#E0F2F1',
    badge: 'قريباً',
    route: '/services/vaccine-schedule',
  },
];

// الخدمة المميزة (سحب الدم)
export const FEATURED_SERVICE = SERVICES_V3[0];

// باقي الخدمات (للـ Bento Grid)
export const BENTO_SERVICES = SERVICES_V3.slice(1);

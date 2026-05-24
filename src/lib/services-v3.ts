/**
 * ════════════════════════════════════════════════════════════════════
 * 🏥 V26.2: Services Config - 14 Medical Services + Smart Tools
 * ════════════════════════════════════════════════════════════════════
 * routes الصحيحة + فصل tools عن services
 * ════════════════════════════════════════════════════════════════════
 */

import {
  IconDroplet, IconVaccine, IconStethoscope, IconBuildingHospital,
  IconPill, IconMessage2, IconDental, IconApple, IconVaccineBottle,
  IconEye, IconBrain, IconRun, IconSparkles, IconAlertOctagon,
  IconFirstAidKit, IconCalculator, IconSearch, IconCalendarEvent,
  IconBell, IconClipboardList, IconChartLine, IconHome2,
} from '@tabler/icons-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';

export type ServiceBadge = 'الأكثر طلباً' | 'جديد' | 'قريباً' | null;

export interface ServiceConfig {
  id: string;
  title: string;
  description: string;
  icon: TablerIcon;
  color: string;
  softBg: string;
  badge?: ServiceBadge;
  route: string;
}

// ⭐ FEATURED - الخدمة المميّزة (سحب الدم - 90%)
export const FEATURED_SERVICE: ServiceConfig = {
  id: 'blood-draw',
  title: 'سحب الدم والتحاليل',
  description: 'فني مختبر يأتي لمنزلك',
  icon: IconDroplet,
  color: '#EA4335',
  softBg: '#FCE8E6',
  badge: 'الأكثر طلباً',
  route: '/appointments/new?service=blood-draw',
};

// 🏥 الخدمات الرئيسية (15 خدمة - بدون سحب الدم)
export const CORE_SERVICES: ServiceConfig[] = [
  { id: 'nursing', title: 'التمريض المنزلي', description: 'إبر · جروح · كانيولا', icon: IconVaccine, color: '#B06000', softBg: '#FEF7E0', route: '/appointments/new?service=home-nursing' },
  { id: 'doctor', title: 'طبيب العائلة', description: 'استشارة فورية', icon: IconStethoscope, color: '#01875F', softBg: '#E6F3EF', badge: 'جديد', route: '/services/doctors' },
  { id: 'hospital', title: 'المستشفيات', description: 'دليل + حجوزات', icon: IconBuildingHospital, color: '#1A73E8', softBg: '#E8F0FE', route: '/services/hospitals' },
  { id: 'pharmacy', title: 'الصيدلية', description: 'احجز دواءك', icon: IconPill, color: '#9334E6', softBg: '#F3E8FD', route: '/services/pharmacies' },
  { id: 'consult', title: 'استشاراتي', description: 'نص + صور · 24س', icon: IconMessage2, color: '#00BCD4', softBg: '#E0F7FA', route: '/consultations' },
  { id: 'reminders', title: 'تنبيهات', description: 'دواء · مواعيد', icon: IconBell, color: '#FBBC04', softBg: '#FEF7E0', route: '/account/reminders' },
  { id: 'prescriptions', title: 'وصفاتي', description: 'كل وصفاتك', icon: IconClipboardList, color: '#5F6368', softBg: '#F1F3F4', route: '/account/prescriptions' },
  { id: 'health', title: 'لوحة الصحة', description: 'ضغط · سكر', icon: IconChartLine, color: '#34A853', softBg: '#E8F5E9', route: '/account/health' },
  { id: 'physio', title: 'العلاج الطبيعي', description: 'جلسات منزلية', icon: IconRun, color: '#7C4DFF', softBg: '#EDE7F6', route: '/services/physio' },
  { id: 'dental', title: 'طب الأسنان', description: 'تقويم · زراعة', icon: IconDental, color: '#00838F', softBg: '#E0F7FA', badge: 'جديد', route: '/services/dental' },
  { id: 'optical', title: 'النظارات الطبية', description: 'فحص · إطارات', icon: IconEye, color: '#FF6D00', softBg: '#FFF3E0', badge: 'جديد', route: '/services/optical' },
  { id: 'mental-health', title: 'الصحة النفسية', description: 'سرية · علاج', icon: IconBrain, color: '#C71C56', softBg: '#FCE8E6', badge: 'جديد', route: '/services/mental-health' },
  { id: 'nutrition', title: 'التغذية والحمية', description: 'إنقاص وزن · سكري', icon: IconApple, color: '#34A853', softBg: '#E8F5E9', badge: 'جديد', route: '/services/nutrition' },
  { id: 'cosmetic', title: 'التجميل والعناية', description: 'منتجات معتمدة', icon: IconSparkles, color: '#9334E6', softBg: '#F3E8FD', route: '/services/cosmetic' },
  { id: 'vaccines', title: 'اللقاحات', description: 'جدول التطعيم', icon: IconVaccineBottle, color: '#FF6D00', softBg: '#FFF3E0', badge: 'جديد', route: '/services/vaccines' },
];

// 🛠️ SMART TOOLS - الأدوات الذكية (4 أدوات منفصلة)
export const SMART_TOOLS: ServiceConfig[] = [
  { id: 'risk-calculator', title: 'حاسبة المخاطر', description: 'قيّم حالتك في ٣٠ ثانية', icon: IconCalculator, color: '#FF7043', softBg: '#FBE9E7', route: '/tools/risk-calculator' },
  { id: 'symptom-checker', title: 'مدقّق الأعراض', description: 'حدّد توجّهك الطبي', icon: IconSearch, color: '#00897B', softBg: '#E0F2F1', route: '/tools/symptom-checker' },
  { id: 'first-aid', title: 'الإسعافات الأولية', description: 'دليل لـ ١٠+ حالات', icon: IconFirstAidKit, color: '#EA4335', softBg: '#FCE8E6', route: '/tools/first-aid' },
  { id: 'vaccinations-schedule', title: 'جدول التطعيمات', description: '١٨ لقاح حسب العمر', icon: IconCalendarEvent, color: '#26A69A', softBg: '#E0F2F1', route: '/tools/vaccinations' },
];

// 🚨 EMERGENCY - الطوارئ
export const EMERGENCY_SERVICE: ServiceConfig = {
  id: 'sos',
  title: 'طوارئ SOS',
  description: 'استجابة فورية · ١٢٢',
  icon: IconAlertOctagon,
  color: '#8B0000',
  softBg: '#FCE8E6',
  route: '/sos',
};

// 📦 PROMO CARDS - بطاقات إعلانية
export interface PromoCard {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  href: string;
  icon: TablerIcon;
  color: string;
  bg: string;
}

export const PROMO_CARDS: PromoCard[] = [
  { id: 'home-services', tag: 'جديد', title: 'خدمات منزلية', subtitle: 'سحب دم · إبر · تمريض · بأسرع وقت', href: '/appointments/new', icon: IconHome2, color: '#01875F', bg: '#E6F3EF' },
];

// 📐 Aliases (legacy)
export const BENTO_SERVICES = CORE_SERVICES;
export const SERVICES_V3 = [FEATURED_SERVICE, ...CORE_SERVICES];

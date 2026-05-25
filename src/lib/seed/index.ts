/**
 * ═══════════════════════════════════════════════════════════════
 * 📦 Seed Data Index — Manager Configuration (V26.10 + V26.11)
 * ═══════════════════════════════════════════════════════════════
 */

import { HOSPITALS_SEED } from './hospitals';
import { PHARMACIES_SEED } from './pharmacies';
import { DOCTORS_SEED } from './doctors';
import { DENTAL_CLINICS_SEED, OPTICAL_STORES_SEED } from './dental-optical';
import { MENTAL_HEALTH_SEED, NUTRITIONISTS_SEED } from './mental-nutrition';
// V26.11 - New categories
import { PARTNER_LABS_SEED } from './labs';
import { VACCINES_SEED } from './vaccines';
import { MEDICATIONS_SEED } from './medications';
import { PHYSIO_SPECIALISTS_SEED, COSMETIC_PRODUCTS_SEED } from './physio-cosmetic';

export type SeedCategory =
  | 'hospitals'
  | 'pharmacies'
  | 'doctors'
  | 'dental_clinics'
  | 'optical_stores'
  | 'mental_health_specialists'
  | 'nutritionists'
  | 'partner_labs'
  | 'vaccines'
  | 'medications'
  | 'physio_specialists'
  | 'cosmetic_products';

export interface SeedCategoryConfig {
  category: SeedCategory;
  table: string;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  description: string;
  count: number;
  data: Record<string, unknown>[];
  uniqueFields: string[];
}

export const SEED_CATEGORIES: Record<SeedCategory, SeedCategoryConfig> = {
  hospitals: {
    category: 'hospitals',
    table: 'hospitals',
    label: 'المستشفيات',
    labelEn: 'Hospitals',
    icon: '🏥',
    color: '#1A73E8',
    description: 'مستشفيات حكومية وأهلية في النجف وبغداد وكربلاء والبصرة',
    count: HOSPITALS_SEED.length,
    data: HOSPITALS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name', 'city'],
  },
  pharmacies: {
    category: 'pharmacies',
    table: 'pharmacies',
    label: 'الصيدليات',
    labelEn: 'Pharmacies',
    icon: '💊',
    color: '#9334E6',
    description: 'صيدليات معتمدة في النجف وبغداد وكربلاء',
    count: PHARMACIES_SEED.length,
    data: PHARMACIES_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name', 'city'],
  },
  doctors: {
    category: 'doctors',
    table: 'doctors',
    label: 'الأطباء',
    labelEn: 'Doctors',
    icon: '⚕️',
    color: '#01875F',
    description: 'أطباء عامون ومتخصّصون (أطفال، باطنية، جلدية، نسائية)',
    count: DOCTORS_SEED.length,
    data: DOCTORS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['full_name', 'specialty'],
  },
  dental_clinics: {
    category: 'dental_clinics',
    table: 'dental_clinics',
    label: 'عيادات الأسنان',
    labelEn: 'Dental Clinics',
    icon: '🦷',
    color: '#00838F',
    description: 'عيادات أسنان شاملة - تنظيف، حشوات، تقويم، زراعة',
    count: DENTAL_CLINICS_SEED.length,
    data: DENTAL_CLINICS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name', 'city'],
  },
  optical_stores: {
    category: 'optical_stores',
    table: 'optical_stores',
    label: 'متاجر البصريات',
    labelEn: 'Optical Stores',
    icon: '👓',
    color: '#FF6D00',
    description: 'فحص نظر + نظارات طبية وشمسية + عدسات لاصقة',
    count: OPTICAL_STORES_SEED.length,
    data: OPTICAL_STORES_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name', 'city'],
  },
  mental_health_specialists: {
    category: 'mental_health_specialists',
    table: 'mental_health_specialists',
    label: 'المختصّون النفسيون',
    labelEn: 'Mental Health',
    icon: '🧠',
    color: '#C71C56',
    description: 'أطباء نفسيون + مرشدون + علاج معرفي سلوكي',
    count: MENTAL_HEALTH_SEED.length,
    data: MENTAL_HEALTH_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['full_name'],
  },
  nutritionists: {
    category: 'nutritionists',
    table: 'nutritionists',
    label: 'أخصّائيو التغذية',
    labelEn: 'Nutritionists',
    icon: '🥗',
    color: '#34A853',
    description: 'برامج تخفيف الوزن + تغذية علاجية + رياضية',
    count: NUTRITIONISTS_SEED.length,
    data: NUTRITIONISTS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['full_name'],
  },

  // ═══════════════════════════════════════════════════════════════
  // V26.11 - New categories
  // ═══════════════════════════════════════════════════════════════

  partner_labs: {
    category: 'partner_labs',
    table: 'partner_labs',
    label: 'المختبرات الشريكة',
    labelEn: 'Partner Labs',
    icon: '🧪',
    color: '#A82E3D',
    description: 'مختبرات لسحب الدم وإجراء التحاليل',
    count: PARTNER_LABS_SEED.length,
    data: PARTNER_LABS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name_ar', 'city'],
  },
  vaccines: {
    category: 'vaccines',
    table: 'vaccines',
    label: 'اللقاحات',
    labelEn: 'Vaccines',
    icon: '💉',
    color: '#FF6D00',
    description: 'الجدول الوطني العراقي للقاحات + لقاحات السفر',
    count: VACCINES_SEED.length,
    data: VACCINES_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name_ar'],
  },
  medications: {
    category: 'medications',
    table: 'medications',
    label: 'الأدوية',
    labelEn: 'Medications',
    icon: '💊',
    color: '#9334E6',
    description: 'أكثر 30 دواء استخداماً في العراق',
    count: MEDICATIONS_SEED.length,
    data: MEDICATIONS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name_ar'],
  },
  physio_specialists: {
    category: 'physio_specialists',
    table: 'physio_specialists',
    label: 'أخصّائيو العلاج الطبيعي',
    labelEn: 'Physio',
    icon: '🏃',
    color: '#7C4DFF',
    description: 'علاج طبيعي منزلي + عيادات - رياضي، كبار السن، أطفال',
    count: PHYSIO_SPECIALISTS_SEED.length,
    data: PHYSIO_SPECIALISTS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['full_name'],
  },
  cosmetic_products: {
    category: 'cosmetic_products',
    table: 'cosmetic_products',
    label: 'منتجات التجميل',
    labelEn: 'Cosmetic Products',
    icon: '💄',
    color: '#C71C56',
    description: 'منتجات تجميل وعناية بالبشرة والشعر',
    count: COSMETIC_PRODUCTS_SEED.length,
    data: COSMETIC_PRODUCTS_SEED as unknown as Record<string, unknown>[],
    uniqueFields: ['name'],
  },
};

export const TOTAL_SEED_ITEMS = Object.values(SEED_CATEGORIES).reduce(
  (sum, cfg) => sum + cfg.count,
  0
);

// Re-export
export { HOSPITALS_SEED, PHARMACIES_SEED, DOCTORS_SEED };
export { DENTAL_CLINICS_SEED, OPTICAL_STORES_SEED };
export { MENTAL_HEALTH_SEED, NUTRITIONISTS_SEED };
export { PARTNER_LABS_SEED, VACCINES_SEED, MEDICATIONS_SEED };
export { PHYSIO_SPECIALISTS_SEED, COSMETIC_PRODUCTS_SEED };

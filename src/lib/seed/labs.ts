/**
 * ═══════════════════════════════════════════════════════════════
 * 🧪 Partner Labs Seed Data - مختبرات شريكة لسحب الدم
 * ═══════════════════════════════════════════════════════════════
 */

export interface PartnerLabSeed {
  name_ar: string;
  name_en?: string;
  description?: string;
  city: string;
  governorate?: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  whatsapp?: string;
  website?: string;
  is_active?: boolean;
  is_featured?: boolean;
  accepts_home_draw: boolean;
}

export const PARTNER_LABS_SEED: PartnerLabSeed[] = [
  // ─── النجف ───
  {
    name_ar: 'مختبر النجف المركزي',
    name_en: 'Najaf Central Laboratory',
    description: 'مختبر تحاليل طبية شامل بأحدث الأجهزة',
    city: 'النجف',
    governorate: 'النجف',
    address: 'شارع الكوفة - النجف',
    latitude: 32.0000,
    longitude: 44.3000,
    phone: '07712370001',
    whatsapp: '07712370001',
    is_featured: true,
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر السلامة',
    name_en: 'Al-Salama Lab',
    description: 'تحاليل دم شاملة + نتائج خلال 24 ساعة',
    city: 'النجف',
    governorate: 'النجف',
    address: 'شارع المدينة',
    latitude: 32.0100,
    longitude: 44.3100,
    phone: '07712370002',
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر الحياة',
    name_en: 'Al-Hayat Lab',
    city: 'النجف',
    governorate: 'النجف',
    address: 'شارع الإمام علي',
    latitude: 32.0050,
    longitude: 44.3050,
    phone: '07712370003',
    whatsapp: '07712370003',
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر الكوفة المتخصّص',
    name_en: 'Kufa Specialized Lab',
    description: 'تحاليل متخصّصة + هرمونات + فيتامينات',
    city: 'النجف',
    governorate: 'النجف',
    address: 'الكوفة - شارع الجامعة',
    latitude: 32.0300,
    longitude: 44.4000,
    phone: '07712370004',
    is_featured: true,
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر الشفاء',
    city: 'النجف',
    governorate: 'النجف',
    address: 'حي السلام',
    latitude: 31.9900,
    longitude: 44.3050,
    phone: '07712370005',
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر النور',
    description: 'تحاليل دقيقة بأسعار مناسبة',
    city: 'النجف',
    governorate: 'النجف',
    address: 'حي الميلاد',
    latitude: 32.0150,
    longitude: 44.3250,
    phone: '07712370006',
    accepts_home_draw: true,
  },

  // ─── بغداد ───
  {
    name_ar: 'مختبر بغداد الطبي',
    name_en: 'Baghdad Medical Lab',
    description: 'مختبر متطوّر بشهادات دولية',
    city: 'بغداد',
    governorate: 'بغداد',
    address: 'الكرادة',
    latitude: 33.3000,
    longitude: 44.4200,
    phone: '07712370010',
    whatsapp: '07712370010',
    is_featured: true,
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر المنصور التخصّصي',
    city: 'بغداد',
    governorate: 'بغداد',
    address: 'المنصور',
    latitude: 33.3100,
    longitude: 44.3500,
    phone: '07712370011',
    accepts_home_draw: true,
  },
  {
    name_ar: 'مختبر الكندي الحديث',
    city: 'بغداد',
    governorate: 'بغداد',
    address: 'الجادرية',
    latitude: 33.2800,
    longitude: 44.3900,
    phone: '07712370012',
    accepts_home_draw: true,
  },

  // ─── كربلاء ───
  {
    name_ar: 'مختبر كربلاء المركزي',
    city: 'كربلاء',
    governorate: 'كربلاء',
    address: 'وسط المدينة',
    latitude: 32.6100,
    longitude: 44.0200,
    phone: '07712370020',
    accepts_home_draw: true,
  },

  // ─── البصرة ───
  {
    name_ar: 'مختبر البصرة التخصّصي',
    city: 'البصرة',
    governorate: 'البصرة',
    address: 'وسط البصرة',
    latitude: 30.5085,
    longitude: 47.7804,
    phone: '07712370030',
    accepts_home_draw: true,
  },
];

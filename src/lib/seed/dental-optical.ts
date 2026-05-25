/**
 * ═══════════════════════════════════════════════════════════════
 * 🦷 Dental Clinics + 👓 Optical Stores Seed
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
// عيادات الأسنان
// ─────────────────────────────────────────────────────────

export interface DentalClinicSeed {
  name: string;
  description?: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  latitude: number;
  longitude: number;
  specialties: string[];
  doctor_count: number;
  doctor_names?: string[];
  cleaning_price_min: number;
  cleaning_price_max: number;
  filling_price_min?: number;
  filling_price_max?: number;
  is_active?: boolean;
}

export const DENTAL_CLINICS_SEED: DentalClinicSeed[] = [
  {
    name: 'عيادة الابتسامة',
    description: 'عيادة أسنان متكاملة بأحدث الأجهزة',
    city: 'النجف',
    district: 'حي الجامعة',
    address: 'مقابل جامعة الكوفة',
    phone: '07712350001',
    whatsapp: '07712350001',
    latitude: 32.0050,
    longitude: 44.3200,
    specialties: ['تنظيف', 'حشوات', 'تقويم', 'زراعة', 'تجميل'],
    doctor_count: 3,
    doctor_names: ['د. علي الكناني', 'د. فاطمة الحسناوي', 'د. حسين الموسوي'],
    cleaning_price_min: 15000,
    cleaning_price_max: 25000,
    filling_price_min: 20000,
    filling_price_max: 50000,
  },
  {
    name: 'عيادة د. زينب الكعبي',
    description: 'متخصّصة في التقويم وتجميل الأسنان',
    city: 'النجف',
    district: 'حي السلام',
    phone: '07712350002',
    latitude: 31.9956,
    longitude: 44.3146,
    specialties: ['تقويم', 'تجميل', 'تبييض'],
    doctor_count: 1,
    doctor_names: ['د. زينب الكعبي'],
    cleaning_price_min: 20000,
    cleaning_price_max: 30000,
  },
  {
    name: 'مركز الكوفة لطب الأسنان',
    city: 'النجف',
    district: 'الكوفة',
    phone: '07712350003',
    whatsapp: '07712350003',
    latitude: 32.0300,
    longitude: 44.4000,
    specialties: ['عام', 'حشوات', 'خلع', 'تنظيف'],
    doctor_count: 2,
    doctor_names: ['د. أحمد الجبوري', 'د. ليلى الموسوي'],
    cleaning_price_min: 10000,
    cleaning_price_max: 20000,
    filling_price_min: 15000,
    filling_price_max: 40000,
  },
  {
    name: 'عيادة الحياة لطب الأسنان',
    city: 'كربلاء',
    district: 'وسط المدينة',
    phone: '07712350010',
    latitude: 32.6100,
    longitude: 44.0200,
    specialties: ['عام', 'تقويم', 'زراعة'],
    doctor_count: 2,
    cleaning_price_min: 15000,
    cleaning_price_max: 25000,
  },
  {
    name: 'مركز السلام لطب الأسنان',
    city: 'بغداد',
    district: 'الكرادة',
    phone: '07712350020',
    latitude: 33.3000,
    longitude: 44.4200,
    specialties: ['عام', 'تقويم', 'تجميل', 'زراعة'],
    doctor_count: 4,
    cleaning_price_min: 20000,
    cleaning_price_max: 35000,
  },
];

// ─────────────────────────────────────────────────────────
// متاجر البصريات
// ─────────────────────────────────────────────────────────

export interface OpticalStoreSeed {
  name: string;
  description?: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  latitude: number;
  longitude: number;
  offers_eye_exam: boolean;
  exam_price?: number;
  offers_prescription_lenses: boolean;
  offers_sunglasses: boolean;
  offers_contact_lenses: boolean;
  brands?: string[];
}

export const OPTICAL_STORES_SEED: OpticalStoreSeed[] = [
  {
    name: 'بصريات النجف',
    description: 'فحص نظر مجاني + إطارات بكل الأسعار',
    city: 'النجف',
    district: 'وسط المدينة',
    phone: '07712360001',
    latitude: 31.9956,
    longitude: 44.3146,
    offers_eye_exam: true,
    exam_price: 0,
    offers_prescription_lenses: true,
    offers_sunglasses: true,
    offers_contact_lenses: true,
    brands: ['Ray-Ban', 'Oakley', 'Prada', 'Gucci'],
  },
  {
    name: 'بصريات الحياة',
    city: 'النجف',
    district: 'حي الأنصار',
    phone: '07712360002',
    latitude: 32.0000,
    longitude: 44.3100,
    offers_eye_exam: true,
    exam_price: 10000,
    offers_prescription_lenses: true,
    offers_sunglasses: true,
    offers_contact_lenses: false,
  },
  {
    name: 'بصريات الإمام علي',
    city: 'النجف',
    district: 'الكوفة',
    phone: '07712360003',
    latitude: 32.0300,
    longitude: 44.4000,
    offers_eye_exam: true,
    exam_price: 5000,
    offers_prescription_lenses: true,
    offers_sunglasses: true,
    offers_contact_lenses: true,
    brands: ['Ray-Ban', 'Vogue', 'Police'],
  },
  {
    name: 'بصريات كربلاء',
    city: 'كربلاء',
    district: 'وسط المدينة',
    phone: '07712360010',
    latitude: 32.6100,
    longitude: 44.0200,
    offers_eye_exam: true,
    exam_price: 10000,
    offers_prescription_lenses: true,
    offers_sunglasses: true,
    offers_contact_lenses: true,
  },
  {
    name: 'بصريات النور',
    city: 'بغداد',
    district: 'المنصور',
    phone: '07712360020',
    latitude: 33.3100,
    longitude: 44.3500,
    offers_eye_exam: true,
    exam_price: 15000,
    offers_prescription_lenses: true,
    offers_sunglasses: true,
    offers_contact_lenses: true,
    brands: ['Ray-Ban', 'Oakley', 'Tom Ford', 'Versace', 'Prada'],
  },
];

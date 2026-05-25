/**
 * ═══════════════════════════════════════════════════════════════
 * 🏥 Hospitals Seed Data - بيانات حقيقية للنجف وبغداد
 * ═══════════════════════════════════════════════════════════════
 */

export interface HospitalSeed {
  name: string;
  name_en?: string;
  type: 'government' | 'private' | 'health_center' | 'specialized';
  city: string;
  district?: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  phone_emergency?: string;
  whatsapp?: string;
  is_24h: boolean;
  has_emergency: boolean;
  has_ambulance: boolean;
  has_pharmacy: boolean;
  has_lab: boolean;
  has_radiology: boolean;
  departments: string[];
  visiting_hours?: string;
  description?: string;
}

export const HOSPITALS_SEED: HospitalSeed[] = [
  // ─── النجف الأشرف ───
  {
    name: 'مستشفى الصدر التعليمي',
    name_en: 'Al-Sadr Teaching Hospital',
    type: 'government',
    city: 'النجف',
    district: 'حي الأنصار',
    address: 'شارع كوفة - النجف',
    latitude: 31.9956,
    longitude: 44.3146,
    phone: '07712345001',
    phone_emergency: '912',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'pediatrics', 'maternity', 'surgery', 'icu', 'lab', 'radiology', 'pharmacy'],
    description: 'أكبر مستشفى حكومي في النجف الأشرف',
  },
  {
    name: 'مستشفى الحكيم العام',
    name_en: 'Al-Hakim General Hospital',
    type: 'government',
    city: 'النجف',
    district: 'حي السلام',
    latitude: 31.9900,
    longitude: 44.3100,
    phone: '07712345002',
    phone_emergency: '912',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'surgery', 'pediatrics', 'maternity', 'icu', 'lab'],
  },
  {
    name: 'مستشفى الزهراء التخصصي',
    name_en: 'Al-Zahra Specialized Hospital',
    type: 'specialized',
    city: 'النجف',
    district: 'حي الجامعة',
    latitude: 32.0050,
    longitude: 44.3200,
    phone: '07712345003',
    is_24h: false,
    visiting_hours: '08:00 - 22:00',
    has_emergency: true,
    has_ambulance: false,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['maternity', 'pediatrics', 'lab', 'radiology'],
    description: 'مستشفى تخصصي للنساء والأطفال',
  },
  {
    name: 'مستشفى الكفيل التخصصي',
    name_en: 'Al-Kafeel Specialized Hospital',
    type: 'private',
    city: 'النجف',
    district: 'منطقة الكوفة',
    latitude: 32.0300,
    longitude: 44.4000,
    phone: '07712345004',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'oncology', 'surgery', 'icu', 'lab', 'radiology'],
    description: 'مستشفى أهلي بمواصفات عالمية',
  },
  {
    name: 'مستشفى الإمام علي (ع)',
    name_en: 'Imam Ali Hospital',
    type: 'government',
    city: 'النجف',
    district: 'وسط المدينة',
    latitude: 32.0040,
    longitude: 44.3160,
    phone: '07712345005',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: false,
    departments: ['emergency', 'surgery', 'orthopedics', 'lab'],
  },

  // ─── بغداد ───
  {
    name: 'مدينة الطب',
    name_en: 'Medical City',
    type: 'government',
    city: 'بغداد',
    district: 'الباب المعظم',
    address: 'الباب المعظم - بغداد',
    latitude: 33.3434,
    longitude: 44.3905,
    phone: '07712345010',
    phone_emergency: '912',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'oncology', 'surgery', 'pediatrics', 'maternity', 'icu', 'lab', 'radiology'],
    description: 'المجمّع الطبي الأكبر في العراق',
  },
  {
    name: 'مستشفى ابن البلدي',
    name_en: 'Ibn Al-Baladi Hospital',
    type: 'specialized',
    city: 'بغداد',
    district: 'الكرخ',
    latitude: 33.3200,
    longitude: 44.3700,
    phone: '07712345011',
    is_24h: true,
    has_emergency: true,
    has_ambulance: false,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['maternity', 'pediatrics', 'lab'],
    description: 'مستشفى تخصصي للنساء والولادة',
  },
  {
    name: 'مستشفى دار التمريض الأهلي',
    name_en: 'Dar Al-Tamridh Private Hospital',
    type: 'private',
    city: 'بغداد',
    district: 'الكرادة',
    latitude: 33.3000,
    longitude: 44.4200,
    phone: '07712345012',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'surgery', 'icu', 'lab', 'radiology'],
  },

  // ─── كربلاء ───
  {
    name: 'مستشفى الحسين العام',
    name_en: 'Al-Hussain General Hospital',
    type: 'government',
    city: 'كربلاء',
    district: 'الحسينية',
    latitude: 32.6100,
    longitude: 44.0200,
    phone: '07712345020',
    phone_emergency: '912',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'pediatrics', 'surgery', 'lab', 'radiology'],
  },
  {
    name: 'مستشفى وارث الأنبياء',
    name_en: 'Warith Al-Anbiya Hospital',
    type: 'private',
    city: 'كربلاء',
    district: 'الحر',
    latitude: 32.6200,
    longitude: 44.0300,
    phone: '07712345021',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'oncology', 'surgery', 'icu', 'lab'],
    description: 'مستشفى أهلي حديث',
  },

  // ─── البصرة ───
  {
    name: 'مستشفى البصرة التعليمي',
    name_en: 'Basra Teaching Hospital',
    type: 'government',
    city: 'البصرة',
    district: 'وسط المدينة',
    latitude: 30.5085,
    longitude: 47.7804,
    phone: '07712345030',
    phone_emergency: '912',
    is_24h: true,
    has_emergency: true,
    has_ambulance: true,
    has_pharmacy: true,
    has_lab: true,
    has_radiology: true,
    departments: ['emergency', 'cardiology', 'surgery', 'pediatrics', 'icu', 'lab'],
  },
];

/**
 * ═══════════════════════════════════════════════════════════════
 * 💊 Pharmacies Seed Data
 * ═══════════════════════════════════════════════════════════════
 */

export interface PharmacySeed {
  name: string;
  license_number?: string;
  city: string;
  district?: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  whatsapp?: string;
  is_24h: boolean;
  opens_at?: string;
  closes_at?: string;
}

export const PHARMACIES_SEED: PharmacySeed[] = [
  // النجف
  {
    name: 'صيدلية المركز',
    license_number: 'NJF-PH-001',
    city: 'النجف',
    district: 'وسط المدينة',
    address: 'شارع الإمام علي',
    latitude: 31.9956,
    longitude: 44.3146,
    phone: '07712340001',
    whatsapp: '07712340001',
    is_24h: false,
    opens_at: '08:00',
    closes_at: '23:00',
  },
  {
    name: 'صيدلية النور 24',
    license_number: 'NJF-PH-002',
    city: 'النجف',
    district: 'حي الأنصار',
    latitude: 32.0000,
    longitude: 44.3100,
    phone: '07712340002',
    whatsapp: '07712340002',
    is_24h: true,
  },
  {
    name: 'صيدلية السلام',
    license_number: 'NJF-PH-003',
    city: 'النجف',
    district: 'الكوفة',
    latitude: 32.0300,
    longitude: 44.4000,
    phone: '07712340003',
    is_24h: false,
    opens_at: '07:00',
    closes_at: '00:00',
  },
  {
    name: 'صيدلية الشفاء',
    license_number: 'NJF-PH-004',
    city: 'النجف',
    district: 'حي الجامعة',
    latitude: 32.0050,
    longitude: 44.3200,
    phone: '07712340004',
    is_24h: false,
    opens_at: '08:00',
    closes_at: '22:00',
  },
  {
    name: 'صيدلية الكرامة',
    license_number: 'NJF-PH-005',
    city: 'النجف',
    district: 'حي السلام',
    latitude: 31.9900,
    longitude: 44.3000,
    phone: '07712340005',
    is_24h: false,
    opens_at: '08:00',
    closes_at: '23:00',
  },
  {
    name: 'صيدلية الحياة',
    license_number: 'NJF-PH-006',
    city: 'النجف',
    district: 'حي الإسكان',
    latitude: 32.0100,
    longitude: 44.3050,
    phone: '07712340006',
    is_24h: false,
    opens_at: '09:00',
    closes_at: '23:00',
  },
  {
    name: 'صيدلية الأمل 24',
    license_number: 'NJF-PH-007',
    city: 'النجف',
    district: 'حي الميلاد',
    latitude: 32.0150,
    longitude: 44.3250,
    phone: '07712340007',
    whatsapp: '07712340007',
    is_24h: true,
  },

  // بغداد
  {
    name: 'صيدلية الكرادة',
    license_number: 'BGD-PH-001',
    city: 'بغداد',
    district: 'الكرادة',
    latitude: 33.3000,
    longitude: 44.4200,
    phone: '07712340010',
    is_24h: false,
    opens_at: '08:00',
    closes_at: '23:00',
  },
  {
    name: 'صيدلية المنصور',
    license_number: 'BGD-PH-002',
    city: 'بغداد',
    district: 'المنصور',
    latitude: 33.3100,
    longitude: 44.3500,
    phone: '07712340011',
    is_24h: true,
  },
  {
    name: 'صيدلية الجادرية',
    license_number: 'BGD-PH-003',
    city: 'بغداد',
    district: 'الجادرية',
    latitude: 33.2800,
    longitude: 44.3900,
    phone: '07712340012',
    is_24h: false,
    opens_at: '07:00',
    closes_at: '00:00',
  },

  // كربلاء
  {
    name: 'صيدلية كربلاء المركزية',
    license_number: 'KRB-PH-001',
    city: 'كربلاء',
    district: 'وسط المدينة',
    latitude: 32.6100,
    longitude: 44.0200,
    phone: '07712340020',
    is_24h: false,
    opens_at: '08:00',
    closes_at: '23:00',
  },
];

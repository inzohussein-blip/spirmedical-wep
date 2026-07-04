/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ أنواع + إعدادات لوحة المواقع الموحّدة (V31)
 * ════════════════════════════════════════════════════════════════════
 * منفصلة عن actions.ts لأنّ ملفات 'use server' لا تُصدّر إلا async functions.
 */

export type LocationSource =
  | 'hospitals'
  | 'pharmacies'
  | 'dental_clinics'
  | 'optical_stores'
  | 'mental_health_specialists'
  | 'nutritionists'
  | 'doctors';

export interface SourceConfig {
  table: LocationSource;
  label: string;
  emoji: string;
  markerType: string;
  nameCol: 'name' | 'full_name';
  cityCol: 'city' | 'clinic_city';
  latCol: 'latitude' | 'clinic_lat';
  lngCol: 'longitude' | 'clinic_lng';
  servicesPath: string;
}

export const SOURCE_MAP: Record<LocationSource, SourceConfig> = {
  hospitals: {
    table: 'hospitals', label: 'مستشفى', emoji: '🏥', markerType: 'hospital',
    nameCol: 'name', cityCol: 'city', latCol: 'latitude', lngCol: 'longitude',
    servicesPath: '/services/hospitals',
  },
  pharmacies: {
    table: 'pharmacies', label: 'صيدلية', emoji: '💊', markerType: 'pharmacy',
    nameCol: 'name', cityCol: 'city', latCol: 'latitude', lngCol: 'longitude',
    servicesPath: '/services/pharmacies',
  },
  dental_clinics: {
    table: 'dental_clinics', label: 'عيادة أسنان', emoji: '🦷', markerType: 'dental',
    nameCol: 'name', cityCol: 'city', latCol: 'latitude', lngCol: 'longitude',
    servicesPath: '/services/dental',
  },
  optical_stores: {
    table: 'optical_stores', label: 'نظّارات', emoji: '👓', markerType: 'optical',
    nameCol: 'name', cityCol: 'city', latCol: 'latitude', lngCol: 'longitude',
    servicesPath: '/services/optical',
  },
  mental_health_specialists: {
    table: 'mental_health_specialists', label: 'صحة نفسية', emoji: '🧠', markerType: 'mental-health',
    nameCol: 'full_name', cityCol: 'clinic_city', latCol: 'latitude', lngCol: 'longitude',
    servicesPath: '/services/mental-health',
  },
  nutritionists: {
    table: 'nutritionists', label: 'تغذية', emoji: '🥗', markerType: 'nutrition',
    nameCol: 'full_name', cityCol: 'clinic_city', latCol: 'latitude', lngCol: 'longitude',
    servicesPath: '/services/nutrition',
  },
  doctors: {
    table: 'doctors', label: 'طبيب', emoji: '🩺', markerType: 'doctor',
    nameCol: 'full_name', cityCol: 'clinic_city', latCol: 'clinic_lat', lngCol: 'clinic_lng',
    servicesPath: '/services/doctors',
  },
};

export interface UnifiedLocation {
  id: string;
  source: LocationSource;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  label: string;
  emoji: string;
  markerType: string;
}

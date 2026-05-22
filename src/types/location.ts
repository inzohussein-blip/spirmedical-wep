/**
 * ═══════════════════════════════════════════════════════════════
 * Location Types — GPS + Maps
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * إحداثيات GPS (Latitude/Longitude)
 */
export interface GpsCoordinates {
  lat: number;
  lng: number;
}

/**
 * موقع GPS كامل (مع metadata)
 */
export interface GpsLocation extends GpsCoordinates {
  accuracy_m?: number | null;
  captured_at?: string | null;
}

/**
 * موقع طلب (من جدول appointments)
 */
export interface AppointmentLocation extends GpsLocation {
  appointment_id: string;
  address: string;
}

/**
 * موقع أخصائي (من جدول users)
 */
export interface SpecialistLocation extends GpsCoordinates {
  user_id: string;
  full_name: string;
  work_address: string | null;
  specialty?: string | null;
}

/**
 * Marker على الخريطة - نوع موحّد
 */
export interface MapMarker extends GpsCoordinates {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  /** نوع الـ marker للتمييز البصري - النظام الجديد V25.37 */
  type?: 'blood-draw' | 'home-nursing' | 'pharmacy' | 'dental' | 'optical' | 'mental-health' | 'nutrition' | 'hospital' | 'doctor' | 'clinic' | 'user';
  /** @deprecated - استخدم type بدلاً */
  variant?: 'patient' | 'specialist' | 'lab' | 'pharmacy' | 'default';
  popup?: string;
}

/* ─── Defaults & Helpers ───────────────────────────────────── */

/**
 * مركز العراق (بغداد) - الافتراضي للخرائط
 */
export const IRAQ_CENTER: GpsCoordinates = {
  lat: 33.3152,
  lng: 44.3661,
};

/**
 * إحداثيات المحافظات العراقية الرئيسية (للـ fallback)
 */
export const IRAQ_GOVERNORATES: Record<string, GpsCoordinates> = {
  baghdad: { lat: 33.3152, lng: 44.3661 },
  basra: { lat: 30.5085, lng: 47.7804 },
  mosul: { lat: 36.3489, lng: 43.1577 },
  erbil: { lat: 36.1901, lng: 44.0094 },
  najaf: { lat: 31.9997, lng: 44.3296 },
  karbala: { lat: 32.6149, lng: 44.0245 },
  sulaymaniyah: { lat: 35.5556, lng: 45.4351 },
  kirkuk: { lat: 35.4681, lng: 44.3923 },
  duhok: { lat: 36.8662, lng: 42.9826 },
  diyala: { lat: 33.7733, lng: 44.6342 },
  anbar: { lat: 33.4274, lng: 43.298 },
  saladin: { lat: 34.6047, lng: 43.6789 },
  babil: { lat: 32.4732, lng: 44.4222 },
  qadisiyyah: { lat: 31.9893, lng: 44.9248 },
  wasit: { lat: 32.5126, lng: 45.8268 },
  muthanna: { lat: 31.5667, lng: 45.2833 },
  maysan: { lat: 31.8336, lng: 47.1444 },
  thi_qar: { lat: 31.0426, lng: 46.2592 },
};

/**
 * الأسماء العربية للمحافظات (للعرض في UI)
 */
export const IRAQ_GOVERNORATES_AR: Record<string, string> = {
  baghdad: 'بغداد',
  basra: 'البصرة',
  mosul: 'الموصل',
  erbil: 'أربيل',
  najaf: 'النجف',
  karbala: 'كربلاء',
  sulaymaniyah: 'السليمانية',
  kirkuk: 'كركوك',
  duhok: 'دهوك',
  diyala: 'ديالى',
  anbar: 'الأنبار',
  saladin: 'صلاح الدين',
  babil: 'بابل',
  qadisiyyah: 'القادسية',
  wasit: 'واسط',
  muthanna: 'المثنى',
  maysan: 'ميسان',
  thi_qar: 'ذي قار',
};

/**
 * قائمة محافظات للـ UI (مرتّبة بحسب الأكثر استخداماً)
 */
export interface GovernorateOption {
  id: string;
  nameAr: string;
  lat: number;
  lng: number;
}

export const GOVERNORATE_OPTIONS: GovernorateOption[] = [
  { id: 'baghdad', nameAr: 'بغداد', lat: 33.3152, lng: 44.3661 },
  { id: 'basra', nameAr: 'البصرة', lat: 30.5085, lng: 47.7804 },
  { id: 'najaf', nameAr: 'النجف', lat: 31.9997, lng: 44.3296 },
  { id: 'karbala', nameAr: 'كربلاء', lat: 32.6149, lng: 44.0245 },
  { id: 'mosul', nameAr: 'الموصل', lat: 36.3489, lng: 43.1577 },
  { id: 'erbil', nameAr: 'أربيل', lat: 36.1901, lng: 44.0094 },
  { id: 'sulaymaniyah', nameAr: 'السليمانية', lat: 35.5556, lng: 45.4351 },
  { id: 'kirkuk', nameAr: 'كركوك', lat: 35.4681, lng: 44.3923 },
  { id: 'duhok', nameAr: 'دهوك', lat: 36.8662, lng: 42.9826 },
  { id: 'diyala', nameAr: 'ديالى', lat: 33.7733, lng: 44.6342 },
  { id: 'anbar', nameAr: 'الأنبار', lat: 33.4274, lng: 43.298 },
  { id: 'saladin', nameAr: 'صلاح الدين', lat: 34.6047, lng: 43.6789 },
  { id: 'babil', nameAr: 'بابل', lat: 32.4732, lng: 44.4222 },
  { id: 'qadisiyyah', nameAr: 'القادسية', lat: 31.9893, lng: 44.9248 },
  { id: 'wasit', nameAr: 'واسط', lat: 32.5126, lng: 45.8268 },
  { id: 'muthanna', nameAr: 'المثنى', lat: 31.5667, lng: 45.2833 },
  { id: 'maysan', nameAr: 'ميسان', lat: 31.8336, lng: 47.1444 },
  { id: 'thi_qar', nameAr: 'ذي قار', lat: 31.0426, lng: 46.2592 },
];

/* ─── Validation ───────────────────────────────────────────── */

/**
 * التحقق من صحة إحداثيات GPS
 */
export function isValidCoordinates(
  lat: unknown,
  lng: unknown
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * يتحقق إذا كان الموقع داخل العراق (تقريباً)
 */
export function isWithinIraq(lat: number, lng: number): boolean {
  return lat >= 29 && lat <= 38 && lng >= 38 && lng <= 49;
}

/**
 * حساب المسافة بالكيلومترات بين نقطتين (Haversine formula)
 */
export function distanceKm(a: GpsCoordinates, b: GpsCoordinates): number {
  const R = 6371; // نصف قطر الأرض بالكم
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * تنسيق إحداثيات للعرض
 */
export function formatCoords(coords: GpsCoordinates, decimals = 5): string {
  return `${coords.lat.toFixed(decimals)}, ${coords.lng.toFixed(decimals)}`;
}

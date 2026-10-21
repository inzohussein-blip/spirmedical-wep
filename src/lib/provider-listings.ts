/**
 * 🏥 الدفعة 3 (0062، قرار المالك): حسابُ الخدمة يملك منشأتَه في الدليل — «ربطٌ بمنشأةٍ موجودة أو إضافةُ جديدة،
 * والإدارةُ تعتمد الربط». ثمّ تصل حجوزاتُ المنشأة إلى نافذة الخدمة.
 *
 *   الصيدلية ← `pharmacies.owner_user_id`   ·   حجوزاتُها `pharmacy_reservations.pharmacy_id`
 *   العيادة  ← `doctors.user_id`            ·   مواعيدُها `appointments.doctor_id`
 *   المستشفى ← `hospitals.owner_user_id`    ·   مواعيدُه  `appointments.hospital_id`
 *
 * هذا الملفُّ نقيّ (لا عميلَ قاعدة) كي يُختبر: الأنواع، والانتقالاتُ المسموحة، وتنقيةُ بيانات المنشأة الجديدة.
 */
import type { ProviderType } from '@/lib/providers';

export const LISTING_KINDS = ['pharmacy', 'doctor', 'hospital'] as const;
export type ListingKind = (typeof LISTING_KINDS)[number];

/** المختبرُ لا منشأةَ دليلٍ له — مسارُه العيّنات (الدفعة 2) */
export function listingKindFor(type: ProviderType | null | undefined): ListingKind | null {
  if (type === 'pharmacy') return 'pharmacy';
  if (type === 'clinic') return 'doctor';
  if (type === 'hospital') return 'hospital';
  return null;
}

export const LISTING_SOURCE: Record<ListingKind, { table: 'pharmacies' | 'doctors' | 'hospitals'; owner: 'owner_user_id' | 'user_id'; label: string }> = {
  pharmacy: { table: 'pharmacies', owner: 'owner_user_id', label: 'صيدلية' },
  doctor: { table: 'doctors', owner: 'user_id', label: 'عيادة' },
  hospital: { table: 'hospitals', owner: 'owner_user_id', label: 'مستشفى' },
};

// ─── منشأةٌ جديدة: ما يقترحه صاحبُ الحساب، منقّىً، بحقول الجدول ───
export const HOSPITAL_TYPES: Record<string, string> = {
  government: 'حكومي',
  private: 'أهلي',
  health_center: 'مركز صحّي',
  specialized: 'تخصّصي',
};

const t = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** يعيد صفَّ الإدراج (بلا مالك — يُضاف عند الاعتماد) أو رسالةَ خطأ للمستخدم */
export function sanitizeProposedListing(
  kind: ListingKind,
  raw: Record<string, unknown>,
): { ok: true; row: Record<string, string | boolean | null> } | { ok: false; error: string } {
  const name = t(raw.name, 120);
  const city = t(raw.city, 60);
  const phone = t(raw.phone, 30);
  const address = t(raw.address, 200) || null;
  if (name.length < 2) return { ok: false, error: 'اكتب اسمَ المنشأة' };
  if (!city) return { ok: false, error: 'حدّد المدينة' };
  if (!/^[+\d\s-]{7,20}$/.test(phone)) return { ok: false, error: 'اكتب رقمَ هاتف المنشأة' };

  if (kind === 'pharmacy') {
    const district = t(raw.district, 60);
    if (!district) return { ok: false, error: 'حدّد الحيّ أو المنطقة' };
    return { ok: true, row: { name, city, district, phone, address } };
  }
  if (kind === 'doctor') {
    const doctor = t(raw.doctorName, 120);
    const specialty = t(raw.specialty, 80);
    if (doctor.length < 2) return { ok: false, error: 'اكتب اسمَ الطبيب' };
    if (!specialty) return { ok: false, error: 'اكتب الاختصاص' };
    return {
      ok: true,
      row: {
        full_name: doctor, specialty, clinic_name: name, clinic_city: city, clinic_phone: phone, clinic_address: address,
        available_for_clinic: true, available_for_home_visit: false, available_for_video: false,
      },
    };
  }
  const type = t(raw.hospitalType, 20);
  if (!(type in HOSPITAL_TYPES)) return { ok: false, error: 'اختر نوعَ المستشفى' };
  return { ok: true, row: { name, type, city, phone, address } };
}

// ─── الانتقالات: من أيّ حالةٍ إلى أيّ حالة، لكلّ فعل ───
export const RESERVATION_ACTIONS = {
  confirm: { from: ['pending'], to: 'confirmed', label: 'تأكيد التوفّر' },
  partial: { from: ['pending'], to: 'partially_available', label: 'متوفّرٌ جزئياً' },
  ready: { from: ['confirmed', 'partially_available'], to: 'ready_for_pickup', label: 'جاهزٌ للاستلام' },
  picked_up: { from: ['ready_for_pickup'], to: 'picked_up', label: 'استُلم' },
  cancel: { from: ['pending', 'confirmed', 'partially_available', 'ready_for_pickup'], to: 'cancelled', label: 'اعتذار' },
} as const;
export type ReservationAction = keyof typeof RESERVATION_ACTIONS;

export const BOOKING_ACTIONS = {
  confirm: { from: ['pending'], to: 'confirmed', label: 'تأكيد الموعد' },
  complete: { from: ['confirmed', 'in_progress'], to: 'completed', label: 'تمّت الزيارة' },
  decline: { from: ['pending', 'confirmed'], to: 'cancelled', label: 'اعتذار' },
} as const;
export type BookingAction = keyof typeof BOOKING_ACTIONS;

export const isReservationAction = (a: unknown): a is ReservationAction =>
  typeof a === 'string' && Object.prototype.hasOwnProperty.call(RESERVATION_ACTIONS, a);
export const isBookingAction = (a: unknown): a is BookingAction =>
  typeof a === 'string' && Object.prototype.hasOwnProperty.call(BOOKING_ACTIONS, a);

/** ما يقرؤه المريضُ في صندوقه بعد كلّ فعل */
export const PATIENT_MESSAGE: Record<string, (place: string) => { title: string; body: string }> = {
  confirmed: (p) => ({ title: 'تأكّد طلبُك', body: `${p} أكّد الطلب.` }),
  partially_available: (p) => ({ title: 'طلبُك متوفّرٌ جزئياً', body: `${p}: بعضُ الأصناف متوفّر — راجع التفاصيل.` }),
  ready_for_pickup: (p) => ({ title: 'دواؤك جاهز للاستلام', body: `${p}: طلبُك جاهز.` }),
  picked_up: (p) => ({ title: 'استُلم طلبُك', body: `${p}: شكراً لك.` }),
  completed: (p) => ({ title: 'اكتملت زيارتُك', body: `${p}: نتمنّى لك الصحّة.` }),
  cancelled: (p) => ({ title: 'اعتذرت المنشأة', body: `${p} اعتذر عن الطلب.` }),
};

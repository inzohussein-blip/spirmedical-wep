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

// ─── تعديلُ المالك لبيانات منشأته: الحقولُ المسموحةُ لكلّ نوع، منقّاة ───
// المنشأةُ دليلٌ فقط (قرار المالك، 22 تشرين الأول): لا تتلقّى طلباتٍ من المريض — يراها ويتواصل معها مباشرة. فما يحرّره
// صاحبُها بياناتُ التواصل والعرض وحدها؛ والاسمُ والتوثيقُ والملكيّةُ للإدارة.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function sanitizeListingUpdate(
  kind: ListingKind,
  raw: Record<string, unknown>,
): { ok: true; patch: Record<string, string | boolean | null> } | { ok: false; error: string } {
  const phone = t(raw.phone, 30);
  if (!/^[+\d\s-]{7,20}$/.test(phone)) return { ok: false, error: 'اكتب رقمَ هاتف المنشأة' };
  const address = t(raw.address, 200) || null;
  const about = t(raw.about, 600) || null;

  if (kind === 'doctor') {
    return { ok: true, patch: { clinic_phone: phone, clinic_address: address, bio: about } };
  }
  if (kind === 'pharmacy') {
    const is24h = raw.is24h === true || raw.is24h === 'on';
    const opens = t(raw.opensAt, 5);
    const closes = t(raw.closesAt, 5);
    if (!is24h && (!TIME.test(opens) || !TIME.test(closes))) return { ok: false, error: 'حدّد ساعاتِ الدوام أو «24 ساعة»' };
    return {
      ok: true,
      patch: {
        phone, whatsapp: t(raw.whatsapp, 30) || null, address, description: about,
        is_24h: is24h, opens_at: is24h ? null : opens, closes_at: is24h ? null : closes,
        has_delivery: raw.hasDelivery === true || raw.hasDelivery === 'on',
      },
    };
  }
  return { ok: true, patch: { phone, whatsapp: t(raw.whatsapp, 30) || null, address, description: about, visiting_hours: t(raw.visitingHours, 120) || null } };
}

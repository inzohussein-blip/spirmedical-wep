import type { IconName } from '@/lib/icons';

/**
 * 🏥 حساباتُ «الخدمة» (0059/0060، قرار المالك، 18 تشرين الأول).
 *
 * التطبيقُ ثلاثُ نوافذ: المريض، والمختصّ (فردٌ يذهب إلى المريض: محلّلٌ يسحب الدم أو ممرّضٌ منزليّ)،
 * والخدمة (منشأة: مختبرٌ يُجري التحاليل ويرفع النتائج، صيدلية، عيادة، مستشفى). الخدمةُ `role = 'provider'`
 * ونوعُها `provider_type`، واسمُها `clinic_name`. مسارُ التحليل: المريضُ يختار المختبرَ ← المحلّلُ يسحب
 * ويُسلّم ← المختبرُ يرفع النتائج.
 */
export const PROVIDER_TYPES = ['lab', 'pharmacy', 'clinic', 'hospital'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export interface ProviderMeta {
  label: string;
  /** ما يقدّمه — يُعرض في التسجيل */
  description: string;
  icon: IconName;
  /** اسمُ المنشأة في النموذج */
  nameLabel: string;
}

export const PROVIDER_META: Record<ProviderType, ProviderMeta> = {
  lab: {
    label: 'مختبر تحاليل',
    description: 'تحدّد تحاليلَك، فتصلك عيّناتُ المرضى الذين اختاروك، وترفع النتائج في التطبيق',
    icon: 'labs',
    nameLabel: 'اسمُ المختبر',
  },
  pharmacy: {
    label: 'صيدلية',
    description: 'تستلم الوصفاتِ وطلباتِ الأدوية',
    icon: 'pharmacies',
    nameLabel: 'اسمُ الصيدلية',
  },
  clinic: {
    label: 'عيادة / طبيب',
    description: 'استشاراتٌ ومواعيد: طبيب، أسنان، نفسيّ، تغذية، علاجٌ طبيعيّ',
    icon: 'doctors',
    nameLabel: 'اسمُ العيادة',
  },
  hospital: {
    label: 'مستشفى / مركز طبي',
    description: 'مستشفى أو مركزٌ طبّيّ أو بصريات',
    icon: 'hospitals',
    nameLabel: 'اسمُ المنشأة',
  },
};

export const isProviderType = (v: unknown): v is ProviderType =>
  typeof v === 'string' && (PROVIDER_TYPES as readonly string[]).includes(v);

/** الاختصاصاتُ التي يسجّل بها «المختصّ» — الباقي خدمة */
export const SPECIALIST_SIGNUP_TYPES = ['lab_analyst', 'nurse'] as const;

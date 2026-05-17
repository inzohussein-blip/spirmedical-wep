// نظام الاختصاصيين الموحّد
// كل المعلومات الخاصة بكل دور في مكان واحد

export type SpecialistType =
  | 'lab_analyst'
  | 'nurse'
  | 'doctor'
  | 'pharmacist'
  | 'physio'
  | 'psychologist'
  | 'nutritionist';

export interface SpecialistMeta {
  type: SpecialistType;
  label: string;
  labelEn: string;
  icon: string;
  gradient: string;
  color: string;
  description: string;
  servicesHandled: string[];
}

export const SPECIALIST_META: Record<SpecialistType, SpecialistMeta> = {
  lab_analyst: {
    type: 'lab_analyst',
    label: 'مُحلِّل مختبر',
    labelEn: 'Lab Analyst',
    icon: '🩸',
    gradient: 'linear-gradient(135deg, #A82E3D 0%, #791F1F 100%)',
    color: '#A82E3D',
    description: 'تحليل عيّنات الدم وإصدار النتائج',
    servicesHandled: ['blood-draw', 'lab-test'],
  },
  nurse: {
    type: 'nurse',
    label: 'تمريضي/ة',
    labelEn: 'Nurse',
    icon: '💉',
    gradient: 'linear-gradient(135deg, #B8540C 0%, #6B3A08 100%)',
    color: '#B8540C',
    description: 'تمريض منزلي · إبر · غيار جروح · لقاحات',
    servicesHandled: ['home-nursing', 'injection', 'vaccination'],
  },
  doctor: {
    type: 'doctor',
    label: 'طبيب',
    labelEn: 'Doctor',
    icon: '⚕️',
    gradient: 'linear-gradient(135deg, #0E5C4D 0%, #073B30 100%)',
    color: '#0E5C4D',
    description: 'استشارات طبية · تشخيص · وصفات',
    servicesHandled: ['consultation-general', 'consultation-specialist', 'consultation-video'],
  },
  pharmacist: {
    type: 'pharmacist',
    label: 'صيدلي',
    labelEn: 'Pharmacist',
    icon: '💊',
    gradient: 'linear-gradient(135deg, #534AB7 0%, #3D3686 100%)',
    color: '#534AB7',
    description: 'استشارات دوائية · تفاعل أدوية · بدائل',
    servicesHandled: ['pharmacy-consultation', 'drug-interaction'],
  },
  physio: {
    type: 'physio',
    label: 'أخصائي علاج طبيعي',
    labelEn: 'Physiotherapist',
    icon: '🦾',
    gradient: 'linear-gradient(135deg, #C97B0C 0%, #854F0B 100%)',
    color: '#C97B0C',
    description: 'جلسات تأهيل · علاج طبيعي منزلي',
    servicesHandled: ['physiotherapy'],
  },
  psychologist: {
    type: 'psychologist',
    label: 'أخصائي نفسي',
    labelEn: 'Psychologist',
    icon: '🧘',
    gradient: 'linear-gradient(135deg, #7A4CC4 0%, #5B3399 100%)',
    color: '#7A4CC4',
    description: 'استشارات نفسية · جلسات تأهيل',
    servicesHandled: ['psychology'],
  },
  nutritionist: {
    type: 'nutritionist',
    label: 'أخصائي تغذية',
    labelEn: 'Nutritionist',
    icon: '🍎',
    gradient: 'linear-gradient(135deg, #0E5C4D 0%, #1A8A6E 100%)',
    color: '#0E5C4D',
    description: 'استشارات تغذوية · خطط غذائية',
    servicesHandled: ['nutrition'],
  },
};

export const SPECIALIST_TYPES: SpecialistType[] = Object.keys(SPECIALIST_META) as SpecialistType[];

/**
 * يحدد نوع الاختصاصي المطلوب لخدمة معينة
 */
export function getSpecialistTypeForService(serviceId: string): SpecialistType {
  for (const [type, meta] of Object.entries(SPECIALIST_META)) {
    if (meta.servicesHandled.includes(serviceId)) {
      return type as SpecialistType;
    }
  }
  return 'doctor'; // default
}

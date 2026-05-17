// ═══════════════════════════════════════════════════════════════════
// 🏥 المختبرات الشريكة - Phase 1
// ═══════════════════════════════════════════════════════════════════

export interface Lab {
  id: string;
  nameAr: string;
  city: string;
  rating: number;        // من 5
  reviewsCount: number;
  resultTime: string;    // متوسط وقت النتيجة
  features: string[];    // مزايا (ISO, معتمد, إلخ)
  emoji: string;
  popular?: boolean;
}

export const PARTNER_LABS: Lab[] = [
  {
    id: 'medcare',
    nameAr: 'مختبر ميد كير',
    city: 'بغداد',
    rating: 4.9,
    reviewsCount: 1240,
    resultTime: '24 ساعة',
    features: ['معتمد دولياً', 'ISO 15189', 'تحاليل متخصصة'],
    emoji: '🏥',
    popular: true,
  },
  {
    id: 'al-hayat',
    nameAr: 'مختبرات الحياة',
    city: 'بغداد',
    rating: 4.8,
    reviewsCount: 980,
    resultTime: '24 ساعة',
    features: ['أحدث الأجهزة', 'نتائج رقمية'],
    emoji: '🔬',
    popular: true,
  },
  {
    id: 'al-shifa',
    nameAr: 'مختبر الشفاء',
    city: 'بغداد',
    rating: 4.7,
    reviewsCount: 760,
    resultTime: '12-24 ساعة',
    features: ['أسعار اقتصادية', 'استشارة مجانية'],
    emoji: '⚕️',
  },
  {
    id: 'ibn-sina',
    nameAr: 'مختبر ابن سينا',
    city: 'البصرة',
    rating: 4.8,
    reviewsCount: 540,
    resultTime: '24 ساعة',
    features: ['الجنوب', 'تحاليل دقيقة'],
    emoji: '🧪',
  },
  {
    id: 'al-amal',
    nameAr: 'مختبر الأمل',
    city: 'أربيل',
    rating: 4.7,
    reviewsCount: 420,
    resultTime: '24 ساعة',
    features: ['الشمال', 'كردي + عربي'],
    emoji: '🩺',
  },
];

// الخيار الافتراضي: اختر لي الأنسب
export const ANY_LAB: Lab = {
  id: 'any',
  nameAr: 'لا يهم — اختاروا الأنسب',
  city: 'حسب موقعك',
  rating: 0,
  reviewsCount: 0,
  resultTime: '24 ساعة',
  features: ['سنختار أقرب مختبر', 'أسرع وقت ممكن', 'أفضل سعر'],
  emoji: '✨',
};

export const ALL_LABS = [ANY_LAB, ...PARTNER_LABS];

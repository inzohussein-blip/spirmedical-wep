// ═══════════════════════════════════════════════════════════════════
// 🏥 المختبرات الشريكة - Phase 1
// ═══════════════════════════════════════════════════════════════════

export interface Lab {
  id: string;
  nameAr: string;
  city: string;
  // لا تقييم ولا عدد مراجعات هنا: لا مصدرَ حيّاً لتقييمات المختبرات بعد، وكانت
  // «4.9 · 1240+ تقييم» أرقاماً مكتوبة تظهر داخل التطبيق (قرار المالك: أرقامُ
  // التطبيق حيّة فقط). تُضاف حين يوجد جدولُ تقييماتٍ يُحسب منه.
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
    resultTime: '24 ساعة',
    features: ['معتمد دولياً', 'ISO 15189', 'تحاليل متخصصة'],
    emoji: '🏥',
    popular: true,
  },
  {
    id: 'al-hayat',
    nameAr: 'مختبرات الحياة',
    city: 'بغداد',
    resultTime: '24 ساعة',
    features: ['أحدث الأجهزة', 'نتائج رقمية'],
    emoji: '🔬',
    popular: true,
  },
  {
    id: 'al-shifa',
    nameAr: 'مختبر الشفاء',
    city: 'بغداد',
    resultTime: '12-24 ساعة',
    features: ['أسعار اقتصادية', 'استشارة مجانية'],
    emoji: '⚕️',
  },
  {
    id: 'ibn-sina',
    nameAr: 'مختبر ابن سينا',
    city: 'البصرة',
    resultTime: '24 ساعة',
    features: ['الجنوب', 'تحاليل دقيقة'],
    emoji: '🧪',
  },
  {
    id: 'al-amal',
    nameAr: 'مختبر الأمل',
    city: 'أربيل',
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
  resultTime: '24 ساعة',
  features: ['سنختار أقرب مختبر', 'أسرع وقت ممكن', 'أفضل سعر'],
  emoji: '✨',
};

export const ALL_LABS = [ANY_LAB, ...PARTNER_LABS];

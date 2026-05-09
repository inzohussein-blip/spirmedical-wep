// قائمة الخدمات الكاملة مع التفاصيل والأسعار
export type ServiceCategory = 'home' | 'lab' | 'consult' | 'pharmacy' | 'hospital' | 'family';

export interface Service {
  id: string;
  name: string;
  nameAr: string;
  category: ServiceCategory;
  icon: string;
  emoji: string;
  description: string;
  basePrice: number; // بالدينار العراقي
  duration: number; // بالدقائق
  available: boolean;
  comingSoon?: boolean;
  needsAddress: boolean; // يحتاج عنوان (منزلي) أم لا (online)
  badge?: string; // مثل "الأكثر طلباً"
  badgeColor?: 'emerald' | 'amber' | 'rose';
}

export const SERVICES: Service[] = [
  // === خدمات منزلية ===
  {
    id: 'blood-draw',
    name: 'blood-draw',
    nameAr: 'سحب دم منزلي',
    category: 'home',
    icon: '🩸',
    emoji: '🩸',
    description: 'فني مختبر مدرّب يأتي إلى منزلك في الوقت الذي تختاره',
    basePrice: 15000,
    duration: 30,
    available: true,
    needsAddress: true,
    badge: 'الأكثر طلباً',
    badgeColor: 'emerald',
  },
  {
    id: 'home-nursing',
    name: 'home-nursing',
    nameAr: 'تمريض منزلي',
    category: 'home',
    icon: '💉',
    emoji: '💉',
    description: 'حقن وتداوي وعناية بكبار السن في راحة منزلكم',
    basePrice: 25000,
    duration: 60,
    available: true,
    needsAddress: true,
  },
  {
    id: 'iv-fluid',
    name: 'iv-fluid',
    nameAr: 'تركيب مغذي',
    category: 'home',
    icon: '💧',
    emoji: '💧',
    description: 'تركيب محاليل وريدية بإشراف طبي',
    basePrice: 30000,
    duration: 90,
    available: true,
    needsAddress: true,
  },

  // === فحوصات مختبرية ===
  {
    id: 'lab-tests',
    name: 'lab-tests',
    nameAr: 'فحوصات مختبرية',
    category: 'lab',
    icon: '🧪',
    emoji: '🧪',
    description: 'تحاليل دم وبول شاملة مع نتائج رقمية في تطبيقك',
    basePrice: 20000,
    duration: 30,
    available: true,
    needsAddress: true,
  },
  {
    id: 'covid-test',
    name: 'covid-test',
    nameAr: 'فحص كورونا PCR',
    category: 'lab',
    icon: '🦠',
    emoji: '🦠',
    description: 'فحص PCR معتمد للسفر والسلامة العامة',
    basePrice: 50000,
    duration: 20,
    available: true,
    needsAddress: true,
  },

  // === استشارات ===
  {
    id: 'video-consult',
    name: 'video-consult',
    nameAr: 'استشارة طبية مرئية',
    category: 'consult',
    icon: '💬',
    emoji: '💬',
    description: 'مكالمة فيديو مع طبيب مختص خلال ٣٠ دقيقة',
    basePrice: 25000,
    duration: 20,
    available: true,
    needsAddress: false,
    badge: 'فوري',
    badgeColor: 'amber',
  },
  {
    id: 'phone-consult',
    name: 'phone-consult',
    nameAr: 'استشارة هاتفية',
    category: 'consult',
    icon: '📞',
    emoji: '📞',
    description: 'مكالمة صوتية مع طبيب من اختيارك',
    basePrice: 15000,
    duration: 15,
    available: true,
    needsAddress: false,
  },
  {
    id: 'chat-consult',
    name: 'chat-consult',
    nameAr: 'استشارة كتابية',
    category: 'consult',
    icon: '✉️',
    emoji: '✉️',
    description: 'محادثة نصية مع طبيب · ردّ خلال ساعتين',
    basePrice: 10000,
    duration: 60,
    available: true,
    needsAddress: false,
  },

  // === صيدلية ===
  {
    id: 'pharmacy-delivery',
    name: 'pharmacy-delivery',
    nameAr: 'توصيل أدوية',
    category: 'pharmacy',
    icon: '💊',
    emoji: '💊',
    description: 'وصفة طبية → دواء عند بابك خلال ٢ ساعات',
    basePrice: 5000,
    duration: 120,
    available: true,
    needsAddress: true,
  },

  // === حجوزات مستشفيات ===
  {
    id: 'hospital-booking',
    name: 'hospital-booking',
    nameAr: 'حجز موعد مستشفى',
    category: 'hospital',
    icon: '🏥',
    emoji: '🏥',
    description: 'حجز موعد مع طبيب أخصائي في مستشفى من اختيارك',
    basePrice: 30000,
    duration: 60,
    available: true,
    needsAddress: false,
  },

  // === طبيب الأسرة ===
  {
    id: 'family-doctor',
    name: 'family-doctor',
    nameAr: 'طبيب الأسرة',
    category: 'family',
    icon: '⌬',
    emoji: '⌬',
    description: 'طبيبك المخصص يتابع صحتك وعائلتك على مدار الشهر',
    basePrice: 100000,
    duration: 0,
    available: true,
    needsAddress: false,
    badge: 'حصري',
    badgeColor: 'amber',
  },
];

export const CATEGORIES: Record<ServiceCategory, { name: string; emoji: string; color: string }> = {
  home: { name: 'خدمات منزلية', emoji: '🏠', color: 'emerald' },
  lab: { name: 'فحوصات مختبرية', emoji: '🧪', color: 'amber' },
  consult: { name: 'استشارات طبية', emoji: '💬', color: 'emerald' },
  pharmacy: { name: 'صيدلية', emoji: '💊', color: 'amber' },
  hospital: { name: 'حجوزات مستشفيات', emoji: '🏥', color: 'emerald' },
  family: { name: 'طبيب العائلة', emoji: '⌬', color: 'amber' },
};

// تنسيق السعر بالعربية
export function formatPrice(price: number): string {
  return price.toLocaleString('ar-IQ') + ' د.ع';
}

// تنسيق المدة
export function formatDuration(minutes: number): string {
  if (minutes === 0) return 'اشتراك شهري';
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ساعة`;
  return `${hours} ساعة و${mins} دقيقة`;
}

// إيجاد خدمة بالـ id
export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

// إيجاد خدمات حسب الفئة
export function getServicesByCategory(category: ServiceCategory): Service[] {
  return SERVICES.filter((s) => s.category === category && s.available);
}

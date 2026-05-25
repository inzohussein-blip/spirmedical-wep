/**
 * ═══════════════════════════════════════════════════════════════
 * 🏃 Physio Specialists + 💄 Cosmetic Products Seed
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
// أخصّائيو العلاج الطبيعي
// ─────────────────────────────────────────────────────────

export interface PhysioSpecialistSeed {
  full_name: string;
  title?: string;
  gender: 'male' | 'female';
  bio?: string;
  years_experience: number;
  specialties: string[];
  certifications?: string[];
  languages: string[];
  cities: string[];
  home_visit_price: number;
  clinic_visit_price?: number;
  package_discount_pct?: number;
  available_for_home: boolean;
  available_for_clinic: boolean;
  clinic_name?: string;
  clinic_address?: string;
  clinic_city?: string;
}

export const PHYSIO_SPECIALISTS_SEED: PhysioSpecialistSeed[] = [
  {
    full_name: 'أ. أحمد جواد الكناني',
    title: 'أخصائي علاج طبيعي',
    gender: 'male',
    years_experience: 10,
    specialties: ['آلام الظهر', 'إصابات رياضية', 'إعادة تأهيل بعد العمليات'],
    certifications: ['ماجستير علاج طبيعي - جامعة بغداد'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['النجف', 'الكوفة'],
    home_visit_price: 30000,
    clinic_visit_price: 20000,
    package_discount_pct: 15,
    available_for_home: true,
    available_for_clinic: true,
    clinic_name: 'مركز الشفاء للعلاج الطبيعي',
    clinic_address: 'شارع الإمام علي - النجف',
    clinic_city: 'النجف',
    bio: 'خبرة 10 سنوات في العلاج الطبيعي للآلام المزمنة والإصابات الرياضية',
  },
  {
    full_name: 'أ. ليلى محمد الموسوي',
    title: 'أخصائية علاج طبيعي',
    gender: 'female',
    years_experience: 8,
    specialties: ['كبار السن', 'إعادة تأهيل', 'آلام الرقبة والظهر'],
    languages: ['العربية'],
    cities: ['النجف'],
    home_visit_price: 25000,
    clinic_visit_price: 18000,
    package_discount_pct: 10,
    available_for_home: true,
    available_for_clinic: true,
    clinic_name: 'عيادة الحياة',
    clinic_address: 'حي السلام - النجف',
    clinic_city: 'النجف',
    bio: 'متخصّصة في العلاج الطبيعي لكبار السن',
  },
  {
    full_name: 'أ. حسن صالح الجبوري',
    title: 'أخصائي علاج طبيعي رياضي',
    gender: 'male',
    years_experience: 12,
    specialties: ['إصابات الرياضيين', 'علاج المفاصل', 'الإصابات الحادة'],
    certifications: ['شهادة دولية في الطب الرياضي'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['بغداد', 'النجف'],
    home_visit_price: 35000,
    clinic_visit_price: 25000,
    package_discount_pct: 20,
    available_for_home: true,
    available_for_clinic: true,
    clinic_name: 'مركز الأبطال للعلاج الرياضي',
    clinic_address: 'الكرادة - بغداد',
    clinic_city: 'بغداد',
  },
  {
    full_name: 'أ. فاطمة عبدالله الحسناوي',
    title: 'أخصائية علاج طبيعي',
    gender: 'female',
    years_experience: 6,
    specialties: ['أطفال', 'تأخّر النمو', 'الشلل الدماغي'],
    languages: ['العربية'],
    cities: ['النجف'],
    home_visit_price: 30000,
    available_for_home: true,
    available_for_clinic: false,
    bio: 'متخصّصة في العلاج الطبيعي للأطفال',
  },
  {
    full_name: 'أ. علي حسين الكعبي',
    title: 'أخصائي علاج طبيعي',
    gender: 'male',
    years_experience: 7,
    specialties: ['إصابات ما بعد الجلطة', 'إعادة تأهيل عصبي'],
    languages: ['العربية'],
    cities: ['كربلاء', 'النجف'],
    home_visit_price: 28000,
    clinic_visit_price: 20000,
    package_discount_pct: 10,
    available_for_home: true,
    available_for_clinic: true,
    clinic_name: 'مركز كربلاء للعلاج الطبيعي',
    clinic_address: 'وسط كربلاء',
    clinic_city: 'كربلاء',
  },
];

// ─────────────────────────────────────────────────────────
// منتجات التجميل
// ─────────────────────────────────────────────────────────

export interface CosmeticProductSeed {
  name: string;
  name_en?: string;
  brand?: string;
  category: string;
  price: number;
  discount_price?: number;
  description?: string;
  ingredients?: string[];
  usage_instructions?: string;
  image_emoji?: string;
  country_of_origin?: string;
  is_recommended?: boolean;
  recommendation_note?: string;
  stock_quantity?: number;
  is_in_stock?: boolean;
}

export const COSMETIC_PRODUCTS_SEED: CosmeticProductSeed[] = [
  // ─── العناية بالبشرة ───
  {
    name: 'كريم مرطّب للوجه - نهاري',
    name_en: 'Day Moisturizer',
    brand: 'CeraVe',
    category: 'skincare',
    price: 35000,
    discount_price: 28000,
    description: 'مرطّب يومي مع SPF 30 - مناسب للبشرة الحسّاسة',
    ingredients: ['Ceramides', 'Hyaluronic Acid', 'Niacinamide'],
    usage_instructions: 'يُطبّق على البشرة النظيفة في الصباح',
    image_emoji: '☀️',
    country_of_origin: 'USA',
    is_recommended: true,
    recommendation_note: 'الأفضل للبشرة الجافة',
    stock_quantity: 50,
    is_in_stock: true,
  },
  {
    name: 'سيروم فيتامين سي',
    name_en: 'Vitamin C Serum',
    brand: 'The Ordinary',
    category: 'skincare',
    price: 25000,
    description: 'مضاد أكسدة قوي لإشراق البشرة',
    ingredients: ['Vitamin C 23%', 'Hyaluronic Acid'],
    image_emoji: '🍊',
    country_of_origin: 'Canada',
    is_recommended: true,
    stock_quantity: 30,
    is_in_stock: true,
  },
  {
    name: 'غسول وجه للبشرة الدهنية',
    name_en: 'Oily Skin Cleanser',
    brand: 'La Roche-Posay',
    category: 'skincare',
    price: 28000,
    description: 'غسول مهدّئ يُنظّف الزيوت الزائدة',
    ingredients: ['Salicylic Acid', 'Niacinamide'],
    image_emoji: '🧴',
    country_of_origin: 'France',
    stock_quantity: 40,
    is_in_stock: true,
  },
  {
    name: 'كريم ليلي للتجاعيد',
    name_en: 'Anti-Aging Night Cream',
    brand: 'Olay',
    category: 'skincare',
    price: 45000,
    discount_price: 38000,
    description: 'مضاد للشيخوخة - يُجدّد البشرة ليلاً',
    ingredients: ['Retinol', 'Vitamin E', 'Peptides'],
    image_emoji: '🌙',
    country_of_origin: 'USA',
    is_recommended: true,
    stock_quantity: 25,
    is_in_stock: true,
  },
  {
    name: 'كريم مقشّر للوجه',
    brand: 'Neutrogena',
    category: 'skincare',
    price: 22000,
    description: 'يُزيل خلايا الجلد الميتة - مرّتين أسبوعياً',
    image_emoji: '✨',
    country_of_origin: 'USA',
    stock_quantity: 35,
    is_in_stock: true,
  },

  // ─── العناية بالشعر ───
  {
    name: 'شامبو مغذّي للشعر',
    name_en: 'Nourishing Shampoo',
    brand: 'Pantene',
    category: 'haircare',
    price: 12000,
    description: 'شامبو يومي للشعر التالف',
    image_emoji: '💆',
    country_of_origin: 'USA',
    stock_quantity: 100,
    is_in_stock: true,
  },
  {
    name: 'بلسم للشعر الجاف',
    name_en: 'Hair Conditioner',
    brand: 'L\'Oreal',
    category: 'haircare',
    price: 14000,
    description: 'يُرطّب الشعر الجاف ويُعطيه لمعاناً',
    image_emoji: '💇',
    country_of_origin: 'France',
    stock_quantity: 80,
    is_in_stock: true,
  },
  {
    name: 'زيت أركان للشعر',
    name_en: 'Argan Oil',
    brand: 'Moroccan Oil',
    category: 'haircare',
    price: 35000,
    description: 'زيت طبيعي 100% - يُعالج الشعر التالف',
    ingredients: ['Argan Oil'],
    image_emoji: '🌿',
    country_of_origin: 'Morocco',
    is_recommended: true,
    stock_quantity: 20,
    is_in_stock: true,
  },

  // ─── العناية الشخصية ───
  {
    name: 'كريم ترطيب الجسم',
    brand: 'Nivea',
    category: 'bodycare',
    price: 18000,
    description: 'ترطيب 48 ساعة - لجميع أنواع البشرة',
    image_emoji: '🧴',
    country_of_origin: 'Germany',
    stock_quantity: 60,
    is_in_stock: true,
  },
  {
    name: 'صابون يدوي معقّم',
    brand: 'Dettol',
    category: 'bodycare',
    price: 8000,
    description: 'يُزيل 99.9% من الجراثيم',
    image_emoji: '🧼',
    country_of_origin: 'UK',
    stock_quantity: 150,
    is_in_stock: true,
  },
  {
    name: 'مزيل عرق للنساء',
    brand: 'Dove',
    category: 'bodycare',
    price: 9000,
    description: 'حماية 48 ساعة - رائحة منعشة',
    image_emoji: '🌸',
    country_of_origin: 'UK',
    stock_quantity: 90,
    is_in_stock: true,
  },

  // ─── واقي شمس ───
  {
    name: 'واقي شمس SPF 50',
    name_en: 'Sunscreen SPF 50',
    brand: 'Anthelios',
    category: 'sunscreen',
    price: 42000,
    discount_price: 35000,
    description: 'حماية عالية من الشمس - مناسب لكل البشرات',
    ingredients: ['Zinc Oxide', 'Titanium Dioxide'],
    image_emoji: '☀️',
    country_of_origin: 'France',
    is_recommended: true,
    recommendation_note: 'مطلوب يومياً للجميع',
    stock_quantity: 45,
    is_in_stock: true,
  },
];

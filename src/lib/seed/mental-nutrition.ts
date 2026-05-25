/**
 * ═══════════════════════════════════════════════════════════════
 * 🧠 Mental Health Specialists + 🥗 Nutritionists Seed
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
// المختصّون النفسيون
// ─────────────────────────────────────────────────────────

export interface MentalHealthSpecialistSeed {
  full_name: string;
  title?: string;
  gender: 'male' | 'female';
  bio?: string;
  years_experience: number;
  specialist_type: 'psychiatrist' | 'psychologist' | 'counselor';
  specialties: string[];
  certifications?: string[];
  languages: string[];
  cities: string[];
  available_online: boolean;
  available_in_clinic: boolean;
  session_price_min: number;
  session_price_max: number;
}

export const MENTAL_HEALTH_SEED: MentalHealthSpecialistSeed[] = [
  {
    full_name: 'د. سامي حسن المالكي',
    title: 'دكتور',
    gender: 'male',
    years_experience: 15,
    specialist_type: 'psychiatrist',
    specialties: ['اكتئاب', 'قلق', 'اضطرابات النوم', 'الصدمات النفسية'],
    certifications: ['بورد عربي طب نفسي'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['النجف', 'بغداد'],
    available_online: true,
    available_in_clinic: true,
    session_price_min: 25000,
    session_price_max: 50000,
    bio: 'استشاري طب نفسي بخبرة 15 سنة في علاج الاضطرابات المزاجية والقلق',
  },
  {
    full_name: 'أ. ليلى عبدالله الحسناوي',
    title: 'أخصائية',
    gender: 'female',
    years_experience: 8,
    specialist_type: 'psychologist',
    specialties: ['علاج معرفي سلوكي', 'استشارات أسرية', 'العلاقات الزوجية'],
    languages: ['العربية'],
    cities: ['النجف'],
    available_online: true,
    available_in_clinic: false,
    session_price_min: 15000,
    session_price_max: 30000,
    bio: 'أخصائية نفسية متخصّصة في العلاج المعرفي السلوكي والاستشارات الأسرية',
  },
  {
    full_name: 'د. حسن جواد الكناني',
    title: 'دكتور',
    gender: 'male',
    years_experience: 12,
    specialist_type: 'psychiatrist',
    specialties: ['اضطرابات الأطفال', 'فرط الحركة', 'التوحّد'],
    certifications: ['دبلوم عالي طب نفسي للأطفال'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['بغداد', 'النجف'],
    available_online: true,
    available_in_clinic: true,
    session_price_min: 30000,
    session_price_max: 60000,
  },
  {
    full_name: 'أ. زهراء كاظم الموسوي',
    title: 'مرشدة نفسية',
    gender: 'female',
    years_experience: 6,
    specialist_type: 'counselor',
    specialties: ['استشارات شبابية', 'التطوير الذاتي', 'إدارة الضغوط'],
    languages: ['العربية'],
    cities: ['النجف', 'كربلاء'],
    available_online: true,
    available_in_clinic: true,
    session_price_min: 10000,
    session_price_max: 25000,
  },
  {
    full_name: 'د. علي محمد الجبوري',
    title: 'دكتور',
    gender: 'male',
    years_experience: 20,
    specialist_type: 'psychiatrist',
    specialties: ['ادمان', 'الفصام', 'اضطرابات شخصية'],
    certifications: ['زمالة الطب النفسي - بريطانيا'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['بغداد'],
    available_online: true,
    available_in_clinic: true,
    session_price_min: 50000,
    session_price_max: 100000,
    bio: 'استشاري الطب النفسي بخبرة دولية',
  },
];

// ─────────────────────────────────────────────────────────
// أخصّائيو التغذية
// ─────────────────────────────────────────────────────────

export interface NutritionistSeed {
  full_name: string;
  title?: string;
  gender: 'male' | 'female';
  bio?: string;
  years_experience: number;
  specialties: string[];
  certifications?: string[];
  languages: string[];
  cities: string[];
  available_online: boolean;
  available_in_clinic: boolean;
  initial_consultation_price: number;
  followup_price?: number;
  weight_loss_program_price?: number;
}

export const NUTRITIONISTS_SEED: NutritionistSeed[] = [
  {
    full_name: 'أ. نور حسين الحسناوي',
    title: 'أخصائية تغذية',
    gender: 'female',
    years_experience: 10,
    specialties: ['تخفيف الوزن', 'تغذية الرياضيين', 'السكري'],
    certifications: ['ماجستير تغذية - جامعة بغداد'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['النجف'],
    available_online: true,
    available_in_clinic: true,
    initial_consultation_price: 30000,
    followup_price: 15000,
    weight_loss_program_price: 150000,
    bio: 'أخصائية تغذية متخصّصة في برامج تخفيف الوزن وتغذية الرياضيين',
  },
  {
    full_name: 'أ. محمد علي الكناني',
    title: 'أخصائي تغذية',
    gender: 'male',
    years_experience: 8,
    specialties: ['تغذية علاجية', 'أمراض القلب', 'السكري'],
    certifications: ['بكالوريوس تغذية - جامعة الكوفة'],
    languages: ['العربية'],
    cities: ['النجف', 'كربلاء'],
    available_online: true,
    available_in_clinic: true,
    initial_consultation_price: 25000,
    followup_price: 12000,
  },
  {
    full_name: 'أ. زينب عبدالله الجبوري',
    title: 'أخصائية تغذية',
    gender: 'female',
    years_experience: 6,
    specialties: ['تغذية الأطفال', 'الحمل والرضاعة', 'الحساسية الغذائية'],
    languages: ['العربية'],
    cities: ['النجف'],
    available_online: true,
    available_in_clinic: false,
    initial_consultation_price: 20000,
    followup_price: 10000,
  },
  {
    full_name: 'أ. حسن صالح المالكي',
    title: 'أخصائي تغذية',
    gender: 'male',
    years_experience: 12,
    specialties: ['تخفيف الوزن', 'بناء العضلات', 'التغذية المتوازنة'],
    certifications: ['شهادة معتمدة من ISSN'],
    languages: ['العربية', 'الإنجليزية'],
    cities: ['بغداد', 'النجف'],
    available_online: true,
    available_in_clinic: true,
    initial_consultation_price: 35000,
    followup_price: 18000,
    weight_loss_program_price: 200000,
  },
];

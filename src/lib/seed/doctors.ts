/**
 * ═══════════════════════════════════════════════════════════════
 * ⚕️ Doctors Seed Data - أطباء العائلة
 * ═══════════════════════════════════════════════════════════════
 * 
 * ملاحظة: هؤلاء كحسابات مستقلّة (بدون user_id)
 * يمكن ربطهم بحساب مختصّ لاحقاً
 */

export interface DoctorSeed {
  full_name: string;
  full_name_en?: string;
  title?: string;
  gender: 'male' | 'female';
  specialty: string;
  sub_specialty?: string;
  years_experience: number;
  qualifications?: string;
  available_for_home_visit: boolean;
  available_for_video: boolean;
  available_for_clinic: boolean;
  home_visit_price?: number;
  video_consult_price?: number;
  clinic_consult_price?: number;
  cities: string[];
  bio?: string;
  languages: string[];
}

export const DOCTORS_SEED: DoctorSeed[] = [
  // ─── أطباء عامون ───
  {
    full_name: 'د. أحمد كاظم الحسيني',
    title: 'دكتور',
    gender: 'male',
    specialty: 'طب عام',
    years_experience: 12,
    qualifications: 'بكالوريوس طب وجراحة - جامعة الكوفة',
    available_for_home_visit: true,
    available_for_video: true,
    available_for_clinic: true,
    home_visit_price: 25000,
    video_consult_price: 15000,
    clinic_consult_price: 10000,
    cities: ['النجف', 'الكوفة'],
    bio: 'خبرة 12 سنة في الطب العام، مهتم بالأمراض المزمنة والوقاية',
    languages: ['العربية', 'الإنجليزية'],
  },
  {
    full_name: 'د. علي محمد الموسوي',
    title: 'دكتور',
    gender: 'male',
    specialty: 'طب عام',
    sub_specialty: 'طب الأسرة',
    years_experience: 8,
    qualifications: 'بكالوريوس طب - جامعة بغداد',
    available_for_home_visit: true,
    available_for_video: true,
    available_for_clinic: true,
    home_visit_price: 20000,
    video_consult_price: 10000,
    clinic_consult_price: 8000,
    cities: ['النجف'],
    bio: 'طبيب أسرة بخبرة في الطب الوقائي والمتابعة الدورية',
    languages: ['العربية'],
  },
  {
    full_name: 'د. زينب حسن الكعبي',
    title: 'دكتورة',
    gender: 'female',
    specialty: 'طب عام',
    years_experience: 6,
    qualifications: 'بكالوريوس طب - جامعة الكوفة',
    available_for_home_visit: true,
    available_for_video: true,
    available_for_clinic: true,
    home_visit_price: 22000,
    video_consult_price: 12000,
    clinic_consult_price: 10000,
    cities: ['النجف'],
    languages: ['العربية', 'الإنجليزية'],
  },

  // ─── أطباء أطفال ───
  {
    full_name: 'د. حيدر صادق الأمير',
    title: 'دكتور',
    gender: 'male',
    specialty: 'طب الأطفال',
    years_experience: 15,
    qualifications: 'بورد عربي - طب الأطفال',
    available_for_home_visit: true,
    available_for_video: true,
    available_for_clinic: true,
    home_visit_price: 35000,
    video_consult_price: 20000,
    clinic_consult_price: 15000,
    cities: ['النجف', 'الكوفة'],
    bio: 'استشاري أطفال بخبرة 15 سنة في الأمراض الباطنية للأطفال',
    languages: ['العربية', 'الإنجليزية'],
  },
  {
    full_name: 'د. فاطمة عبدالله الجبوري',
    title: 'دكتورة',
    gender: 'female',
    specialty: 'طب الأطفال',
    sub_specialty: 'حديثي الولادة',
    years_experience: 10,
    qualifications: 'دبلوم عالي - طب الأطفال',
    available_for_home_visit: false,
    available_for_video: true,
    available_for_clinic: true,
    video_consult_price: 18000,
    clinic_consult_price: 12000,
    cities: ['النجف'],
    languages: ['العربية'],
  },

  // ─── أمراض باطنية ───
  {
    full_name: 'د. مهدي جواد الربيعي',
    title: 'دكتور',
    gender: 'male',
    specialty: 'باطنية',
    sub_specialty: 'أمراض القلب',
    years_experience: 18,
    qualifications: 'زمالة - أمراض القلب · بريطانيا',
    available_for_home_visit: false,
    available_for_video: true,
    available_for_clinic: true,
    video_consult_price: 30000,
    clinic_consult_price: 25000,
    cities: ['النجف', 'بغداد'],
    bio: 'استشاري قلبية بخبرة دولية، متخصّص في القسطرة',
    languages: ['العربية', 'الإنجليزية'],
  },
  {
    full_name: 'د. كريم رشيد العزاوي',
    title: 'دكتور',
    gender: 'male',
    specialty: 'باطنية',
    sub_specialty: 'السكري والغدد',
    years_experience: 14,
    available_for_home_visit: true,
    available_for_video: true,
    available_for_clinic: true,
    home_visit_price: 35000,
    video_consult_price: 20000,
    clinic_consult_price: 18000,
    cities: ['النجف'],
    bio: 'متخصّص في السكري والغدد الصماء',
    languages: ['العربية'],
  },

  // ─── جلدية ───
  {
    full_name: 'د. هدى صالح الموسوي',
    title: 'دكتورة',
    gender: 'female',
    specialty: 'جلدية',
    years_experience: 9,
    qualifications: 'بورد عربي - أمراض جلدية',
    available_for_home_visit: false,
    available_for_video: true,
    available_for_clinic: true,
    video_consult_price: 25000,
    clinic_consult_price: 20000,
    cities: ['النجف', 'بغداد'],
    languages: ['العربية', 'الإنجليزية'],
  },

  // ─── نسائية ───
  {
    full_name: 'د. سارة ياسين الحسناوي',
    title: 'دكتورة',
    gender: 'female',
    specialty: 'نسائية وتوليد',
    years_experience: 12,
    qualifications: 'بورد عربي - نسائية وتوليد',
    available_for_home_visit: false,
    available_for_video: true,
    available_for_clinic: true,
    video_consult_price: 25000,
    clinic_consult_price: 20000,
    cities: ['النجف'],
    bio: 'استشارية نسائية وتوليد',
    languages: ['العربية'],
  },
  {
    full_name: 'د. مريم ناصر الحسيني',
    title: 'دكتورة',
    gender: 'female',
    specialty: 'نسائية وتوليد',
    sub_specialty: 'العقم والمساعدة على الإنجاب',
    years_experience: 16,
    available_for_home_visit: false,
    available_for_video: true,
    available_for_clinic: true,
    video_consult_price: 35000,
    clinic_consult_price: 30000,
    cities: ['النجف', 'كربلاء'],
    languages: ['العربية', 'الإنجليزية'],
  },
];

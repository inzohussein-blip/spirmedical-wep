/**
 * ═══════════════════════════════════════════════════════════════
 * 💉 Vaccines Seed Data - الجدول الوطني العراقي للقاحات
 * ═══════════════════════════════════════════════════════════════
 */

export interface VaccineSeed {
  name_ar: string;
  name_en?: string;
  manufacturer?: string;
  category: 'pediatric' | 'adult' | 'travel' | 'covid' | 'seasonal' | 'optional';
  diseases: string[];
  doses_required: number;
  dose_interval_days?: number;
  recommended_age_months?: number;
  recommended_age_months_max?: number;
  price: number;
  description?: string;
  is_active?: boolean;
  is_required_by_law?: boolean;
}

export const VACCINES_SEED: VaccineSeed[] = [
  // ─── لقاحات الأطفال (الجدول الوطني العراقي) ───
  {
    name_ar: 'لقاح الدرن (BCG)',
    name_en: 'BCG Vaccine',
    category: 'pediatric',
    diseases: ['الدرن (السل)'],
    doses_required: 1,
    recommended_age_months: 0,
    recommended_age_months_max: 1,
    price: 0,
    description: 'يُعطى عند الولادة - مجاني في المراكز الحكومية',
    is_required_by_law: true,
  },
  {
    name_ar: 'لقاح التهاب الكبد B',
    name_en: 'Hepatitis B Vaccine',
    category: 'pediatric',
    diseases: ['التهاب الكبد B'],
    doses_required: 3,
    dose_interval_days: 30,
    recommended_age_months: 0,
    price: 0,
    description: '3 جرعات: عند الولادة، شهرين، 6 أشهر',
    is_required_by_law: true,
  },
  {
    name_ar: 'لقاح شلل الأطفال (OPV)',
    name_en: 'Polio Vaccine',
    category: 'pediatric',
    diseases: ['شلل الأطفال'],
    doses_required: 4,
    dose_interval_days: 60,
    recommended_age_months: 2,
    price: 0,
    description: 'لقاح فموي - 4 جرعات في أول سنتين',
    is_required_by_law: true,
  },
  {
    name_ar: 'لقاح الخماسي (DTP-HepB-Hib)',
    name_en: 'Pentavalent Vaccine',
    category: 'pediatric',
    diseases: ['الدفتيريا', 'السعال الديكي', 'الكزاز', 'التهاب الكبد B', 'المستدمية النزلية'],
    doses_required: 3,
    dose_interval_days: 60,
    recommended_age_months: 2,
    price: 0,
    description: 'لقاح خماسي - يحمي من 5 أمراض',
    is_required_by_law: true,
  },
  {
    name_ar: 'لقاح المكورات الرئوية (PCV)',
    name_en: 'PCV13 Vaccine',
    category: 'pediatric',
    diseases: ['المكورات الرئوية', 'التهاب السحايا'],
    doses_required: 3,
    dose_interval_days: 60,
    recommended_age_months: 2,
    price: 50000,
    description: 'يحمي من التهاب الرئة والسحايا',
  },
  {
    name_ar: 'لقاح الفيروسة العجلية (Rotavirus)',
    name_en: 'Rotavirus Vaccine',
    category: 'pediatric',
    diseases: ['الإسهال الفيروسي'],
    doses_required: 2,
    dose_interval_days: 60,
    recommended_age_months: 2,
    price: 35000,
    description: 'لقاح فموي للأطفال الصغار',
  },
  {
    name_ar: 'لقاح الحصبة والنكاف والحصبة الألمانية (MMR)',
    name_en: 'MMR Vaccine',
    category: 'pediatric',
    diseases: ['الحصبة', 'النكاف', 'الحصبة الألمانية'],
    doses_required: 2,
    dose_interval_days: 180,
    recommended_age_months: 9,
    price: 0,
    description: 'جرعتان: 9 أشهر و 18 شهراً',
    is_required_by_law: true,
  },
  {
    name_ar: 'لقاح جدري الماء (Varicella)',
    name_en: 'Varicella Vaccine',
    category: 'pediatric',
    diseases: ['جدري الماء'],
    doses_required: 2,
    dose_interval_days: 180,
    recommended_age_months: 12,
    price: 45000,
    description: 'وقاية من جدري الماء',
  },

  // ─── لقاحات الكبار ───
  {
    name_ar: 'لقاح الإنفلونزا الموسمية',
    name_en: 'Seasonal Flu Vaccine',
    category: 'seasonal',
    diseases: ['الإنفلونزا'],
    doses_required: 1,
    price: 25000,
    description: 'موصى به سنوياً - خاصة لكبار السن والحوامل',
  },
  {
    name_ar: 'لقاح التيتانوس (Tetanus)',
    name_en: 'Tetanus Vaccine',
    category: 'adult',
    diseases: ['الكزاز'],
    doses_required: 1,
    price: 15000,
    description: 'جرعة معزّزة كل 10 سنوات',
  },
  {
    name_ar: 'لقاح كوفيد-19',
    name_en: 'COVID-19 Vaccine',
    category: 'covid',
    diseases: ['كوفيد-19'],
    doses_required: 2,
    dose_interval_days: 21,
    price: 0,
    description: 'مجاني في المراكز الحكومية',
  },
  {
    name_ar: 'لقاح فيروس الورم الحليمي (HPV)',
    name_en: 'HPV Vaccine',
    category: 'optional',
    diseases: ['سرطان عنق الرحم', 'فيروس الورم الحليمي'],
    doses_required: 3,
    dose_interval_days: 60,
    price: 150000,
    description: 'موصى به للنساء بعمر 9-26 سنة',
  },

  // ─── لقاحات السفر ───
  {
    name_ar: 'لقاح الحمى الصفراء',
    name_en: 'Yellow Fever Vaccine',
    category: 'travel',
    diseases: ['الحمى الصفراء'],
    doses_required: 1,
    price: 80000,
    description: 'مطلوب للسفر لبعض الدول الإفريقية',
  },
  {
    name_ar: 'لقاح الحمى الشوكية',
    name_en: 'Meningitis Vaccine',
    category: 'travel',
    diseases: ['التهاب السحايا'],
    doses_required: 1,
    price: 60000,
    description: 'مطلوب للحج والعمرة',
  },
];

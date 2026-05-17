// ═══════════════════════════════════════════════════════════════════
// 🩸 كتالوج التحاليل الأساسية - Phase 1
// ═══════════════════════════════════════════════════════════════════
// المرحلة الأولى: أكثر 10 تحاليل طلباً في العراق + 3 باقات شائعة
// يُستخدم في AppointmentWizard لما المستخدم يختار "سحب دم منزلي"
// ═══════════════════════════════════════════════════════════════════

export type TestCategory = 'general' | 'diabetes' | 'cardiac' | 'thyroid' | 'liver' | 'kidney' | 'vitamins' | 'inflammation';

export interface BloodTest {
  id: string;
  code: string;            // اختصار عالمي (CBC, FBS, ..)
  nameAr: string;          // الاسم العربي
  description: string;     // وصف مختصر
  category: TestCategory;
  price: number;           // بالدينار العراقي
  fastingRequired: boolean; // يحتاج صيام؟
  fastingHours?: number;   // ساعات الصيام (لو needed)
  resultTime: string;      // مدة النتيجة (مثلاً "24 ساعة")
  emoji: string;
  popular?: boolean;       // الأكثر طلباً
  keywords: string[];      // كلمات للبحث
}

// ─────────────────────────────────────────────────────────────────
// الـ 10 تحاليل الأساسية
// ─────────────────────────────────────────────────────────────────

export const BLOOD_TESTS: BloodTest[] = [
  {
    id: 'cbc',
    code: 'CBC',
    nameAr: 'تعداد الدم الكامل',
    description: 'فحص شامل لخلايا الدم الحمراء والبيضاء والصفائح',
    category: 'general',
    price: 7000,
    fastingRequired: false,
    resultTime: '24 ساعة',
    emoji: '🩸',
    popular: true,
    keywords: ['تعداد', 'دم', 'كريات', 'هيموغلوبين', 'cbc', 'فقر دم', 'انيميا'],
  },
  {
    id: 'fbs',
    code: 'FBS',
    nameAr: 'سكر الدم الصائم',
    description: 'قياس مستوى الجلوكوز بعد 8 ساعات صيام',
    category: 'diabetes',
    price: 5000,
    fastingRequired: true,
    fastingHours: 8,
    resultTime: '4 ساعات',
    emoji: '🍬',
    popular: true,
    keywords: ['سكر', 'صائم', 'fbs', 'سكري', 'صيامي', 'glucose', 'جلوكوز'],
  },
  {
    id: 'hba1c',
    code: 'HbA1c',
    nameAr: 'السكر التراكمي',
    description: 'متوسط السكر خلال آخر 3 أشهر (لمراقبة السكري)',
    category: 'diabetes',
    price: 15000,
    fastingRequired: false,
    resultTime: '24 ساعة',
    emoji: '📊',
    popular: true,
    keywords: ['تراكمي', 'hba1c', 'a1c', 'سكر طويل', 'تحكم سكري'],
  },
  {
    id: 'lipid',
    code: 'Lipid Profile',
    nameAr: 'الدهون الكاملة',
    description: 'كوليسترول، LDL، HDL، الدهون الثلاثية',
    category: 'cardiac',
    price: 18000,
    fastingRequired: true,
    fastingHours: 12,
    resultTime: '24 ساعة',
    emoji: '❤️',
    popular: true,
    keywords: ['دهون', 'كوليسترول', 'ldl', 'hdl', 'triglycerides', 'قلب', 'lipid'],
  },
  {
    id: 'tsh',
    code: 'TSH',
    nameAr: 'هرمون الغدة الدرقية',
    description: 'فحص نشاط الغدة الدرقية (الـ TSH)',
    category: 'thyroid',
    price: 12000,
    fastingRequired: false,
    resultTime: '24 ساعة',
    emoji: '🦋',
    keywords: ['درقية', 'tsh', 'غدة', 'هرمون', 'كسل غدة', 'thyroid'],
  },
  {
    id: 'lft',
    code: 'LFT',
    nameAr: 'وظائف الكبد',
    description: 'ALT, AST, ALP, البيليروبين، الزلال',
    category: 'liver',
    price: 15000,
    fastingRequired: false,
    resultTime: '24 ساعة',
    emoji: '🫀',
    keywords: ['كبد', 'liver', 'alt', 'ast', 'lft', 'وظائف كبد', 'كبدي'],
  },
  {
    id: 'rft',
    code: 'RFT',
    nameAr: 'وظائف الكلى',
    description: 'الكرياتينين، اليوريا، حمض اليوريك',
    category: 'kidney',
    price: 14000,
    fastingRequired: false,
    resultTime: '24 ساعة',
    emoji: '🫘',
    keywords: ['كلى', 'كلية', 'كرياتينين', 'يوريا', 'rft', 'kidney', 'نقرس', 'يوريك'],
  },
  {
    id: 'vit-d',
    code: 'Vitamin D',
    nameAr: 'فيتامين د',
    description: 'مستوى فيتامين D في الدم (25-OH)',
    category: 'vitamins',
    price: 25000,
    fastingRequired: false,
    resultTime: '48 ساعة',
    emoji: '☀️',
    popular: true,
    keywords: ['فيتامين د', 'vitamin d', 'vit d', 'شمس', '25-oh', 'هشاشة'],
  },
  {
    id: 'vit-b12',
    code: 'Vitamin B12',
    nameAr: 'فيتامين ب١٢',
    description: 'مستوى فيتامين B12 (لفقر الدم والأعصاب)',
    category: 'vitamins',
    price: 18000,
    fastingRequired: false,
    resultTime: '48 ساعة',
    emoji: '💊',
    keywords: ['فيتامين b12', 'b12', 'ب12', 'ب١٢', 'cobalamin', 'أعصاب'],
  },
  {
    id: 'crp',
    code: 'CRP',
    nameAr: 'الكشف عن الالتهابات',
    description: 'مؤشر الالتهابات في الجسم (C-Reactive Protein)',
    category: 'inflammation',
    price: 8000,
    fastingRequired: false,
    resultTime: '12 ساعة',
    emoji: '🔥',
    keywords: ['التهاب', 'crp', 'بروتين', 'inflammation', 'إنفلامشن'],
  },
  {
    id: 'insulin-resistance',
    code: 'HOMA-IR',
    nameAr: 'مقاومة الأنسولين',
    description: 'قياس مقاومة الجسم للأنسولين (السكر + الأنسولين)',
    category: 'diabetes',
    price: 25000,
    fastingRequired: true,
    fastingHours: 12,
    resultTime: '48 ساعة',
    emoji: '⚖️',
    popular: true,
    keywords: ['مقاومة', 'انسولين', 'insulin', 'homa', 'سكري مبكر', 'pre-diabetes', 'متلازمة الأيض'],
  },
  {
    id: 'ferritin',
    code: 'Ferritin',
    nameAr: 'الفيريتين (مخزون الحديد)',
    description: 'قياس مخزون الحديد في الجسم — للأنيميا وفقر الدم',
    category: 'general',
    price: 14000,
    fastingRequired: false,
    resultTime: '24 ساعة',
    emoji: '⛓️',
    keywords: ['فيريتين', 'حديد', 'ferritin', 'iron', 'مخزون', 'انيميا', 'فقر دم'],
  },
  {
    id: 'thyroid-full',
    code: 'T3/T4/TSH',
    nameAr: 'الغدة الدرقية الكاملة',
    description: 'TSH + T3 + T4 — تشخيص شامل للغدة الدرقية',
    category: 'thyroid',
    price: 28000,
    fastingRequired: false,
    resultTime: '48 ساعة',
    emoji: '🦋',
    keywords: ['درقية كاملة', 't3', 't4', 'thyroid full', 'هرمونات الغدة'],
  },
  {
    id: 'pregnancy-bhcg',
    code: 'B-hCG',
    nameAr: 'فحص الحمل بالدم',
    description: 'قياس هرمون B-hCG بدقة (للحمل المبكر)',
    category: 'general',
    price: 12000,
    fastingRequired: false,
    resultTime: '6 ساعات',
    emoji: '🤱',
    keywords: ['حمل', 'pregnancy', 'bhcg', 'beta', 'هرمون الحمل'],
  },
];

// ─────────────────────────────────────────────────────────────────
// الباقات الجاهزة (Bundles)
// ─────────────────────────────────────────────────────────────────

export interface TestBundle {
  id: string;
  nameAr: string;
  description: string;
  testIds: string[];          // مراجع للـ BLOOD_TESTS
  price: number;              // سعر الباقة (أقل من المجموع)
  savePercent: number;        // نسبة التوفير
  fastingRequired: boolean;
  emoji: string;
  popular?: boolean;
  forWhom: string;            // لمن يُنصح بهذه الباقة
}

export const TEST_BUNDLES: TestBundle[] = [
  {
    id: 'bundle-general-health',
    nameAr: 'باقة الصحة العامة',
    description: 'فحص شامل أساسي لكل البالغين سنوياً',
    testIds: ['cbc', 'fbs', 'lipid', 'lft', 'rft'],
    price: 49000, // المجموع 59,000 → خصم 10,000
    savePercent: 17,
    fastingRequired: true,
    emoji: '✨',
    popular: true,
    forWhom: 'يُنصح بها سنوياً لكل من فوق 30 سنة',
  },
  {
    id: 'bundle-diabetes',
    nameAr: 'باقة مرضى السكري',
    description: 'متابعة شاملة للسكري ومضاعفاته',
    testIds: ['fbs', 'hba1c', 'lipid', 'rft', 'vit-d'],
    price: 65000, // المجموع 77,000 → خصم 12,000
    savePercent: 16,
    fastingRequired: true,
    emoji: '🩺',
    popular: true,
    forWhom: 'لمرضى السكري كل 3-6 أشهر',
  },
  {
    id: 'bundle-complete',
    nameAr: 'الباقة الشاملة',
    description: 'فحص شامل لكل المؤشرات الحيوية',
    testIds: ['cbc', 'fbs', 'hba1c', 'lipid', 'tsh', 'lft', 'rft', 'vit-d', 'vit-b12'],
    price: 105000, // المجموع 129,000 → خصم 24,000
    savePercent: 19,
    fastingRequired: true,
    emoji: '🏆',
    forWhom: 'فحص سنوي شامل أو لمن لديه عدة شكاوى',
  },
];

// ─────────────────────────────────────────────────────────────────
// تصنيفات للعرض
// ─────────────────────────────────────────────────────────────────

export const TEST_CATEGORIES: Record<TestCategory, { name: string; emoji: string }> = {
  general: { name: 'عامة', emoji: '🩸' },
  diabetes: { name: 'السكري', emoji: '🍬' },
  cardiac: { name: 'القلب', emoji: '❤️' },
  thyroid: { name: 'الغدة', emoji: '🦋' },
  liver: { name: 'الكبد', emoji: '🫀' },
  kidney: { name: 'الكلى', emoji: '🫘' },
  vitamins: { name: 'الفيتامينات', emoji: '☀️' },
  inflammation: { name: 'الالتهابات', emoji: '🔥' },
};

// ─────────────────────────────────────────────────────────────────
// أدوات (Helpers)
// ─────────────────────────────────────────────────────────────────

/**
 * بحث في التحاليل بالاسم أو الكلمات المفتاحية
 */
export function searchTests(query: string): BloodTest[] {
  const q = query.trim().toLowerCase();
  if (!q) return BLOOD_TESTS;

  return BLOOD_TESTS.filter((test) => {
    if (test.nameAr.toLowerCase().includes(q)) return true;
    if (test.code.toLowerCase().includes(q)) return true;
    if (test.description.toLowerCase().includes(q)) return true;
    return test.keywords.some((k) => k.toLowerCase().includes(q));
  });
}

/**
 * حساب السعر الإجمالي لمجموعة تحاليل
 */
export function calculateTestsTotal(testIds: string[]): number {
  return testIds.reduce((total, id) => {
    const test = BLOOD_TESTS.find((t) => t.id === id);
    return total + (test?.price || 0);
  }, 0);
}

/**
 * يحتاج صيام؟ إذا أي تحليل في القائمة يحتاج صيام
 */
export function needsFasting(testIds: string[]): { required: boolean; hours: number } {
  let maxHours = 0;
  for (const id of testIds) {
    const test = BLOOD_TESTS.find((t) => t.id === id);
    if (test?.fastingRequired && (test.fastingHours || 8) > maxHours) {
      maxHours = test.fastingHours || 8;
    }
  }
  return { required: maxHours > 0, hours: maxHours };
}

/**
 * أطول وقت نتيجة (لعرض ETA للمستخدم)
 */
export function longestResultTime(testIds: string[]): string {
  let maxHours = 0;
  for (const id of testIds) {
    const test = BLOOD_TESTS.find((t) => t.id === id);
    if (!test) continue;
    const match = test.resultTime.match(/(\d+)/);
    const hours = match ? parseInt(match[1], 10) : 24;
    if (hours > maxHours) maxHours = hours;
  }
  return `${maxHours} ساعة`;
}

/**
 * تنسيق سعر بالدينار العراقي
 */
export function formatTestPrice(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

/**
 * حساب تكلفة باقة من ids التحاليل (مع تسعير ذكي)
 * - تحليلين: -5%
 * - 3-4 تحاليل: -10%
 * - 5+ تحاليل: -15%
 */
export function calculateBundleDiscount(testIds: string[]): {
  subtotal: number;
  discount: number;
  total: number;
  discountPercent: number;
} {
  const subtotal = calculateTestsTotal(testIds);
  let discountPercent = 0;
  if (testIds.length >= 5) discountPercent = 15;
  else if (testIds.length >= 3) discountPercent = 10;
  else if (testIds.length === 2) discountPercent = 5;

  const discount = Math.round((subtotal * discountPercent) / 100 / 500) * 500; // تقريب لأقرب 500
  return {
    subtotal,
    discount,
    total: subtotal - discount,
    discountPercent,
  };
}

/**
 * نص ملاحظات حول التحاليل المختارة (يُدمج مع notes في DB)
 */
export function buildTestsSummary(testIds: string[], bundleId?: string): string {
  if (bundleId) {
    const bundle = TEST_BUNDLES.find((b) => b.id === bundleId);
    if (bundle) {
      const testNames = bundle.testIds
        .map((id) => BLOOD_TESTS.find((t) => t.id === id)?.nameAr)
        .filter(Boolean)
        .join(', ');
      return `[باقة] ${bundle.nameAr}: ${testNames}`;
    }
  }

  const names = testIds
    .map((id) => BLOOD_TESTS.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => `${t!.code} (${t!.nameAr})`)
    .join('، ');
  return `[تحاليل] ${names}`;
}

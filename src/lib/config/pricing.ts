// إظهار/إخفاء الأسعار في واجهة المريض (مصدر واحد موحّد).
//
// false = تُخفى كل مبالغ الفحوصات/الطلبات من واجهة المريض (الاختيار، الفوتر،
// سجلّ التحاليل، تفاصيل الطلب). البيانات والحساب يبقيان داخلياً (تُسجَّل في
// lab_orders للإدارة). لإظهار الأسعار مجدداً بدّل هذا العلم إلى true.
export const SHOW_PRICES = false;

/**
 * 🚫 التحاليلُ وسحبُ الدم بلا سعرٍ أبداً (قرار المالك، 17 تشرين الأول).
 *
 * لا يتبع `SHOW_PRICES`: لو أُعيد العلمُ إلى true تبقى هذه بلا سعر — في واجهة المريض
 * والمختصّ والإدارة والموقع. كانت «من 15$» في بطاقة الرئيسية و«من 15,000 د.ع» في المعالج
 * تتجاوز العلمَ أصلاً. السعرُ يُتّفق عليه مع المختصّ (`lib/seo/facts.ts`).
 * الحارس: tests/no-test-prices.test.tsx
 */
const UNPRICED_IDS = new Set(['blood-draw', 'covid-test', 'lab-tests', 'blood-tests']);
const UNPRICED_TEXT = /سحب\s*(?:ال)?دم|تحليل|تحاليل|فحص\s*مختبر/;

export function isUnpricedService(s: {
  id?: string | null;
  service_id?: string | null;
  category?: string | null;
  service_type?: string | null;
  required_specialist_type?: string | null;
}): boolean {
  const id = s.id ?? s.service_id;
  return (
    s.category === 'lab' ||
    (!!id && UNPRICED_IDS.has(id)) ||
    s.required_specialist_type === 'lab_analyst' ||
    (!!s.service_type && UNPRICED_TEXT.test(s.service_type))
  );
}

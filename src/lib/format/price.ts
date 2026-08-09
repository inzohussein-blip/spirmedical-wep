/**
 * ════════════════════════════════════════════════════════════════════
 * 💰 تنسيق الأسعار والأعداد التي تقبل NULL
 * ════════════════════════════════════════════════════════════════════
 *
 * أعمدة الأسعار في قاعدة البيانات كلّها `NULL`-able، بينما كانت الأنواع
 * المكتوبة يدوياً تدّعي أنّها `number`. فكان الكود ينادي
 * `price.toLocaleString('ar-IQ')` مباشرةً — ومزوّدٌ يفعّل خدمةً بلا سعرٍ
 * مُسجَّل **يُسقط الصفحة كلّها** بـTypeError، لا يعرض سعراً ناقصاً فحسب.
 *
 * القاعدة هنا: السعر الغائب يُعرض «غير محدّد» ولا يُعرض صفراً — فصفرٌ
 * يعني «مجّاني» وهو ادّعاءٌ مختلف تماماً.
 * ════════════════════════════════════════════════════════════════════
 */

const LOCALE = 'ar-IQ';

/** «غير محدّد» حين يغيب السعر */
export const PRICE_UNKNOWN = 'غير محدّد';

/** رقم منسَّق، أو null إن كان غائباً */
export function formatNumber(value: number | null | undefined): string | null {
  return value == null ? null : value.toLocaleString(LOCALE);
}

/** سعر بالدينار: «12,000 د.ع» أو «غير محدّد» */
export function formatPrice(value: number | null | undefined): string {
  const n = formatNumber(value);
  return n === null ? PRICE_UNKNOWN : `${n} د.ع`;
}

/**
 * مدى سعري يتحمّل غياب أحد الطرفين:
 *   كلاهما → «5,000 - 12,000 د.ع»
 *   الأدنى فقط → «من 5,000 د.ع»
 *   الأعلى فقط → «حتى 12,000 د.ع»
 *   لا شيء → «غير محدّد»
 */
export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  const lo = formatNumber(min);
  const hi = formatNumber(max);

  if (lo !== null && hi !== null) return `${lo} - ${hi} د.ع`;
  if (lo !== null) return `من ${lo} د.ع`;
  if (hi !== null) return `حتى ${hi} د.ع`;
  return PRICE_UNKNOWN;
}

/** عدّاد للعرض — الغائب صفر (وهنا الصفر معنىً صحيح) */
export function count(value: number | null | undefined): number {
  return value ?? 0;
}

/** تقييم بمنزلة عشرية واحدة؛ الغائب يُعامل صفراً */
export function formatRating(value: number | null | undefined): string {
  return (value ?? 0).toFixed(1);
}

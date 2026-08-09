/**
 * ════════════════════════════════════════════════════════════════════
 * 💰 الأسعار اختيارية على مقدّم الخدمة
 * ════════════════════════════════════════════════════════════════════
 *
 * السياسة: السعر يُدخله مقدّم الخدمة إن شاء. وإن لم يُدخله فلا يُعرض شيء
 * إطلاقاً — لا صفر، ولا «غير محدّد»، ولا قيمة تخترعها المنصّة نيابةً عنه.
 *
 * سببان لهذا:
 *   • كانت أعمدة الأسعار تحمل قيماً افتراضية في قاعدة البيانات
 *     (مثل `cleaning_price_min DEFAULT 15000`)، فمقدّم خدمة لا يُدخل سعراً
 *     تُلصق به المنصّة سعراً مخترَعاً ويراه المريض كأنّه سعره المعلَن.
 *   • عرض «٠ د.ع» يعني «مجّاني» — وهو ادّعاء مختلف تماماً عن «لم يُحدَّد».
 *
 * لذلك يُعامَل **الصفر كغير محدَّد** أيضاً: لا خدمة طبّية في الكتالوج
 * سعرها صفر، والصفر في البيانات القديمة كان يعني «غير مُدخَل».
 *
 * كل الدوالّ تُرجع `null` حين لا سعر — كي يُخفي المستدعي الكتلة كلّها
 * بدل طباعة نصٍّ بديل.
 * ════════════════════════════════════════════════════════════════════
 */

const LOCALE = 'ar-IQ';
const CURRENCY = 'د.ع';

/** هل هذه القيمة سعرٌ معروض فعلاً؟ (الفراغ والصفر ليسا سعراً) */
export function hasPrice(value: number | null | undefined): value is number {
  return value != null && value > 0;
}

/** رقم منسَّق، أو null إن لم يُحدَّد */
export function formatNumber(value: number | null | undefined): string | null {
  return hasPrice(value) ? value.toLocaleString(LOCALE) : null;
}

/** «12,000 د.ع» أو null إن لم يُحدَّد */
export function formatPrice(value: number | null | undefined): string | null {
  const n = formatNumber(value);
  return n === null ? null : `${n} ${CURRENCY}`;
}

/**
 * مدى سعري يتحمّل غياب أحد الطرفين:
 *   كلاهما → «5,000 - 12,000 د.ع»
 *   الأدنى فقط → «من 5,000 د.ع»
 *   الأعلى فقط → «حتى 12,000 د.ع»
 *   لا شيء → null (فلا تُعرض الكتلة)
 */
export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  const lo = formatNumber(min);
  const hi = formatNumber(max);

  if (lo !== null && hi !== null) return `${lo} - ${hi} ${CURRENCY}`;
  if (lo !== null) return `من ${lo} ${CURRENCY}`;
  if (hi !== null) return `حتى ${hi} ${CURRENCY}`;
  return null;
}

/** عدّاد للعرض — الغائب صفر (وهنا الصفر معنىً صحيح، بخلاف السعر) */
export function count(value: number | null | undefined): number {
  return value ?? 0;
}

/** تقييم بمنزلة عشرية واحدة؛ الغائب يُعامل صفراً */
export function formatRating(value: number | null | undefined): string {
  return (value ?? 0).toFixed(1);
}

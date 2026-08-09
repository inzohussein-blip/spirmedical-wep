/**
 * ════════════════════════════════════════════════════════════════════
 * 🕒 حدود «اليوم» بتوقيت بغداد
 * ════════════════════════════════════════════════════════════════════
 *
 * الخادم على Vercel يعمل بتوقيت UTC، فـ`new Date().setHours(0,0,0,0)`
 * يُنتج بداية اليوم **بتوقيت UTC** لا بتوقيت المستخدم في العراق. الفارق
 * ثلاث ساعات، وأثره حقيقي في التذكيرات:
 *
 *   نافذة يوم UTC = من ٠٣:٠٠ بغداد اليوم إلى ٠٢:٥٩ بغداد غداً.
 *
 * فموعدٌ غداً الساعة ٠١:٠٠ بغداد يقع داخل «اليوم» بتوقيت UTC، ويصل صاحبَه
 * إشعار «📅 موعدك اليوم» قبل يومٍ كامل تقريباً — وهو خطأ مُكلف في منصّة
 * طبّية: إمّا يحضر المريض في اليوم الخطأ أو يفقد الثقة بالتذكيرات.
 *
 * العراق يعتمد UTC+3 ثابتاً طوال السنة (أُلغي التوقيت الصيفي عام ٢٠١٥)،
 * فإزاحةٌ ثابتة صحيحة هنا ولا تحتاج مكتبة مناطق زمنية.
 * ════════════════════════════════════════════════════════════════════
 */

/** إزاحة بغداد عن UTC بالساعات (ثابتة — لا توقيت صيفي) */
export const BAGHDAD_UTC_OFFSET_HOURS = 3;

const HOUR_MS = 60 * 60 * 1000;

export interface DayWindow {
  /** بداية اليوم بتوقيت بغداد، معبَّراً عنها كلحظة UTC */
  start: Date;
  /** نهاية اليوم بتوقيت بغداد، معبَّراً عنها كلحظة UTC */
  end: Date;
}

/**
 * يُعيد بداية ونهاية اليوم **بتوقيت بغداد** للحظة المعطاة.
 *
 * الطريقة: نزيح اللحظة إلى توقيت بغداد، نقتطع مكوّنات اليوم، ثمّ نطرح
 * الإزاحة لنعود إلى لحظات UTC صالحة للمقارنة مع `timestamptz`.
 */
export function baghdadDayWindow(now: Date = new Date()): DayWindow {
  const offsetMs = BAGHDAD_UTC_OFFSET_HOURS * HOUR_MS;
  const shifted = new Date(now.getTime() + offsetMs);

  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();

  return {
    start: new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - offsetMs),
    end: new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - offsetMs),
  };
}

/**
 * التاريخ بصيغة `YYYY-MM-DD` بتوقيت بغداد.
 * يُستعمل للمقارنة مع أعمدة `date` (مثل `end_date` في الجداول الدورية).
 */
export function baghdadDateString(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + BAGHDAD_UTC_OFFSET_HOURS * HOUR_MS);
  return shifted.toISOString().slice(0, 10);
}

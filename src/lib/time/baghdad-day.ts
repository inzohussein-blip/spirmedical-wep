/**
 * ════════════════════════════════════════════════════════════════════
 * 🕒 حدود «اليوم» بتوقيت بغداد
 * ════════════════════════════════════════════════════════════════════
 *
 * الخادم على Vercel يعمل بتوقيت UTC، فـ`new Date().setHours(0,0,0,0)`
 * يُنتج بداية اليوم **بتوقيت UTC** لا بتوقيت المستخدم في العراق. الفارق
 * ثلاث ساعات، وأثره حقيقي في التذكيرات:
 *
 *   نافذة يوم UTC = من 03:00 بغداد اليوم إلى 02:59 بغداد غداً.
 *
 * فموعدٌ غداً الساعة 01:00 بغداد يقع داخل «اليوم» بتوقيت UTC، ويصل صاحبَه
 * إشعار «📅 موعدك اليوم» قبل يومٍ كامل تقريباً — وهو خطأ مُكلف في منصّة
 * طبّية: إمّا يحضر المريض في اليوم الخطأ أو يفقد الثقة بالتذكيرات.
 *
 * العراق يعتمد UTC+3 ثابتاً طوال السنة (أُلغي التوقيت الصيفي عام 2015)،
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
 * الوقت بصيغة `HH:MM:SS` بتوقيت بغداد.
 *
 * يُقارَن بأعمدة `time` مثل `quiet_hours_start` / `quiet_hours_end`. كان
 * الحساب يستعمل `new Date().toTimeString()` أي توقيت الخادم (UTC)، فساعات
 * الهدوء «23:00 → 07:00» كانت تُطبَّق فعلياً من 02:00 إلى 10:00 بغداد:
 * إشعارات تصل في منتصف الليل، وتُكتم في ساعات الصباح المفيدة.
 */
export function baghdadTimeString(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + BAGHDAD_UTC_OFFSET_HOURS * HOUR_MS);
  return shifted.toISOString().slice(11, 19);
}

/**
 * التاريخ بصيغة `YYYY-MM-DD` بتوقيت بغداد.
 * يُستعمل للمقارنة مع أعمدة `date` (مثل `end_date` في الجداول الدورية).
 */
export function baghdadDateString(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + BAGHDAD_UTC_OFFSET_HOURS * HOUR_MS);
  return shifted.toISOString().slice(0, 10);
}

/**
 * «YYYY-MM-DD» ليوم بغداد بعد `offsetDays` — لـ`min`/`max` وقيمِ `<input type="date">`.
 *
 * كانت هذه الحقول تُؤخذ من `toISOString()` على جهاز المستخدم، أي بتاريخ UTC: بين منتصف
 * الليل والثالثة فجراً في العراق صار «الغد» في سحب الدم هو اليوم، و«اليوم» في التمريض
 * المنزليّ هو الأمس — فيُقترح على المريض موعدٌ في يومٍ مضى. والمنطقةُ ثابتة لا منطقةُ
 * الجهاز: الحقول تُرسَم على الخادم ثمّ تُرطَّب في المتصفّح، فيجب أن يتّفق التاريخان.
 */
export function baghdadDateOffset(offsetDays: number, now: Date = new Date()): string {
  return baghdadDateString(new Date(now.getTime() + offsetDays * 24 * HOUR_MS));
}

/**
 * العمرُ بالسنوات الكاملة في يوم بغداد، أو null لتاريخٍ غائب أو غير صالح.
 *
 * كان يُحسب في أربعة مواضع بـ`(Date.now() - dob) / 365.25 يوماً`: يومَ ميلاد المريض بعد
 * سنةٍ غير كبيسة تكون القسمةُ 0.9993 فيُعرض عمرُه أقلَّ بسنة.
 */
export function ageInYears(dob: string | null | undefined, now: Date = new Date()): number | null {
  if (!dob) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob);
  if (!m) return null;
  const [y, mo, d] = baghdadDateString(now).split('-').map(Number);
  let years = y - Number(m[1]);
  const bm = Number(m[2]);
  if (mo < bm || (mo === bm && d < Number(m[3]))) years--;
  return Math.max(0, years);
}

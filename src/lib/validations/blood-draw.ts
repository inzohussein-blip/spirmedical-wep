import { z } from 'zod';

/**
 * ════════════════════════════════════════════════════════════════════
 * التحقّق من طلب سحب الدم/التحاليل — مصدر واحد (عميل + خادم)
 * ════════════════════════════════════════════════════════════════════
 *
 * يُستعمل في:
 *   • BloodDrawFlow (عميل): لعرض أخطاء الحقول المضمّنة + صندوق «الحقول الناقصة».
 *   • createBloodDrawOrder (خادم): كطبقة تحقّق ثانية تُرجع أخطاء الحقول أيضاً.
 *
 * القاعدة: مصدر واحد لحدود كل حقل (كان هناك تضارب: العميل 15 · الخادم 10).
 * ════════════════════════════════════════════════════════════════════
 */

// موبايل عراقي: 07XXXXXXXXX (11 رقماً) أو 7XXXXXXXXX (10 أرقام) — أرقام فقط.
const IRAQI_MOBILE = /^0?7\d{9}$/;

export const bloodDrawSchema = z.object({
  tests: z
    .array(z.string())
    .min(1, 'اختر تحليلاً واحداً على الأقل'),
  address: z
    .string()
    .trim()
    .min(10, 'أدخل عنواناً مفصّلاً (محافظة + منطقة + شارع)')
    .max(300, 'العنوان طويل جداً'),
  phone: z
    .string()
    .trim()
    .regex(IRAQI_MOBILE, 'أدخل رقم موبايل عراقي صحيح (يبدأ بـ 07)'),
  date: z
    .string()
    .min(1, 'اختر تاريخ سحب الدم')
    .refine((v) => !isNaN(Date.parse(v)), 'تاريخ غير صحيح'),
  time: z
    .string()
    .min(1, 'اختر وقت سحب الدم'),
  // اختيارية — لا تمنع الإرسال، لكن تُتحقّق إن مُلئت
  age: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number(v) >= 1 && Number(v) <= 120),
      'أدخل عمراً صحيحاً (1–120)',
    ),
  gender: z.enum(['male', 'female', '']).optional(),
  condition: z.string().max(150, 'الوصف طويل جداً').optional(),
});

export type BloodDrawValidationInput = z.input<typeof bloodDrawSchema>;
export type BloodDrawFieldErrors = Record<string, string>;

/** تسميات عربية للحقول — تُستعمل في صندوق «الحقول الناقصة». */
export const BLOOD_DRAW_FIELD_LABELS: Record<string, string> = {
  tests: 'التحاليل',
  address: 'العنوان',
  phone: 'رقم الموبايل',
  date: 'التاريخ',
  time: 'الساعة',
  age: 'العمر',
  gender: 'الجنس',
  condition: 'الحالة المرضية',
};

/**
 * يتحقّق ويُرجع أوّل خطأ لكل حقل (نمط reducer على path[0]).
 * `ok:true` يعني لا أخطاء.
 */
export function validateBloodDraw(
  input: BloodDrawValidationInput,
): { ok: boolean; fieldErrors: BloodDrawFieldErrors } {
  const result = bloodDrawSchema.safeParse(input);
  if (result.success) return { ok: true, fieldErrors: {} };

  const fieldErrors: BloodDrawFieldErrors = {};
  for (const err of result.error.errors) {
    const field = err.path[0] as string;
    if (field && !fieldErrors[field]) fieldErrors[field] = err.message;
  }
  return { ok: false, fieldErrors };
}

/**
 * تحقّق خادمي — يتحقّق فقط من الحقول التي يستقبلها الخادم (التحاليل + العنوان)
 * بنفس الحدود، ويُرجع أخطاء الحقول. (الهاتف/التاريخ/الوقت يُتحقّق منها عميلاً.)
 */
export function validateBloodDrawServer(
  input: { tests: string[]; address: string },
): { ok: boolean; fieldErrors: BloodDrawFieldErrors } {
  const schema = bloodDrawSchema.pick({ tests: true, address: true });
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, fieldErrors: {} };

  const fieldErrors: BloodDrawFieldErrors = {};
  for (const err of result.error.errors) {
    const field = err.path[0] as string;
    if (field && !fieldErrors[field]) fieldErrors[field] = err.message;
  }
  return { ok: false, fieldErrors };
}

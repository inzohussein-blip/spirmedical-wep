/**
 * ════════════════════════════════════════════════════════════════════
 * التحقّق من طلب التمريض المنزلي — مصدر واحد (عميل + خادم)
 * ════════════════════════════════════════════════════════════════════
 *
 * على نمط src/lib/validations/blood-draw.ts. يُرجع أخطاء الحقول
 * (Record<field,message>) لتُبرز مضمّنة + في صندوق «الحقول الناقصة».
 * ════════════════════════════════════════════════════════════════════
 */

// موبايل عراقي: 07XXXXXXXXX (11) أو 7XXXXXXXXX (10) — أرقام فقط.
const IRAQI_MOBILE = /^0?7\d{9}$/;

export type NursingFieldErrors = Record<string, string>;

export interface NursingValidationInput {
  procedureId: string | null;
  allergyConfirmed: boolean;
  prescriptionImage: string | null;
  prescriptionSkipped: boolean;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  phone: string;
}

/** تسميات عربية للحقول — لصندوق «الحقول الناقصة». */
export const NURSING_FIELD_LABELS: Record<string, string> = {
  procedure: 'الإجراء',
  allergy: 'استمارة الحساسية',
  prescription: 'الوصفة الطبية',
  date: 'التاريخ',
  time: 'الوقت',
  address: 'العنوان',
  phone: 'رقم الموبايل',
};

/** حقول كل خطوة (للتحقّق عند «التالي»). */
export const NURSING_STEP_FIELDS: Record<number, string[]> = {
  1: ['procedure'],
  2: ['allergy'],
  3: ['prescription'],
  4: [], // تفضيل جنس الكادر اختياري
  5: ['date', 'time'],
  6: ['address', 'phone'],
};

// ترتيب الحقول العام (للملخّص والتركيز على أوّل خطأ)
export const NURSING_FIELD_ORDER = [
  'procedure', 'allergy', 'prescription', 'date', 'time', 'address', 'phone',
];

function checkOne(field: string, input: NursingValidationInput): string | null {
  switch (field) {
    case 'procedure':
      return input.procedureId ? null : 'اختر الإجراء المطلوب';
    case 'allergy':
      return input.allergyConfirmed ? null : 'أكّد ملء استمارة الحساسية';
    case 'prescription':
      return input.prescriptionImage || input.prescriptionSkipped
        ? null
        : 'أرفق صورة الوصفة أو اختر «تخطّي»';
    case 'date':
      return input.scheduledDate ? null : 'اختر تاريخ الزيارة';
    case 'time':
      return input.scheduledTime ? null : 'اختر وقت الزيارة';
    case 'address':
      return input.address.trim().length >= 10
        ? null
        : 'أدخل عنواناً مفصّلاً (محافظة + منطقة + شارع)';
    case 'phone':
      return IRAQI_MOBILE.test(input.phone.trim())
        ? null
        : 'أدخل رقم موبايل عراقي صحيح (يبدأ بـ 07)';
    default:
      return null;
  }
}

/** يتحقّق من مجموعة حقول (خطوة) ويُرجع أخطاءها. */
export function validateNursingFields(
  fields: string[],
  input: NursingValidationInput,
): { ok: boolean; fieldErrors: NursingFieldErrors } {
  const fieldErrors: NursingFieldErrors = {};
  for (const f of fields) {
    const msg = checkOne(f, input);
    if (msg) fieldErrors[f] = msg;
  }
  return { ok: Object.keys(fieldErrors).length === 0, fieldErrors };
}

/** تحقّق كامل (كل الحقول المطلوبة) — عند الإرسال النهائي. */
export function validateNursing(
  input: NursingValidationInput,
): { ok: boolean; fieldErrors: NursingFieldErrors } {
  return validateNursingFields(NURSING_FIELD_ORDER, input);
}

/**
 * تحقّق خادمي — فقط ما يستقبله الخادم (الإجراء + العنوان) بنفس الحدود.
 */
export function validateNursingServer(
  input: { procedure_type?: string | null; address?: string | null },
): { ok: boolean; fieldErrors: NursingFieldErrors } {
  const fieldErrors: NursingFieldErrors = {};
  if (!input.procedure_type) fieldErrors.procedure = 'اختر الإجراء المطلوب';
  if (!input.address || input.address.trim().length < 10) {
    fieldErrors.address = 'أدخل عنواناً مفصّلاً (محافظة + منطقة + شارع)';
  }
  return { ok: Object.keys(fieldErrors).length === 0, fieldErrors };
}

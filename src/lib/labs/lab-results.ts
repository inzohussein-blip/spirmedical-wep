/**
 * 🧪 نتائجُ التحاليل: شكلُها، وتنقيتُها على الخادم، وتحويلُها إلى صفوف `lab_results`.
 *
 * يكتبها المختبرُ من نافذة الخدمة (الدفعة 2)، أو المحلّلُ حين لا مختبرَ مسجَّلاً. والمدخلُ من المتصفّح —
 * فلا يُصدَّق: حالةٌ من القائمة وحدها، وحقولٌ مقصوصة، وسقفٌ لعدد الصفوف.
 */
export const LAB_RESULT_STATUSES = ['normal', 'low', 'high', 'critical', 'inconclusive'] as const;
export type LabResultStatus = (typeof LAB_RESULT_STATUSES)[number];

export interface LabResultInput {
  test_id: string;
  test_name: string;
  result_value: string;
  result_numeric?: number | null;
  unit?: string;
  normal_range_min?: number | null;
  normal_range_max?: number | null;
  normal_range_text?: string;
  status: LabResultStatus;
  flag?: string;
  notes?: string;
  pdf_url?: string;
}

export const MAX_LAB_RESULTS = 60;

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
};
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** يعيد الصفوفَ المنقّاة أو رسالةَ خطأ للمستخدم */
export function sanitizeLabResults(
  input: unknown,
): { ok: true; results: LabResultInput[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: 'أدخل نتيجةً واحدة على الأقل' };
  if (input.length > MAX_LAB_RESULTS) return { ok: false, error: `لا أكثر من ${MAX_LAB_RESULTS} نتيجة في الطلب` };

  const results: LabResultInput[] = [];
  for (const raw of input as Record<string, unknown>[]) {
    const test_name = text(raw?.test_name, 120);
    const result_value = text(raw?.result_value, 120);
    if (!test_name || !result_value) return { ok: false, error: 'بعض النتائج ناقصة (الاسم أو القيمة)' };
    const status = LAB_RESULT_STATUSES.includes(raw.status as LabResultStatus) ? (raw.status as LabResultStatus) : null;
    if (!status) return { ok: false, error: 'حالةُ نتيجةٍ غيرُ معروفة' };
    results.push({
      test_id: text(raw.test_id, 60) ?? 'custom',
      test_name,
      result_value,
      result_numeric: num(raw.result_numeric),
      unit: text(raw.unit, 30) ?? undefined,
      normal_range_min: num(raw.normal_range_min),
      normal_range_max: num(raw.normal_range_max),
      normal_range_text: text(raw.normal_range_text, 80) ?? undefined,
      status,
      flag: text(raw.flag, 30) ?? undefined,
      notes: text(raw.notes, 500) ?? undefined,
      pdf_url: undefined, // لا رفعَ ملفّاتٍ هنا — رابطٌ من المتصفّح لا يُكتب في سجلّ المريض
    });
  }
  return { ok: true, results };
}

/** صفوفُ `lab_results` لطلبٍ واحد: المريضُ من الطلب لا من المدخل */
export function toLabResultRows(
  results: LabResultInput[],
  order: { labOrderId: string; patientId: string; enteredBy: string; at: string },
) {
  return results.map((r) => ({
    lab_order_id: order.labOrderId,
    user_id: order.patientId,
    test_id: r.test_id,
    test_name: r.test_name,
    result_value: r.result_value,
    result_numeric: r.result_numeric ?? null,
    unit: r.unit ?? null,
    normal_range_min: r.normal_range_min ?? null,
    normal_range_max: r.normal_range_max ?? null,
    normal_range_text: r.normal_range_text ?? null,
    status: r.status,
    flag: r.flag ?? null,
    notes: r.notes ?? null,
    pdf_url: null,
    tested_at: order.at,
    entered_by: order.enteredBy,
  }));
}

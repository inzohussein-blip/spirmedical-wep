import { z } from 'zod';

export const appointmentStatusEnum = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);

export const appointmentSchema = z.object({
  service_type: z
    .string()
    .min(2, 'نوع الخدمة مطلوب')
    .max(100, 'نوع الخدمة طويل جداً'),
  scheduled_at: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'تاريخ غير صحيح')
    .refine(
      (val) => new Date(val) > new Date(),
      'يجب أن يكون التاريخ في المستقبل'
    ),
  address: z
    .string()
    .min(10, 'العنوان قصير جداً')
    .max(500, 'العنوان طويل جداً'),
  notes: z.string().max(1000, 'الملاحظات طويلة جداً').optional(),
});

export const appointmentUpdateSchema = appointmentSchema.partial().extend({
  status: appointmentStatusEnum.optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>;

// ─── أخطاء الحقول (لتوحيد «رفع الطلبات») ───
export type AppointmentFieldErrors = Record<string, string>;

/** تسميات عربية لحقول تدفّق الخدمات العامّة (Wizard). */
export const APPOINTMENT_FIELD_LABELS: Record<string, string> = {
  service: 'الخدمة',
  slot: 'الموعد',
  service_type: 'الخدمة',
  scheduled_at: 'الموعد',
  address: 'العنوان',
};

/**
 * تحقّق خادمي يُرجع أخطاء الحقول من appointmentSchema (تعيين path→field)،
 * بدل رسالة واحدة فقط. يُستعمل في createAppointmentV2.
 */
export function validateAppointmentV2Server(
  input: unknown,
): { ok: boolean; fieldErrors: AppointmentFieldErrors } {
  const result = appointmentSchema.safeParse(input);
  if (result.success) return { ok: true, fieldErrors: {} };

  const fieldErrors: AppointmentFieldErrors = {};
  for (const err of result.error.errors) {
    const field = err.path[0] as string;
    if (field && !fieldErrors[field]) fieldErrors[field] = err.message;
  }
  return { ok: false, fieldErrors };
}

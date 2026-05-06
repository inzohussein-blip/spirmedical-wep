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

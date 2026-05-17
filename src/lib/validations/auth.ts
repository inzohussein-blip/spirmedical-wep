import { z } from 'zod';

/**
 * تحقق من رقم الهاتف العراقي (يبدأ بـ 07 أو +9647)
 */
const iraqiPhoneRegex = /^(\+964|0)?7[0-9]{9}$/;

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'رقم الهاتف قصير جداً')
    .regex(iraqiPhoneRegex, 'يجب أن يكون رقم هاتف عراقي صحيح'),
});

export const otpSchema = z.object({
  phone: z.string().regex(iraqiPhoneRegex),
  token: z
    .string()
    .length(6, 'الرمز يجب أن يكون ٦ أرقام')
    .regex(/^\d+$/, 'الرمز يجب أن يكون أرقاماً فقط'),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
export type OtpInput = z.infer<typeof otpSchema>;

/**
 * تحويل رقم الهاتف للصيغة الدولية (E.164)
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('+964')) return cleaned;
  if (cleaned.startsWith('07')) return '+964' + cleaned.slice(1);
  if (cleaned.startsWith('7')) return '+964' + cleaned;
  return cleaned;
}

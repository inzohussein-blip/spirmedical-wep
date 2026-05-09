import { z } from 'zod';

// ============================================================
// رسائل خطأ بالعربية
// ============================================================
const messages = {
  required: 'هذا الحقل إلزامي',
  phoneInvalid: 'رقم الهاتف غير صحيح. مثال: 07712345678',
  passwordShort: 'الرمز يجب أن يكون 6 أرقام على الأقل',
  passwordLong: 'الرمز طويل جداً (10 أرقام كحد أقصى)',
  passwordNumeric: 'الرمز يجب أن يكون أرقام فقط',
  nameShort: 'الاسم قصير جداً (حرفان على الأقل)',
  nameLong: 'الاسم طويل جداً (50 حرف كحد أقصى)',
  nameInvalid: 'الاسم يحتوي على أحرف غير مقبولة',
  accountInvalid: 'رقم الحساب غير صحيح',
  selectRequired: 'يرجى اختيار قيمة',
  fileSize: 'حجم الملف كبير (الحد الأقصى 5MB)',
  fileType: 'نوع الملف غير مدعوم. استخدم: JPG, PNG, PDF',
};

// ============================================================
// Helpers
// ============================================================

// رقم هاتف عراقي
const iraqiPhoneRegex = /^(\+964|0)?7[0-9]{9}$/;

// اسم: أحرف عربية وإنجليزية ومسافات فقط
const nameRegex = /^[a-zA-Zا-يآ-ٿ\s'-]+$/;

// رقم حساب: 6-12 رقم
const accountRegex = /^[0-9]{6,12}$/;

// الرمز السري: 6 أرقام
const passwordRegex = /^[0-9]{6}$/;

export const phoneFieldSchema = z
  .string()
  .min(1, { message: messages.required })
  .regex(iraqiPhoneRegex, { message: messages.phoneInvalid })
  .transform((val) => {
    // تطبيع الرقم لـ +964
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.startsWith('964')) return '+' + cleaned;
    if (cleaned.startsWith('07')) return '+964' + cleaned.slice(1);
    if (cleaned.startsWith('7')) return '+964' + cleaned;
    return val;
  });

// ============================================================
// 1. Login Schema (تسجيل الدخول)
// ============================================================
export const loginSchema = z.object({
  accountNumber: z
    .string()
    .min(1, { message: messages.required })
    .regex(accountRegex, { message: messages.accountInvalid }),
  password: z
    .string()
    .min(1, { message: messages.required })
    .regex(passwordRegex, { message: messages.passwordNumeric })
    .min(6, { message: messages.passwordShort })
    .max(10, { message: messages.passwordLong }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// 2. Patient Registration Schema (تسجيل مراجع)
// ============================================================
export const patientRegisterSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: messages.required })
    .min(2, { message: messages.nameShort })
    .max(50, { message: messages.nameLong })
    .regex(nameRegex, { message: messages.nameInvalid }),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: messages.selectRequired }),
  }),
  phone: phoneFieldSchema,
  password: z
    .string()
    .min(1, { message: messages.required })
    .regex(passwordRegex, { message: messages.passwordNumeric })
    .min(6, { message: messages.passwordShort })
    .max(6, { message: messages.passwordLong }),
  // اختياري عند الإنشاء الأول
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'يجب الموافقة على الشروط والأحكام',
  }),
});

export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>;

// ============================================================
// 3. Specialist Registration Schema (تسجيل أخصائي)
// ============================================================
const specializations = [
  'doctor', // دكتور
  'nurse', // ممرض
  'analyst', // محلل
  'pharmacist', // صيدلي
  'physiotherapist', // معالج طبيعي
  'dentist', // طبيب أسنان
  'lab_tech', // فني مختبر
  'radiologist', // أخصائي أشعة
  'other', // أخرى (تتطلب تفاصيل)
] as const;

export const specialistRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(1, { message: messages.required })
      .min(2, { message: messages.nameShort })
      .max(50, { message: messages.nameLong })
      .regex(nameRegex, { message: messages.nameInvalid }),
    gender: z.enum(['male', 'female', 'other'], {
      errorMap: () => ({ message: messages.selectRequired }),
    }),
    phone: phoneFieldSchema,
    password: z
      .string()
      .min(1, { message: messages.required })
      .regex(passwordRegex, { message: messages.passwordNumeric })
      .min(6, { message: messages.passwordShort })
      .max(6, { message: messages.passwordLong }),
    specialization: z.enum(specializations, {
      errorMap: () => ({ message: messages.selectRequired }),
    }),
    // مطلوب فقط لو الاختصاص "other"
    specializationDetails: z
      .string()
      .max(100, { message: 'الوصف طويل جداً' })
      .optional(),
    // الحقول الاختيارية (opt) - مطلوبة عند الإنشاء الأول
    idDocument: z.any().optional(), // ملف
    certificateDocument: z.any().optional(), // ملف
    profilePhoto: z.any().optional(), // ملف
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'يجب الموافقة على الشروط والأحكام',
    }),
  })
  .refine(
    (data) => {
      // إذا الاختصاص "other"، يجب توفير التفاصيل
      if (data.specialization === 'other' && !data.specializationDetails) {
        return false;
      }
      return true;
    },
    {
      message: 'يرجى توضيح الاختصاص',
      path: ['specializationDetails'],
    }
  );

export type SpecialistRegisterInput = z.infer<typeof specialistRegisterSchema>;

// ============================================================
// File validation helper
// ============================================================
export const fileValidation = {
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],

  validate(file: File | null | undefined): { valid: boolean; error?: string } {
    if (!file) return { valid: true }; // اختياري
    if (file.size > this.maxSize) {
      return { valid: false, error: messages.fileSize };
    }
    if (!this.allowedTypes.includes(file.type)) {
      return { valid: false, error: messages.fileType };
    }
    return { valid: true };
  },
};

// ============================================================
// Specialization labels (للعرض)
// ============================================================
export const specializationLabels: Record<string, string> = {
  doctor: 'دكتور',
  nurse: 'ممرض / ممرضة',
  analyst: 'محلل',
  pharmacist: 'صيدلي',
  physiotherapist: 'معالج طبيعي',
  dentist: 'طبيب أسنان',
  lab_tech: 'فني مختبر',
  radiologist: 'أخصائي أشعة',
  other: 'أخرى - حدّد',
};

export const genderLabels: Record<string, string> = {
  male: 'ذكر',
  female: 'أنثى',
  other: 'غير ذلك',
};

/**
 * Environment Validation
 *
 * يتحقق من المتغيرات البيئية عند بدء التطبيق ويُفشل بسرعة
 * (fail-fast) إذا كانت قيمة مفقودة أو غير صحيحة.
 *
 * الاستخدام:
 *   import { env } from '@/lib/env';
 *   const url = env.NEXT_PUBLIC_SUPABASE_URL;  // type-safe!
 */

import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL يجب أن يكون URL صالحاً'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY قصير جداً'),
  // مطلوب فعلياً لكل تدفّقات المصادقة/الأدمن — fail-fast بدل undefined صامت
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY قصير جداً'),

  // التشفير - 32 bytes hex
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'ENCRYPTION_KEY يجب أن يكون 64 hex character (32 bytes)'),

  // الموقع
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://spir-medical.com'),

  // البيئة
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging level (اختياري)
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // ⭐ OTP Mode (3 أوضاع)
  // - 'required': OTP إجباري — الافتراضي الآمن (لا يمكن التخطي)
  // - 'optional': المستخدم يختار - زر OTP + زر تخطي (غير آمن للإنتاج)
  // - 'disabled': لا OTP، دخول مباشر (تطوير فقط — يُمنع في الإنتاج ما لم يُفعَّل
  //   ALLOW_PASSWORDLESS_LOGIN صراحةً)
  // ⚠️ الافتراضي required: يتطلب قناة OTP فعّالة (Meta WhatsApp أو Supabase SMS)
  //   قبل النشر، وإلا تعذّر الدخول. للسماح بالدخول بدون رمز مؤقتاً استخدم
  //   NEXT_PUBLIC_OTP_MODE=disabled مع ALLOW_PASSWORDLESS_LOGIN=true.
  NEXT_PUBLIC_OTP_MODE: z
    .enum(['disabled', 'optional', 'required'])
    .default('required'),

  // Feature flags (اختياري)
  NEXT_PUBLIC_ENABLE_SPECIALIST_CHAT: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_ENABLE_FAMILY_ACCOUNTS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Sentry (اختياري)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Upstash Redis (اختياري)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ─── أسرار قنوات/أدمن (اختيارية، لكن موثّقة هنا لتفادي انحراف المخطط) ───
  // الدخول بدون رمز (خطر — إنتاج): 'true' يسمح به صراحةً
  ALLOW_PASSWORDLESS_LOGIN: z.enum(['true', 'false']).optional(),
  // Meta WhatsApp Cloud API
  META_ACCESS_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_PROVIDER: z.enum(['meta', 'twilio', 'mock']).optional(),
  // Resend (البريد)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  // إنشاء/إشعار الأدمن
  ADMIN_CREATE_KEY: z.string().optional(),
  ADMIN_ALLOWED_EMAILS: z.string().optional(),
  ADMIN_OWNER_EMAIL: z.string().optional(),
  // تفعيل قناة Telegram في واجهة OTP
  NEXT_PUBLIC_ENABLE_TELEGRAM_OTP: z.enum(['true', 'false']).optional(),
  // عنوان التطبيق (لروابط التفعيل/إعادة التعيين)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    // eslint-disable-next-line no-console
    console.error(`\n❌ Invalid environment variables:\n${errorMessages}\n`);

    if (typeof window === 'undefined') {
      throw new Error('Invalid environment variables');
    }
  }

  return parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>);
}

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;

/**
 * Helper: ما هو وضع OTP الحالي؟
 */
export type OtpMode = 'disabled' | 'optional' | 'required';

export function getOtpMode(): OtpMode {
  return env.NEXT_PUBLIC_OTP_MODE ?? 'required';
}

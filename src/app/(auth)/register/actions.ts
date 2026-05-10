'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { getOtpMode, canSkipOtp } from '@/lib/flags';
import {
  patientRegisterSchema,
  specialistRegisterSchema,
} from '@/lib/validations/auth-forms';
import { normalizePhone } from '@/lib/validations/auth';

// ═══════════════════════════════════════════════════════════
// 📝 إنشاء حساب جديد - يدعم 3 أوضاع OTP
// ═══════════════════════════════════════════════════════════
// - 'disabled': إنشاء + دخول مباشر
// - 'optional': المستخدم يختار (action: 'otp' أو 'skip')
// - 'required': إنشاء ثم OTP إجباري
// ═══════════════════════════════════════════════════════════

function getIp(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}

function derivePassword(phone: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  return createHash('sha256')
    .update(phone + ':' + encryptionKey)
    .digest('hex')
    .slice(0, 32);
}

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.spirmedical.local`;
}

// ─────────────────────────────────────────────────────────
// إنشاء حساب مراجع
// ─────────────────────────────────────────────────────────

export async function registerPatient(formData: FormData) {
  const input = {
    fullName: formData.get('fullName') as string,
    gender: formData.get('gender') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
    acceptTerms: formData.get('acceptTerms') === 'on',
  };
  // المستخدم اختار طريقة الدخول صراحةً (في optional mode)
  const action = (formData.get('action') as string) || 'auto';

  const ip = getIp();
  const limit = await checkRateLimit(`register:${ip}`, {
    max: 5,
    windowSeconds: 3600,
  });

  if (!limit.allowed) {
    redirect(
      '/register/patient?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = patientRegisterSchema.safeParse(input);
  if (!validation.success) {
    redirect(
      '/register/patient?error=' +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const { fullName, phone } = validation.data;
  const normalizedPhone = normalizePhone(phone);

  await createAccount({
    phone: normalizedPhone,
    fullName,
    role: 'patient',
    ip,
  });

  // التوجيه حسب الوضع
  await routeAfterRegister(normalizedPhone, 'patient', action);
}

// ─────────────────────────────────────────────────────────
// إنشاء حساب أخصائي
// ─────────────────────────────────────────────────────────

export async function registerSpecialist(formData: FormData) {
  const input = {
    fullName: formData.get('fullName') as string,
    gender: formData.get('gender') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
    specialization: formData.get('specialization') as string,
    specializationDetails:
      (formData.get('specializationDetails') as string) || undefined,
    acceptTerms: formData.get('acceptTerms') === 'on',
  };
  const action = (formData.get('action') as string) || 'auto';

  const ip = getIp();
  const limit = await checkRateLimit(`register:${ip}`, {
    max: 5,
    windowSeconds: 3600,
  });

  if (!limit.allowed) {
    redirect(
      '/register/specialist?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = specialistRegisterSchema.safeParse(input);
  if (!validation.success) {
    redirect(
      '/register/specialist?error=' +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const { fullName, phone } = validation.data;
  const normalizedPhone = normalizePhone(phone);

  await createAccount({
    phone: normalizedPhone,
    fullName,
    role: 'specialist',
    ip,
  });

  await routeAfterRegister(normalizedPhone, 'specialist', action);
}

// ─────────────────────────────────────────────────────────
// منطق التوجيه بعد التسجيل
// ─────────────────────────────────────────────────────────

async function routeAfterRegister(
  phone: string,
  role: 'patient' | 'specialist',
  action: string
): Promise<never> {
  const mode = getOtpMode();

  // disabled: دخول مباشر دائماً
  // optional: حسب اختيار المستخدم
  // required: OTP إجباري دائماً

  const shouldUseOtp =
    mode === 'required' || (mode === 'optional' && action === 'otp');

  if (!shouldUseOtp) {
    // تخطي OTP - دخول مباشر
    // (في وضع required، shouldUseOtp = true دائماً)
    await signInDirectly(phone);
    redirect(role === 'specialist' ? '/specialist' : '/dashboard');
  }

  // إرسال OTP
  const supabase = createClient();
  await supabase.auth.signInWithOtp({ phone });
  redirect(`/otp?phone=${encodeURIComponent(phone)}`);
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

async function createAccount(opts: {
  phone: string;
  fullName: string;
  role: 'patient' | 'specialist';
  ip: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = derivePassword(opts.phone);
  const email = phoneToEmail(opts.phone);

  // ابحث إن كان موجوداً
  const { data: existingAuth } = await admin.auth.admin.listUsers();
  const existing = existingAuth.users.find(
    (u) => u.email === email || u.phone === opts.phone
  );

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data: newUser, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone: opts.phone,
        phone_confirm: true,
        user_metadata: {
          phone: opts.phone,
          full_name: opts.fullName,
          created_via: canSkipOtp() ? 'no_otp' : 'otp',
        },
      });

    if (createErr || !newUser?.user) {
      logger.error('Failed to create user', {
        phone: opts.phone,
        error: createErr?.message,
      });
      redirect(
        `/register/${opts.role}?error=` +
          encodeURIComponent('فشل إنشاء الحساب. حاول مرة أخرى')
      );
    }

    userId = newUser.user.id;
  }

  // upsert في public.users
  await admin.from('users').upsert({
    id: userId,
    phone: opts.phone,
    full_name: opts.fullName,
    role: opts.role,
  });

  await logAuditEvent({
    action: 'auth.account_created',
    user_id: userId,
    metadata: {
      phone: opts.phone,
      role: opts.role,
      ip: opts.ip,
      method: canSkipOtp() ? 'no_otp' : 'otp',
    },
  });
}

async function signInDirectly(phone: string): Promise<void> {
  const supabase = createClient();
  const password = derivePassword(phone);
  const email = phoneToEmail(phone);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.error('Direct signin failed', { phone, error: error.message });
    redirect('/login?error=' + encodeURIComponent('فشل تسجيل الدخول'));
  }
}

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
  mapSpecializationToDbType,
} from '@/lib/validations/auth-forms';
import { normalizePhone } from '@/lib/validations/auth';
import { sendWelcomePatientEmail, sendWelcomeSpecialistEmail } from '@/lib/email/actions';

// ═══════════════════════════════════════════════════════════
// 📝 إنشاء حساب - يدعم 3 أوضاع OTP
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

function isNextRedirect(err: unknown): boolean {
  return (
    err instanceof Error &&
    'digest' in err &&
    typeof (err as { digest?: string }).digest === 'string' &&
    (err as { digest: string }).digest.includes('NEXT_REDIRECT')
  );
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

  try {
    await createOrGetAccount({
      phone: normalizedPhone,
      fullName,
      role: 'patient',
      ip,
    });

    await routeAfterRegister(normalizedPhone, 'patient', action);
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    logger.error('registerPatient failed', {
      phone: normalizedPhone,
      error: err instanceof Error ? err.message : String(err),
    });
    redirect(
      '/register/patient?error=' +
        encodeURIComponent(
          `فشل إنشاء الحساب: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`
        )
    );
  }
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

  const { fullName, phone, specialization, specializationDetails } = validation.data;
  const normalizedPhone = normalizePhone(phone);

  // 🔧 V30: تحويل specialization → specialist_type (DB format)
  const specialistType = mapSpecializationToDbType(specialization);

  try {
    await createOrGetAccount({
      phone: normalizedPhone,
      fullName,
      role: 'specialist',
      ip,
      specialistType,
      specializationDetails,
    });

    await routeAfterRegister(normalizedPhone, 'specialist', action);
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    logger.error('registerSpecialist failed', {
      phone: normalizedPhone,
      error: err instanceof Error ? err.message : String(err),
    });
    redirect(
      '/register/specialist?error=' +
        encodeURIComponent(
          `فشل إنشاء الحساب: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`
        )
    );
  }
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
  const shouldUseOtp =
    mode === 'required' || (mode === 'optional' && action === 'otp');

  if (!shouldUseOtp) {
    await signInDirectly(phone, role);
    // 📧 إرسال إيميل ترحيب (fire-and-forget، لن يفشل التسجيل إذا فشل)
    try {
      const sup = createClient();
      const { data: { user: signedUser } } = await sup.auth.getUser();
      if (signedUser?.id) {
        if (role === 'specialist') {
          sendWelcomeSpecialistEmail(signedUser.id).catch(() => null);
        } else {
          sendWelcomePatientEmail(signedUser.id).catch(() => null);
        }
      }
    } catch {
      // ignore - لا يفشل التسجيل إذا فشل الإيميل
    }
    redirect(role === 'specialist' ? '/specialist' : '/dashboard');
  }

  const supabase = createClient();
  await supabase.auth.signInWithOtp({ phone });
  redirect(`/otp?phone=${encodeURIComponent(phone)}`);
}

// ─────────────────────────────────────────────────────────
// إنشاء أو الحصول على الحساب (مُصلح)
// ─────────────────────────────────────────────────────────
// ✅ لا يستخدم phone في createUser (Phone provider قد لا يكون مفعّلاً)
// ✅ يستخدم email-only approach
// ✅ يكتب في public.users يدوياً
// ✅ idempotent (آمن للتشغيل عدة مرات)

async function createOrGetAccount(opts: {
  phone: string;
  fullName: string;
  role: 'patient' | 'specialist';
  ip: string;
  // 🔧 V30: حقول المختص (اختيارية)
  specialistType?: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist';
  specializationDetails?: string;
}): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('إعداد الخادم ناقص (SUPABASE keys مفقودة)');
  }

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = derivePassword(opts.phone);
  const email = phoneToEmail(opts.phone);

  // 1. ابحث في public.users بالرقم
  const { data: existingProfile } = await admin
    .from('users')
    .select('id')
    .eq('phone', opts.phone)
    .maybeSingle();

  let userId = existingProfile?.id;

  // 2. إذا غير موجود، ابحث في auth.users أو أنشئ
  if (!userId) {
    const { data: existingAuth } = await admin.auth.admin.listUsers();
    const authUser = existingAuth?.users?.find((u) => u.email === email);

    if (authUser) {
      userId = authUser.id;
    } else {
      // أنشئ جديد - بدون phone في الـ payload
      const { data: newUser, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            phone: opts.phone,
            full_name: opts.fullName,
            created_via: canSkipOtp() ? 'no_otp' : 'otp',
          },
        });

      if (createErr || !newUser?.user) {
        const errMsg = createErr?.message ?? 'createUser returned no user';
        logger.error('createUser failed', {
          phone: opts.phone,
          error: errMsg,
        });
        throw new Error(errMsg);
      }

      userId = newUser.user.id;
    }
  }

  // 3. upsert في public.users (يدوياً)
  // المختصون الجدد: pending (يحتاجون موافقة)
  const profileData: Record<string, unknown> = {
    id: userId,
    phone: opts.phone,
    full_name: opts.fullName,
    role: opts.role,
  };

  if (opts.role === 'specialist') {
    // فقط لو ما عنده موافقة سابقة
    if (!existingProfile?.id) {
      profileData.approval_status = 'pending';
    }
    // 🔧 V30: حفظ specialist_type (مطلوب لربط المختص بالطلبات)
    if (opts.specialistType) {
      profileData.specialist_type = opts.specialistType;
    }
    // ملاحظات اختصاص "other"
    if (opts.specializationDetails) {
      profileData.specialist_bio = opts.specializationDetails;
    }
  }

  const { error: profileErr } = await admin.from('users').upsert(
    profileData,
    { onConflict: 'id' }
  );

  if (profileErr) {
    logger.error('users upsert failed', {
      phone: opts.phone,
      error: profileErr.message,
    });
    // إذا كان الخطأ unique constraint على phone، اكتب رسالة واضحة
    if (profileErr.message?.includes('users_phone_key')) {
      throw new Error('هذا الرقم مسجّل بالفعل');
    }
    throw new Error(profileErr.message);
  }

  // 4. حدّث password (يضمن sync مع ENCRYPTION_KEY الحالي)
  await admin.auth.admin.updateUserById(userId, { password });

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

  return userId;
}

// ─────────────────────────────────────────────────────────
// تسجيل دخول مباشر
// ─────────────────────────────────────────────────────────

async function signInDirectly(
  phone: string,
  _role: 'patient' | 'specialist'
): Promise<void> {
  const supabase = createClient();
  const password = derivePassword(phone);
  const email = phoneToEmail(phone);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.error('Direct signin failed', { phone, error: error.message });
    throw new Error(`فشل تسجيل الدخول: ${error.message}`);
  }
}

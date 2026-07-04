'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { getOtpMode, canSkipOtp, isPasswordlessLoginAllowed } from '@/lib/flags';
import {
  patientRegisterSchema,
  specialistRegisterSchema,
  mapSpecializationToDbType,
  phoneFieldSchema,
} from '@/lib/validations/auth-forms';
import { normalizePhone } from '@/lib/validations/auth';
import { sendWelcomePatientEmail, sendWelcomeSpecialistEmail } from '@/lib/email/actions';
// ✅ FIX 1: static import بدلاً من dynamic import
import { sendOtp as sendWhatsAppOtp, verifyOtp as verifyWhatsAppOtp } from '@/lib/whatsapp/otp-service';

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

  // ✅ FIX: تحقق يدوي (patientRegisterSchema هو ZodEffects بسبب refine → لا يدعم .omit())
  const rawFullName  = (formData.get('fullName')  as string | null)?.trim() ?? '';
  const rawGender    = (formData.get('gender')    as string | null)?.trim() ?? '';
  const rawPhone     = (formData.get('phone')     as string | null)?.trim() ?? '';
  const rawTerms     = formData.get('acceptTerms') === 'on';

  if (!rawFullName || rawFullName.length < 2) {
    redirect('/register/patient?error=' + encodeURIComponent('الاسم الكامل مطلوب (حرفان على الأقل)'));
  }
  if (!['male', 'female'].includes(rawGender)) {
    redirect('/register/patient?error=' + encodeURIComponent('يرجى اختيار الجنس'));
  }
  const phoneValidation = phoneFieldSchema.safeParse(rawPhone);
  if (!phoneValidation.success) {
    redirect('/register/patient?error=' + encodeURIComponent(phoneValidation.error.errors[0].message));
  }
  if (!rawTerms) {
    redirect('/register/patient?error=' + encodeURIComponent('يجب الموافقة على الشروط والأحكام'));
  }

  const fullName = rawFullName;
  const phone    = phoneValidation.data as string;
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

  // ✅ FIX: تحقق يدوي (specialistRegisterSchema هو ZodEffects بسبب refine → لا يدعم .omit())
  const rawFullName            = (formData.get('fullName')            as string | null)?.trim() ?? '';
  const rawGender              = (formData.get('gender')              as string | null)?.trim() ?? '';
  const rawPhone               = (formData.get('phone')               as string | null)?.trim() ?? '';
  const rawSpecialization      = (formData.get('specialization')      as string | null)?.trim() ?? '';
  const rawSpecDetails         = (formData.get('specializationDetails') as string | null)?.trim() || undefined;
  const rawTerms               = formData.get('acceptTerms') === 'on';

  const validSpecializations = ['doctor','nurse','analyst','pharmacist','physiotherapist','dentist','lab_tech','radiologist','other'];

  if (!rawFullName || rawFullName.length < 2) {
    redirect('/register/specialist?error=' + encodeURIComponent('الاسم الكامل مطلوب (حرفان على الأقل)'));
  }
  if (!['male', 'female'].includes(rawGender)) {
    redirect('/register/specialist?error=' + encodeURIComponent('يرجى اختيار الجنس'));
  }
  const phoneValidation = phoneFieldSchema.safeParse(rawPhone);
  if (!phoneValidation.success) {
    redirect('/register/specialist?error=' + encodeURIComponent(phoneValidation.error.errors[0].message));
  }
  if (!validSpecializations.includes(rawSpecialization)) {
    redirect('/register/specialist?error=' + encodeURIComponent('يرجى اختيار الاختصاص'));
  }
  if (rawSpecialization === 'other' && !rawSpecDetails) {
    redirect('/register/specialist?error=' + encodeURIComponent('يرجى توضيح الاختصاص'));
  }
  if (!rawTerms) {
    redirect('/register/specialist?error=' + encodeURIComponent('يجب الموافقة على الشروط والأحكام'));
  }

  const fullName             = rawFullName;
  const phone                = phoneValidation.data as string;
  const specialization       = rawSpecialization;
  const specializationDetails = rawSpecDetails;
  const normalizedPhone = normalizePhone(phone);

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
    mode === 'required' ||
    (mode === 'optional' && action === 'otp') ||
    // 🔒 حتى في disabled/optional: إن مُنع الدخول بدون رمز (إنتاج) نفرض OTP
    !isPasswordlessLoginAllowed();

  if (!shouldUseOtp) {
    await signInDirectly(phone, role);
    // 📧 إرسال إيميل ترحيب (fire-and-forget)
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
      // ignore
    }
    redirect(role === 'specialist' ? '/specialist' : '/dashboard');
  }

  // ✅ FIX 1: استخدام static import مباشرة
  await sendWhatsAppOtp({
    phone,
    channel: 'whatsapp',
    purpose: 'register',
  });

  redirect(`/otp?phone=${encodeURIComponent(phone)}&channel=whatsapp`);
}

// ─────────────────────────────────────────────────────────
// إنشاء أو الحصول على الحساب (مُصلح)
// ─────────────────────────────────────────────────────────
// ✅ FIX 3: إضافة approval_status للمريض (default: 'approved')
// ✅ FIX 4: حذف listUsers() الثقيل — البحث مباشرة بالـ email

async function createOrGetAccount(opts: {
  phone: string;
  fullName: string;
  role: 'patient' | 'specialist';
  ip: string;
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

  // 2. إذا غير موجود
  if (!userId) {
    // ✅ FIX 4: createUser مع معالجة duplicate (getUserByEmail غير موجودة في v2.45)
    const { data: tryCreate, error: tryCreateErr } =
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

    if (tryCreate?.user) {
      // مستخدم جديد أُنشئ
      userId = tryCreate.user.id;
    } else if (
      tryCreateErr &&
      (tryCreateErr.message?.toLowerCase().includes('already') ||
        (tryCreateErr as any)?.status === 422)
    ) {
      // الحساب موجود → تسجيل دخول مؤقت للحصول على ID
      const supabaseTmp = createClient();
      const { data: tmpSignIn } = await supabaseTmp.auth.signInWithPassword({ email, password });
      if (tmpSignIn?.user) {
        userId = tmpSignIn.user.id;
      }
      // لو password تغيّر، سنكتشفه في الخطوة 4 (updateUserById)
    } else if (tryCreateErr) {
      // أنشئ جديد
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

      const errMsg = tryCreateErr.message ?? 'createUser returned no user';
      logger.error('createUser failed', {
        phone: opts.phone,
        error: errMsg,
      });
      throw new Error(errMsg);
    }
  }

  // 3. upsert في public.users
  // ✅ FIX 3: approval_status دائماً موجود
  const profileData: Record<string, unknown> = {
    id: userId,
    phone: opts.phone,
    full_name: opts.fullName,
    role: opts.role,
    // المرضى: approved تلقائياً
    // المختصون الجدد: pending (يحتاجون موافقة)
    approval_status: opts.role === 'specialist' && !existingProfile?.id
      ? 'pending'
      : 'approved',
  };

  if (opts.role === 'specialist') {
    if (opts.specialistType) {
      profileData.specialist_type = opts.specialistType;
    }
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

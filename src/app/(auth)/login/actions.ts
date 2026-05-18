'use server';

import { createClient } from '@/lib/supabase/server';
import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { getOtpMode, canSkipOtp } from '@/lib/flags';

// ═══════════════════════════════════════════════════════════
// 🔐 نظام تسجيل الدخول مع 3 أوضاع OTP
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

/**
 * NEXT_REDIRECT helper - يميز redirects (المتوقعة) عن الأخطاء الحقيقية
 */
function isNextRedirect(err: unknown): boolean {
  return (
    err instanceof Error &&
    'digest' in err &&
    typeof (err as { digest?: string }).digest === 'string' &&
    (err as { digest: string }).digest.includes('NEXT_REDIRECT')
  );
}

// ─────────────────────────────────────────────────────────
// إرسال OTP أو دخول مباشر (حسب action)
// ─────────────────────────────────────────────────────────

export async function sendOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const action = (formData.get('action') as string) || 'auto';

  const ip = getIp();
  const limit = await checkRateLimit(`otp:send:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = phoneSchema.safeParse({ phone });
  if (!validation.success) {
    redirect(
      '/login?error=' + encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const normalizedPhone = normalizePhone(validation.data.phone);
  const mode = getOtpMode();

  const shouldUseOtp =
    mode === 'required' || (mode === 'optional' && action === 'otp');

  if (!shouldUseOtp) {
    return await loginWithoutOtp(normalizedPhone, ip);
  }

  // إرسال OTP عبر Supabase Auth
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    logger.error('OTP send failed', {
      phone: normalizedPhone,
      error: error.message,
    });
    redirect(
      '/login?error=' +
        encodeURIComponent('فشل إرسال الرمز. حاول مرة أخرى')
    );
  }

  await logAuditEvent({
    action: 'auth.otp_sent',
    metadata: { phone: normalizedPhone, ip },
  });

  redirect(`/otp?phone=${encodeURIComponent(normalizedPhone)}`);
}

// ─────────────────────────────────────────────────────────
// تخطي OTP
// ─────────────────────────────────────────────────────────

export async function skipOtp(formData: FormData) {
  if (!canSkipOtp()) {
    redirect('/login?error=' + encodeURIComponent('OTP مطلوب'));
  }

  const phone = formData.get('phone') as string;
  const ip = getIp();

  const limit = await checkRateLimit(`otp:skip:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = phoneSchema.safeParse({ phone });
  if (!validation.success) {
    redirect(
      '/login?error=' + encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const normalizedPhone = normalizePhone(validation.data.phone);
  return await loginWithoutOtp(normalizedPhone, ip);
}

// ─────────────────────────────────────────────────────────
// دخول مباشر بدون OTP (مُصلح)
// ─────────────────────────────────────────────────────────
// ✅ لا يستخدم phone في createUser (لأن Phone provider قد لا يكون مفعّلاً)
// ✅ يستخدم email-only approach
// ✅ معالجة أخطاء واضحة ومُفصَّلة
// ✅ يكتب في public.users يدوياً (لا يعتمد على trigger)

async function loginWithoutOtp(phone: string, ip: string): Promise<never> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // التحقق من توفر env vars
  if (!supabaseUrl || !serviceKey) {
    logger.error('Missing Supabase env vars', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceKey,
    });
    redirect(
      '/login?error=' + encodeURIComponent('إعداد الخادم ناقص')
    );
  }

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = derivePassword(phone);
  const email = phoneToEmail(phone);

  try {
    // 1. ابحث عن المستخدم في public.users بالرقم (الأسرع)
    const { data: existingProfile } = await admin
      .from('users')
      .select('id, role')
      .eq('phone', phone)
      .maybeSingle();

    let userId = existingProfile?.id;

    // 2. إذا غير موجود في public.users، تحقق من Auth أو أنشئ
    if (!userId) {
      // ابحث في auth.users
      const { data: existingAuth } = await admin.auth.admin.listUsers();
      const authUser = existingAuth?.users?.find((u) => u.email === email);

      if (authUser) {
        userId = authUser.id;
      } else {
        // أنشئ مستخدم جديد - بدون phone (لأن provider قد لا يكون مفعّلاً)
        const { data: newUser, error: createErr } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { phone, created_via: 'no_otp' },
          });

        if (createErr || !newUser?.user) {
          logger.error('createUser failed', {
            phone,
            error: createErr?.message,
            code: createErr?.status,
          });
          redirect(
            '/login?error=' +
              encodeURIComponent(
                `فشل إنشاء الحساب: ${createErr?.message ?? 'خطأ غير معروف'}`
              )
          );
        }

        userId = newUser.user.id;
      }

      // أنشئ صف في public.users (يدوياً - لا نعتمد على trigger)
      const { error: profileErr } = await admin.from('users').upsert(
        {
          id: userId,
          phone,
          full_name: 'مستخدم جديد',
          role: 'patient',
        },
        { onConflict: 'id' }
      );

      if (profileErr) {
        logger.error('Profile upsert failed', {
          phone,
          error: profileErr.message,
        });
        // نُكمل رغم الخطأ - signInWithPassword يجب أن يعمل
      }
    }

    // 3. حدّث password (في حال تغيّر ENCRYPTION_KEY)
    await admin.auth.admin.updateUserById(userId!, { password });

    // 4. سجّل دخول
    const supabase = createClient();
    const { data: signInData, error: signInErr } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInErr || !signInData?.user) {
      logger.error('signInWithPassword failed', {
        phone,
        error: signInErr?.message,
      });
      redirect(
        '/login?error=' +
          encodeURIComponent(
            `فشل تسجيل الدخول: ${signInErr?.message ?? 'خطأ غير معروف'}`
          )
      );
    }

    // 5. Audit log
    await logAuditEvent({
      action: 'auth.login',
      user_id: signInData.user.id,
      metadata: { ip, phone, method: 'no_otp' },
    });

    // 6. التوجيه حسب الدور (V25: دعم كل الأدوار)
    const role = existingProfile?.role || 'patient';
    if (role === 'specialist') {
      redirect('/specialist');
    }
    if (
      role === 'admin' ||
      role === 'super_admin' ||
      role === 'manager' ||
      role === 'support'
    ) {
      redirect('/admin44');
    }
    redirect('/dashboard');
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    logger.error('No-OTP flow failed', {
      phone,
      error: err instanceof Error ? err.message : String(err),
    });
    redirect(
      '/login?error=' +
        encodeURIComponent(
          `خطأ: ${err instanceof Error ? err.message : 'غير معروف'}`
        )
    );
  }
}

// ─────────────────────────────────────────────────────────
// التحقق من OTP
// ─────────────────────────────────────────────────────────

export async function verifyOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;

  const ip = getIp();
  const limit = await checkRateLimit(`otp:verify:${ip}`, {
    max: 5,
    windowSeconds: 900,
  });

  if (!limit.allowed) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  const validation = otpSchema.safeParse({ phone, token });
  if (!validation.success) {
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent(validation.error.errors[0].message)
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error || !data.user) {
    logger.warn('OTP verification failed', {
      phone,
      error: error?.message,
    });
    redirect(
      `/otp?phone=${encodeURIComponent(phone)}&error=` +
        encodeURIComponent('الرمز غير صحيح')
    );
  }

  await logAuditEvent({
    action: 'auth.login',
    user_id: data.user.id,
    metadata: { ip, phone, method: 'otp' },
  });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profile?.role === 'specialist') {
    redirect('/specialist');
  }
  if (
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'manager' ||
    profile?.role === 'support'
  ) {
    redirect('/admin44');
  }

  redirect('/dashboard');
}

// ─────────────────────────────────────────────────────────
// إعادة إرسال OTP
// ─────────────────────────────────────────────────────────

export async function resendOtp(formData: FormData) {
  return sendOtp(formData);
}

// ─────────────────────────────────────────────────────────
// تسجيل الخروج
// ─────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAuditEvent({
      action: 'auth.logout',
      user_id: user.id,
    });
  }

  await supabase.auth.signOut();
  redirect('/');
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { sendEmail, isEmailConfigured } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

// ═══════════════════════════════════════════════════════════
// 📧 EMAIL AUTHENTICATION SERVER ACTIONS
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// 1. تسجيل جديد (Email + Password)
// ─────────────────────────────────────────────────────────

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
  gender: 'male' | 'female';
  role: 'patient' | 'specialist';
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const { email, password, fullName, gender, role } = input;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. تحقق من عدم وجود البريد مرتين
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'البريد الإلكتروني مسجّل بالفعل' };
    }

    // 2. أنشئ مستخدم في Supabase Auth
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authErr || !authUser?.user) {
      return { success: false, error: authErr?.message || 'خطأ في الإنشاء' };
    }

    // 3. أنشئ profile في public.users
    const { error: profileErr } = await admin.from('users').insert({
      id: authUser.user.id,
      email,
      full_name: fullName,
      gender,
      role,
      signup_method: 'email',
      email_verified: false,
      profile_completed: false,
      approval_status: role === 'specialist' ? 'pending' : 'approved',
    });

    if (profileErr) {
      // احذف auth user إذا فشل profile
      await admin.auth.admin.deleteUser(authUser.user.id).then(() => null, () => null);
      return { success: false, error: profileErr.message };
    }

    // 4. أنشئ specialist_applications إذا لزم
    if (role === 'specialist') {
      await admin
        .from('specialist_applications')
        .insert({
          user_id: authUser.user.id,
          status: 'pending',
          step_1_completed_at: new Date().toISOString(),
        })
        .then(() => null, () => null);
    }

    // 5. أرسل إيميل التحقق
    await sendEmailVerification(authUser.user.id, email);

    return { success: true, userId: authUser.user.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ غير معروف',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 2. إرسال رابط التحقق من الإيميل
// ─────────────────────────────────────────────────────────

export async function sendEmailVerification(
  userId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://spir-medical.com';

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. توليد token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 2. احفظ في DB
    const { error: tokenErr } = await admin
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenErr) throw tokenErr;

    // 3. أرسل الإيميل فعلاً عبر Resend
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;
    const sendRes = await sendEmail({
      to: email,
      template: 'email_verification',
      data: { url: verificationUrl },
    });

    if (!sendRes.success) {
      // لم يُرسَل (Resend غير مُهيّأ أو خطأ) — لا نُخفِق الإنشاء، لكن نُبلّغ
      logger.warn('Email verification not delivered', {
        reason: sendRes.error,
      });
      return { success: false, error: sendRes.error };
    }

    return { success: true };
  } catch (err) {
    logger.error('sendEmailVerification failed', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في الإرسال',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 3. التحقق من رابط الإيميل
// ─────────────────────────────────────────────────────────

export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. ابحث عن token
    const { data: tokenData, error: findErr } = await admin
      .from('email_verification_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (findErr || !tokenData) {
      return { success: false, error: 'الرابط غير صحيح' };
    }

    // 2. تحقق من الصلاحية
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'انتهت صلاحية الرابط' };
    }

    // 3. حدّث email_verified
    const { error: updateErr } = await admin
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', tokenData.user_id);

    if (updateErr) throw updateErr;

    // 4. حدّث في Supabase Auth
    await admin.auth.admin.updateUserById(tokenData.user_id, {
      email_confirm: true,
    });

    // 5. حدّث token status
    await admin
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    return { success: true, userId: tokenData.user_id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في التحقق',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 4. دخول بـ Email + Password
// ─────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // 1. تسجيل دخول
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      if (signInErr.message.includes('Invalid login')) {
        return { success: false, error: 'البريد أو كلمة المرور خاطئة' };
      }
      return { success: false, error: signInErr.message };
    }

    // 2. تحقق من email_verified
    const { data: userAuth } = await supabase.auth.getUser();
    if (userAuth?.user) {
      // email_verified حقل جديد — نستخدم as any حتى تُضاف للـ database types
      const { data: profile } = await supabase
        .from('users')
        .select('email_verified, role')
        .eq('id', userAuth.user.id)
        .single() as any;

      const profileData = profile?.data ?? profile;
      // نُطبّق بوابة تأكيد البريد فقط عندما يكون إرسال البريد مُهيّأً فعلاً،
      // وإلا لأصبحت طريقاً مسدوداً (المستخدم لن يستلم رابط التفعيل أبداً).
      if (!profileData?.email_verified && isEmailConfigured()) {
        // أرسل إيميل تحقق جديد
        await sendEmailVerification(userAuth.user.id, email).then(() => null, () => null);
        return {
          success: false,
          error: 'يجب تأكيد بريدك أولاً — تحقّق من صندوق الوارد',
        };
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في الدخول',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 5. دخول بـ Google OAuth
// ─────────────────────────────────────────────────────────

export async function signInWithGoogle(
  email: string,
  name: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createSbClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. ابحث عن user موجود عبر public.users (getUserByEmail غير موجودة في v2.45)
    const { data: existingProfile } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let userId: string;

    if (existingProfile?.id) {
      userId = existingProfile.id;
      // حدّث email_verified
      await admin
        .from('users')
        .update({ email_verified: true })
        .eq('id', userId)
        .then(() => null, () => null);
    } else {
      // أنشئ user جديد
      const { data: newUser, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { name },
        });

      if (createErr || !newUser?.user) {
        return { success: false, error: createErr?.message };
      }

      userId = newUser.user.id;

      // أنشئ profile
      await admin
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: name,
          role: 'patient',
          signup_method: 'google',
          email_verified: true,
          email_verified_at: new Date().toISOString(),
          approval_status: 'approved',
          profile_completed: true,
        })
        .then(() => null, () => null);
    }

    return { success: true, userId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في Google',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 6. تسجيل الخروج
// ─────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

// ─────────────────────────────────────────────────────────
// 7. طلب إعادة تعيين كلمة المرور
// ─────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في الإرسال',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 8. إعادة تعيين كلمة المرور
// ─────────────────────────────────────────────────────────

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.updateUser(
      { password: newPassword },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login` }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في التحديث',
    };
  }
}

// ─────────────────────────────────────────────────────────
// 9. تحديث البيانات الأساسية
// ─────────────────────────────────────────────────────────

export async function updateUserProfile(input: {
  fullName?: string;
  gender?: 'male' | 'female';
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { success: false, error: 'لم يتم تسجيل الدخول' };
    }

    const updateData: Record<string, unknown> = {};
    if (input.fullName) updateData.full_name = input.fullName;
    if (input.gender) updateData.gender = input.gender;
    if (input.phone) updateData.phone = input.phone;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'خطأ في التحديث',
    };
  }
}

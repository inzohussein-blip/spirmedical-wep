'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// 🔑 الحسابات الشخصية المباشرة
// ═══════════════════════════════════════════════════════════
// هذه الحسابات للدخول المباشر بدون OTP أو تسجيل
// كل حساب له:
// - رقم: للدخول
// - رمز: كلمة سر
// - دور: patient / specialist / admin
// - بيانات شخصية كاملة
// ═══════════════════════════════════════════════════════════

interface DirectAccount {
  accountNumber: string;
  accessCode: string;
  role: 'patient' | 'specialist' | 'admin';
  phone: string;
  fullName: string;
  email: string;
  password: string; // كلمة السر الفعلية في Supabase
  governorate?: string;
  redirectTo: string;
}

const DIRECT_ACCOUNTS: DirectAccount[] = [
  // 👤 حساب المراجع - رقم: 100001 / رمز: 100001
  {
    accountNumber: '100001',
    accessCode: '100001',
    role: 'patient',
    phone: '+9647712345678',
    fullName: 'أحمد محمد العراقي',
    email: 'patient@spirmedical.iq',
    password: 'SpirPatient_2026_Live!',
    governorate: 'بغداد',
    redirectTo: '/dashboard',
  },

  // ⚕️ حساب الأخصائي - رقم: 200001 / رمز: 200001
  {
    accountNumber: '200001',
    accessCode: '200001',
    role: 'specialist',
    phone: '+9647811111111',
    fullName: 'د. سارة أحمد',
    email: 'specialist@spirmedical.iq',
    password: 'SpirSpecialist_2026_Live!',
    governorate: 'بغداد',
    redirectTo: '/specialist',
  },

  // 🛡 حساب الأدمن - رقم: 900001 / رمز: 900001
  {
    accountNumber: '900001',
    accessCode: '900001',
    role: 'admin',
    phone: '+9647900000000',
    fullName: 'مسؤول النظام',
    email: 'admin@spirmedical.iq',
    password: 'SpirAdmin_2026_Live!',
    governorate: 'بغداد',
    redirectTo: '/admin',
  },
];

/**
 * دخول مباشر بـ رقم + رمز
 *
 * الفلسفة:
 * - إذا الرقم/الرمز صحيحان → دخول مباشر
 * - يستخدم حساب Supabase حقيقي ودائم
 * - بدون OTP، بدون تسجيل، بدون SMS
 * - الجلسة تبقى نشطة ٣٠ يوم (مثل أي مستخدم عادي)
 */
export async function quickLogin(accountNumber: string, accessCode: string) {
  // التحقق من الإدخال
  if (!accountNumber || !accessCode) {
    return { success: false, error: 'يرجى إدخال الرقم والرمز' };
  }

  // البحث عن الحساب
  const account = DIRECT_ACCOUNTS.find(
    (a) =>
      a.accountNumber === accountNumber.trim() &&
      a.accessCode === accessCode.trim()
  );

  if (!account) {
    logger.warn('Quick login failed', { accountNumber: accountNumber.slice(0, 3) + '***' });
    return { success: false, error: 'الرقم أو الرمز خاطئ' };
  }

  // تسجيل الدخول إلى Supabase
  const supabase = createClient();

  try {
    // محاولة الدخول
    let { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    // إذا الحساب غير موجود، أنشئه أولاً
    if (error || !data.user) {
      logger.info('Account not found, creating', { role: account.role });

      const signUpResult = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        phone: account.phone,
        options: {
          data: {
            role: account.role,
            full_name: account.fullName,
            governorate: account.governorate,
          },
        },
      });

      if (signUpResult.error || !signUpResult.data.user) {
        logger.error('Account creation failed', {
          role: account.role,
          error: signUpResult.error?.message,
        });
        return {
          success: false,
          error: 'فشل إنشاء الحساب. تواصل مع الدعم',
        };
      }

      // ضمان أن الـ profile يُنشأ في جدول users
      await ensureUserProfile(signUpResult.data.user, account);

      // إعادة محاولة الدخول
      const retrySignIn = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (retrySignIn.error || !retrySignIn.data.user) {
        return { success: false, error: 'فشل الدخول بعد إنشاء الحساب' };
      }

      data = retrySignIn.data;
    } else {
      // الحساب موجود - ضمان أن الـ profile محدّث
      await ensureUserProfile(data.user, account);
    }

    logger.info('Quick login successful', {
      role: account.role,
      user_id: data.user.id,
    });

    return {
      success: true,
      redirectTo: account.redirectTo,
      role: account.role,
    };
  } catch (e: any) {
    logger.error('Quick login exception', { error: e.message });
    return { success: false, error: 'حدث خطأ في النظام' };
  }
}

/**
 * ضمان أن جدول users يحتوي على البيانات
 * (يُحدّث إذا موجود، يُنشئ إذا غير موجود)
 */
async function ensureUserProfile(authUser: User, account: DirectAccount) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id: authUser.id,
          phone: account.phone,
          full_name: account.fullName,
          email: account.email,
          role: account.role,
          governorate: account.governorate,
          updated_at: new Date().toISOString(),
        } as any,
        {
          onConflict: 'id',
        }
      );

    if (error) {
      logger.warn('Profile upsert failed (non-critical)', { error: error.message });
    }
  } catch (e) {
    logger.warn('Profile creation skipped (non-critical)');
  }
}

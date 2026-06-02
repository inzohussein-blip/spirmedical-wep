'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

function getIp(): string {
  const h = headers();
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 📧 التسجيل / الدخول بالبريد الإلكتروني (V33)
 * ════════════════════════════════════════════════════════════════════
 *
 * طريقة ثانوية (الأساسية هي الهاتف). تُنشئ حساباً بالإيميل + كلمة مرور.
 * الـ trigger handle_new_user يُنشئ صفّ public.users تلقائياً.
 * ════════════════════════════════════════════════════════════════════
 */
export async function registerWithEmail(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const ip = getIp();
  const limit = await checkRateLimit(`register-email:${ip}`, { max: 5, windowSeconds: 3600 });
  if (!limit.allowed) {
    redirect('/register/email?error=' + encodeURIComponent(`محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`));
  }

  // تحقّق أساسي
  if (fullName.length < 3) {
    redirect('/register/email?error=' + encodeURIComponent('الاسم قصير جداً'));
  }
  if (!email.includes('@')) {
    redirect('/register/email?error=' + encodeURIComponent('بريد إلكتروني غير صالح'));
  }
  if (password.length < 8) {
    redirect('/register/email?error=' + encodeURIComponent('كلمة المرور يجب أن تكون 8 أحرف على الأقل'));
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'patient' },
      },
    });

    if (error) {
      logger.error('email register failed', { email, error: error.message });
      const msg = error.message.includes('already')
        ? 'هذا البريد مُسجّل مسبقاً'
        : 'تعذّر إنشاء الحساب';
      redirect('/register/email?error=' + encodeURIComponent(msg));
    }

    // حدّث الاسم في users (لو لم يلتقطه الـ trigger)
    if (data.user) {
      await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', data.user.id);
    }
  } catch (err) {
    if (err instanceof Error && 'digest' in err && String((err as { digest?: string }).digest).includes('NEXT_REDIRECT')) {
      throw err;
    }
    logger.error('email register exception', { email, error: err instanceof Error ? err.message : String(err) });
    redirect('/register/email?error=' + encodeURIComponent('حدث خطأ غير متوقّع'));
  }

  redirect('/dashboard');
}

export async function loginWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/login/email?error=' + encodeURIComponent('أدخل البريد وكلمة المرور'));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logger.error('email login failed', { email, error: error.message });
    redirect('/login/email?error=' + encodeURIComponent('بيانات الدخول غير صحيحة'));
  }

  redirect('/dashboard');
}

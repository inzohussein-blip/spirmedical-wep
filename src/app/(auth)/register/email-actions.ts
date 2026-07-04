'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

// ════════════════════════════════════════════════════════════════════
// 📧 التسجيل / الدخول بالبريد الإلكتروني (V34 — موحّد)
// ════════════════════════════════════════════════════════════════════
//
// النظام الرسمي للمصادقة بالإيميل. يعتمد على:
//   • supabase.auth.signUp / signInWithPassword (لا service_role يدوي)
//   • DB trigger handle_new_user لإنشاء صفّ public.users تلقائياً
//
// أُصلحت 3 ثغرات عن V33:
//   1. توجيه حسب الدور (specialist/admin) بدل /dashboard دائماً
//   2. رسائل خطأ أوضح + audit logging
//   3. حماية redirect المفتوح (open redirect) في المعامل next
// ════════════════════════════════════════════════════════════════════

function getIp(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}

function isNextRedirect(err: unknown): boolean {
  return (
    err instanceof Error &&
    'digest' in err &&
    typeof (err as { digest?: string }).digest === 'string' &&
    (err as { digest: string }).digest.includes('NEXT_REDIRECT')
  );
}

/**
 * توجيه آمن حسب الدور بعد نجاح المصادقة.
 * يمنع open-redirect: أي مسار خارجي أو // يُتجاهل.
 */
function safeInternalPath(path: string | null, fallback: string): string {
  if (!path) return fallback;
  if (path.startsWith('/') && !path.startsWith('//')) return path;
  return fallback;
}

function roleHomePath(role: string | null | undefined): string {
  if (role === 'specialist') return '/specialist';
  if (
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'manager' ||
    role === 'support'
  ) {
    return '/admin44';
  }
  return '/dashboard';
}

// ────────────────────────────────────────────────────────────────────
// التسجيل بالإيميل
// ────────────────────────────────────────────────────────────────────

export async function registerWithEmail(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const ip = getIp();
  const limit = await checkRateLimit(`register-email:${ip}`, {
    max: 5,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    redirect(
      '/register/email?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  // ─── تحقّق أساسي ───────────────────────────────────────
  if (fullName.length < 3) {
    redirect('/register/email?error=' + encodeURIComponent('الاسم قصير جداً (3 أحرف على الأقل)'));
  }
  // regex بسيط لصحة البريد
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect('/register/email?error=' + encodeURIComponent('بريد إلكتروني غير صالح'));
  }
  if (password.length < 8) {
    redirect(
      '/register/email?error=' +
        encodeURIComponent('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    );
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
      const msg = error.message.toLowerCase().includes('already')
        ? 'هذا البريد مُسجّل مسبقاً'
        : 'تعذّر إنشاء الحساب، حاول مرة أخرى';
      redirect('/register/email?error=' + encodeURIComponent(msg));
    }

    // حدّث الاسم في users (احتياطاً لو لم يلتقطه الـ trigger)
    if (data.user) {
      await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', data.user.id);

      await logAuditEvent({
        action: 'auth.register',
        user_id: data.user.id,
        metadata: { email, ip, method: 'email' },
      });
    }

    // ─── التحقق من حالة تأكيد البريد ────────────────────
    // إذا كان Supabase يتطلّب تأكيد البريد، لن توجد session بعد signUp
    if (!data.session) {
      redirect(
        '/register/email?pending=1&email=' + encodeURIComponent(email)
      );
    }
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    logger.error('email register exception', {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
    redirect('/register/email?error=' + encodeURIComponent('حدث خطأ غير متوقّع'));
  }

  // نجاح + session موجودة → دخول مباشر (مريض جديد)
  redirect('/dashboard');
}

// ────────────────────────────────────────────────────────────────────
// الدخول بالإيميل
// ────────────────────────────────────────────────────────────────────

export async function loginWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = formData.get('redirect') as string | null;

  const ip = getIp();
  const limit = await checkRateLimit(`login-email:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });
  if (!limit.allowed) {
    redirect(
      '/login/email?error=' +
        encodeURIComponent(
          `محاولات كثيرة، حاول بعد ${limit.retryAfterSeconds} ثانية`
        )
    );
  }

  if (!email || !password) {
    redirect('/login/email?error=' + encodeURIComponent('أدخل البريد وكلمة المرور'));
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      logger.warn('email login failed', { email, error: error?.message });
      redirect('/login/email?error=' + encodeURIComponent('بيانات الدخول غير صحيحة'));
    }

    await logAuditEvent({
      action: 'auth.login',
      user_id: data.user.id,
      metadata: { email, ip, method: 'email' },
    });

    // ─── جلب الدور للتوجيه الصحيح ───────────────────────
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const home = roleHomePath(profile?.role);

    // لو المستخدم قادم من صفحة محميّة، أعده إليها (بأمان)
    const target = safeInternalPath(redirectTo, home);
    redirect(target);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    logger.error('email login exception', {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
    redirect('/login/email?error=' + encodeURIComponent('حدث خطأ غير متوقّع'));
  }
}

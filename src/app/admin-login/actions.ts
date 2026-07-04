'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { getClientIp as getIp } from '@/lib/auth/request-helpers';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🔐 Admin Login (V33) — دخول مخصّص للوحة الأدمن
 * ════════════════════════════════════════════════════════════════════
 *
 * منفصل تماماً عن دخول المستخدمين العاديين:
 *   - الإيميل + كلمة المرور (لا OTP هاتف)
 *   - يرفض أيّ حساب ليس دوره من أدوار الأدمن (ويُسجّل خروجه)
 * ════════════════════════════════════════════════════════════════════
 */
export async function adminLogin(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/admin-login?error=' + encodeURIComponent('أدخل البريد وكلمة المرور'));
  }

  // 🔒 حدّ محاولات الدخول (منع تخمين كلمة السر)
  const ip = getIp();
  const rl = await checkRateLimit(`admin:login:${ip}`, {
    max: 10,
    windowSeconds: 900,
  });
  if (!rl.allowed) {
    redirect(
      '/admin-login?error=' +
        encodeURIComponent(`محاولات كثيرة، حاول بعد ${rl.retryAfterSeconds} ثانية`)
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    logger.error('admin login failed', { email, error: error?.message });
    redirect('/admin-login?error=' + encodeURIComponent('بيانات الدخول غير صحيحة'));
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (!isAdminRole(profile?.role)) {
    await supabase.auth.signOut();
    logger.warn('non-admin attempted admin login', { email, role: profile?.role });
    redirect('/admin-login?error=' + encodeURIComponent('هذا الحساب لا يملك صلاحيات الأدمن'));
  }

  logAuditEvent({
    user_id: data.user.id,
    action: 'admin_login',
    metadata: { email },
  }).catch(() => {});

  redirect('/admin');
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 🆕 Admin Create (V33) — إنشاء حساب أدمن مباشر مع اختيار الرول
 * ════════════════════════════════════════════════════════════════════
 *
 * محميّ بمفتاح سرّي (ADMIN_CREATE_KEY) يعرفه المالك فقط.
 * يُنشئ الحساب + يُرقّيه للرول المختار فوراً (لا حاجة لموافقة منفصلة).
 * بدون المفتاح الصحيح → يُرفض.
 * ════════════════════════════════════════════════════════════════════
 */
export async function adminCreate(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'support');
  const secretKey = String(formData.get('secretKey') ?? '');

  // 🔒 حدّ الإنشاء (منع تخمين المفتاح السرّي / الإساءة)
  const ip = getIp();
  const rl = await checkRateLimit(`admin:create:${ip}`, {
    max: 5,
    windowSeconds: 3600,
  });
  if (!rl.allowed) {
    redirect(
      '/admin-login?tab=create&error=' +
        encodeURIComponent(`محاولات كثيرة، حاول بعد ${rl.retryAfterSeconds} ثانية`)
    );
  }

  // من هو المُنشئ؟ (لو توجد جلسة أدمن قائمة)
  const sessionClient = createClient();
  const {
    data: { user: caller },
  } = await sessionClient.auth.getUser();
  let callerRole: string | null = null;
  if (caller) {
    const { data: cp } = await sessionClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();
    callerRole = (cp as { role?: string } | null)?.role ?? null;
  }
  const callerIsSuperAdmin = callerRole === 'super_admin';

  // 🔐 غير الـ super_admin المُصادق يحتاج مفتاحاً سرّياً قوياً
  if (!callerIsSuperAdmin) {
    const expectedKey = process.env.ADMIN_CREATE_KEY;
    if (!expectedKey || expectedKey.length < 16) {
      logger.error('admin create blocked — ADMIN_CREATE_KEY missing or too weak');
      redirect(
        '/admin-login?tab=create&error=' +
          encodeURIComponent('إنشاء حساب الأدمن غير متاح حالياً')
      );
    }
    if (secretKey !== expectedKey) {
      logger.warn('admin create rejected — bad secret key', { email });
      redirect('/admin-login?tab=create&error=' + encodeURIComponent('المفتاح السرّي غير صحيح'));
    }
  }

  // قائمة السماح للبريد (اختيارية عبر ADMIN_ALLOWED_EMAILS)
  const allowlist = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length > 0 && !allowlist.includes(email)) {
    logger.warn('admin create rejected — email not in allowlist', { email });
    redirect(
      '/admin-login?tab=create&error=' + encodeURIComponent('هذا البريد غير مُصرّح له')
    );
  }

  // تحقّقات أساسية
  if (fullName.length < 3) {
    redirect('/admin-login?tab=create&error=' + encodeURIComponent('الاسم قصير جداً'));
  }
  if (!email.includes('@')) {
    redirect('/admin-login?tab=create&error=' + encodeURIComponent('بريد إلكتروني غير صالح'));
  }
  if (password.length < 8) {
    redirect('/admin-login?tab=create&error=' + encodeURIComponent('كلمة المرور 8 أحرف على الأقل'));
  }

  const validRoles = ['super_admin', 'admin', 'manager', 'support'];
  let grantedRole = validRoles.includes(role) ? role : 'support';
  // 🔒 لا يُمنح super_admin إلا بواسطة super_admin مُصادق — المفتاح وحده يُنشئ admin كحدّ أقصى
  if (grantedRole === 'super_admin' && !callerIsSuperAdmin) {
    grantedRole = 'admin';
  }

  const admin = createAdminClient();

  try {
    // 🔧 أنشئ الحساب عبر admin API مع تأكيد فوري للإيميل (جاهز للدخول مباشرة)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: grantedRole },
    });

    if (error || !data.user) {
      const msg = error?.message.includes('already') || error?.message.includes('exists')
        ? 'هذا البريد مُسجّل مسبقاً'
        : 'تعذّر إنشاء الحساب';
      redirect('/admin-login?tab=create&error=' + encodeURIComponent(msg));
    }

    const userId = data.user!.id;

    // استخدم نفس admin client للكتابة (يتجاوز RLS)
    const adminDb = admin as unknown as { from: (t: string) => any };

    // رقّ الحساب للرول المختار + موافقة فورية
    await adminDb
      .from('users')
      .update({ full_name: fullName, role: grantedRole, approval_status: 'approved' })
      .eq('id', userId);

    logAuditEvent({
      user_id: userId,
      action: 'admin_account_created',
      metadata: {
        email,
        granted_role: grantedRole,
        created_by: caller?.id ?? 'secret_key',
      },
    }).catch(() => {});
  } catch (err) {
    if (
      err instanceof Error &&
      'digest' in err &&
      String((err as { digest?: string }).digest).includes('NEXT_REDIRECT')
    ) {
      throw err;
    }
    logger.error('admin create failed', { email, error: err instanceof Error ? err.message : String(err) });
    redirect('/admin-login?tab=create&error=' + encodeURIComponent('حدث خطأ غير متوقّع'));
  }

  redirect('/admin-login?created=1');
}

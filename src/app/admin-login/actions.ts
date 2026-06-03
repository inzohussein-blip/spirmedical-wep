'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/admin-types';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

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

  redirect('/admin44');
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

  // 🔐 تحقّق من المفتاح السرّي
  const expectedKey = process.env.ADMIN_CREATE_KEY;
  if (!expectedKey || secretKey !== expectedKey) {
    logger.warn('admin create rejected — bad secret key', { email });
    redirect('/admin-login?tab=create&error=' + encodeURIComponent('المفتاح السرّي غير صحيح'));
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
  const grantedRole = validRoles.includes(role) ? role : 'support';

  const supabase = createClient();

  try {
    // أنشئ الحساب في Supabase Auth (مع تأكيد تلقائي عبر admin API لو متاح)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: grantedRole } },
    });

    if (error || !data.user) {
      const msg = error?.message.includes('already')
        ? 'هذا البريد مُسجّل مسبقاً'
        : 'تعذّر إنشاء الحساب';
      redirect('/admin-login?tab=create&error=' + encodeURIComponent(msg));
    }

    const userId = data.user!.id;
    const sb = supabase as unknown as { from: (t: string) => any };

    // رقّ الحساب للرول المختار + موافقة فورية
    await sb
      .from('users')
      .update({ full_name: fullName, role: grantedRole, approval_status: 'approved' })
      .eq('id', userId);

    logAuditEvent({
      user_id: userId,
      action: 'admin_account_created',
      metadata: { email, granted_role: grantedRole },
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

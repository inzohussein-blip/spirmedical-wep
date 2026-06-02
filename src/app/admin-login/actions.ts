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

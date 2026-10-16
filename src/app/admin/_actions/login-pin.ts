'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/admin-audit';
import { isAdminRole } from '@/lib/admin-types';
import { generateTemporaryPin, isPhoneAuthEmail, setLoginPin } from '@/lib/auth/login-pin';

export type ResetLoginPinResult = { ok: true; pin: string } | { ok: false; error: string };

/**
 * إعادةُ ضبط رمز الدخول من الإدارة — البديلُ عن «نسيت الرمز» ما دام واتساب معطّلاً.
 * يُعاد الرمزُ المؤقّت مرّةً واحدة ولا يُخزَّن إلّا مجزّأً؛ يغيّره صاحبه من /login-pin.
 * حساباتُ البريد (ومنها الإدارة) لا تُمسّ: دخولُها بكلمة سرّها لا بالرمز.
 */
export async function adminResetLoginPin(userId: string): Promise<ResetLoginPinResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'غير مصرّح' };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isAdminRole(profile?.role)) return { ok: false, error: 'غير مصرّح' };

  const { data: target, error } = await createAdminClient().auth.admin.getUserById(userId);
  if (error || !target?.user) return { ok: false, error: 'الحساب غير موجود' };
  if (!isPhoneAuthEmail(target.user.email)) {
    return { ok: false, error: 'حسابُ بريدٍ — يدخل بكلمة سرّه لا برمز الدخول' };
  }

  const pin = generateTemporaryPin();
  if (!(await setLoginPin(userId, pin))) return { ok: false, error: 'تعذّر حفظ الرمز — حاول مجدّداً' };

  await logAdminAction({ action_type: 'reset_login_pin', target_type: 'user', target_id: userId });
  return { ok: true, pin };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { loginPinProblem, setLoginPin } from '@/lib/auth/login-pin';

/**
 * يضبط رمزَ الدخول للمستخدم المُسجَّل — بعد «نسيت الرمز» (دخولٌ برمز واتساب)
 * أو لتغييره. الجلسةُ هي الإثبات؛ والحدُّ يمنع الإغراق.
 */
export async function changeLoginPin(
  pin: string,
  confirm: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول أولاً' };

  const limit = await checkRateLimit(`pin:set:${user.id}`, { max: 10, windowSeconds: 3600 });
  if (!limit.allowed) return { ok: false, error: 'محاولات كثيرة، حاول لاحقاً' };

  const problem = loginPinProblem(pin);
  if (problem) return { ok: false, error: problem };
  if (pin !== confirm) return { ok: false, error: 'الرمزان غير متطابقين' };

  return (await setLoginPin(user.id, pin))
    ? { ok: true }
    : { ok: false, error: 'تعذّر حفظ الرمز. حاول بعد قليل.' };
}

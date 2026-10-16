'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/auth/request-helpers';
import { isPhoneAuthEmail, loginPinProblem, setLoginPin } from '@/lib/auth/login-pin';
import { phonePinLogin } from '@/lib/auth/phone-pin-login';
import { getRoleHomePath } from '@/lib/auth/home-path';
import { normalizePhone } from '@/lib/validations/auth';
import { logAuditEvent } from '@/lib/audit';
import {
  consumeVerification,
  getWaVerifyConfig,
  isWaVerifyAvailable,
  startVerification,
} from '@/lib/whatsapp/inbound-verify';

/**
 * 🔑 استعادةُ رمز الدخول عبر واتساب (التحقّق العكسيّ، 0050)
 *
 * ١. `startPinReset(رقم)` ← رمزٌ ورابطُ wa.me إلى رقمنا.
 * ٢. صاحبُ الرقم يرسل الرمزَ منه؛ البوّابةُ تطابق المرسِلَ بالرقم (`handleInboundMessage`).
 * ٣. `completePinReset(معرّف، رمزٌ جديد)` ← يستهلك التحقّقَ مرّةً، يضبط الرمز، ويُدخله.
 *
 * هذا أيضاً «رابطُ التفعيل» الذي ترسله الإدارةُ لحسابٍ أنشأته: يختار صاحبُه رمزَه بنفسه.
 * حساباتُ البريد (ومنها الإدارة) لا تُمسّ — دخولُها بكلمة سرّها.
 */

export type StartPinResetResult =
  | { ok: true; id: string; code: string; link: string; number: string; expiresAt: string }
  | { ok: false; error: string };

export async function startPinReset(rawPhone: string): Promise<StartPinResetResult> {
  if (!(await isWaVerifyAvailable())) {
    return { ok: false, error: 'الاستعادةُ عبر واتساب غير متاحة الآن — تواصل مع الدعم لرمزٍ مؤقّت' };
  }
  const phone = normalizePhone((rawPhone ?? '').replace(/\D/g, ''));
  if (!/^\+9647\d{9}$/.test(phone)) return { ok: false, error: 'رقم الهاتف غير صالح — مثال: 07712345678' };

  const ip = await getClientIp();
  const limit = await checkRateLimit(`pin:reset:${ip}`, { max: 10, windowSeconds: 3600 });
  if (!limit.allowed) return { ok: false, error: 'محاولات كثيرة، حاول بعد ساعة' };

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('id').eq('phone', phone).maybeSingle();
  if (!profile) return { ok: false, error: 'لا يوجد حسابٌ بهذا الرقم' };
  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  if (!isPhoneAuthEmail(authUser?.user?.email)) {
    return { ok: false, error: 'هذا الحساب يدخل بالبريد الإلكتروني — استعمل «نسيت كلمة المرور»' };
  }

  const started = await startVerification({ phone, purpose: 'reset_pin', userId: profile.id, ip });
  if (!started.ok) return started;
  return {
    ok: true,
    id: started.id,
    code: started.code,
    link: started.link,
    number: getWaVerifyConfig().number!,
    expiresAt: started.expiresAt,
  };
}

export async function completePinReset(
  verificationId: string,
  pin: string,
  confirm: string,
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const problem = loginPinProblem(pin);
  if (problem) return { ok: false, error: problem };
  if (pin !== confirm) return { ok: false, error: 'الرمزان غير متطابقين' };

  // مرّةً واحدة: التحقّقُ يُستهلك هنا، فلا يُعاد استعمالُ الرابط ولا الرمز
  const proven = await consumeVerification(verificationId, 'reset_pin');
  if (!proven?.userId) return { ok: false, error: 'انتهت صلاحيةُ التحقّق — ابدأ من جديد' };

  if (!(await setLoginPin(proven.userId, pin))) {
    return { ok: false, error: 'تعذّر حفظ الرمز — ابدأ من جديد' };
  }
  const ip = await getClientIp();
  await logAuditEvent({ action: 'auth.pin_reset_whatsapp', user_id: proven.userId, metadata: { ip } });

  // دخولٌ فوريّ بالرمز الجديد — المسارُ نفسُه لكلّ دخولٍ بالرقم
  const login = await phonePinLogin(proven.phone, pin, ip);
  if (!login.ok) return { ok: true, redirectTo: '/login/phone' };
  return { ok: true, redirectTo: getRoleHomePath(login.role) };
}

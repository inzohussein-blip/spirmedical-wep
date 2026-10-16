import { createAdminClient, createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { derivePhonePassword } from '@/lib/auth/phone-credentials';
import { checkLoginPin, isPhoneAuthEmail, loginPinProblem, setLoginPin } from '@/lib/auth/login-pin';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📱 الدخول بالرقم + رمز الدخول (PIN) — بلا رمز واتساب (قرار المالك، 0049)
 * ════════════════════════════════════════════════════════════════════
 *
 * كان مسارُ «الدخول بلا رمز» يُدخل الحسابَ **برقمه وحده** (كلمةُ السرّ مشتقّةٌ من
 * الرقم)، ويُنشئ حساباً لأيّ رقمٍ مجهول، ويكتب كلمةَ السرّ المشتقّة فوق كلمة سرّ
 * حسابات البريد — ومنها حسابُ الإدارة — إن عُرف رقمُها. هنا:
 *
 *   • لا إنشاءَ حساب — الحسابُ يُنشأ في التسجيل.
 *   • حسابُ البريد لا يُمسّ — يدخل بالبريد وكلمة المرور.
 *   • الرمزُ مطلوب ويُتحقَّق منه، مع حدٍّ لكلّ رقم وقفلٍ بعد خمس محاولات.
 *   • حسابٌ أُنشئ قبل 0049 بلا رمز: الرمزُ المُدخَل في أوّل دخولٍ يصير رمزَه.
 *
 * مشتركٌ بين `/login/phone` (إجراءٌ يعيد التوجيه) و`/login` (يعيد نتيجة) — كي لا
 * يتفرّق المعيارُ على موضعين.
 * ════════════════════════════════════════════════════════════════════
 */

export type PhonePinResult =
  | { ok: true; role: string | null; userId: string; claimed: boolean }
  | { ok: false; error: string };

export async function phonePinLogin(phone: string, pin: string, ip: string): Promise<PhonePinResult> {
  const fail = (error: string): PhonePinResult => ({ ok: false, error });

  // حدٌّ لكلّ رقم فوق حدّ العنوان: تخمينُ الرمز من عناوين كثيرة يصطدم بهذا وبالقفل
  const limit = await checkRateLimit(`pin:login:${phone}`, { max: 10, windowSeconds: 900 });
  if (!limit.allowed) {
    return fail(`محاولات كثيرة لهذا الرقم، حاول بعد ${Math.ceil(limit.retryAfterSeconds / 60)} دقيقة`);
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from('users').select('id, role').eq('phone', phone).maybeSingle();
    if (!profile) return fail('لا يوجد حساب بهذا الرقم. أنشئ حساباً أوّلاً.');

    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const authEmail = authUser?.user?.email;
    if (!isPhoneAuthEmail(authEmail)) {
      // لا نكتب فوق كلمة سرّ حساب البريد — كان هذا يُقفل صاحبَه (والإدارةَ) خارج حسابه
      return fail('هذا الحساب يدخل بالبريد الإلكتروني وكلمة المرور.');
    }

    const check = await checkLoginPin(profile.id, pin);
    let claimed = false;
    switch (check.status) {
      case 'locked':
        return fail(`رمز الدخول مقفل ${check.minutes} دقيقة بعد محاولات خاطئة.`);
      case 'wrong':
        return fail(`رمز الدخول غير صحيح. بقيت ${check.remaining} ${check.remaining === 1 ? 'محاولة' : 'محاولات'}.`);
      case 'error':
        return fail('تعذّر التحقّق من الرمز. حاول بعد قليل.');
      case 'none': {
        const problem = loginPinProblem(pin);
        if (problem) return fail(`حسابك بلا رمز دخول بعد — اختر رمزاً: ${problem}`);
        if (!(await setLoginPin(profile.id, pin))) return fail('تعذّر حفظ رمز الدخول. حاول بعد قليل.');
        claimed = true;
        break;
      }
      case 'ok':
        break;
    }

    // الرمزُ صحيح: الدخولُ بكلمة السرّ المشتقّة (تُزامَن إن تغيّرت، كحسابٍ أنشأته الإدارة)
    const password = derivePhonePassword(phone);
    const supabase = await createClient();
    let { data: signed } = await supabase.auth.signInWithPassword({ email: authEmail!, password });
    if (!signed?.user) {
      await admin.auth.admin.updateUserById(profile.id, { password });
      ({ data: signed } = await supabase.auth.signInWithPassword({ email: authEmail!, password }));
    }
    if (!signed?.user) return fail('تعذّر تسجيل الدخول. حاول بعد قليل.');

    logAuditEvent({
      action: 'auth.login',
      user_id: profile.id,
      metadata: { ip, phone, method: claimed ? 'phone_pin_claimed' : 'phone_pin' },
    }).catch(() => {});

    return { ok: true, role: profile.role ?? null, userId: profile.id, claimed };
  } catch (err) {
    logger.error('phonePinLogin failed', { error: err instanceof Error ? err.message : String(err) });
    return fail('تعذّر تسجيل الدخول. حاول بعد قليل.');
  }
}
